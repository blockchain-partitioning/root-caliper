import * as Client from "fabric-client";
/**
 * Initialize the Fabric client configuration.
 * @param {string} config_path The path of the Fabric network configuration file.
 */
declare function init(config_path: any): void;
/**
 * Deploy the given chaincode to the given organization's peers.
 * @param {string} org The name of the organization.
 * @param {object} chaincode The chaincode object from the configuration file.
 * @return {Promise} The return promise.
 */
declare function installChaincode(org: any, chaincode: any): Promise<void>;
/**
 * Instantiate or upgrade the given chaincode with the given endorsement policy.
 * @param {object} chaincode The chaincode object from the configuration file.
 * @param {object} endorsement_policy The endorsement policy object from the configuration file.
 * @param {boolean} upgrade Indicates whether the call is an upgrade or a new instantiation.
 * @return {Promise} The return promise.
 */
declare function instantiateChaincode(chaincode: any, endorsement_policy: any, upgrade: any): Promise<void>;
/**
 * Create a Fabric context based on the channel configuration.
 * @param {object} channelConfig The channel object from the configuration file.
 * @return {Promise<object>} The created Fabric context.
 */
declare function getcontext(channelConfig: any): Promise<{
    org: any;
    client: Client;
    channel: Client.Channel;
    submitter: any;
    eventhubs: any[];
}>;
/**
 * Disconnect the event hubs.
 * @param {object} context The Fabric context.
 * @return {Promise} The return promise.
 */
declare function releasecontext(context: any): Promise<void>;
/**
 * Submit a transaction to the given chaincode with the specified options.
 * @param {object} context The Fabric context.
 * @param {string} id The name of the chaincode.
 * @param {string} version The version of the chaincode.
 * @param {string[]} args The arguments to pass to the chaincode.
 * @param {number} timeout The timeout for the transaction invocation.
 * @return {Promise<object>} The result and stats of the transaction invocation.
 */
declare function invokebycontext(context: any, id: any, version: any, args: any, timeout: any): Promise<{
    id: any;
    status: string;
    time_create: number;
    time_final: number;
    time_endorse: number;
    time_order: number;
    result: any;
    verified: boolean;
    error_flags: number;
    error_messages: any[];
}>;
/**
 * Submit a query to the given chaincode with the specified options.
 * @param {object} context The Fabric context.
 * @param {string} id The name of the chaincode.
 * @param {string} version The version of the chaincode.
 * @param {string} name The single argument to pass to the chaincode.
 * @return {Promise<object>} The result and stats of the transaction invocation.
 */
declare function querybycontext(context: any, id: any, version: any, name: any): any;
/**
 * Read all file contents in the given directory.
 * @param {string} dir The path of the directory.
 * @return {object[]} The collection of raw file contents.
 */
declare function readAllFiles(dir: any): any[];
export { init, installChaincode, instantiateChaincode, getcontext, releasecontext, invokebycontext, querybycontext, readAllFiles };
