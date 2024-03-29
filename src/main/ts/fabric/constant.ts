import * as os from "os";
import * as path from "path";
const tempdir = path.join(os.tmpdir(), 'hfc');

const TxErrorEnum = {
    NoError: 0,
    ProposalResponseError: 1,
    BadProposalResponseError: 2,
    OrdererResponseError: 4,
    BadOrdererResponseError: 8,
    EventNotificationError: 16,
    BadEventNotificationError: 32
};

const TxErrorIndex = {
    ProposalResponseError: 0,
    BadProposalResponseError: 1,
    OrdererResponseError: 2,
    BadOrdererResponseError: 3,
    EventNotificationError: 4,
    BadEventNotificationError: 5
};

export {
    tempdir,
    TxErrorIndex,
    TxErrorEnum
};