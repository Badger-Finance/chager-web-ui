/* eslint-disable react/jsx-no-comment-textnodes */
import { BigNumber } from "ethers";
import Head from "next/head";
import { FunctionComponent, useMemo } from "react";
import { useQuery } from "react-query";
import { Link, useParams } from "react-router-dom";
import ExternalLinkIcon from "../../public/icons/external-link.svg";
import EnsLabel from "../EnsLabel";
import { getExplorerContractLink, getExplorerTokenLink } from "../Explorer";
import Favicon from "../Favicon";
import Header from "../Header";
import { useVaultApi, VaultBaseInfo, VaultDepositorInfo, VaultInfo } from "../Vault/useVaultApi";
import VaultActions from "../Vault/VaultActions";
import { useWalletContext } from "../Wallet";
import PageMeta from "../PageMeta";
import { ethers, providers } from "ethers";

import BadgerSDK, { ChartGranularity, EmissionSchedule, formatBalance, Network, PriceSummary, VaultDTO, VaultSnapshot, VaultVersion } from "@badger-dao/sdk";
import { BadgerTreeDistribution_OrderBy, OrderDirection, SettHarvest_OrderBy, Transfer_OrderBy } from "@badger-dao/sdk/lib/graphql/generated/badger";

const getVaultProps = async ({ network, address }: any) => {
    const sdk = new BadgerSDK({
        network: Network.Fantom,
        provider: new ethers.providers.Web3Provider(window.ethereum),
    });
    // const { api, graph, config } = sdk;
    // const tokens = await api.loadTokens();
    // const vault = await api.loadVault(address);

    // const end = new Date();
    // const start = new Date();
    // start.setDate(start.getDate() - 30);
    // const chartData = await api.loadCharts({
    //     vault: address,
    //     start: start.toISOString(),
    //     end: end.toISOString(),
    //     granularity: ChartGranularity.DAY,
    // });
    // const schedules = await api.loadSchedule(address, true);
    // schedules.forEach((s) => (s.token = tokens[s.token].name));

    // const { transfers } = await graph.loadTransfers({
    //     where: {
    //         sett: address.toLowerCase(),
    //     },
    //     orderBy: Transfer_OrderBy.Timestamp,
    //     orderDirection: OrderDirection.Desc,
    // });
    // const vaultTransfers = transfers.map((t) => {
    //     const transferType = Number(t.to.id) === 0 ? "Withdraw" : Number(t.from.id) === 0 ? "Deposit" : "Transfer";
    //     return {
    //         from: t.from.id,
    //         to: t.to.id,
    //         amount: formatBalance(t.amount, tokens[address].decimals),
    //         date: new Date(t.timestamp * 1000).toLocaleString(),
    //         transferType,
    //         hash: t.id.split("-")[0],
    //     };
    // });

    // const prices = await api.loadPrices();

    // const { settHarvests } = await graph.loadSettHarvests({
    //     where: {
    //         sett: address.toLowerCase(),
    //     },
    //     orderBy: SettHarvest_OrderBy.Timestamp,
    //     orderDirection: OrderDirection.Desc,
    // });
    // const { badgerTreeDistributions } = await graph.loadBadgerTreeDistributions({
    //     where: {
    //         sett: address.toLowerCase(),
    //     },
    //     orderBy: BadgerTreeDistribution_OrderBy.Timestamp,
    //     orderDirection: OrderDirection.Desc,
    // });

    // const harvests: VaultHarvestInfo[] = [];

    // for (let i = 0; i < settHarvests.length - 1; i++) {
    //     const start = settHarvests[i];
    //     const end = settHarvests[i + 1];
    //     const duration = start.timestamp - end.timestamp;
    //     const underlyingDecimals = tokens[vault.underlyingToken].decimals;
    //     const isDigg = start.token.id === "0x798D1bE841a82a273720CE31c822C61a67a601C3".toLowerCase();
    //     let tokenAmount = BigNumber.from(start.amount);
    //     if (isDigg) {
    //         tokenAmount = tokenAmount.div("222256308823765331027878635805365830922307440079959220679625904457");
    //     }
    //     const amount = formatBalance(tokenAmount, underlyingDecimals);
    //     const value = amount * prices[vault.underlyingToken] ?? 0;
    //     const vaultSnapshot = await graph.loadSett({
    //         id: address.toLowerCase(),
    //         block: { number: Number(start.blockNumber) },
    //     });
    //     let balanceAmount = 0;
    //     if (!isDigg && vaultSnapshot.sett?.strategy?.balance) {
    //         balanceAmount = vaultSnapshot.sett?.strategy?.balance;
    //     } else {
    //         balanceAmount = vaultSnapshot.sett?.balance;
    //     }
    //     const balanceValue = formatBalance(balanceAmount, underlyingDecimals) * prices[vault.underlyingToken];
    //     const apr = (value / balanceValue) * (31536000 / duration) * 100;
    //     if (!BLACKLIST_HARVESTS.includes(address)) {
    //         harvests.push({
    //             rewardType: RewardType.Harvest,
    //             token: tokens[vault.underlyingToken].name,
    //             amount,
    //             value,
    //             duration,
    //             apr,
    //             timestamp: start.timestamp,
    //             hash: start.id.split("-")[0],
    //         });
    //     }

    //     badgerTreeDistributions
    //         .filter((d) => d.timestamp === start.timestamp)
    //         .forEach((d) => {
    //             const tokenAddress = d.token.id.startsWith("0x0x") ? d.token.id.slice(2) : d.token.id;
    //             const emissionToken = tokens[ethers.utils.getAddress(tokenAddress)];
    //             if (!emissionToken) {
    //                 // bsc and arb is apparently acting weird
    //                 return;
    //             }
    //             let tokenAmount = BigNumber.from(d.amount);
    //             if (d.token.id === "0x798D1bE841a82a273720CE31c822C61a67a601C3".toLowerCase()) {
    //                 tokenAmount = tokenAmount.div("222256308823765331027878635805365830922307440079959220679625904457");
    //             }
    //             const amount = formatBalance(tokenAmount, emissionToken.decimals);
    //             const value = amount * prices[ethers.utils.getAddress(emissionToken.address)] ?? 0;
    //             const apr = (value / balanceValue) * (31536000 / duration) * 100;
    //             harvests.push({
    //                 rewardType: RewardType.TreeDistribution,
    //                 token: emissionToken.name,
    //                 amount,
    //                 value,
    //                 duration,
    //                 apr: isNaN(apr) ? 0 : apr,
    //                 timestamp: start.timestamp,
    //                 hash: d.id.split("-")[0],
    //             });
    //         });
    // }

    return {
        vault,
        chartData,
        schedules,
        transfers: vaultTransfers,
        network: config.network,
        prices,
        harvests,
    };
};

type VaultPageProps = {};
const VaultPage: FunctionComponent<VaultPageProps> = ({}) => {
    const { chain, account } = useWalletContext();
    let { address: vaultAddress } = useParams();

    const info = getVaultProps({ address: vaultAddress, network: chain });

    const { getVaultBaseData, getVaultDepositorData } = useVaultApi();

    const {
        data: vaultBaseData,
        isLoading,
        isRefetching,
        error,
        refetch: refetchVault,
    } = useQuery<VaultBaseInfo | null, Error>(
        `${chain.chain.id}:Home:VaultDetail:${vaultAddress}:BaseData`,
        async () => {
            return await getVaultBaseData(vaultAddress as string);
        },
        {
            enabled: !!vaultAddress,
            retry: false,
        }
    );

    const {
        data: vaultDepositorData,
        isLoading: isLoadingDepositorData,
        isRefetching: isRefetchingDepositorData,
        error: errorDepositorData,
        refetch: refetchVaultDepositorData,
    } = useQuery<VaultDepositorInfo | null, Error>(
        `${chain.chain.id}:Home:VaultDetail:${vaultAddress}:DepositorData:${account}`,
        async () => {
            if (!account) return null;
            return await getVaultDepositorData(vaultAddress as string, account);
        },
        {
            enabled: !!vaultAddress && !!account,
            retry: false,
        }
    );

    const vault = useMemo<VaultInfo | undefined>(() => {
        if (!vaultBaseData) return undefined;
        if (!account) return vaultBaseData;
        return {
            ...vaultBaseData,
            ...(vaultDepositorData || {}),
        };
    }, [vaultBaseData, vaultDepositorData, account]);

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col overflow-hidden bg-gray-light-1 py-4 px-2 font-inter dark:bg-gray-dark-1 md:px-8">
            <Head>
                <title>Chadger Experimental Vaults</title>
                <meta name="description" content="Chadger Experimental Vaults" />
                <PageMeta />
            </Head>
            <Favicon />

            <div className="container mx-auto mb-8 max-w-full">
                <Header />
            </div>

            <div className="container mx-auto mb-8 max-w-full text-white">
                <div className="mb-4">
                    <Link to={"/"} className="flex w-full flex-row text-xl">
                        <div className="text-sm">&lt;&lt;</div>
                        <div className="ml-1 text-sm text-[#E6F44F] underline">Back to all Strategists and Vaults</div>
                    </Link>
                </div>

                {isLoading && <div>Loading...</div>}
                {!isLoading && !vault && error && <div>{error.message}</div>}
                {!isLoading && vault && <p>ADD STUFF HERE</p>}
            </div>
        </div>
    );
};

export default VaultPage;
