import { Chain } from "wagmi";

export const getExplorerTxLink = (chain: Chain, hash: string) => {
    return chain.blockExplorers && chain.blockExplorers.length ? `${chain.blockExplorers[0].url}/tx/${hash}` : "#";
};


export const getExplorerTokenLink = (chain: Chain, token: string) => {
    return chain.blockExplorers && chain.blockExplorers.length ? `${chain.blockExplorers[0].url}/token/${token}` : "#";
};


export const getExplorerContractLink = (chain: Chain, contract: string) => {
    return chain.blockExplorers && chain.blockExplorers.length ? `${chain.blockExplorers[0].url}/address/${contract}` : "#";
};