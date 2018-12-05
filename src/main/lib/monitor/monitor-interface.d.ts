/**
* Copyright 2017 HUAWEI. All Rights Reserved.
*
* SPDX-License-Identifier: Apache-2.0
*
*/
/**
 * Interface of resource consumption monitor
 */
export default class MonitorInterface {
    protected filter: any;
    protected interval: number;
    /**
     * Constructor
     * @param {JSON} filter Lookup filter
     * @param {*} interval Watching interval, in second
     */
    constructor(filter: any, interval: any);
    /**
    * start monitoring
    */
    start(): void;
    /**
    * restart monitoring
    */
    restart(): void;
    /**
    * stop monitoring
    */
    stop(): void;
    /**
    * Get watching list
    */
    getPeers(): void;
    /**
    * Get history of memory usage, in byte
    * @param {String} key Lookup key
    */
    getMemHistory(key: any): void;
    /**
    * Get history of cpu usage, %
    * @param {String} key Lookup key
    */
    getCpuHistory(key: any): void;
    /**
    * Get history of network IO usage, byte
    * @param {String} key Lookup key
    */
    getNetworkHistory(key: any): void;
}
