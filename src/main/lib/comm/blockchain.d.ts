/**
* Copyright 2017 HUAWEI. All Rights Reserved.
*
* SPDX-License-Identifier: Apache-2.0
*
*/
/**
 * BlockChain class, define operations to interact with the blockchain system under test
 */
export default class Blockchain {
    /**
     * merge an array of default 'txStatistics', the result is in first object of the array
     * Note even failed the first object of the array may still be changed
     * @param {Array} results txStatistics array
     * @return {Number} 0 if failed; otherwise 1
     */
    static mergeDefaultTxStats(results: any): 0 | 1;
    /**
     * create a 'null' txStatistics object
     * @return {JSON} 'null' txStatistics object
     */
    static createNullDefaultTxStats(): {
        succ: number;
        fail: number;
    };
}
