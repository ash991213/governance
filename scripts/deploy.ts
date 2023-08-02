import { ethers } from 'hardhat';

async function main() {
	const Governance = await ethers.getContractFactory('Governance');
	const governance = await Governance.deploy();
	await governance.deployed();
	console.log(`Governance deployed to ${governance.address}`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
