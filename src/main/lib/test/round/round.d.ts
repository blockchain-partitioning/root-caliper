import TestRoundConfiguration from "./configuration";
export default class TestRound {
    private resourceMonitor;
    private resourceStatistics;
    private blockchain;
    private transactionClient;
    private transactionStatistics;
    private transactionSendRateInterval;
    private configuration;
    private queue;
    private finished;
    private transactionsRemainingInBlock;
    private stopped;
    constructor(configuration: TestRoundConfiguration, context: any);
    private getNodesToWatch;
    private getImagesToWatch;
    addTransactions(block: any[]): Promise<{}>;
    private addTransactionToQueue;
    private transactionCanBeAddedToQueue;
    private filterChainCodeTransactions;
    start(): Promise<{}>;
    private processQueue;
    private shouldContinueRound;
    private processTransaction;
    private invokeSmartContract;
    stop(): Promise<void>;
}
