import { Chain, chain as Chains } from "wagmi";

export const ChadgerRegistryContractAddresses: {
    [key in Chain["id"]]: string;
} = {
    [Chains.mainnet.id]: "0x0DBd1f105a955F237142C64243E347578705dC87",
    [250]: "0x0DBd1f105a955F237142C64243E347578705dC87", // fantom
    [Chains.optimism.id]: "0x0DBd1f105a955F237142C64243E347578705dC87", // Optimism
    [Chains.avalanche.id]: "0x0DBd1f105a955F237142C64243E347578705dC87", // Avalanche
    [Chains.polygonMainnet.id]: "0x0DBd1f105a955F237142C64243E347578705dC87", // Polygon
    [Chains.arbitrumOne.id]: "0x0DBd1f105a955F237142C64243E347578705dC87", // Arbitrum
};
