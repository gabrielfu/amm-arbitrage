import fs from "fs";
import { ethers, BigNumber as BN } from "ethers";
import { Token, Pair, ArbitragePair, Factory } from "./types";

const factoryAbi = JSON.parse(fs.readFileSync("./src/abi/Factory.json", 'utf-8'));
const factoryIface = new ethers.utils.Interface(factoryAbi);

const pairAbi = JSON.parse(fs.readFileSync("./src/abi/Pair.json", 'utf-8'));
const pairIface = new ethers.utils.Interface(pairAbi);

const factories: Factory[] = [
    { name: "UniswapV2", address: "0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f" },
    { name: "Sushiswap", address: "0xc0aee478e3658e2610c5f7a4a2e1777ce9e4f2ac" },
];

const baseTokens: Token[] = [
    { symbol: 'WETH', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' },
    { symbol: 'DAI', address: '0x6b175474e89094c44da98b954eedeac495271d0f' },
    { symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
    { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
];

const quoteTokens: Token[] = [
    { symbol: 'WETH', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' },
    { symbol: 'DAI', address: '0x6b175474e89094c44da98b954eedeac495271d0f' },
    { symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
    { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
    { symbol: 'LINK', address: '0x514910771af9ca656af840dff83e8264ecf986ca' },
    { symbol: 'ZRX', address: '0xe41d2489571d322189246dafa5ebde1f4699f498' },
    { symbol: 'SNX', address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f' },
    { symbol: 'WBTC', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' },
    { symbol: 'AAVE', address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9' },
    { symbol: 'UNI', address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' },
];

var arbitragePairs: ArbitragePair[] = [];

/** Please call initializePairs() before calling this function */
export function getArbitragePairs() {
    return arbitragePairs;
}

export function getBaseTokens() {
    return baseTokens;
}

export function getQuoteTokens() {
    return quoteTokens;
}

export function getFactories() {
    return factories;
}

/**
* Initialize all available arbitrage pairs
* @param provider 
*/
export async function initializePairs(provider: ethers.providers.Provider) {
    // form token pairs [token0, token1]
    let allTokenPairs: [Token, Token][] = [];
    baseTokens.forEach((b) => {
        quoteTokens.forEach((q) => {
            if (b.address != q.address) {
                allTokenPairs.push([b, q]);
            }
        });
    });
    
    // for each token pair, we find all AMMs that support this pair
    // by calling the AMM factory getPair() method to get the pair address
    // and store the pair addresses in allAmms
    let allAmms: string[][] = allTokenPairs.map(_ => []);
    let promises: Promise<any>[] = [];
    let factoryContracts = factories.map(f => new ethers.Contract(f.address, factoryIface, provider));
    allTokenPairs.forEach(([t0, t1], i) => {
        let _i = i;
        factoryContracts.forEach(f => {
            let factoryContract = new ethers.Contract(f.address, factoryIface, provider);
            let p = factoryContract.functions.getPair(t0.address, t1.address)
            .then((resp: string[]) => {
                let address: string = resp[0].toLowerCase();
                // if pair exists
                if (address != "0x0000000000000000000000000000000000000000") {
                    allAmms[_i].push(address);
                };
            });
            promises.push(p);
        });
    });
    await Promise.all(promises);
    
    // flatten allAmms
    allTokenPairs.forEach(([t0, t1], i) => {
        let amms = allAmms[i];
        for (var j=0; j < amms.length; j += 1) {
            for (var k=j+1; k < amms.length; k += 1) {
                let [_t0, _t1] = sortTokens(t0.address, t1.address);
                let ap: ArbitragePair = {
                    baseToken: t0,
                    quoteToken: t1,
                    pair0: { address: amms[j], token0: _t0, token1: _t1 },
                    pair1: { address: amms[k], token0: _t0, token1: _t1 },
                }
                arbitragePairs.push(ap);
            }
        }
    });
}

function sortTokens(tokenA: string, tokenB: string): [string, string] {
    let [token0, token1] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA];
    return [token0, token1];
}

export async function getReserves(pair: string, provider: ethers.providers.Provider): Promise<[BN, BN]> {
    let pairContract = new ethers.Contract(pair, pairIface, provider);
    let reserves = await pairContract.functions.getReserves();
    let reserve0 = BN.from(reserves._reserve0);
    let reserve1 = BN.from(reserves._reserve1);
    return [reserve0, reserve1];
}