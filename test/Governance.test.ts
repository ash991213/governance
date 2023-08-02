import { ethers } from 'hardhat';
import { Contract, Signer } from 'ethers';
import { expect } from 'chai';

async function errException(promise: Promise<any>): Promise<any> {
	try {
		await promise;
	} catch (error: any) {
		return error;
	}
	throw new Error('Expected throw not received');
}

describe('Governance', () => {
	let governance: Contract;
	let owner: Signer;
	let signers: Signer[] = [];
	let notaries: Signer[] = [];
	let verifiers: Signer[] = [];
	let operators: Signer[] = [];
	const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
	const period = 24 * 60 * 60;

	enum VoterType {
		NOTARY,
		VERIFIER,
		OPERATOR,
	}

	enum VoteChoice {
		SUPPORT,
		OPPOSE,
		NEUTRAL,
	}

	before(async () => {
		const Governance = await ethers.getContractFactory('Governance');
		governance = await Governance.deploy();
		governance.deployed();

		// @ts-ignore
		signers = await ethers.getSigners();
		owner = signers[0];
		notaries = signers.slice(1, 4);
		verifiers = signers.slice(4, 7);
		operators = signers.slice(7, 10);
	});

	describe('addVoter', async () => {
		it('should add a new voter', async () => {
			await governance.connect(owner).addVoter(await notaries[0].getAddress(), VoterType.NOTARY);
			await governance.connect(owner).addVoter(await verifiers[0].getAddress(), VoterType.VERIFIER);
			await governance.connect(owner).addVoter(await operators[0].getAddress(), VoterType.OPERATOR);

			expect(await governance.isAllowedVoter(await notaries[0].getAddress())).to.be.true;
			expect(await governance.isAllowedVoter(await verifiers[0].getAddress())).to.be.true;
			expect(await governance.isAllowedVoter(await operators[0].getAddress())).to.be.true;

			expect(await governance.votersType(await notaries[0].getAddress())).to.equal(VoterType.NOTARY);
			expect(await governance.votersType(await verifiers[0].getAddress())).to.equal(VoterType.VERIFIER);
			expect(await governance.votersType(await operators[0].getAddress())).to.equal(VoterType.OPERATOR);
		});

		it('should emit VoterAdded event', async () => {
			const transaction1 = await governance.connect(owner).addVoter(await notaries[1].getAddress(), VoterType.NOTARY);
			const transaction2 = await governance.connect(owner).addVoter(await verifiers[1].getAddress(), VoterType.VERIFIER);
			const transaction3 = await governance.connect(owner).addVoter(await operators[1].getAddress(), VoterType.OPERATOR);

			const receiptTx1 = await transaction1.wait();
			const receiptTx2 = await transaction2.wait();
			const receiptTx3 = await transaction3.wait();

			const notaryEvent = receiptTx1.events.find((e: any) => e.event === 'VoterAdded');
			expect(notaryEvent.args.newVoter).to.equal(await notaries[1].getAddress());
			expect(notaryEvent.args.voterType).to.equal(VoterType.NOTARY);

			const verifierEvent = receiptTx2.events.find((e: any) => e.event === 'VoterAdded');
			expect(verifierEvent.args.newVoter).to.equal(await verifiers[1].getAddress());
			expect(verifierEvent.args.voterType).to.equal(VoterType.VERIFIER);

			const operatorEvent = receiptTx3.events.find((e: any) => e.event === 'VoterAdded');
			expect(operatorEvent.args.newVoter).to.equal(await operators[1].getAddress());
			expect(operatorEvent.args.voterType).to.equal(VoterType.OPERATOR);
		});

		it('should revert when adding an existing voter', async () => {
			await errException(governance.connect(owner).addVoter(await notaries[0].getAddress(), VoterType.NOTARY));
			await errException(governance.connect(owner).addVoter(await notaries[1].getAddress(), VoterType.NOTARY));
			await errException(governance.connect(owner).addVoter(await verifiers[0].getAddress(), VoterType.VERIFIER));
			await errException(governance.connect(owner).addVoter(await verifiers[1].getAddress(), VoterType.VERIFIER));
			await errException(governance.connect(owner).addVoter(await operators[0].getAddress(), VoterType.OPERATOR));
			await errException(governance.connect(owner).addVoter(await operators[1].getAddress(), VoterType.OPERATOR));
		});
	});

	describe('removeVoter', async () => {
		it('should remove an existing voter', async () => {
			await governance.connect(owner).removeVoter(await notaries[0].getAddress());
			await governance.connect(owner).removeVoter(await verifiers[0].getAddress());
			await governance.connect(owner).removeVoter(await operators[0].getAddress());

			expect(await governance.isAllowedVoter(await notaries[0].getAddress())).to.be.false;
			expect(await governance.isAllowedVoter(await verifiers[0].getAddress())).to.be.false;
			expect(await governance.isAllowedVoter(await operators[0].getAddress())).to.be.false;
		});

		it('should emit VoterRemoved evnet', async () => {
			const transaction1 = await governance.connect(owner).removeVoter(await notaries[1].getAddress());
			const transaction2 = await governance.connect(owner).removeVoter(await verifiers[1].getAddress());
			const transaction3 = await governance.connect(owner).removeVoter(await operators[1].getAddress());

			const receiptTx1 = await transaction1.wait();
			const receiptTx2 = await transaction2.wait();
			const receiptTx3 = await transaction3.wait();

			const notaryEvent = receiptTx1.events.find((e: any) => e.event === 'VoterRemoved');
			expect(notaryEvent.args.voter).to.equal(await notaries[1].getAddress());
			expect(notaryEvent.args.voterType).to.equal(VoterType.NOTARY);

			const verifierEvent = receiptTx2.events.find((e: any) => e.event === 'VoterRemoved');
			expect(verifierEvent.args.voter).to.equal(await verifiers[1].getAddress());
			expect(verifierEvent.args.voterType).to.equal(VoterType.VERIFIER);

			const operatorEvent = receiptTx3.events.find((e: any) => e.event === 'VoterRemoved');
			expect(operatorEvent.args.voter).to.equal(await operators[1].getAddress());
			expect(operatorEvent.args.voterType).to.equal(VoterType.OPERATOR);
		});

		it('should revert when removing an existing voter', async () => {
			await errException(governance.connect(owner).removeVoter(await notaries[0].getAddress(), VoterType.NOTARY));
			await errException(governance.connect(owner).removeVoter(await notaries[1].getAddress(), VoterType.NOTARY));
			await errException(governance.connect(owner).removeVoter(await verifiers[0].getAddress(), VoterType.VERIFIER));
			await errException(governance.connect(owner).removeVoter(await verifiers[1].getAddress(), VoterType.VERIFIER));
			await errException(governance.connect(owner).removeVoter(await operators[0].getAddress(), VoterType.OPERATOR));
			await errException(governance.connect(owner).removeVoter(await operators[1].getAddress(), VoterType.OPERATOR));
		});
	});

	describe('createVote', () => {
		let voters: any = [];

		beforeEach(async () => {
			voters = [
				{ voter: notaries[0], type: VoterType.NOTARY },
				{ voter: verifiers[0], type: VoterType.VERIFIER },
				{ voter: operators[0], type: VoterType.OPERATOR },
			];

			await Promise.all(
				voters.map(async (v: any) => {
					await governance.connect(owner).addVoter(await v.voter.getAddress(), v.type);
					expect(await governance.isAllowedVoter(await v.voter.getAddress())).to.be.true;
				}),
			);
		});

		it('should create a new vote', async () => {
			for (const voter of voters) {
				const createVoteTx = await governance.connect(owner).createVote(period, voter.type);
				const createVoteReceiptTx = await createVoteTx.wait();

				const voteId = (await governance.totalVotes()) - 1;
				const vote = await governance.votes(voteId);
				const eligibleVotersLength = await governance.eligibleVotersLength();

				expect(vote.totalSupportCount).to.equal(0);
				expect(vote.totalOpposeCount).to.equal(0);
				expect(vote.totalNeutralCount).to.equal(0);
				expect(vote.isFinalized).to.equal(false);
				expect(vote.voterType).to.equal(voter.type);
				expect(vote.totalVotersCount).to.equal(eligibleVotersLength - 1);

				const votingStartedEvent = createVoteReceiptTx.events.find((e: any) => e.event === 'VotingStarted');
				expect(votingStartedEvent.args.voteId).to.equal(voteId);
			}
		});
	});

	describe('vote', () => {
		beforeEach(async () => {
			await governance.connect(owner).createVote(period, VoterType.NOTARY);
		});

		it('When a new voter is added while a vote is in progress, the new voter should be able to participate in the vote starting from the next vote.', async () => {
			await governance.connect(owner).addVoter(await notaries[1].getAddress(), VoterType.NOTARY);
			await governance.connect(owner).addVoter(await verifiers[1].getAddress(), VoterType.VERIFIER);
			await governance.connect(owner).addVoter(await operators[1].getAddress(), VoterType.OPERATOR);

			const voteId = (await governance.totalVotes()) - 1;

			const currentVote = await governance.votes(voteId);
			expect(currentVote.isFinalized).to.be.false;
			await errException(governance.connect(notaries[1]).vote(voteId, VoteChoice.SUPPORT));
			await errException(governance.connect(verifiers[1]).vote(voteId, VoteChoice.OPPOSE));
			await errException(governance.connect(operators[1]).vote(voteId, VoteChoice.NEUTRAL));
		});

		it('should allow eligible voter to vote and update vote data', async () => {
			const voteId = (await governance.totalVotes()) - 1;
			const initialVote = await governance.votes(voteId);

			expect(initialVote.totalSupportCount).to.equal(0);
			expect(initialVote.totalOpposeCount).to.equal(0);
			expect(initialVote.totalNeutralCount).to.equal(0);
			expect(initialVote.isFinalized).to.equal(false);
			expect(initialVote.voterType).to.equal(VoterType.NOTARY);

			expect(await governance.hasVoted(voteId, await notaries[0].getAddress())).to.be.false;
			expect(await governance.hasVoted(voteId, await verifiers[0].getAddress())).to.be.false;
			expect(await governance.hasVoted(voteId, await operators[0].getAddress())).to.be.false;

			const notariesVoteTransaction = await governance.connect(notaries[0]).vote(voteId, VoteChoice.SUPPORT);
			const verifiersVotetransaction = await governance.connect(verifiers[0]).vote(voteId, VoteChoice.OPPOSE);
			const operatorsVoteTransaction = await governance.connect(operators[0]).vote(voteId, VoteChoice.NEUTRAL);

			const notariesVoteReceiptTx = await notariesVoteTransaction.wait();
			const verifiersVoteReceiptTx = await verifiersVotetransaction.wait();
			const operatorsVoteReceiptTx = await operatorsVoteTransaction.wait();

			const notaryEvent = notariesVoteReceiptTx.events.find((e: any) => e.event === 'VotingCasted');
			expect(notaryEvent.args.voteId).to.equal(voteId);
			expect(notaryEvent.args.voter).to.equal(await notaries[0].getAddress());
			expect(notaryEvent.args.voteChoice).to.equal(VoteChoice.SUPPORT);

			const verifierEvent = verifiersVoteReceiptTx.events.find((e: any) => e.event === 'VotingCasted');
			expect(verifierEvent.args.voteId).to.equal(voteId);
			expect(verifierEvent.args.voter).to.equal(await verifiers[0].getAddress());
			expect(verifierEvent.args.voteChoice).to.equal(VoteChoice.OPPOSE);

			const operatorEvent = operatorsVoteReceiptTx.events.find((e: any) => e.event === 'VotingCasted');
			expect(operatorEvent.args.voteId).to.equal(voteId);
			expect(operatorEvent.args.voter).to.equal(await operators[0].getAddress());
			expect(operatorEvent.args.voteChoice).to.equal(VoteChoice.NEUTRAL);

			const updateVote = await governance.votes(voteId);

			expect(await governance.hasVoted(voteId, await notaries[0].getAddress())).to.be.true;
			expect(await governance.hasVoted(voteId, await verifiers[0].getAddress())).to.be.true;
			expect(await governance.hasVoted(voteId, await operators[0].getAddress())).to.be.true;

			expect(await governance.totalVoters(voteId, VoterType.NOTARY)).to.equal(1);
			expect(await governance.totalVoters(voteId, VoterType.VERIFIER)).to.equal(1);
			expect(await governance.totalVoters(voteId, VoterType.OPERATOR)).to.equal(1);

			const [supportCount, opposeCount, neutralCount] = await governance.getVoteCounts(voteId);
			const [notariesVoteChoice, notariesChoiceCount] = await governance.getVoteSelectionAndCount(voteId, await notaries[0].getAddress());
			const [verifiersVoteChoice, verifiersChoiceCount] = await governance.getVoteSelectionAndCount(voteId, await verifiers[0].getAddress());
			const [operatorsVoteChoice, operatorsChoiceCount] = await governance.getVoteSelectionAndCount(voteId, await operators[0].getAddress());

			expect(await governance.verifyVoteCount(voteId, supportCount, opposeCount, neutralCount)).to.be.true;
			expect({ supportCount, opposeCount, neutralCount }).to.deep.equal({ supportCount: updateVote.totalSupportCount, opposeCount: updateVote.totalOpposeCount, neutralCount: updateVote.totalNeutralCount });
			expect({ notariesVoteChoice, notariesChoiceCount }).to.deep.equal({ notariesVoteChoice: VoteChoice.SUPPORT, notariesChoiceCount: 5 });
			expect({ verifiersVoteChoice, verifiersChoiceCount }).to.deep.equal({ verifiersVoteChoice: VoteChoice.OPPOSE, verifiersChoiceCount: 3 });
			expect({ operatorsVoteChoice, operatorsChoiceCount }).to.deep.equal({ operatorsVoteChoice: VoteChoice.NEUTRAL, operatorsChoiceCount: 1 });
		});

		it('should not allow a voter to vote twice for the same vote', async () => {
			const voteId = (await governance.totalVotes()) - 1;

			await governance.connect(notaries[0]).vote(voteId, VoteChoice.SUPPORT);
			await governance.connect(verifiers[0]).vote(voteId, VoteChoice.OPPOSE);
			await governance.connect(operators[0]).vote(voteId, VoteChoice.NEUTRAL);

			expect(await governance.hasVoted(voteId, await notaries[0].getAddress())).to.be.true;
			expect(await governance.hasVoted(voteId, await verifiers[0].getAddress())).to.be.true;
			expect(await governance.hasVoted(voteId, await operators[0].getAddress())).to.be.true;

			await errException(governance.connect(notaries[0]).vote(voteId, VoteChoice.SUPPORT));
			await errException(governance.connect(verifiers[0]).vote(voteId, VoteChoice.OPPOSE));
			await errException(governance.connect(operators[0]).vote(voteId, VoteChoice.NEUTRAL));
		});

		it('should only allow eligible voters to vote', async () => {
			const voteId = (await governance.totalVotes()) - 1;

			await errException(governance.connect(notaries[2]).vote(voteId, VoteChoice.SUPPORT));
			await errException(governance.connect(verifiers[2]).vote(voteId, VoteChoice.OPPOSE));
			await errException(governance.connect(operators[2]).vote(voteId, VoteChoice.NEUTRAL));

			const vote = await governance.votes(voteId);

			expect(vote.totalSupportCount).to.equal(0);
			expect(vote.totalOpposeCount).to.equal(0);
			expect(vote.totalNeutralCount).to.equal(0);
		});

		it('should only allow voting for valid vote ID', async () => {
			const invalidVoteId = await governance.totalVotes();

			await errException(governance.connect(notaries[0]).vote(invalidVoteId, VoteChoice.SUPPORT));
			await errException(governance.connect(verifiers[0]).vote(invalidVoteId, VoteChoice.OPPOSE));
			await errException(governance.connect(operators[0]).vote(invalidVoteId, VoteChoice.NEUTRAL));
		});

		it('should only allow voting for valid vote ID', async () => {
			const transaction = await governance.connect(owner).createVote(period, VoterType.NOTARY);
			const receiptTx = await transaction.wait();
			const createVoteEvent = receiptTx.events.find((e: any) => e.event === 'VotingStarted');
			const voteId = (await governance.totalVotes()) - 1;

			await provider.send('evm_mine', [createVoteEvent.args.time.toNumber() + 100]);
			await errException(governance.connect(notaries[0]).vote(voteId, VoteChoice.SUPPORT));
			await errException(governance.connect(verifiers[0]).vote(voteId, VoteChoice.OPPOSE));
			await errException(governance.connect(operators[0]).vote(voteId, VoteChoice.NEUTRAL));
		});
	});

	describe('forceEndVote', () => {
		beforeEach(async () => {
			await governance.connect(owner).createVote(period, VoterType.NOTARY);
		});

		it('should force end a vote', async () => {
			const voteId = (await governance.totalVotes()) - 1;
			const forceEndVoteTx = await governance.connect(owner).forceEndVote(voteId);
			const forceEndVoteReceiptTx = await forceEndVoteTx.wait();
			const vote = await governance.votes(voteId);

			expect(vote.isFinalized).to.be.true;

			await errException(governance.connect(notaries[0]).vote(voteId, VoteChoice.SUPPORT));
			await errException(governance.connect(verifiers[0]).vote(voteId, VoteChoice.OPPOSE));
			await errException(governance.connect(operators[0]).vote(voteId, VoteChoice.NEUTRAL));

			const votingForceEndedEvent = forceEndVoteReceiptTx.events.find((e: any) => e.event === 'VotingForceEnded');
			expect(votingForceEndedEvent.args.voteId).to.equal(voteId);
		});
	});

	describe('transferVoteRewards', () => {
		beforeEach(async () => {
			await governance.connect(owner).createVote(period, VoterType.NOTARY);
		});

		it('should revert if the vote is not finalized', async () => {
			const voteId = (await governance.totalVotes()) - 1;
			await governance.connect(notaries[0]).vote(voteId, VoteChoice.SUPPORT);
			await governance.connect(verifiers[0]).vote(voteId, VoteChoice.OPPOSE);
			await governance.connect(operators[0]).vote(voteId, VoteChoice.NEUTRAL);

			await errException(governance.connect(owner).transferVoteRewards(voteId));
		});

		it('should revert if the vote is rejected or invalidated', async () => {
			const transaction = await governance.connect(owner).createVote(period, VoterType.NOTARY);
			const receiptTx = await transaction.wait();
			const createVoteEvent = receiptTx.events.find((e: any) => e.event === 'VotingStarted');
			const voteId = (await governance.totalVotes()) - 1;

			await governance.connect(notaries[0]).vote(voteId, VoteChoice.NEUTRAL);
			await governance.connect(verifiers[0]).vote(voteId, VoteChoice.NEUTRAL);
			await governance.connect(operators[0]).vote(voteId, VoteChoice.NEUTRAL);

			await provider.send('evm_mine', [createVoteEvent.args.time.toNumber() + 100]);

			await governance.connect(owner).endVote(voteId);
			await errException(governance.connect(owner).transferVoteRewards(voteId));
		});

		it('should transfer rewards to voters', async () => {
			await owner.sendTransaction({
				to: governance.address,
				value: ethers.utils.parseEther('900'),
			});

			const cretaeVoteTransaction = await governance.connect(owner).createVote(period, VoterType.NOTARY);
			const cretaeVotereceiptTx = await cretaeVoteTransaction.wait();
			const createVoteEvent = cretaeVotereceiptTx.events.find((e: any) => e.event === 'VotingStarted');
			const voteId = (await governance.totalVotes()) - 1;

			await governance.connect(notaries[0]).vote(voteId, VoteChoice.SUPPORT);
			await governance.connect(verifiers[0]).vote(voteId, VoteChoice.SUPPORT);
			await governance.connect(operators[0]).vote(voteId, VoteChoice.SUPPORT);

			await provider.send('evm_mine', [createVoteEvent.args.time.toNumber() + 100]);
			await governance.connect(owner).endVote(voteId);

			const notariesRewardTransaction = await governance.connect(notaries[0]).transferVoteRewards(voteId);
			const notariesRewardTx = await notariesRewardTransaction.wait();
			const notariesRewardEvent = notariesRewardTx.events.find((e: any) => e.event === 'RewardsTransferred');
			expect(notariesRewardEvent.args.voteId).to.equal(voteId);
			expect(notariesRewardEvent.args.transferredAmount).to.equal(ethers.utils.parseEther('250'));

			const verifiersRewardTransaction = await governance.connect(verifiers[0]).transferVoteRewards(voteId);
			const verifiersRewardTx = await verifiersRewardTransaction.wait();
			const verifiersRewardEvent = verifiersRewardTx.events.find((e: any) => e.event === 'RewardsTransferred');
			expect(verifiersRewardEvent.args.voteId).to.equal(voteId);
			expect(verifiersRewardEvent.args.transferredAmount).to.equal(ethers.utils.parseEther('150'));

			const operatorsRewardTransaction = await governance.connect(operators[0]).transferVoteRewards(voteId);
			const operatorsRewardTx = await operatorsRewardTransaction.wait();
			const operatorsRewardEvent = operatorsRewardTx.events.find((e: any) => e.event === 'RewardsTransferred');
			expect(operatorsRewardEvent.args.voteId).to.equal(voteId);
			expect(operatorsRewardEvent.args.transferredAmount).to.equal(ethers.utils.parseEther('90'));
		});
	});
});
