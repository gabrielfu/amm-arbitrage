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
        [pair1.address]: 1_200_000,
    })
    await quoteToken.setVariable("_balances", {
        [pair0.address]: 1_000_000,
        [pair1.address]: 800_000,
    })
    // sync pair reserves
    await pair0.sync();
    await pair1.sync();

    // expected profit
    let amountIn = 5000;
    let expectedProfit = 2372;

    return { baseToken, quoteToken, pair0, pair1, amountIn, expectedProfit };
}


describe("Arbitrage", function() {

    describe("Deployment", function() {
        it("Should set the right owner", async function () {
            const { arbitrage, owner } = await loadFixture(deployFixture);
            expect(await arbitrage.getOwner()).to.equal(owner.address);
        });
    });

    describe("Execute", function() {
        let arbitrage: Contract;
        let owner: any;
        let otherAccount: any;

        let baseToken: MockContract;
        let quoteToken: MockContract;
        let pair0: MockContract;
        let pair1: MockContract;
        let amountIn: number;
        let expectedProfit: number;

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
            amountIn = mock.amountIn;
            expectedProfit = mock.expectedProfit;
        });

        it("Should revert when called by non owner", async function() {
            await expect(arbitrage.connect(otherAccount).execute(
                baseToken.address, 
                quoteToken.address, 
                pair0.address, 
                pair1.address,
                amountIn
            )).to.be.revertedWith("UNAUTHORIZED");
        });

        it("Should revert when unprofitable", async function() {
            await baseToken.setVariable("_balances", {
                [pair0.address]: 1_000_000,
                [pair1.address]: 800_000,
            })
            await pair1.sync();
            await expect(arbitrage.execute(
                baseToken.address, 
                quoteToken.address, 
                pair0.address, 
                pair1.address,
                amountIn
            )).to.be.revertedWith("UNPROFITABLE");
            expect(await baseToken.balanceOf(arbitrage.address)).to.equal(0);
            expect(await baseToken.balanceOf(owner.address)).to.equal(0);
        });

        it("Should trade", async function() {
            await expect(arbitrage.execute(
                baseToken.address, 
                quoteToken.address, 
                pair0.address, 
                pair1.address,
                amountIn
            )).to.not.be.reverted;
            expect(await baseToken.balanceOf(arbitrage.address)).to.equal(0);
            expect(await baseToken.balanceOf(owner.address)).to.equal(expectedProfit);
        });
    });

});