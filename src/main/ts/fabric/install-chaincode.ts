import * as  Client from "fabric-client";
import * as  e2eUtils from "./e2eUtils";
import * as  testUtil from "./util";

function run(config_path): Promise<any> {
    Client.addConfigFile(config_path);
    testUtil.setupChaincodeDeploy();
    const fabricSettings = Client.getConfigSetting('fabric');
    let chaincodes = fabricSettings.chaincodes;
    if (typeof chaincodes === 'undefined' || chaincodes.length === 0) {
        return Promise.resolve();
    }
    return new Promise(function (resolve, reject) {
        console.debug('install all chaincodes......');
        chaincodes.reduce(function (prev, chaincode) {
            return prev.then(() => {
                let promises = [];
                let channel = testUtil.getChannel(chaincode.channel);
                if (channel === null) {
                    throw new Error('could not find channel in config');
                }
                for (let v in channel.organizations) {
                    promises.push(e2eUtils.installChaincode(channel.organizations[v], chaincode));
                }

                return Promise.all(promises).then(() => {
                    console.debug('Installed chaincode ' + chaincode.id + ' successfully in all peers');
                    return Promise.resolve();
                });
            });
        }, Promise.resolve())
            .then(() => {
                return resolve();
            })
            .catch((err) => {
                console.error('Failed to install chaincodes, ' + (err.stack ? err.stack : err));
                return reject(err);
            });
    });
}

export {run}
