import { Chain, chain as Chains } from "wagmi";

export const ChadgerRegistryContractAddresses: {
    [key in Chain["id"]]: string;
} = {
    [Chains.kovan.id]: "0x7A809E2F2086CB09E80dFBA533Fc4b2741923EEB",
    [250]: "0x0B5CB2aED6d52171222cb6Ef078148714C712776", // fantom
};
