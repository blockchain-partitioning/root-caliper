"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Client = require("fabric-client");
const e2eUtils = require("./e2eUtils");
const util_1 = require("../comm/util");
function run(config_path) {
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
                    return util_1.default.sleep(5000);
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
exports.run = run;
//# sourceMappingURL=instantiate-chaincode.js.map