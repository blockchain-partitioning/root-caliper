/**
* Copyright 2017 HUAWEI. All Rights Reserved.
*
* SPDX-License-Identifier: Apache-2.0
*
*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * BlockChain class, define operations to interact with the blockchain system under test
 */
class Blockchain {
    /**
     * merge an array of default 'txStatistics', the result is in first object of the array
     * Note even failed the first object of the array may still be changed
     * @param {Array} results txStatistics array
     * @return {Number} 0 if failed; otherwise 1
     */
    static mergeDefaultTxStats(results) {
        try {
            // skip invalid result
            let skip = 0;
            for (let i = 0; i < results.length; i++) {
                let result = results[i];
                if (!result.hasOwnProperty('succ') || !result.hasOwnProperty('fail') || (result.succ + result.fail) === 0) {
                    skip++;
                }
                else {
                    break;
                }
            }
            if (skip > 0) {
                results.splice(0, skip);
            }
            if (results.length === 0) {
                return 0;
            }
            let r = results[0];
            for (let i = 1; i < results.length; i++) {
                let v = results[i];
                if (!v.hasOwnProperty('succ') || !v.hasOwnProperty('fail') || (v.succ + v.fail) === 0) {
                    continue;
                }
                r.succ += v.succ;
                r.fail += v.fail;
                r.out.push.apply(r.out, v.out);
                if (v.create.min < r.create.min) {
                    r.create.min = v.create.min;
                }
                if (v.create.max > r.create.max) {
                    r.create.max = v.create.max;
                }
                if (v.final.min < r.final.min) {
                    r.final.min = v.final.min;
                }
                if (v.final.max > r.final.max) {
                    r.final.max = v.final.max;
                }
                if (v.delay.min < r.delay.min) {
                    r.delay.min = v.delay.min;
                }
                if (v.delay.max > r.delay.max) {
                    r.delay.max = v.delay.max;
                }
                r.delay.sum += v.delay.sum;
                for (let j = 0; j < v.delay.detail.length; j++) {
                    r.delay.detail.push(v.delay.detail[j]);
                }
            }
            return 1;
        }
        catch (err) {
            return 0;
        }
    }
    /**
     * create a 'null' txStatistics object
     * @return {JSON} 'null' txStatistics object
     */
    static createNullDefaultTxStats() {
        return { succ: 0, fail: 0 };
    }
}
exports.default = Blockchain;
//# sourceMappingURL=blockchain.js.map