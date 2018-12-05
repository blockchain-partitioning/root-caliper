import Fabric from "../fabric/fabric";
export default class Client {
    private blockchain;
    private results;
    private txUpdateTail;
    private txNum;
    private txLastNum;
    private context;
    constructor(blockchain: Fabric, context: any);
    transact(args: string[]): Promise<void>;
    private addResult;
    transactionStatistics(): {
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
    createDataDump(label: string): void;
}
