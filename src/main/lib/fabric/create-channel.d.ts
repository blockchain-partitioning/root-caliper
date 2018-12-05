/**
 * Create the channels located in the given configuration file.
 * @param {string} config_path The path to the Fabric network configuration file.
 * @return {Promise} The return promise.
 */
declare function run(config_path: any): Promise<any>;
export { run };
