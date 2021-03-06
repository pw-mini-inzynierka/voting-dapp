import moment from "moment";
import Web3 from "web3";
import CategoryAbi from "../contracts/CategoryContract.json";
import VotingAbi from "../contracts/VotingContract.json";
import { CategoryContract } from "../typed-contracts/CategoryContract";
import { ManagerContract } from "../typed-contracts/ManagerContract";
import { VotingContract } from "../typed-contracts/VotingContract";
import { VotingState } from "./enums";
import { BlockchainData, Category, Voting, VotingInfo } from "./types";

export const fetchCategories = async (blockchainData: BlockchainData) => {
    const web3 = blockchainData.web3;
    const managerInstance = blockchainData.manager as ManagerContract;
    const numberOfCategories = parseInt(await managerInstance.methods.numberOfCategories().call(), 10);

    const categoryPromises = [...Array(numberOfCategories).keys()].map(
        async (index): Promise<Category> => {
            const categoryAddress = await managerInstance.methods.categoryContractsList(index).call();
            const categoryContract = new web3.eth.Contract(CategoryAbi.abi, categoryAddress) as CategoryContract;
            const categoryName = web3.utils.toUtf8(await categoryContract.methods.categoryName().call());
            return { name: categoryName, address: categoryAddress };
        }
    );

    return Promise.all(categoryPromises);
};

// tslint:disable:object-literal-sort-keys
export const fetchVotings = async (blockchainData: BlockchainData, category: Category, votingState: VotingState) => {
    const web3 = blockchainData.web3;
    const categoryInstance = new web3.eth.Contract(CategoryAbi.abi, category.address) as CategoryContract;
    const now = moment().utc().unix(); // prettier-ignore
    const numberOfVotings = parseInt(await categoryInstance.methods.numberOfContracts().call(), 10);

    const votingPromises = [...Array(numberOfVotings).keys()].map(
        async (index): Promise<Voting> => {
            const votingAddress = await categoryInstance.methods.votingContracts(index).call();
            const votingInstance = new web3.eth.Contract(VotingAbi.abi, votingAddress) as VotingContract;
            const resp = await votingInstance.methods.viewContractInfo().call();
            const info: VotingInfo = {
                question: resp[0],
                categoryAddress: resp[1],
                answers: resp[2].map((raw) => web3.utils.hexToUtf8(raw)),
                votingEndTime: parseInt(resp[3], 10),
                resultsEndTime: parseInt(resp[4], 10),
                isPrivate: null,
                isPrivileged: null,
                hasUserVoted: null,
            };

            let testPassed: boolean;
            switch (votingState) {
                case VotingState.Active:
                    testPassed = now <= info.votingEndTime;
                    break;
                case VotingState.Passive:
                    testPassed = info.votingEndTime < now && now <= info.resultsEndTime;
                    break;
                case VotingState.Disabled:
                    testPassed = info.resultsEndTime < now;
                    break;
                default:
                    testPassed = false;
            }
            if (!testPassed) {
                return null;
            }

            info.isPrivate = await votingInstance.methods.isPrivate().call();
            if (info.isPrivate) {
                info.isPrivileged = await votingInstance.methods.isPrivileged(blockchainData.accounts[0]).call();
            }
            info.hasUserVoted = await votingInstance.methods.hasVoted(blockchainData.accounts[0]).call();
            return {
                contract: votingInstance,
                info,
            };
        }
    );

    return Promise.all(votingPromises).then((votings) => votings.filter((v) => v !== null));
};

export const submitVote = async (blockchainData: BlockchainData, voting: Voting, answerIndex: number) => {
    const votingInstance = voting.contract;
    votingInstance.options.from = blockchainData.accounts[0];
    await votingInstance.methods.vote(answerIndex).send();
};

export const fetchVoting = async (blockchainData: BlockchainData, address: string) => {
    const web3 = blockchainData.web3;
    try {
        const votingInstance = new web3.eth.Contract(VotingAbi.abi, address) as VotingContract;
        const resp = await votingInstance.methods.viewContractInfo().call();
        const info: VotingInfo = {
            question: resp[0],
            categoryAddress: resp[1],
            answers: resp[2].map((raw) => web3.utils.hexToUtf8(raw)),
            votingEndTime: parseInt(resp[3], 10),
            resultsEndTime: parseInt(resp[4], 10),
            isPrivate: null,
            isPrivileged: null,
            hasUserVoted: null,
        };
        info.isPrivate = await votingInstance.methods.isPrivate().call();
        if (info.isPrivate) {
            info.isPrivileged = await votingInstance.methods.isPrivileged(blockchainData.accounts[0]).call();
        }
        info.hasUserVoted = await votingInstance.methods.hasVoted(blockchainData.accounts[0]).call();
        const voting: Voting = {
            contract: votingInstance,
            info,
        };
        return voting;
    } catch {
        return null;
    }
};

export const fetchResults = async (voting: Voting) => {
    const votingInstance = voting.contract;
    const results = await votingInstance.methods.viewVotes().call();
    return results;
};

export function ethStrBytesLength(str: string) {
    const hex = Web3.utils.fromUtf8(str);
    const bytes = Web3.utils.hexToBytes(hex);
    return bytes.length;
}
