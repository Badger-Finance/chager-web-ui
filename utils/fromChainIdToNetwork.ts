import { Network } from "@badger-dao/sdk";

export const fromChainIdToNetwork = (chainId: number) => {
    switch (chainId) {
        case 250:
            return Network.Fantom;
        case 43114:
            return Network.Avalanche;
        case 42161:
            return Network.Arbitrum;
        case 137:
            return Network.Polygon;
        default:
            return Network.Ethereum;
    }
};
