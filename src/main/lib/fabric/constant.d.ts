declare const tempdir: string;
declare const TxErrorEnum: {
    NoError: number;
    ProposalResponseError: number;
    BadProposalResponseError: number;
    OrdererResponseError: number;
    BadOrdererResponseError: number;
    EventNotificationError: number;
    BadEventNotificationError: number;
};
declare const TxErrorIndex: {
    ProposalResponseError: number;
    BadProposalResponseError: number;
    OrdererResponseError: number;
    BadOrdererResponseError: number;
    EventNotificationError: number;
    BadEventNotificationError: number;
};
export { tempdir, TxErrorIndex, TxErrorEnum };
