/**
* Copyright 2017 HUAWEI. All Rights Reserved.
*
* SPDX-License-Identifier: Apache-2.0
*
*/
/**
 * Interface of blockchain adapters
 */
export default class BlockchainInterface {
    protected configPath: string;
    /**
     * Constructor
     * @param {String} configPath path of the blockchain configuration file
     */
    constructor(configPath: any);
    /**
     * Initialise test environment
     */
    init(): void;
    /**
     * Install smart contract(s)
     */
    installSmartContract(): void;
    /**
     * Perform required preparation for test clients
     * @param {Number} number count of test clients
     * @return {Promise} obtained material for test clients
     */
    prepareClients(number: any): Promise<any[]>;
    /**
     * Get a context for subsequent operations
     * 'engine' attribute of returned context object must be reserved for benchmark engine to extend the context
     *  engine = {
     *   submitCallback: callback which must be called once new transaction(s) is submitted, it receives a number argument which tells how many transactions are submitted
     * }
     * @param {String} name name of the context
     * @param {Object} args adapter specific arguments
     */
    getContext(name: any, args: any): void;
    /**
     * Release a context as well as related resources
     * @param {Object} context adapter specific object
     */
    releaseContext(context: any): void;
    /**
     * Invoke a smart contract
     * @param {Object} context context object
     * @param {String} contractID identiy of the contract
     * @param {String} contractVer version of the contract
     * @param {Array} args array of JSON formatted arguments for multiple transactions
     * @param {Number} timeout request timeout, in second
     */
    invokeSmartContract(context: any, contractID: any, contractVer: any, args: any, timeout: any): void;
    /**
     * Query state from the ledger
     * @param {Object} context context object from getContext
     * @param {String} contractID identiy of the contract
     * @param {String} contractVer version of the contract
     * @param {String} key lookup key
     */
    queryState(context: any, contractID: any, contractVer: any, key: any): void;
    /**
     * Get adapter specific transaction statistics
     * @param {JSON} stats txStatistics object
     * @param {Array} results array of txStatus objects
     */
    getDefaultTxStats(stats: any, results: any): void;
}
