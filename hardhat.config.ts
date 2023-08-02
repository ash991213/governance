import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'dotenv/config';

const config: HardhatUserConfig = {
	defaultNetwork: 'ganache',
	networks: {
		ganache: {
			url: `http://127.0.0.1:8545`,
			gas: 'auto',
			gasPrice: 10e9,
		},
		sepolia: {
			url: `https://sepolia.infura.io/v3/${String(process.env.SEPOLIA_API_KEY)}`,
			accounts: [String(process.env.PRIVATE_KEY)],
			chainId: 11155111,
		},
		bsc_testnet: {
			url: `https://wandering-icy-dinghy.bsc-testnet.quiknode.pro/${String(process.env.BSC_TESTNET_API_KEY)}/`,
			accounts: [String(process.env.PRIVATE_KEY)],
			chainId: 97,
			gas: 'auto',
			gasPrice: 20e9,
		},
		bsc_mainnet: {
			url: `https://bold-magical-bush.bsc.quiknode.pro/${String(process.env.BSC_MAINNET_API_KEY)}/`,
			accounts: [String(process.env.PRIVATE_KEY)],
			chainId: 56,
			gas: 'auto',
			gasPrice: 10e9,
		},
	},
	solidity: {
		version: '0.8.0',
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	paths: {
		sources: './contracts',
		tests: './test',
		cache: './cache',
		artifacts: './artifacts',
	},
	mocha: {
		timeout: 20000,
	},
};

export default config;
