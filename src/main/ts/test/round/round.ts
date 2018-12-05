import Fabric from "../../fabric/fabric";
import DockerMonitor from "../../monitor/docker-monitor";
import ResourceStatistics from "../../monitor/resourcestatistics";
import Client from "../../client/client";
import TransactionStatistics from "../../client/transactionstatistics";
import TestRoundConfiguration from "./configuration";
import Timer = NodeJS.Timer;
import TransactionQueue from "./transactionqueue";

export default class TestRound {
    private resourceMonitor: DockerMonitor;
    private resourceStatistics: ResourceStatistics;
    private blockchain: Fabric;
    private transactionClient: Client;
    private transactionStatistics: TransactionStatistics;
    private transactionSendRateInterval: Timer;
    private configuration: TestRoundConfiguration;
    private queue: TransactionQueue;
    private finished: Function;
    private transactionsRemainingInBlock: any[];
    private stopped: boolean;

    constructor(configuration: TestRoundConfiguration, context: any) {
        this.configuration = configuration;
        this.queue = {
            transactions: [],
            transactionsAddedToQueue: 0,
            transactionsSent: 0,
            transactionsToSend: this.configuration.amountOfTransactions
        };
        this.blockchain = new Fabric("/test-runner/network/configuration.json");
        this.transactionClient = new Client(this.blockchain, context);
        this.transactionStatistics = new TransactionStatistics(this.transactionClient);
        let imagesToWatch = this.getImagesToWatch();
        let nodesToWatch = this.getNodesToWatch();
        const containerFilter = {name: nodesToWatch, images: imagesToWatch};
        this.resourceMonitor = new DockerMonitor(containerFilter, 1);
        this.resourceStatistics = new ResourceStatistics(this.resourceMonitor);
        this.transactionsRemainingInBlock = [];
    }

    private getNodesToWatch() {
        let nodesToWatch = [];
        try {
            if (process.env.NODES_TO_WATCH) {
                nodesToWatch = JSON.parse(process.env.NODES_TO_WATCH);
            }
        }
        catch (e) {
            console.error("Unable to parse env.NODES_TO_WATCH");
        }
        return nodesToWatch;
    }

    private getImagesToWatch() {
        let imagesToWatch = ["hyperledger/fabric-ca", "hyperledger/fabric-peer", "hyperledger/fabric-orderer", "org1", "org2"];
        try {
            if (process.env.IMAGES_TO_WATCH) {
                imagesToWatch = JSON.parse(process.env.IMAGES_TO_WATCH);
            }
        }
        catch (e) {
            console.error("Unable to parse env.IMAGES_TO_WATCH");
        }
        return imagesToWatch;
    }

    addTransactions(block: any[]) {
        return new Promise((resolve, reject) => {
            if (block && block.length > 0 && !this.stopped && this.transactionCanBeAddedToQueue()) {
                const filteredTransactions = this.filterChainCodeTransactions(block, this.configuration.function);
                filteredTransactions.forEach((transaction) => {
                    transaction.forEach((chaincodeArguments) => {
                        this.addTransactionToQueue(chaincodeArguments, transaction);
                    });
                });
                if (this.transactionCanBeAddedToQueue()) {
                    resolve();
                }
                else {
                    reject(this.transactionsRemainingInBlock);
                    this.transactionsRemainingInBlock = [];
                }
            }
            else {
                reject(block);
            }
        })
    }

    private addTransactionToQueue(chaincodeArguments, transaction) {
        if (this.transactionCanBeAddedToQueue()) {
            this.queue.transactions.push(chaincodeArguments);
            this.queue.transactionsAddedToQueue++;
        } else {
            this.transactionsRemainingInBlock.push(transaction);
        }
    }

    private transactionCanBeAddedToQueue() {
        return this.queue.transactionsAddedToQueue < this.queue.transactionsToSend;
    }

    private filterChainCodeTransactions(block, functionName) {
        return block.filter((transaction) => {
            const filteredTransactions = transaction.filter((chainCodeArguments) => {
                const chaincdeFunctionName = chainCodeArguments[0];
                return chaincdeFunctionName === functionName;
            });
            return (filteredTransactions.length && filteredTransactions.length > 0);
        });
    }

    async start() {
        console.log("Starting round:", this.configuration.name);
        await this.resourceMonitor.start();
        this.transactionSendRateInterval = setInterval(() => {
            this.processQueue();
        }, 1000 / this.configuration.rate);
        return new Promise((resolve, reject) => {
            this.finished = () => {
                resolve()
            };
        })

    }

    private processQueue() {
        if (this.shouldContinueRound()) {
            this.processTransaction()
        }
        else {
            const returnval = this.stop();
        }
    }

    private shouldContinueRound() {
        return this.queue.transactionsSent < this.queue.transactionsToSend
    }

    private async processTransaction() {
        if (this.queue.transactions && this.queue.transactions.length > 0) {
            try {
                const chaincodeArguments = this.queue.transactions.shift();
                await this.invokeSmartContract(chaincodeArguments);
                this.queue.transactionsSent++;
            } catch (e) {
                console.error(e);
                this.queue.transactionsSent++;
            }
        }
    }

    private invokeSmartContract(chaincodeArguments) {
        return this.transactionClient.transact(chaincodeArguments);
    }

    async stop() {
        console.log("Stopping round:", this.configuration.name);
        clearInterval(this.transactionSendRateInterval);
        this.resourceStatistics.print();
        this.resourceStatistics.printMaxStats();
        this.resourceStatistics.createDataDump(this.configuration.name + '-resources');
        this.transactionStatistics.print(this.configuration.name);
        this.transactionStatistics.createDataDump(this.configuration.name + '-transactions');
        await this.resourceMonitor.stop();
        this.finished();
        this.stopped = true;
        console.log("Amount of transactions sent:", this.queue.transactionsSent);
        this.queue.transactions = [];
    }
}