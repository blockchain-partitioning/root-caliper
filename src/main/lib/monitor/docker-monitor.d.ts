/**
 * Copyright 2017 HUAWEI. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 */
import MonitorInterface from './monitor-interface';
/**
 * Resource monitor for local/remote docker containers
 */
export default class DockerMonitor extends MonitorInterface {
    private si;
    private Docker;
    private containers;
    private isReading;
    private intervalObj;
    private stats;
    private hasContainters;
    /**
     * Constructor
     * @param {JSON} filter lookup filter for containers
     * @param {*} interval resource fetching interval
     */
    constructor(filter: any, interval: any);
    /**
     * Start the monitor
     * @return {Promise} promise object
     */
    start(): any;
    static coresInUse(cpu_stats: any): any;
    static findCoresInUse(percpu_usage: any): any;
    /**
     * Restart the monitor
     * @return {Promise} promise object
     */
    restart(): any;
    /**
     * Stop the monitor
     * @return {Promise} promise object
     */
    stop(): Promise<{}>;
    /**
     * Get information of watched containers
     * info = {
     *     key: key of the container
     *     info: {
     *         TYPE: 'docker',
     *         NAME: name of the container
     *     }
     * }
     * @return {Array} array of containers' information
     */
    getPeers(): any[];
    /**
     * Get history of memory usage
     * @param {String} key key of the container
     * @return {Array} array of memory usage
     */
    getMemHistory(key: any): any;
    /**
     * Get history of CPU usage
     * @param {String} key key of the container
     * @return {Array} array of CPU usage
     */
    getCpuHistory(key: any): any;
    /**
     * Get history of network IO usage as {in, out}
     * @param {String} key key of the container
     * @return {Array} array of network IO usage
     */
    getNetworkHistory(key: any): {
        'in': any;
        'out': any;
    };
    createDataDump(label: any): void;
}
