import { Chain, chain as Chains } from "wagmi";

export const ChadgerRegistryContractAddresses: {
    [key in Chain["id"]]: string;
} = {
    [Chains.kovan.id]: "0xD8d8aE4A5363edb6C3E01759576Da04bcc3a947e",
    [250]: "0xD8d8aE4A5363edb6C3E01759576Da04bcc3a947e", // fantom
};
