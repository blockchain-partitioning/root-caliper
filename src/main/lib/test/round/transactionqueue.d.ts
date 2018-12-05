export default interface TransactionQueue {
    transactions: any[];
    transactionsToSend: number;
    transactionsAddedToQueue: number;
    transactionsSent: number;
}
