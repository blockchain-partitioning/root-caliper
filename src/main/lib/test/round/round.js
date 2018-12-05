"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fabric_1 = require("../../fabric/fabric");
const docker_monitor_1 = require("../../monitor/docker-monitor");
const resourcestatistics_1 = require("../../monitor/resourcestatistics");
const client_1 = require("../../client/client");
const transactionstatistics_1 = require("../../client/transactionstatistics");
class TestRound {
    constructor(configuration, context) {
        this.configuration = configuration;
        this.queue = {
            transactions: [],
            transactionsAddedToQueue: 0,
            transactionsSent: 0,
            transactionsToSend: this.configuration.amountOfTransactions
        };
        this.blockchain = new fabric_1.default("/test-runner/network/configuration.json");
        this.transactionClient = new client_1.default(this.blockchain, context);
        this.transactionStatistics = new transactionstatistics_1.default(this.transactionClient);
        let imagesToWatch = this.getImagesToWatch();
        let nodesToWatch = this.getNodesToWatch();
        const containerFilter = { name: nodesToWatch, images: imagesToWatch };
        this.resourceMonitor = new docker_monitor_1.default(containerFilter, 1);
        this.resourceStatistics = new resourcestatistics_1.default(this.resourceMonitor);
        this.transactionsRemainingInBlock = [];
    }
    getNodesToWatch() {
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
    getImagesToWatch() {
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
    addTransactions(block) {
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
        });
    }
    addTransactionToQueue(chaincodeArguments, transaction) {
        if (this.transactionCanBeAddedToQueue()) {
            this.queue.transactions.push(chaincodeArguments);
            this.queue.transactionsAddedToQueue++;
        }
        else {
            this.transactionsRemainingInBlock.push(transaction);
        }
    }
    transactionCanBeAddedToQueue() {
        return this.queue.transactionsAddedToQueue < this.queue.transactionsToSend;
    }
    filterChainCodeTransactions(block, functionName) {
        return block.filter((transaction) => {
            const filteredTransactions = transaction.filter((chainCodeArguments) => {
                const chaincdeFunctionName = chainCodeArguments[0];
                return chaincdeFunctionName === functionName;
            });
            return (filteredTransactions.length && filteredTransactions.length > 0);
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Starting round:", this.configuration.name);
            yield this.resourceMonitor.start();
            this.transactionSendRateInterval = setInterval(() => {
                this.processQueue();
            }, 1000 / this.configuration.rate);
            return new Promise((resolve, reject) => {
                this.finished = () => {
                    resolve();
                };
            });
        });
    }
    processQueue() {
        if (this.shouldContinueRound()) {
            this.processTransaction();
        }
        else {
            const returnval = this.stop();
        }
    }
    shouldContinueRound() {
        return this.queue.transactionsSent < this.queue.transactionsToSend;
    }
    processTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.queue.transactions && this.queue.transactions.length > 0) {
                try {
                    const chaincodeArguments = this.queue.transactions.shift();
                    yield this.invokeSmartContract(chaincodeArguments);
                    this.queue.transactionsSent++;
                }
                catch (e) {
                    console.error(e);
                    this.queue.transactionsSent++;
                }
            }
        });
    }
    invokeSmartContract(chaincodeArguments) {
        return this.transactionClient.transact(chaincodeArguments);
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Stopping round:", this.configuration.name);
            clearInterval(this.transactionSendRateInterval);
            this.resourceStatistics.print();
            this.resourceStatistics.printMaxStats();
            this.resourceStatistics.createDataDump(this.configuration.name + '-resources');
            this.transactionStatistics.print(this.configuration.name);
            this.transactionStatistics.createDataDump(this.configuration.name + '-transactions');
            yield this.resourceMonitor.stop();
            this.finished();
            this.stopped = true;
            console.log("Amount of transactions sent:", this.queue.transactionsSent);
            this.queue.transactions = [];
        });
    }
}
exports.default = TestRound;
//# sourceMappingURL=round.js.map