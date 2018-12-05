if (global && global.hfc) {
    global.hfc.config = undefined;
}

import * as Nconf from "nconf";
import * as utils from "fabric-client/lib/utils";
import * as Client from "fabric-client";
import * as fs from "fs-extra";
import * as testUtil from "./util";
import commUtils from "../comm/util";

Nconf.reset();

/**
 * Create the channels located in the given configuration file.
 * @param {string} config_path The path to the Fabric network configuration file.
 * @return {Promise} The return promise.
 */
async function run(config_path): Promise<any> {
    Client.addConfigFile(config_path);
    const fabric = Client.getConfigSetting('fabric');
    const channels = fabric.channel;
    if (!channels || channels.length === 0) {
        return Promise.reject(new Error('No channel information found'));
    }
    return new Promise(function (resolve, reject) {
        let ORGS = fabric.network;
        let caRootsPath = ORGS.orderer.tls_cacerts;
        let data = fs.readFileSync(caRootsPath);
        let caroots = Buffer.from(data).toString();
        utils.setConfigSetting('key-value-store', 'fabric-client/lib/impl/FileKeyValueStore.js');

        return channels.reduce((prev, channel) => {
            return prev.then(async () => {
                if (channel.deployed) {
                    return Promise.resolve();
                }

                console.log('create ' + channel.name + '......');
                let client = new Client();
                let org = channel.organizations[0];
                let orderer = client.newOrderer(
                    ORGS.orderer.url,
                    {
                        'pem': caroots,
                        'ssl-target-name-override': ORGS.orderer['server-hostname']
                    }
                );
                const store = await createStore(client, org);
                let cryptoSuite = createCryptoSuite(client, org);
                const admin = await testUtil.getOrderAdminSubmitter(client);
                let channelConfiguration = createChannelConfigurationEnvelope(client, channel);
                let signatures = await signChannelConfiguration(channel, client, channelConfiguration);
                await setOrdererAdmin(client);
                signatures = await signChannelConfigurationWithOrdererAdmin(client, channelConfiguration, signatures);
                const request = createRequest(client, channelConfiguration, signatures, channel, orderer);
                // send create request to orderer
                return createChannel(client, request, channel);
            });
        }, Promise.resolve())
            .then(() => {
                console.log('Sleep 5s......');
                return commUtils.sleep(5000);
            })
            .then(() => {
                return resolve();
            })
            .catch((err) => {
                console.error('Failed to create channels ' + (err.stack ? err.stack : err));
                return reject(new Error('Fabric: Create channel failed'));
            });
    });
}

async function createStore(client, org) {
    const store = await Client.newDefaultKeyValueStore({path: testUtil.storePathForOrg(org)});
    client.setStateStore(store);
    return store;
}

function createCryptoSuite(client, org) {
    const cryptoSuite = Client.newCryptoSuite();
    cryptoSuite.setCryptoKeyStore(Client.newCryptoKeyStore({path: testUtil.storePathForOrg(org)}));
    client.setCryptoSuite(cryptoSuite);
    return cryptoSuite;
}

function createChannelConfigurationEnvelope(client, channel) {
    let envelope_bytes = fs.readFileSync(channel.config);
    return client.extractChannelConfig(envelope_bytes);
}

async function signChannelConfiguration(channel, client, channelConfiguration) {
    const signatures = [];
    await channel.organizations.reduce(function (prev, item) {
        return prev.then(() => {
            client._userContext = null;
            return testUtil.getSubmitter(client, true, item).then((orgAdmin) => {
                // sign the config
                let signature = client.signChannelConfig(channelConfiguration);
                // TODO: signature counting against policies on the orderer
                // at the moment is being investigated, but it requires this
                // weird double-signature from each org admin
                signatures.push(signature);
                signatures.push(signature);
                return Promise.resolve(signatures);
            });
        });
    }, Promise.resolve());
    return signatures;
}

async function setOrdererAdmin(client) {
    client._userContext = null;
    await testUtil.getOrderAdminSubmitter(client);
}

async function signChannelConfigurationWithOrdererAdmin(client, channelConfiguration, signatures) {
    let signature = client.signChannelConfig(channelConfiguration);
    // collect signature from orderer admin
    // TODO: signature counting against policies on the orderer
    // at the moment is being investigated, but it requires this
    // weird double-signature from each org admin
    signatures.push(signature);
    signatures.push(signature);

    return signatures;
}

function createRequest(client, channelConfiguration, signatures, channel, orderer) {
    let tx_id = client.newTransactionID();
    return {
        config: channelConfiguration,
        signatures: signatures,
        name: channel.name,
        orderer: orderer,
        txId: tx_id
    };
}

async function createChannel(client, request, channel) {
    const result = await client.createChannel(request);
    if (result.status && result.status === 'SUCCESS') {
        console.debug('created ' + channel.name + ' successfully');
        return Promise.resolve();
    }
    else {
        throw new Error('create status is ' + result.status);
    }
}

export {run}


