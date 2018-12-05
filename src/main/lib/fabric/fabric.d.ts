import BlockchainInterface from "../comm/blockchain-interface";
/**
 * Implements {BlockchainInterface} for a Fabric backend.
 */
export default class Fabric extends BlockchainInterface {
    /**
     * Create a new instance of the {Fabric} class.
     * @param {string} config_path The path of the Fabric network configuration file.
     */
    constructor(config_path: any);
    /**
     * Initialize the {Fabric} object.
     * @return {Promise} The return promise.
     */
    init(): Promise<any>;
    /**
     * Deploy the chaincode specified in the network configuration file to all peers.
     * @return {Promise} The return promise.
     */
    installSmartContract(): Promise<any>;
    /**
     * Return the Fabric context associated with the given callback module name.
     * @param {string} name The name of the callback module as defined in the configuration files.
     * @param {object} args Unused.
     * @return {object} The assembled Fabric context.
     */
    getContext(name: any): any;
    /**
     * Release the given Fabric context.
     * @param {object} context The Fabric context to release.
     * @return {Promise} The return promise.
     */
    releaseContext(context: any): Promise<{}>;
    /**
     * Invoke the given chaincode according to the specified options. Multiple transactions will be generated according to the length of args.
     * @param {string} contractID The name of the chaincode.
     * @param {string} contractVer The version of the chaincode.
     * @param {Array} args Array of JSON formatted arguments for transaction(s). Each element containts arguments (including the function name) passing to the chaincode. JSON attribute named transaction_type is used by default to specify the function name. If the attribute does not exist, the first attribute will be used as the function name.
     * @param {number} timeout The timeout to set for the execution in seconds.
     * @return {Promise<object>} The promise for the result of the execution.
     */
    invokeSmartContract(context: any, contractID: any, contractVer: any, args: any, timeout: any): Promise<any[]>;
    /**
     * Query the given chaincode according to the specified options.
     * @param {object} context The Fabric context returned by {getContext}.
     * @param {string} contractID The name of the chaincode.
     * @param {string} contractVer The version of the chaincode.
     * @param {string} key The argument to pass to the chaincode query.
     * @return {Promise<object>} The promise for the result of the execution.
     */
    queryState(context: any, contractID: any, contractVer: any, key: any): any;
    /**
     * Calculate basic statistics of the execution results.
     * @param {object} stats The object that contains the different statistics.
     * @param {object[]} results The collection of previous results.
     */
    getDefaultTxStats(results: any, detail: any): {
        'succ': number;
        'fail': number;
        'create': {
            'min': number;
            'max': number;
        };
        'final': {
            'min': number;
            'max': number;
        };
        'delay': {
            'min': number;
            'max': number;
            'sum': number;
            'detail': any[];
        };
        'out': any[];
    };
}
