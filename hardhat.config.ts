import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import AppConfig from "./config";

const MAINNET_RPC = `https://mainnet.infura.io/v3/${AppConfig.providers.infura}`;
const MAINNET_ACCOUNTS = AppConfig.accounts;

const config: HardhatUserConfig = {
    networks: {
        hardhat: {},
        mainnet: {
            chainId: 1,
            url: MAINNET_RPC,
            accounts: MAINNET_ACCOUNTS
        }
    },
    solidity: {
        version: "0.8.9",
        settings: {
            optimizer: {
                enabled: true,
                runs: 20
            },
            outputSelection: {
                "*": {
                    "*": ["storageLayout"]
                }
            }
        }
    }
};

export default config;
