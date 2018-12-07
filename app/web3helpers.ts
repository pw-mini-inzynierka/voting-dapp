import { promisify } from "util";
import Web3 = require("web3");

const web3 = new Web3(Web3.givenProvider);

export function createVotingOptions(options: string[]) {
    return options.map((opt) => web3.utils.fromUtf8(opt));
}

export function createCategoryName(name: string) {
    return web3.utils.fromUtf8(name);
}

export function decodeVotingOption(option: string) {
    return web3.utils.toUtf8(option);
}

export async function mineEmptyBlock() {
    const promisifiedSend = promisify(Web3.givenProvider.send);
    return promisifiedSend({
        id: nextId().next().value,
        jsonrpc: "2.0",
        method: "evm_mine",
        params: [],
    });
}

function* nextId() {
    yield 1;
    yield 2;
    yield 3;
}
