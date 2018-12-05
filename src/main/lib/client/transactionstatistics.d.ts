import Client from "./client";
export default class TransactionStatistics {
    private client;
    constructor(client: Client);
    print(label: any): void;
    getResultTitle(): string[];
    getResultValue(r: any): any[];
    printTable(value: any): void;
    createDataDump(name: string): void;
}
