import Fabric from "../fabric/fabric";
import Util from "../util";

export default class Client {
    private blockchain: Fabric;
    private results: any[];
    private txUpdateTail: number;
    private txNum: number;
    private txLastNum: number;
    private context: any;

    constructor(blockchain: Fabric, context: any) {
        this.blockchain = blockchain;
        this.results = [];
        this.txUpdateTail = 0;
        this.txNum = 0;
        this.txLastNum = 0;
        this.context = context;
    }

    async transact(args: string[]) {
        const result = await this.blockchain.invokeSmartContract(this.context, 'simple-addition-chaincode', 'v0', [Object.assign({}, args)], 120);
        this.addResult(result);
    }

    private addResult(result) {
        if (Array.isArray(result)) { // contain multiple results
            for (let i = 0; i < result.length; i++) {
                this.results.push(result[i]);
            }
        }
        else {
            this.results.push(result);
        }
    }

    transactionStatistics() {
        return this.blockchain.getDefaultTxStats(this.results, true);
    }

    createDataDump(label:string ) {
        Util.createDataDump(label, this.results)
    }
}