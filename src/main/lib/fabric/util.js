"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const util = require("util");
const Client = require("fabric-client");
const Nconf = require("nconf");
const copService = require("fabric-ca-client/lib/FabricCAClientImpl");
const User = require("fabric-client/lib/User");
const Constants = require("./constant");
const util_1 = require("../comm/util");
let channels = [];
let cryptodir;
const rootpath = '../..';
let ORGS;
function getChannel(name) {
    for (let i in channels) {
        if (channels[i].name === name) {
            return channels[i];
        }
    }
    return null;
}
exports.getChannel = getChannel;
function getDefaultChannel() {
    return channels[0];
}
exports.getDefaultChannel = getDefaultChannel;
// all temporary files and directories are created under here
const tempdir = Constants.tempdir;
function getTempDir() {
    fs.ensureDirSync(tempdir);
    return tempdir;
}
exports.getTempDir = getTempDir;
// directory for file based KeyValueStore
const KVS = path.join(tempdir, 'hfc-test-kvs');
exports.KVS = KVS;
function storePathForOrg(org) {
    return KVS + '_' + org;
}
exports.storePathForOrg = storePathForOrg;
// temporarily set $GOPATH to the test fixture folder unless specified otherwise
function setupChaincodeDeploy() {
    if (typeof process.env.OVERWRITE_GOPATH === 'undefined' ||
        process.env.OVERWRITE_GOPATH.toString().toUpperCase() === 'TRUE') {
        process.env.GOPATH = path.join(__dirname, rootpath);
    }
}
exports.setupChaincodeDeploy = setupChaincodeDeploy;
// specifically set the values to defaults because they may have been overridden when
// running in the overall test bucket ('gulp test')
function resetDefaults() {
    global.hfc.config = undefined;
    Nconf.reset();
}
exports.resetDefaults = resetDefaults;
function cleanupDir(keyValStorePath) {
    const absPath = path.join(process.cwd(), keyValStorePath);
    const exists = existsSync(absPath);
    if (exists) {
        fs.removeSync(absPath);
    }
}
function getUniqueVersion(prefix) {
    if (!prefix) {
        prefix = 'v';
    }
    return prefix + Date.now();
}
exports.getUniqueVersion = getUniqueVersion;
// utility function to check if directory or file exists
// uses entire / absolute path from root
function existsSync(absolutePath /*string*/) {
    try {
        const stat = fs.statSync(absolutePath);
        return stat.isDirectory() || stat.isFile();
    }
    catch (e) {
        return false;
    }
}
exports.existsSync = existsSync;
/**
 * Read the content of the given file.
 * @param {string} path The path of the file.
 * @return {Promise<object>} The raw content of the file.
 */
function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err) {
                reject(new Error('Failed to read file ' + path + ' due to error: ' + err));
            }
            else {
                resolve(data);
            }
        });
    });
}
exports.readFile = readFile;
/**
 * Read all file contents in the given directory.
 * @param {string} dir The path of the directory.
 * @return {object[]} The collection of raw file contents.
 */
function readAllFiles(dir) {
    const files = fs.readdirSync(dir);
    const certs = [];
    files.forEach((file_name) => {
        let file_path = path.join(dir, file_name);
        let data = fs.readFileSync(file_path);
        certs.push(data);
    });
    return certs;
}
function init(config_path) {
    Client.addConfigFile(config_path);
    const fa = Client.getConfigSetting('fabric');
    ORGS = fa.network;
    channels = fa.channel;
    cryptodir = fa.cryptodir;
}
exports.init = init;
const tlsOptions = {
    trustedRoots: [],
    verify: false
};
/**
 * Retrieve an enrolled user, or enroll the user if necessary.
 * @param {string} username The name of the user.
 * @param {string} password The enrollment secret necessary to enroll the user.
 * @param {Client} client The Fabric client object.
 * @param {string} userOrg The name of the user's organization.
 * @return {Promise<User>} The retrieved and enrolled user object.
 */
function getMember(username, password, client, userOrg) {
    const caUrl = ORGS[userOrg].ca.url;
    return client.getUserContext(username, true)
        .then((user) => {
        return new Promise((resolve, reject) => {
            if (user && user.isEnrolled()) {
                return resolve(user);
            }
            const member = new User(username);
            let cryptoSuite = client.getCryptoSuite();
            if (!cryptoSuite) {
                cryptoSuite = Client.newCryptoSuite();
                if (userOrg) {
                    cryptoSuite.setCryptoKeyStore(Client.newCryptoKeyStore({ path: storePathForOrg(ORGS[userOrg].name) }));
                    client.setCryptoSuite(cryptoSuite);
                }
            }
            member.setCryptoSuite(cryptoSuite);
            // need to enroll it with CA server
            const cop = new copService(caUrl, tlsOptions, ORGS[userOrg].ca.name, cryptoSuite);
            return cop.enroll({
                enrollmentID: username,
                enrollmentSecret: password
            }).then((enrollment) => {
                return member.setEnrollment(enrollment.key, enrollment.certificate, ORGS[userOrg].mspid);
            }).then(() => {
                let skipPersistence = false;
                if (!client.getStateStore()) {
                    skipPersistence = true;
                }
                return client.setUserContext(member, skipPersistence);
            }).then(() => {
                return resolve(member);
            }).catch((err) => {
                // TODO: will remove t argument later
                util_1.default.log('Failed to enroll and persist user. Error: ' + (err.stack ? err.stack : err));
            });
        });
    });
}
/**
 * Retrieve the admin identity for the given organization.
 * @param {Client} client The Fabric client object.
 * @param {string} userOrg The name of the user's organization.
 * @return {User} The admin user identity.
 */
function getAdmin(client, userOrg) {
    try {
        if (!ORGS.hasOwnProperty(userOrg)) {
            throw new Error('Could not found ' + userOrg + ' in configuration');
        }
        const org = ORGS[userOrg];
        let keyPEM, certPEM;
        if (org.user) {
            keyPEM = fs.readFileSync(org.user.key);
            certPEM = fs.readFileSync(org.user.cert);
        }
        else {
            let keyPath = path.join(__dirname, util.format('../../%s/peerOrganizations/%s.example.com/users/Admin@%s.example.com/keystore', cryptodir, userOrg, userOrg));
            if (!fs.existsSync(keyPath)) {
                keyPath = path.join(__dirname, util.format('../../%s/peerOrganizations/%s.example.com/users/Admin@%s.example.com/msp/keystore', cryptodir, userOrg, userOrg));
            }
            keyPEM = readAllFiles(keyPath)[0];
            let certPath = path.join(__dirname, util.format('../../%s/peerOrganizations/%s.example.com/users/Admin@%s.example.com/signcerts', cryptodir, userOrg, userOrg));
            if (!fs.existsSync(certPath)) {
                certPath = path.join(__dirname, util.format('../../%s/peerOrganizations/%s.example.com/users/Admin@%s.example.com/msp/signcerts', cryptodir, userOrg, userOrg));
            }
            certPEM = readAllFiles(certPath)[0];
        }
        const cryptoSuite = Client.newCryptoSuite();
        cryptoSuite.setCryptoKeyStore(Client.newCryptoKeyStore({ path: storePathForOrg(ORGS[userOrg].name) }));
        client.setCryptoSuite(cryptoSuite);
        return Promise.resolve(client.createUser({
            username: 'peer' + userOrg + 'Admin',
            mspid: org.mspid,
            cryptoContent: {
                privateKeyPEM: keyPEM.toString(),
                signedCertPEM: certPEM.toString()
            }
        }));
    }
    catch (err) {
        return Promise.reject(err);
    }
}
/**
 * Retrieve the admin identity of the orderer service organization.
 * @param {Client} client The Fabric client object.
 * @return {User} The retrieved orderer admin identity.
 */
function getOrdererAdmin(client) {
    try {
        if (!ORGS.orderer) {
            throw new Error('Could not found orderer in configuration');
        }
        const orderer = ORGS.orderer;
        let keyPEM, certPEM;
        if (orderer.user) {
            keyPEM = fs.readFileSync(orderer.user.key);
            certPEM = fs.readFileSync(orderer.user.cert);
        }
        else {
            let keyPath = path.join(__dirname, util.format('../../%s/ordererOrganizations/example.com/users/Admin@example.com/keystore', cryptodir));
            if (!fs.existsSync(keyPath)) {
                keyPath = path.join(__dirname, util.format('../../%s/ordererOrganizations/example.com/users/Admin@example.com/msp/keystore', cryptodir));
            }
            keyPEM = readAllFiles(keyPath)[0];
            let certPath = path.join(__dirname, util.format('../../%s/ordererOrganizations/example.com/users/Admin@example.com/signcerts', cryptodir));
            if (!fs.existsSync(certPath)) {
                certPath = path.join(__dirname, util.format('../../%s/ordererOrganizations/example.com/users/Admin@example.com/msp/signcerts', cryptodir));
            }
            certPEM = readAllFiles(certPath)[0];
        }
        return Promise.resolve(client.createUser({
            username: orderer.user.name,
            mspid: orderer.mspid,
            cryptoContent: {
                privateKeyPEM: keyPEM.toString(),
                signedCertPEM: certPEM.toString()
            }
        }));
    }
    catch (err) {
        return Promise.reject(err);
    }
}
function getOrderAdminSubmitter(client) {
    return getOrdererAdmin(client);
}
exports.getOrderAdminSubmitter = getOrderAdminSubmitter;
function getSubmitter(client, peerOrgAdmin, org) {
    if (arguments.length < 2) {
        throw new Error('"client" and "test" are both required parameters');
    }
    let peerAdmin, userOrg;
    if (typeof peerOrgAdmin === 'boolean') {
        peerAdmin = peerOrgAdmin;
    }
    else {
        peerAdmin = false;
    }
    // if the 3rd argument was skipped
    if (typeof peerOrgAdmin === 'string') {
        userOrg = peerOrgAdmin;
    }
    else {
        if (typeof org === 'string') {
            userOrg = org;
        }
        else {
            userOrg = 'org1';
        }
    }
    if (peerAdmin) {
        return getAdmin(client, userOrg);
    }
    else {
        return getMember('admin', 'adminpw', client, userOrg);
    }
}
exports.getSubmitter = getSubmitter;
//# sourceMappingURL=util.js.map