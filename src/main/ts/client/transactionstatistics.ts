import * as Table from "table";
import Client from "./client";
import Blockchain from "../comm/blockchain";

export default class TransactionStatistics {
    private client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    print(label){
        const statistics = [this.client.transactionStatistics()]; // Requires an Array for some reason.
        let resultTable = [];
        resultTable[0] = this.getResultTitle();
        let r;
        if(Blockchain.mergeDefaultTxStats(statistics) === 0) {
            r = Blockchain.createNullDefaultTxStats;
            r.label = label;
        }
        else {
            r = statistics[0];
            r.label = label;
            resultTable[1] = this.getResultValue(r);
        }

        // if(this.resultsbyround.length === 0) {
        //     this.resultsbyround.push(resultTable[0].slice(0));
        // }
        // if(resultTable.length > 1) {
        //     this.resultsbyround.push(resultTable[1].slice(0));
        // }
        console.log('###test result:###');
        this.printTable(resultTable);
    }

    getResultTitle() {
        return ['Name', 'Succ', 'Fail', 'Send Rate', 'Max Latency', 'Min Latency', 'Avg Latency', '75%ile Latency', 'Throughput'];
    }

    getResultValue(r) {
        let row = [];
        try {
            row.push(r.label);
            row.push(r.succ);
            row.push(r.fail);
            (r.create.max === r.create.min) ? row.push((r.succ + r.fail) + ' tps') : row.push(((r.succ + r.fail) / (r.create.max - r.create.min)).toFixed(0) + ' tps');
            row.push(r.delay.max.toFixed(2) + ' s');
            row.push(r.delay.min.toFixed(2) + ' s');
            row.push((r.delay.sum / r.succ).toFixed(2) + ' s');
            if(r.delay.detail.length === 0) {
                row.push('N/A');
            }
            else{
                r.delay.detail.sort(function(a, b) {
                    return a-b;
                });
                row.push(r.delay.detail[Math.floor(r.delay.detail.length * 0.75)].toFixed(2) + ' s');
            }

            (r.final.max === r.final.min) ? row.push(r.succ + ' tps') : row.push(((r.succ / (r.final.max - r.create.min)).toFixed(0)) + ' tps');
        }
        catch (err) {
            row = [r.label, 0, 0, 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A'];
        }

        return row;
    }

    printTable(value) {
        let t = Table.table(value, {border: Table.getBorderCharacters('ramac')});
        console.log(t);
    }

    createDataDump(name: string) {
        this.client.createDataDump(name);
    }
}