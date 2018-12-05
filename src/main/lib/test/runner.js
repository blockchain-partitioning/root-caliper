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
const Path = require("path");
const Request = require("request");
const Fs = require("fs-extra");
const fabric_1 = require("../fabric/fabric");
const round_1 = require("./round/round");
class TestRunner {
    constructor(childrenIpAddresses) {
        this.childrenIpAddresses = childrenIpAddresses || [];
        this.blockchain = new fabric_1.default(Path.join(Path.sep, "test-runner", "network", "configuration.json"));
        this.benchmarkConfiguration = Fs.readJsonSync(Path.join(Path.sep, "test-runner", "benchmark", "configuration.json"));
        this.totalAmountOfTransactions = 0;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            global.status = 'initializing';
            yield this.blockchain.init();
            yield this.blockchain.installSmartContract();
            this.rounds = yield this.createRounds(this.benchmarkConfiguration);
            this.startRounds();
            this.startChildren();
        });
    }
    createRounds(configuration) {
        return __awaiter(this, void 0, void 0, function* () {
            const rounds = [];
            for (let i = 0; i < configuration.rounds.length; i++) {
                const roundConfiguration = configuration.rounds[i];
                const context = yield this.blockchain.getContext(roundConfiguration.name);
                rounds.push(new round_1.default(roundConfiguration, context));
            }
            return rounds;
        });
    }
    startRounds() {
        global.status = 'busy';
        this.currentRoundIndex = 0;
        this.startNextRound();
    }
    startNextRound() {
        if (this.currentRoundIndex < this.rounds.length) {
            this.currentRound = this.rounds[this.currentRoundIndex];
            this.currentRound.start().then(() => {
                this.currentRoundIndex++;
                console.log("Amount of transactions received:", this.totalAmountOfTransactions);
                this.startNextRound();
            });
        }
        else {
            global.status = 'finished';
        }
    }
    startChildren() {
        console.log("Starting children tests");
        this.childrenIpAddresses.forEach((child) => {
            this.startChild(child);
        });
    }
    startChild(childIpAddress) {
        console.log("Starting", childIpAddress);
        Request.get(`http://${childIpAddress}/start`, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body);
            }
        });
    }
    stop() {
        this.rounds.forEach((round) => __awaiter(this, void 0, void 0, function* () {
            yield round.stop();
        }));
    }
    handleBlock(request, response) {
        if (!request.body)
            return response.sendStatus(400);
        const block = request.body.transactions || [];
        this.totalAmountOfTransactions += block.length;
        this.addTransactionsToRound(block);
    }
    addTransactionsToRound(block) {
        this.currentRound.addTransactions(block)
            .then(() => {
        })
            .catch((transactionsForNextRound) => {
            this.addTransactionsToNextRound(transactionsForNextRound, this.currentRoundIndex + 1);
        });
    }
    addTransactionsToNextRound(transactionsForNextRound, nextIndex) {
        console.log("Could not add transactions. Adding to round with index:", nextIndex);
        if (transactionsForNextRound.length > 0 && nextIndex < this.rounds.length) {
            const nextRound = this.rounds[nextIndex];
            nextRound.addTransactions(transactionsForNextRound).then(() => {
            }).catch((block) => {
                this.addTransactionsToNextRound(block, nextIndex + 1);
            });
        }
    }
}
exports.default = TestRunner;
//# sourceMappingURL=runner.js.map