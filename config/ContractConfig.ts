import { Chain, chain as Chains } from "wagmi";

export const ChadgerRegistryContractAddresses: {
    [key in Chain["id"]]: string;
} = {
    [Chains.kovan.id]: "0x7A809E2F2086CB09E80dFBA533Fc4b2741923EEB",
};
