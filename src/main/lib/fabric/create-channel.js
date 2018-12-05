"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
if (global && global.hfc) {
    global.hfc.config = undefined;
}
const Nconf = require("nconf");
const utils = require("fabric-client/lib/utils");
const Client = require("fabric-client");
const fs = require("fs-extra");
const testUtil = require("./util");
const util_1 = require("../comm/util");
Nconf.reset();
/**
 * Create the channels located in the given configuration file.
 * @param {string} config_path The path to the Fabric network configuration file.
 * @return {Promise} The return promise.
 */
function run(config_path) {
    return __awaiter(this, void 0, void 0, function* () {
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
                return prev.then(() => __awaiter(this, void 0, void 0, function* () {
                    if (channel.deployed) {
                        return Promise.resolve();
                    }
                    console.log('create ' + channel.name + '......');
                    let client = new Client();
                    let org = channel.organizations[0];
                    let orderer = client.newOrderer(ORGS.orderer.url, {
                        'pem': caroots,
                        'ssl-target-name-override': ORGS.orderer['server-hostname']
                    });
                    const store = yield createStore(client, org);
                    let cryptoSuite = createCryptoSuite(client, org);
                    const admin = yield testUtil.getOrderAdminSubmitter(client);
                    let channelConfiguration = createChannelConfigurationEnvelope(client, channel);
                    let signatures = yield signChannelConfiguration(channel, client, channelConfiguration);
                    yield setOrdererAdmin(client);
                    signatures = yield signChannelConfigurationWithOrdererAdmin(client, channelConfiguration, signatures);
                    const request = createRequest(client, channelConfiguration, signatures, channel, orderer);
                    // send create request to orderer
                    return createChannel(client, request, channel);
                }));
            }, Promise.resolve())
                .then(() => {
                console.log('Sleep 5s......');
                return util_1.default.sleep(5000);
            })
                .then(() => {
                return resolve();
            })
                .catch((err) => {
                console.error('Failed to create channels ' + (err.stack ? err.stack : err));
                return reject(new Error('Fabric: Create channel failed'));
            });
        });
    });
}
exports.run = run;
function createStore(client, org) {
    return __awaiter(this, void 0, void 0, function* () {
        const store = yield Client.newDefaultKeyValueStore({ path: testUtil.storePathForOrg(org) });
        client.setStateStore(store);
        return store;
    });
}
function createCryptoSuite(client, org) {
    const cryptoSuite = Client.newCryptoSuite();
    cryptoSuite.setCryptoKeyStore(Client.newCryptoKeyStore({ path: testUtil.storePathForOrg(org) }));
    client.setCryptoSuite(cryptoSuite);
    return cryptoSuite;
}
function createChannelConfigurationEnvelope(client, channel) {
    let envelope_bytes = fs.readFileSync(channel.config);
    return client.extractChannelConfig(envelope_bytes);
}
function signChannelConfiguration(channel, client, channelConfiguration) {
    return __awaiter(this, void 0, void 0, function* () {
        const signatures = [];
        yield channel.organizations.reduce(function (prev, item) {
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
    });
}
function setOrdererAdmin(client) {
    return __awaiter(this, void 0, void 0, function* () {
        client._userContext = null;
        yield testUtil.getOrderAdminSubmitter(client);
    });
}
function signChannelConfigurationWithOrdererAdmin(client, channelConfiguration, signatures) {
    return __awaiter(this, void 0, void 0, function* () {
        let signature = client.signChannelConfig(channelConfiguration);
        // collect signature from orderer admin
        // TODO: signature counting against policies on the orderer
        // at the moment is being investigated, but it requires this
        // weird double-signature from each org admin
        signatures.push(signature);
        signatures.push(signature);
        return signatures;
    });
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
function createChannel(client, request, channel) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield client.createChannel(request);
        if (result.status && result.status === 'SUCCESS') {
            console.debug('created ' + channel.name + ' successfully');
            return Promise.resolve();
        }
        else {
            throw new Error('create status is ' + result.status);
        }
    });
}
//# sourceMappingURL=create-channel.js.map