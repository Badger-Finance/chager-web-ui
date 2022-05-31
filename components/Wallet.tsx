import { FunctionComponent, ReactNode } from "react";
import createPersistedState from "use-persisted-state";
import { Chain, Provider, chain as Chains, useAccount, useNetwork, useConnect, useSigner } from "wagmi";
import { createContext, useContext } from "react";
import { ethers, providers } from "ethers";
import { InjectedConnector } from "wagmi/connectors/injected";

export const connectorStorageKey = "chadgerConnectors.wallet";

export const FantomChain: Chain = {
    id: 250,
    name: "Fantom",
    nativeCurrency: { name: "Fantom", symbol: "FTM", decimals: 18 },
    rpcUrls: ["https://rpc.ftm.tools"],
    testnet: false,
    blockExplorers: [{ name: "FtmScan", url: "https://ftmscan.com/" }],
};

export const supportedChains = [Chains.mainnet, FantomChain, Chains.arbitrumOne, Chains.avalanche, Chains.optimism, Chains.polygonMainnet];
export const DEFAULT_CHAIN = FantomChain;

// Wallet connectors
export const MetaMaskConnector = new InjectedConnector({
    chains: supportedChains,
});

export const RinkebyProvider = new providers.JsonRpcProvider("https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", Chains.rinkeby.id);
export const RopstenProvider = new providers.JsonRpcProvider("https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", Chains.ropsten.id);
export const KovanProvider = new providers.JsonRpcProvider("https://kovan.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", Chains.kovan.id);
export const MainnetProvider = new providers.JsonRpcProvider("https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", Chains.mainnet.id);
export const FantomProvider = new providers.JsonRpcProvider("https://rpc.ftm.tools", 250);

export type WalletStates = {
    account: string | undefined;
    chain: { unsupported: Boolean; chain: Chain };
    connectWallet: (c: InjectedConnector) => Promise<any>;
    disconnectWallet: () => void;
    switchNetwork: ((chaindID: number) => Promise<any>) | undefined;
    signer: ethers.Signer | undefined;
    provider: ethers.providers.JsonRpcProvider;
};

const WalletContext = createContext<WalletStates>({
    account: undefined,
    chain: { unsupported: false, chain: DEFAULT_CHAIN },
    connectWallet: async (c: InjectedConnector) => {},
    disconnectWallet: () => {},
    switchNetwork: undefined,
    signer: undefined,
    provider: MainnetProvider,
});

// Persistent states
enum MetamaskState {
    Connected,
    NotConnected,
}
const useMatamaskState = createPersistedState("chadger.metamaskState"); // Persist disconnect state on metamask

type WalletGlobalStateProps = {
    children: ReactNode;
};

const getProvider = () => {
    return new ethers.providers.Web3Provider(window.ethereum);
};

const WalletGlobalState: FunctionComponent<WalletGlobalStateProps> = ({ children }) => {
    // Read global states
    const [accountData, disconnect] = useAccount();
    const [, connect] = useConnect();
    const [networkData, switchNetwork] = useNetwork();
    const [signerData] = useSigner();

    // Metamask state, to persist the connect/disconnect status on metamask wallet
    const [metamaskState, setMetamaskState] = useMatamaskState(MetamaskState.NotConnected);

    // List of action that will change the global states
    // Connect wallet
    const connectWallet = async function (c: InjectedConnector) {
        try {
            const result = await connect(c);
            if (result && result.error) return result; // Return error early

            // Persist metamask connection state
            if (c.name === "MetaMask") {
                setMetamaskState(MetamaskState.Connected);
            }

            return result;
        } catch (e) {
            console.error("Cannot connect");
            console.error(e);
        }
    };

    // Disconnect wallet
    const disconnectWallet = () => {
        // Persist data in Metamask
        if (accountData.data?.connector?.name === "MetaMask") {
            setMetamaskState(MetamaskState.NotConnected);
        }
        // Run the disconnect; esp for wallet connect
        disconnect();
    };

    // Create derivatives states based on the global states
    const chain = accountData.data && networkData.data ? (networkData.data.chain as Chain) : DEFAULT_CHAIN;
    const provider = getProvider();
    const signer = signerData.data ? signerData.data : provider.getSigner();
    const isChainSupported = supportedChains.map((c) => c.id).includes(chain.id);

    // account address is defined only if:
    // 1. If connector is metamask, and the the state is connected
    // 2. If connector is not metamask, but account data is exists
    const isMetamask = accountData.data && accountData.data.connector?.name === "MetaMask" ? true : false;
    const account = (accountData.data && isMetamask && metamaskState === MetamaskState.Connected) || (accountData.data && !isMetamask) ? accountData.data.address : undefined;

    const sharedStates = {
        account: account,
        chain: { unsupported: !isChainSupported, chain: chain },
        connectWallet,
        disconnectWallet,
        switchNetwork,
        signer,
        provider,
    };
    return <WalletContext.Provider value={sharedStates}>{children}</WalletContext.Provider>;
};

type WalletProps = {
    children: ReactNode;
};

const Wallet: FunctionComponent<WalletProps> = ({ children }) => {
    return (
        <Provider autoConnect={true} connectorStorageKey={connectorStorageKey} connectors={[MetaMaskConnector]} provider={getProvider}>
            <WalletGlobalState>{children}</WalletGlobalState>
        </Provider>
    );
};

export default Wallet;

export function useWalletContext() {
    return useContext(WalletContext);
}

// Utilities
export const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4, address.length)}`;
};

export const getEtherscanAddressURL = (chain: Chain | null, address: string): string => {
    if (chain) {
        if (chain.blockExplorers) {
            return `${chain.blockExplorers[0].url}/address/${address}`;
        }
        return "#";
    }
    return "#";
};
