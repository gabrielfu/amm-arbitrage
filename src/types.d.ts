export interface Token {
    readonly symbol: string;
    readonly address: string;
}

export interface Pair {
    readonly address: string;
    readonly token0: Token;
    readonly token1: Token;
}

/** Represents a pair of AMM pairs to perform arbitrage on for a pair of baseToken & quoteToken */
export interface ArbitragePair {
    readonly baseToken: string;
    readonly quoteToken: string;
    readonly pair0: string;
    readonly pair1: string;
};

export interface Factory {
    readonly name: string;
    readonly address: string;
}