import DockerMonitor from "./docker-monitor";
export default class ResourceStatistics {
    private monitor;
    private peers;
    constructor(monitor: DockerMonitor);
    print(): void;
    createDataDump(label: any): void;
    private printTable;
    /**
     * Get the default statistics table
     * @return {Array} statistics table
     */
    private getDefaultStats;
    _getDefaultItems(): any[];
    /**
     * Print the maximum values of all watched items
     */
    printMaxStats(): void;
    _getMaxItems(): string[];
    _getMaxHistoryValues(items: any, idx: any): any[];
    /**
     * pseudo private functions
     */
    /**
     * read current statistics from monitor object and push the data into peers.history object
     * the history data will not be cleared until stop() is called, in other words, calling restart will not vanish the data
     * @param {Boolean} tmp =true, the data should only be stored in history temporarily
     */
    _readDefaultStats(tmp: any): void;
    _getLastHistoryValues(items: any, idx: any): any[];
}
