/**
 * Internal Utility class for Caliper
 */
export default class Util {
    /**
     * Perform a sleep
     * @param {*} ms the time to sleep, in ms
     * @returns {Promise} a completed promise
     */
    static sleep(ms: any): Promise<{}>;
    /**
     * Simple log method to output to the console
     * @param {any} msg messages to log
     */
    static log(...msg: any[]): void;
    static createDataDump(label: any, data: any): void;
}
