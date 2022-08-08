import fs from "fs";
import pool from '@ricokahler/pool';
import { ethers, BigNumber as BN } from "ethers";
import { calculateAmountIn, calculateProfit } from "./model";
import { initializePairs, getArbitragePairs, getReserves } from "./tokens";
import { ArbitragePair, Pair } from "./types";

const INFURA_API_KEY = "";
const provider = new ethers.providers.InfuraProvider("homestead", INFURA_API_KEY);

const contractAddress = "";
const contractAbi = JSON.parse(fs.readFileSync("./src/abi/Arbitrage.json", 'utf-8'));
const contractIface = new ethers.utils.Interface(contractAbi);
const arbitrage = new ethers.Contract(contractAddress, contractIface, provider);

const c = BN.from(30);
const ZERO = BN.from(0);

async function runOnePair(ap: ArbitragePair) {
    let [p0_r0, p0_r1] = await getReserves(ap.pair0.address, provider);
    let [rb0, rq0 ] = ap.pair0.token0 == ap.baseToken.address
    ? [p0_r0, p0_r1] 
    : [p0_r1, p0_r0];
    let [p1_r0, p1_r1] = await getReserves(ap.pair1.address, provider);
    let [rb1, rq1 ] = ap.pair1.token0 == ap.baseToken.address
    ? [p1_r0, p1_r1] 
    : [p1_r1, p1_r0];
    
    let amount01 = calculateAmountIn(rb0, rq0, rb1, rq1, c);
    let amount10 = calculateAmountIn(rb1, rq1, rb0, rq0, c);
    let profit01 = calculateProfit(amount01, rb0, rq0, rb1, rq1, c);
    let profit10 = calculateProfit(amount10, rb1, rq1, rb0, rq0, c);
    
    let amountIn: BN;
    let profit: BN;
    let pair0: Pair;
    let pair1: Pair;
    if (amount01.gt(ZERO)) {
        amountIn = amount01;
        profit = profit01;
        pair0 = ap.pair0;
        pair1 = ap.pair1;
    }
    else if (amount10.gt(ZERO)) {
        amountIn = amount10;
        profit = profit10;
        pair0 = ap.pair1;
        pair1 = ap.pair0;
    } else {
        return;
    }
    
    console.log(`executing arbitrage base=${ap.baseToken.symbol} quote=${ap.quoteToken.symbol} pair0=${pair0} pair1=${pair1}`);
    let response = await arbitrage.functions.execute(
        ap.baseToken.address, 
        ap.quoteToken.address, 
        pair0.address, 
        pair1.address,
        amountIn,
        )
        let receipt = await response.wait();
        console.log(`tx submmited hash=${receipt.transactionHash} status=${receipt.status}`);
    }
    
    async function main() {
        // 
        await initializePairs(provider);
        const arbitragePairs = getArbitragePairs();
        
        while (true) {
            await pool({
                collection: arbitragePairs,
                task: runOnePair,
                maxConcurrency: 3,
            });
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    }
    
    main();