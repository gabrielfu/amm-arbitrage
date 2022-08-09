import { ethers } from "hardhat";

async function main() {
    const Arbitrage = await ethers.getContractFactory("Arbitrage");
    const arbitrage = await Arbitrage.deploy();
    
    await arbitrage.deployed();
    console.log(`Arbitrage deployed to ${arbitrage.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
