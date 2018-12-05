"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const path = require("path");
const tempdir = path.join(os.tmpdir(), 'hfc');
exports.tempdir = tempdir;
const TxErrorEnum = {
    NoError: 0,
    ProposalResponseError: 1,
    BadProposalResponseError: 2,
    OrdererResponseError: 4,
    BadOrdererResponseError: 8,
    EventNotificationError: 16,
    BadEventNotificationError: 32
};
exports.TxErrorEnum = TxErrorEnum;
const TxErrorIndex = {
    ProposalResponseError: 0,
    BadProposalResponseError: 1,
    OrdererResponseError: 2,
    BadOrdererResponseError: 3,
    EventNotificationError: 4,
    BadEventNotificationError: 5
};
exports.TxErrorIndex = TxErrorIndex;
//# sourceMappingURL=constant.js.map