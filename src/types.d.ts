export interface Token {
    readonly symbol: string;
    readonly address: string;
}

export interface Pair {
    readonly address: string;
    readonly token0: string;
    readonly token1: string;
}

/** Represents a pair of AMM pairs to perform arbitrage on for a pair of baseToken & quoteToken */
export interface ArbitragePair {
    readonly baseToken: Token;
    readonly quoteToken: Token;
    readonly pair0: Pair;
    readonly pair1: Pair;
};

export interface Factory {
    readonly name: string;
    readonly address: string;
}