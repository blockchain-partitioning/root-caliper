import * as Client from "fabric-client";
import * as e2eUtils from "./e2eUtils";
import commUtils from "../comm/util";

function run(config_path): Promise<any> {
    Client.addConfigFile(config_path);
    const fabricSettings = Client.getConfigSetting('fabric');
    const policy = fabricSettings['endorsement-policy'];
    let chaincodes = fabricSettings.chaincodes;
    if (typeof chaincodes === 'undefined' || chaincodes.length === 0) {
        return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
        console.log('Instantiate chaincode......');
        chaincodes.reduce(function (prev, chaincode) {
            console.debug("Installing", JSON.stringify(chaincode));
            return prev.then(() => {
                return e2eUtils.instantiateChaincode(chaincode, policy, false).then(() => {
                    console.debug('Instantiated chaincode ' + chaincode.id + ' successfully ');
                    console.log('Sleep 5s...');
                    return commUtils.sleep(5000);
                });
            });
        }, Promise.resolve())
            .then(() => {
                return resolve();
            })
            .catch((err) => {
                console.error('Failed to instantiate chaincodes, ' + (err.stack ? err.stack : err));
                return reject(new Error('Fabric: instantiate chaincodes failed'));
            });
    });
}

export {run}
