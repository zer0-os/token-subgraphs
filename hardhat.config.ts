/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-unused-vars */

require("dotenv").config();

import "@nomicfoundation/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";

import { HardhatUserConfig } from "hardhat/types";

const config : HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.26",
        settings: {
          optimizer: {
            enabled: true,
            runs: 20000,
          },
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "typechain",
  },
  mocha: {
    timeout: 5000000,
  },
  networks: {
    hardhat: {
      forking: {
        url: `${process.env.MAINNET_RPC_URL}`
      }
    },
    mainnet: {
      url: `${process.env.MAINNET_RPC_URL}`,
      accounts: [
        `${process.env.PRIVATE_KEY_A}`,
      ]
    },
  },
};

export default config;
