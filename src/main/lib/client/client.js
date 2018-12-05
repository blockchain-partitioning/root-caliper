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
const util_1 = require("../util");
class Client {
    constructor(blockchain, context) {
        this.blockchain = blockchain;
        this.results = [];
        this.txUpdateTail = 0;
        this.txNum = 0;
        this.txLastNum = 0;
        this.context = context;
    }
    transact(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.blockchain.invokeSmartContract(this.context, 'simple-addition-chaincode', 'v0', [Object.assign({}, args)], 120);
            this.addResult(result);
        });
    }
    addResult(result) {
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
    createDataDump(label) {
        util_1.default.createDataDump(label, this.results);
    }
}
exports.default = Client;
//# sourceMappingURL=client.js.map