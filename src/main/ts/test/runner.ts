import * as Path from "path";
import * as Request from "request";
import * as Fs from "fs-extra";
import Fabric from "../fabric/fabric";
import TestRound from "./round/round";
import TestRoundConfiguration from "./round/configuration";

interface BenchmarkConfiguration {
    rounds: TestRoundConfiguration[]
}

export default class TestRunner {
    private childrenIpAddresses: string[];
    private blockchain: Fabric;
    private benchmarkConfiguration: BenchmarkConfiguration;
    private rounds: TestRound[];
    private currentRound: TestRound;
    private currentRoundIndex: number;
    private totalAmountOfTransactions: number;

    constructor(childrenIpAddresses: string[]) {
        this.childrenIpAddresses = childrenIpAddresses || [];
        this.blockchain = new Fabric(Path.join(Path.sep, "test-runner", "network", "configuration.json"));
        this.benchmarkConfiguration = Fs.readJsonSync(Path.join(Path.sep, "test-runner", "benchmark", "configuration.json"));
        this.totalAmountOfTransactions = 0;
    }

    async start() {
        global.status = 'initializing';
        await this.blockchain.init();
        await this.blockchain.installSmartContract();
        this.rounds = await this.createRounds(this.benchmarkConfiguration);
        this.startRounds();
        this.startChildren();
    }

    private async createRounds(configuration: BenchmarkConfiguration): Promise<TestRound>[] {
        const rounds = [];
        for (let i = 0; i < configuration.rounds.length; i++) {
            const roundConfiguration = configuration.rounds[i];
            const context = await this.blockchain.getContext(roundConfiguration.name);
            rounds.push(new TestRound(roundConfiguration, context));
        }

        return rounds;
    }

    private startRounds() {
        global.status = 'busy';
        this.currentRoundIndex = 0;
        this.startNextRound()
    }

    private startNextRound() {
        if (this.currentRoundIndex < this.rounds.length) {
            this.currentRound = this.rounds[this.currentRoundIndex];
            this.currentRound.start().then(() => {
                this.currentRoundIndex++;
                console.log("Amount of transactions received:", this.totalAmountOfTransactions);
                this.startNextRound();
            });
        }
        else{
            global.status = 'finished';
        }
    }

    private startChildren() {
        console.log("Starting children tests");
        this.childrenIpAddresses.forEach((child: string) => {
            this.startChild(child);
        })
    }

    private startChild(childIpAddress: string) {
        console.log("Starting", childIpAddress);
        Request.get(
            `http://${childIpAddress}/start`,
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body)
                }
            }
        );
    }

    stop() {
        this.rounds.forEach(async (round) => {
            await round.stop()
        })
    }

    handleBlock(request: any, response: any) {
        if (!request.body) return response.sendStatus(400);
        const block = request.body.transactions || [];
        this.totalAmountOfTransactions += block.length;
        this.addTransactionsToRound(block);
    }


    private addTransactionsToRound(block) {
        this.currentRound.addTransactions(block)
            .then(() => {
            })
            .catch((transactionsForNextRound) => {
                this.addTransactionsToNextRound(transactionsForNextRound, this.currentRoundIndex + 1)
            });
    }

    private addTransactionsToNextRound(transactionsForNextRound: any[], nextIndex: number) {
        console.log("Could not add transactions. Adding to round with index:", nextIndex);
        if (transactionsForNextRound.length > 0 && nextIndex < this.rounds.length) {
            const nextRound = this.rounds[nextIndex];
            nextRound.addTransactions(transactionsForNextRound).then(() => {
            }).catch((block) => {
                this.addTransactionsToNextRound(block, nextIndex + 1);
            })
        }
    }
}