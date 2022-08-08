import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { MockContract, smock } from "@defi-wonderland/smock";
import { Contract } from "ethers";

async function deployFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Arbitrage = await ethers.getContractFactory("Arbitrage");
    const arbitrage = await Arbitrage.deploy();

    return { arbitrage, owner, otherAccount };
}

function sortTokens(tokenA: string, tokenB: string) {
    let [token0, token1] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA];
    return [token0, token1];
}


// Deploy mock external contracts so that our contract can interact with them
async function deployMockContracts() {    
    // mock erc20 contracts
    const ERC20 = await smock.mock("ERC20");
    const baseToken = await ERC20.deploy("baseToken", "baseToken");
    const quoteToken = await ERC20.deploy("quoteToken", "quoteToken");
    
    // mock pair contracts
    const Pair = await smock.mock("Pair");
    const pair0 = await Pair.deploy();
    const pair1 = await Pair.deploy();
    
    // set token0 & token 1
    await pair0.setVariables({
        token0: sortTokens(baseToken.address, quoteToken.address)[0],
        token1: sortTokens(baseToken.address, quoteToken.address)[1],
    })
    await pair1.setVariables({
        token0: sortTokens(baseToken.address, quoteToken.address)[0],
        token1: sortTokens(baseToken.address, quoteToken.address)[1],
    })
    
    // set reserves
    await baseToken.setVariable("_balances", {
        [pair0.address]: 1_000_000,
        [pair1.address]: 1_000_000,
    })
    await quoteToken.setVariable("_balances", {
        [pair0.address]: 1_000_000,
        [pair1.address]: 1_000_000,
    })
    // sync pair reserves
    await pair0.sync();
    await pair1.sync();

    return { baseToken, quoteToken, pair0, pair1 };
}


describe("Arbitrage", function() {

    describe("Deployment", function() {

    });


    describe("Arbitrage", function() {
        let arbitrage: Contract;
        let owner: any;
        let otherAccount: any;

        let baseToken: MockContract;
        let quoteToken: MockContract;
        let pair0: MockContract;
        let pair1: MockContract;

        beforeEach(async function() {
            const fixture = await loadFixture(deployFixture);
            arbitrage = fixture.arbitrage;
            owner = fixture.owner;
            otherAccount = fixture.otherAccount;

            const mock = await deployMockContracts();
            baseToken = mock.baseToken;
            quoteToken = mock.quoteToken;
            pair0 = mock.pair0;
            pair1 = mock.pair1;
        });

        it("Should trade", async function() {

        });
    });

});