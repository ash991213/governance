## Smart Contract: Governance

This smart contract implements a governance system that allows for voting on proposals. It provides functionalities for adding and removing voters, creating and ending votes, casting votes, and transferring rewards based on the voting results.

## Features

Voter Management: The contract allows the contract owner to add and remove voters. Voters are categorized into three types: Notary, Verifier, and Operator.

Vote Creation: The contract owner can create a new vote by specifying the voting period and the type of voters allowed to participate.

Voting: Eligible voters can cast their votes by choosing one of the three options: Support, Oppose, or Neutral. Each voter's vote is weighted based on their voter type.

Vote Results: The contract provides functions to retrieve the total number of votes for each choice (Support, Oppose, Neutral) and determine the most voted choice.

Vote Finalization: The contract owner can manually end a vote or let it expire based on the specified voting period.

Reward Distribution: After a vote is finalized, rewards can be transferred to voters based on their participation and the voting results. The contract calculates the reward amount based on the voter type and the total number of voters of that type.

## Requirements

Solidity version: ^0.8.0

OpenZeppelin library: ^4.9.2

## Usage

Deploy the Governance contract to a compatible Ethereum network.

As the contract owner, add eligible voters using the addVoter function. Specify the address of the voter and their type (Notary, Verifier, or Operator).

Create a new vote using the createVote function. Specify the voting period and the type of voters allowed to participate.

Eligible voters can cast their votes using the vote function. Provide the ID of the vote and the vote choice (Support, Oppose, or Neutral).

After the voting period ends, the contract owner can manually end the vote using the endVote function or let it expire.

Once a vote is finalized, rewards can be transferred to voters using the transferVoteRewards function. Only voters who participated in the vote can receive rewards.

Use the provided getter functions to retrieve vote information, voter counts, and vote results.

## Testing

Automated tests can be written to verify the functionality of the smart contract. The tests should cover scenarios such as adding/removing voters, creating/ending votes, casting votes, calculating rewards, and retrieving vote information. The tests can be executed using a testing framework like Truffle or Hardhat.

## Security analysis

- Slither

![스크린샷 2023-08-02 오후 3 38 41](https://github.com/ash991213/governance/assets/99451647/9cb6a2f4-e747-493f-a314-7d08a789848c)
