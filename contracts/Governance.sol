// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Payable is Ownable, ReentrancyGuard {
    /**
     * @dev Event emitted when coins are deposited into the contract.
     * @param depositor Address of the depositor.
     * @param amount The amount of coins deposited.
     */
    event Deposit(address indexed depositor, uint256 amount);

    /**
     * @dev Event emitted when coins are withdrawn from the contract.
     * @param recipient Address of the recipient.
     * @param amount The amount of coins withdrawn.
     */
    event Withdrawal(address indexed recipient, uint256 amount);

    /**
     * @dev Fallback function to deposit coins into the contract.
     */
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev Function to withdraw coins from the contract.
     * @param amount The amount of coins to withdraw.
     */
    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= address(this).balance, "Insufficient balance");
        emit Withdrawal(msg.sender, amount);
        payable(msg.sender).transfer(amount);
    }
}

contract Governance is Payable {
    /**
     * @dev Total number of votes created.
     */
    uint32 public totalVotes;

    /**
     * @dev Total number of eligible voters.
     */
    uint32 public eligibleVotersLength = 1;

    /**
     * @dev Enumerates the types of votes: SUPPORT, OPPOSE, NEUTRAL.
     */
    enum VoteChoice {SUPPORT, OPPOSE, NEUTRAL}

    /**
     * @dev Enumerates the types of voters: NOTARY, VERIFIER, OPERATOR.
     */
    enum VoterType {NOTARY, VERIFIER, OPERATOR}

    /**
     * @dev Struct the vote results of an individual voter.
     */
    struct VoterResult {
        uint32 supportCount; // 찬성표
        uint32 opposeCount; // 반대표
        uint32 neutralCount; // 무효표
    }

    /**
     * @dev Struct the information of a vote.
     */
    struct Vote {
        uint32 totalSupportCount; // Total number of support votes
        uint32 totalOpposeCount; // Total number of oppose votes
        uint32 totalNeutralCount; // Total number of neutral votes
        uint32 totalVotersCount; // Total number of eligible voters
        uint256 votingPeriod; // Voting end time
        bool isFinalized; // Indicates if the vote is finalized
        VoterType voterType; // Type of voters (NOTARY, VERIFIER, OPERATOR)
        mapping(address => bool) voteWhitelist; // Mapping to check if an address is whitelisted for voting
        mapping(address => bool) voteStatus; // Mapping to check if an address has voted
        mapping(address => VoterResult) votersVote; // Mapping to struct the vote results of individual voters
        mapping(VoterType => uint256) totalVoters; // Mapping to struct the total number of voters by voter type
    }

    /**
     * @dev Maps eligible voters to their corresponding IDs.
     */
    mapping(address => uint32) public eligibleVoters;

    /**
     * @dev Maps voter IDs to their corresponding addresses.
     */
    mapping(uint32 => address) public eligibleVotersAddress;

    /**
     * @dev Maps vote IDs to their corresponding vote information.
     */
    mapping(uint32 => Vote) public votes;

    /**
     * @dev Maps wallet addresses to their corresponding voter types (NOTARY, VERIFIER, OPERATOR).
     */
    mapping(address => VoterType) public votersType;

    /**
     * @dev Event emitted when a voter is added.
     * @param newVoter The address of the new voter.
     * @param voterType The type of the voter.
     */
    event VoterAdded(address newVoter, VoterType voterType);

    /**
     * @dev Event emitted when a voter is removed.
     * @param voter The address of the removed voter.
     * @param voterType The type of the voter.
     */
    event VoterRemoved(address voter, VoterType voterType);

    /**
     * @dev Event emitted when a voting starts.
     * @param voteId The ID of the started vote.
     * @param time The start time of the vote (timestamp).
     */
    event VotingStarted(uint32 voteId, uint256 time);

    /**
     * @dev Event emitted when a voting ends.
     * @param voteId The ID of the ended vote.
     * @param time The end time of the vote (timestamp).
     */
    event VotingEnded(uint32 voteId, uint256 time);

    /**
     * @dev Event emitted when a voting is forcibly ended.
     * @param voteId The ID of the forcibly ended vote.
     * @param time The end time of the vote (timestamp).
     */
    event VotingForceEnded(uint32 voteId, uint256 time);

    /**
     * @dev Event emitted when a vote is casted.
     * @param voteId The ID of the voted-on vote.
     * @param voter The address of the voter.
     * @param voteChoice The choice of the vote.
     */
    event VotingCasted(uint32 voteId, address voter, VoteChoice voteChoice);

    /**
     * @dev Event emitted when rewards are transferred.
     * @param voteId The ID of the voted-on vote.
     * @param transferredAmount The total transferred rewards amount.
     */
    event RewardsTransferred(uint32 voteId, uint256 transferredAmount);

    /**
     * @dev Modifier to validate the vote ID.
     * @param voteId The vote ID to validate.
     */
    modifier isValidVoteId(uint32 voteId) {
        require(voteId < totalVotes, "Governance : Invalid vote ID");
        _;
    }

    /**
     * @dev Modifier to check if the voting period has expired or the vote has been finalized.
     * @param voteId The vote ID to check.
     */
    modifier isVotingPeriodExpired(uint32 voteId) {
        Vote storage voteData = votes[voteId];
        require(block.timestamp <= voteData.votingPeriod && !voteData.isFinalized, "Governance : Vote is already finalized");
        _;
    }

    /**
     * @dev Modifier to check if the sender is an eligible voter for a specific vote.
     * @param voteId The vote ID to check.
     */
    modifier onlyEligibleVoters(uint32 voteId) {
        require(isEligibleVoters(voteId, _msgSender()), "Governance : Only selected voters can perform this action");
        _;
    }

    /**
     * @dev Check if a voter is allowed to participate in voting.
     * @param voter The address of the voter to check.
     * @return bool True if the voter is allowed to participate, false otherwise.
     */
    function isAllowedVoter(address voter) public view returns (bool) {
        return eligibleVoters[voter] > 0;
    }

    /**
     * @dev Check if a voter is eligible for a specific vote.
     * @param voteId The vote ID to check.
     * @param voter The address of the voter to check.
     * @return bool True if the voter is eligible for the specific vote, false otherwise.
     */
    function isEligibleVoters(uint32 voteId, address voter) public view returns (bool) {
        Vote storage voteData = votes[voteId];
        return voteData.voteWhitelist[voter];
    }

    /**
     * @dev Add a new voter.
     * @param newVoter The address of the new voter.
     * @param voterType The type of the voter (NOTARY, VERIFIER, OPERATOR).
     */
    function addVoter(address newVoter, VoterType voterType) public onlyOwner {
        require(!isAllowedVoter(newVoter), "Governance : The address is already a selected voter");

        eligibleVoters[newVoter] = eligibleVotersLength;
        eligibleVotersAddress[eligibleVotersLength] = newVoter;
        votersType[newVoter] = voterType;
        eligibleVotersLength++;

        emit VoterAdded(newVoter, voterType);
    }

    /**
     * @dev Remove a voter.
     * @param voter The address of the voter to remove.
     */
    function removeVoter(address voter) public onlyOwner {
        require(isAllowedVoter(voter), "Governance : The address is not a selected voter");
        VoterType _voterType = votersType[voter];

        delete eligibleVotersAddress[eligibleVoters[voter]];
        delete eligibleVoters[voter];
        delete votersType[voter];
        eligibleVotersLength--;

        emit VoterRemoved(voter, _voterType);
    }

    /**
     * @dev Create a new vote.
     * @param period The duration until the vote ends.
     * @param voterType The type of the vote (NOTARY, VERIFIER, OPERATOR).
     */
    function createVote(uint256 period, VoterType voterType) public onlyOwner {
        Vote storage newVote = votes[totalVotes];
        newVote.totalSupportCount = 0;
        newVote.totalOpposeCount = 0;
        newVote.totalNeutralCount = 0;
        newVote.isFinalized = false;
        newVote.votingPeriod = block.timestamp + period;
        newVote.voterType = voterType;
        newVote.totalVotersCount = eligibleVotersLength - 1;

        for(uint32 i = 1; i < eligibleVotersLength; i++){
            newVote.voteWhitelist[eligibleVotersAddress[i]] = true;
        }

        emit VotingStarted(totalVotes, block.timestamp + period);

        totalVotes++;
    }

    /**
     * @dev Vote for a specific vote.
     * @param voteId The ID of the vote to vote for.
     * @param choice The vote choice (SUPPORT, OPPOSE, NEUTRAL).
     */
    function vote(uint32 voteId, VoteChoice choice) public isValidVoteId(voteId) onlyEligibleVoters(voteId) isVotingPeriodExpired(voteId) {
        Vote storage voteData = votes[voteId];
        require(!voteData.voteStatus[_msgSender()], "Governance : You have already voted for this");

        VoterType voterType = votersType[_msgSender()];
        voteData.voteStatus[_msgSender()] = true;

        uint8 voteWeight = voterType == VoterType.NOTARY ? 5 : voterType == VoterType.VERIFIER ? 3 : 1;

        if (choice == VoteChoice.SUPPORT) {
            voteData.totalSupportCount += voteWeight;
        } else if (choice == VoteChoice.OPPOSE) {
            voteData.totalOpposeCount += voteWeight;
        } else {
            voteData.totalNeutralCount += voteWeight;
        }

        voteData.votersVote[_msgSender()].supportCount += (choice == VoteChoice.SUPPORT ? voteWeight : 0);
        voteData.votersVote[_msgSender()].opposeCount += (choice == VoteChoice.OPPOSE ? voteWeight : 0);
        voteData.votersVote[_msgSender()].neutralCount += (choice == VoteChoice.NEUTRAL ? voteWeight : 0);

        voteData.totalVoters[voterType]++;

        emit VotingCasted(voteId, _msgSender(), choice);
    }

    /**
     * @dev End a vote when the voting period has expired.
     * @param voteId The ID of the vote to end.
     */
    function endVote(uint32 voteId) public onlyOwner isValidVoteId(voteId) {
        Vote storage voteData = votes[voteId];
        require(block.timestamp >= voteData.votingPeriod, "Vote : The voting period has not ended yet");

        votes[voteId].isFinalized = true;
        emit VotingForceEnded(voteId, block.timestamp);
    }

    /**
     * @dev Forcefully end a vote.
     * @param voteId The ID of the vote to force end.
     */
    function forceEndVote(uint32 voteId) public onlyOwner isValidVoteId(voteId) {
        votes[voteId].isFinalized = true;
        emit VotingForceEnded(voteId, block.timestamp);
    }

    /**
     * @dev Check if an address has voted for a specific vote.
     * @param voteId The ID of the vote to check.
     * @param voter The address of the voter to check.
     * @return bool True if the address has voted, false otherwise.
     */
    function hasVoted(uint32 voteId, address voter) public view isValidVoteId(voteId) returns (bool) {
        Vote storage voteData = votes[voteId];
        return voteData.voteStatus[voter];
    }

    /**
     * @dev Get the total number of voters of a specific type for a vote.
     * @param voteId The ID of the vote to check.
     * @param voterType The type of the voters.
     * @return uint256 The total number of voters of the specified type for the vote.
     */
    function totalVoters(uint32 voteId, VoterType voterType) public view isValidVoteId(voteId) returns(uint256) {
        Vote storage voteData = votes[voteId];
        return voteData.totalVoters[voterType];
    }

    /**
     * @dev Get the total number of support, oppose, and neutral votes for a specific vote.
     * @param voteId The ID of the vote to check.
     * @return uint32 The total number of support, oppose, and neutral votes.
     */
    function getVoteCounts(uint32 voteId) public view isValidVoteId(voteId) returns (uint32, uint32, uint32) {
        Vote storage voteData = votes[voteId];
        return (voteData.totalSupportCount, voteData.totalOpposeCount, voteData.totalNeutralCount);
    }
    
    /**
     * @dev Get the vote choice (support, oppose, neutral) that received the most votes for a specific vote.
     * @param voteId The ID of the vote to check.
     * @return bool True if the most voted choice is support, false otherwise.
     */
    function getMostVotedChoice(uint32 voteId) public view returns(bool) {
        Vote storage voteData = votes[voteId];

        if (voteData.totalSupportCount > voteData.totalOpposeCount && voteData.totalSupportCount > voteData.totalNeutralCount) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Verify if the total vote counts match the expected counts for a specific vote.
     * @param voteId The ID of the vote to check.
     * @param expectedSupportCount The expected number of support votes.
     * @param expectedOpposeCount The expected number of oppose votes.
     * @param expectedNeutralCount The expected number of neutral votes.
     * @return bool True if the expected vote counts match the actual counts, false otherwise.
     */
    function verifyVoteCount(uint32 voteId, uint32 expectedSupportCount, uint32 expectedOpposeCount, uint32 expectedNeutralCount) public view isValidVoteId(voteId) returns (bool) {
        Vote storage voteData = votes[voteId];
        return (voteData.totalSupportCount == expectedSupportCount && voteData.totalOpposeCount == expectedOpposeCount && voteData.totalNeutralCount == expectedNeutralCount);
    }

    /**
     * @dev Get the vote choice and count for a specific voter in a vote.
     * @param voteId The ID of the vote to check.
     * @param voter The address of the voter to check.
     * @return The vote choice and count for the voter.
     */
    function getVoteSelectionAndCount(uint32 voteId, address voter) public view isValidVoteId(voteId) returns (VoteChoice, uint32) {
        Vote storage voteData = votes[voteId];
        require(voteData.voteStatus[voter], "Governance : Address did not vote for this");

        VoterResult storage voterVotes = voteData.votersVote[voter];

        if (voterVotes.supportCount > 0) {
            return (VoteChoice.SUPPORT, voterVotes.supportCount);
        } else if (voterVotes.opposeCount > 0) {
            return (VoteChoice.OPPOSE, voterVotes.opposeCount);
        } else {
            return (VoteChoice.NEUTRAL, voterVotes.neutralCount);
        }
    }

    /**
     * @dev Transfer rewards for a completed vote.
     * @param voteId The ID of the vote to transfer rewards for.
     */
    function transferVoteRewards(uint32 voteId) public payable isValidVoteId(voteId) nonReentrant {
        Vote storage voteData = votes[voteId];
        require(voteData.isFinalized, "Governance : Vote is not finalized");
        require(voteData.voteStatus[_msgSender()], "Governance : Only the wallets that participated in the vote can receive the rewards");

        bool voteResult = getMostVotedChoice(voteId);
        require(voteResult, "Governance : Vote has been rejected or invalidated");

        uint16 totalReward = voteData.voterType == VoterType.NOTARY ? 1000 : voteData.voterType == VoterType.VERIFIER ? 500 : 100;

        VoterType senderType = votersType[_msgSender()];
        uint256 rewardAmount = 0;

        if (senderType == VoterType.NOTARY) {
            rewardAmount = (totalReward * 25 * 1e18) / (100 * voteData.totalVoters[VoterType.NOTARY]);
        } else if (senderType == VoterType.VERIFIER) {
            rewardAmount = (totalReward * 15 * 1e18) / (100 * voteData.totalVoters[VoterType.VERIFIER]);
        } else if (senderType == VoterType.OPERATOR) {
            rewardAmount = (totalReward * 9 * 1e18) / (100 * voteData.totalVoters[VoterType.OPERATOR]);
        }

        emit RewardsTransferred(voteId, rewardAmount);
        payable(_msgSender()).transfer(rewardAmount);
    }

    /**
     * @dev Set the voting period for a specific vote.
     * @param voteId The ID of the vote.
     * @param period The duration of the voting period in seconds.
     */
    function setVotingPeriod(uint32 voteId, uint256 period) public onlyOwner isValidVoteId(voteId) {
        votes[voteId].votingPeriod = block.timestamp + period;
    }
}
