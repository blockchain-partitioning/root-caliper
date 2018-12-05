declare function getChannel(name: any): any;
declare function getDefaultChannel(): any;
declare function getTempDir(): string;
declare const KVS: string;
declare function storePathForOrg(org: any): string;
declare function setupChaincodeDeploy(): void;
declare function resetDefaults(): void;
declare function getUniqueVersion(prefix: any): any;
declare function existsSync(absolutePath: any): boolean;
/**
 * Read the content of the given file.
 * @param {string} path The path of the file.
 * @return {Promise<object>} The raw content of the file.
 */
declare function readFile(path: any): Promise<{}>;
declare function init(config_path: any): void;
declare function getOrderAdminSubmitter(client: any): Promise<any>;
declare function getSubmitter(client: any, peerOrgAdmin: any, org: any): any;
export { getChannel, getDefaultChannel, getTempDir, KVS, storePathForOrg, setupChaincodeDeploy, resetDefaults, getUniqueVersion, existsSync, readFile, init, getOrderAdminSubmitter, getSubmitter };
