import * as fs from "fs-extra";
import * as Client from "fabric-client";
import * as EventHub from "fabric-client/lib/EventHub";
import * as testUtil from "./util";

let tx_id = null;
let ORGS;
const allEventhubs = [];

/**
 * Disconnect from the given list of event hubs.
 * @param {object[]} ehs A collection of event hubs.
 */
function disconnect(ehs) {
    for (let key in ehs) {
        const eventhub = ehs[key];
        if (eventhub && eventhub.isconnected()) {
            eventhub.disconnect();
        }
    }
}

/**
 * Join the peers of the given organization to the given channel.
 * @param {string} org The name of the organization.
 * @param {string} channelName The name of the channel.
 * @return {Promise} The return promise.
 */
function joinChannel(org, channelName) {
    const client: any = new Client();
    const channel = client.newChannel(channelName);

    const orgName = ORGS[org].name;

    const targets = [], eventhubs = [];

    const caRootsPath = ORGS.orderer.tls_cacerts;
    let data = fs.readFileSync(caRootsPath);
    let caroots = Buffer.from(data).toString();
    let genesis_block = null;

    channel.addOrderer(
        client.newOrderer(
            ORGS.orderer.url,
            {
                'pem': caroots,
                'ssl-target-name-override': ORGS.orderer['server-hostname']
            }
        )
    );

    return Client.newDefaultKeyValueStore({
        path: testUtil.storePathForOrg(orgName)
    }).then((store) => {
        client.setStateStore(store);

        return testUtil.getOrderAdminSubmitter(client);
    }).then((admin) => {
        console.warn("Retreiving genesis block for Org:", orgName);
        tx_id = client.newTransactionID();
        let request = {
            txId: tx_id
        };

        return channel.getGenesisBlock(request);
    }).then((block) => {
        console.warn("Retreiving admin for Org:", orgName);
        genesis_block = block;

        // get the peer org's admin required to send join channel requests
        client._userContext = null;
        return testUtil.getSubmitter(client, true /* get peer org admin */, org);
    }).then((admin) => {
        //the_user = admin;
        console.warn("Creating peers and eventhubs");
        for (let key in ORGS[org]) {
            if (ORGS[org].hasOwnProperty(key)) {
                if (key.indexOf('peer') === 0) {
                    data = fs.readFileSync(ORGS[org][key].tls_cacerts);
                    targets.push(
                        client.newPeer(
                            ORGS[org][key].requests,
                            {
                                pem: Buffer.from(data).toString(),
                                'ssl-target-name-override': ORGS[org][key]['server-hostname']
                            }
                        )
                    );

                    let eh = new EventHub(client);  //client.newEventHub();
                    eh.setPeerAddr(
                        ORGS[org][key].events,
                        {
                            pem: Buffer.from(data).toString(),
                            'ssl-target-name-override': ORGS[org][key]['server-hostname']
                        }
                    );
                    eh.connect();
                    eventhubs.push(eh);
                    allEventhubs.push(eh);
                }
            }
        }
        console.warn("Setting event listeners");
        const eventPromises = [];
        eventhubs.forEach((eh) => {
            let txPromise = new Promise((resolve, reject) => {
                let handle = setTimeout(reject, 30000);

                eh.registerBlockEvent((block) => {
                    clearTimeout(handle);

                    // in real-world situations, a peer may have more than one channel so
                    // we must check that this block came from the channel we asked the peer to join
                    if (block.data.data.length === 1) {
                        // Config block must only contain one transaction
                        const channel_header = block.data.data[0].payload.header.channel_header;
                        if (channel_header.channel_id === channelName) {
                            resolve();
                        }
                        else {
                            reject(new Error('invalid channel name'));
                        }
                    }
                });
            });

            eventPromises.push(txPromise);
        });
        tx_id = client.newTransactionID();
        let request = {
            targets: targets,
            block: genesis_block,
            txId: tx_id
        };
        console.warn("Requesting peers to join channel:", channelName);
        let sendPromise = channel.joinChannel(request);
        return Promise.all([sendPromise].concat(eventPromises));
    })
        .then((results) => {
            disconnect(eventhubs);
            if (results[0] && results[0][0] && results[0][0].response && results[0][0].response.status === 200) {
                console.debug('Successfully joined peers in organization', orgName, ' to join the channel');
            } else {
                throw new Error('Unexpected join channel response');
            }
        })
        .catch((err) => {
            disconnect(eventhubs);
            return Promise.reject(err);
        });
}

function run(config_path) {
    Client.addConfigFile(config_path);
    const fabric = Client.getConfigSetting('fabric');
    let channels = fabric.channel;
    if (!channels || channels.length === 0) {
        return Promise.resolve();
    }
    ORGS = Client.getConfigSetting('fabric').network;
    return new Promise(function (resolve, reject) {
        console.debug('Join channel......');

        return channels.reduce((prev, channel) => {
            return prev.then(() => {
                if (channel.deployed) {
                    return Promise.resolve();
                }

                console.debug('join ' + channel.name);
                let promises = [];
                channel.organizations.forEach((org, index) => {
                    promises.push(joinChannel(org, channel.name));
                });
                return Promise.all(promises).then(() => {
                    console.debug('Successfully joined ' + channel.name);
                    return Promise.resolve();
                });
            });
        }, Promise.resolve())
            .then(() => {
                return resolve();
            })
            .catch((err) => {
                console.error('Failed to join peers, ' + (err.stack ? err.stack : err));
                return reject(new Error('Fabric: Join channel failed'));
            });
    });
}

export {run}

