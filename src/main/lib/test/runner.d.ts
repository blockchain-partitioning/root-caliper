export default class TestRunner {
    private childrenIpAddresses;
    private blockchain;
    private benchmarkConfiguration;
    private rounds;
    private currentRound;
    private currentRoundIndex;
    private totalAmountOfTransactions;
    constructor(childrenIpAddresses: string[]);
    start(): Promise<void>;
    private createRounds;
    private startRounds;
    private startNextRound;
    private startChildren;
    private startChild;
    stop(): void;
    handleBlock(request: any, response: any): any;
    private addTransactionsToRound;
    private addTransactionsToNextRound;
}
