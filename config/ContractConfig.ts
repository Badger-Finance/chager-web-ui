import { Chain, chain as Chains } from "wagmi";

export const ChadgerRegistryContractAddresses: {
    [key in Chain["id"]]: string;
} = {
    [Chains.kovan.id]: "0x7A809E2F2086CB09E80dFBA533Fc4b2741923EEB",
    [250]: "0x83980cADe75375A32196E7219F3e578BFBb8F6a6", // fantom
};
