/* eslint-disable react/jsx-no-comment-textnodes */
import { BigNumber } from "ethers";
import Head from "next/head";
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
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
import { getChainExplorer, shortenAddress, fromChainIdToNetwork } from "../../utils";

import BadgerSDK, { ChartGranularity, EmissionSchedule, formatBalance, Network, PriceSummary, VaultDTO, VaultSnapshot, VaultVersion } from "@badger-dao/sdk";
import { BadgerTreeDistribution_OrderBy, OrderDirection, SettHarvest_OrderBy, Transfer_OrderBy } from "@badger-dao/sdk/lib/graphql/generated/badger";

import VaultStatistic from "../../components/VaultStatistic";
import VaultSummary from "../../components/VaultSummary";
import VaultChart from "../../components/VaultChart";
import VaultAprSources from "../../components/VaultAprSources";
import VaultSchedules from "../../components/VaultSchedules";

export interface VaultHarvestInfo {
    rewardType: RewardType;
    token: string;
    amount: number;
    value: number;
    duration: number;
    apr: number;
    timestamp: number;
    hash: string;
}

interface Props {
    vault: VaultDTO;
    chartData: VaultSnapshot[];
    schedules: EmissionSchedule[];
    transfers: VaultTransfer[];
    network: Network;
    prices: PriceSummary;
    harvests: VaultHarvestInfo[];
}

export interface VaultTransfer {
    from: string;
    to: string;
    transferType: string;
    amount: number;
    date: string;
    hash: string;
}

export enum RewardType {
    TreeDistribution = "Tree Distribution",
    Harvest = "Harvest",
}

type VaultPathParms = { network: string; address: string };

const PAGE_SIZE = 10;

const BLACKLIST_HARVESTS = ["0xfd05D3C7fe2924020620A8bE4961bBaA747e6305", "0x53c8e199eb2cb7c01543c137078a038937a68e40"];

const getVaultProps = async ({ chainId, address }: any): Promise<any> => {
    console.log("chainId", chainId);
    const sdk = new BadgerSDK({
        network: fromChainIdToNetwork(chainId),
        provider: new ethers.providers.Web3Provider(window.ethereum),
    });
    const { api, graph, config } = sdk;
    const tokens = await api.loadTokens();
    const vault = await api.loadVault(address);

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const chartData = await api.loadCharts({
        vault: address,
        start: start.toISOString(),
        end: end.toISOString(),
        granularity: ChartGranularity.DAY,
    });
    const schedules = await api.loadSchedule(address, true);
    schedules.forEach((s) => (s.token = tokens[s.token].name));

    const { transfers } = await graph.loadTransfers({
        where: {
            sett: address.toLowerCase(),
        },
        orderBy: Transfer_OrderBy.Timestamp,
        orderDirection: OrderDirection.Desc,
    });
    const vaultTransfers = transfers.map((t) => {
        const transferType = Number(t.to.id) === 0 ? "Withdraw" : Number(t.from.id) === 0 ? "Deposit" : "Transfer";
        return {
            from: t.from.id,
            to: t.to.id,
            amount: formatBalance(t.amount, tokens[address].decimals),
            date: new Date(t.timestamp * 1000).toLocaleString(),
            transferType,
            hash: t.id.split("-")[0],
        };
    });

    const prices = await api.loadPrices();

    const { settHarvests } = await graph.loadSettHarvests({
        where: {
            sett: address.toLowerCase(),
        },
        orderBy: SettHarvest_OrderBy.Timestamp,
        orderDirection: OrderDirection.Desc,
    });
    const { badgerTreeDistributions } = await graph.loadBadgerTreeDistributions({
        where: {
            sett: address.toLowerCase(),
        },
        orderBy: BadgerTreeDistribution_OrderBy.Timestamp,
        orderDirection: OrderDirection.Desc,
    });

    const harvests: VaultHarvestInfo[] = [];

    for (let i = 0; i < settHarvests.length - 1; i++) {
        const start = settHarvests[i];
        const end = settHarvests[i + 1];
        const duration = start.timestamp - end.timestamp;
        const underlyingDecimals = tokens[vault.underlyingToken].decimals;
        const isDigg = start.token.id === "0x798D1bE841a82a273720CE31c822C61a67a601C3".toLowerCase();
        let tokenAmount = BigNumber.from(start.amount);
        if (isDigg) {
            tokenAmount = tokenAmount.div("222256308823765331027878635805365830922307440079959220679625904457");
        }
        const amount = formatBalance(tokenAmount, underlyingDecimals);
        const value = amount * prices[vault.underlyingToken] ?? 0;
        const vaultSnapshot = await graph.loadSett({
            id: address.toLowerCase(),
            block: { number: Number(start.blockNumber) },
        });
        let balanceAmount = 0;
        if (!isDigg && vaultSnapshot.sett?.strategy?.balance) {
            balanceAmount = vaultSnapshot.sett?.strategy?.balance;
        } else {
            balanceAmount = vaultSnapshot.sett?.balance;
        }
        const balanceValue = formatBalance(balanceAmount, underlyingDecimals) * prices[vault.underlyingToken];
        const apr = (value / balanceValue) * (31536000 / duration) * 100;
        if (!BLACKLIST_HARVESTS.includes(address)) {
            harvests.push({
                rewardType: RewardType.Harvest,
                token: tokens[vault.underlyingToken].name,
                amount,
                value,
                duration,
                apr,
                timestamp: start.timestamp,
                hash: start.id.split("-")[0],
            });
        }

        badgerTreeDistributions
            .filter((d) => d.timestamp === start.timestamp)
            .forEach((d) => {
                const tokenAddress = d.token.id.startsWith("0x0x") ? d.token.id.slice(2) : d.token.id;
                const emissionToken = tokens[ethers.utils.getAddress(tokenAddress)];
                if (!emissionToken) {
                    // bsc and arb is apparently acting weird
                    return;
                }
                let tokenAmount = BigNumber.from(d.amount);
                if (d.token.id === "0x798D1bE841a82a273720CE31c822C61a67a601C3".toLowerCase()) {
                    tokenAmount = tokenAmount.div("222256308823765331027878635805365830922307440079959220679625904457");
                }
                const amount = formatBalance(tokenAmount, emissionToken.decimals);
                const value = amount * prices[ethers.utils.getAddress(emissionToken.address)] ?? 0;
                const apr = (value / balanceValue) * (31536000 / duration) * 100;
                harvests.push({
                    rewardType: RewardType.TreeDistribution,
                    token: emissionToken.name,
                    amount,
                    value,
                    duration,
                    apr: isNaN(apr) ? 0 : apr,
                    timestamp: start.timestamp,
                    hash: d.id.split("-")[0],
                });
            });
    }

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

    const [data, setData] = useState(null);

    useEffect(() => {
        const asyncFunc = async () => {
            const result = await getVaultProps({ address: vaultAddress, chainId: chain.chain.id });
            setData(result);
        };

        asyncFunc();
    }, [vaultAddress, chain]);

    console.log("vault", data);

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
                <div>
                    <h2>Ninja data is centralized, especially price sources come from an API, this info could be tampered, DYOR</h2>
                </div>
                {!data && <p>Loading</p>}
                {data && data.vault && <VaultInformation vault={data.vault} chartData={data.chartData} schedules={data.schedules} transfers={data.transfers} network={data.network} prices={data.prices} harvests={data.harvests} />}
            </div>
        </div>
    );
};

function VaultInformation({ vault, chartData, schedules, transfers, network, prices, harvests }: Props): JSX.Element {
    const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });
    const { version, protocol, yieldProjection } = vault;
    const { harvestValue, yieldValue, yieldTokens, harvestTokens, yieldApr, harvestApr } = yieldProjection;

    const realizedHarvestPercent = version === VaultVersion.v1_5 ? (harvestValue / yieldValue) * 100 : 0;

    const maxHarvestPages = harvests.length / PAGE_SIZE - 1;
    const [harvestPage, setHarvestPage] = useState(0);

    const maxPages = transfers.length / PAGE_SIZE - 1;
    const [page, setPage] = useState(0);

    return (
        <div className="md:11/12 mx-auto flex w-full flex-grow flex-col pb-10 text-gray-300 lg:w-5/6 xl:w-3/4">
            <VaultSummary network={network} vault={vault} />
            <VaultChart chartData={chartData} vault={vault} />
            {version === VaultVersion.v1_5 && (
                <div className="bg-calm mx-2 mt-4 rounded-lg p-3 md:mx-0 md:p-4">
                    <div className="text-sm text-gray-400">Vault Harvest Health</div>
                    <div className={`text-xl ${realizedHarvestPercent > 100 ? "text-electric text-shadow" : realizedHarvestPercent > 97 ? "text-green-400" : realizedHarvestPercent > 94 ? "text-orange-400" : "text-red-400"}`}>{realizedHarvestPercent.toFixed(2)}% Realized Yield</div>
                    <div className="mt-2 text-xs">What is Harvest Health?</div>
                    <div className="mt-1 text-xs text-gray-400">Harvest health is a measure of a strategy performance. Pending yield is the current yield being realized by the vault from the protocol being farmed. Pending harvest is the current simulated yield being realized by the vault when harvested. This measure most accurately reflects the current yield the vault is experiencing with respect to market conditions and other externalities.</div>
                    <div className="mt-3 grid grid-cols-2">
                        <div className="flex flex-col">
                            <div className="text-xs">Pending Yield ({protocol})</div>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2">
                                {yieldTokens.map((t) => (
                                    <VaultStatistic key={`yield-${t.address}`} title={t.symbol} value={t.balance.toFixed(5)} subtext={<div className="text-xs text-gray-400">${t.value.toFixed(2)}</div>} />
                                ))}
                            </div>
                            <div className="mt-2 text-xs">
                                Total: {yieldValue.toFixed(2)} ({yieldApr.toFixed(2)}% APR)
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-xs">Pending Harvest</div>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2">
                                {harvestTokens.map((t) => (
                                    <VaultStatistic key={`harvest-${t.address}`} title={t.symbol} value={t.balance.toFixed(5)} subtext={<div className="text-xs text-gray-400">${t.value.toFixed(2)}</div>} />
                                ))}
                            </div>
                            <div className="mt-2 text-xs">
                                Total: {harvestValue.toFixed(2)} ({harvestApr.toFixed(2)}% APR)
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="mx-2 mt-4 grid grid-cols-1 md:mx-0 md:grid-cols-2">
                <VaultAprSources vault={vault} />
                <VaultSchedules vault={vault} schedules={schedules} />
            </div>
            <div className="bg-calm mx-2 mt-4 rounded-lg p-3 md:mx-0 md:p-4">
                <div className="text-sm text-gray-400">Vault Harvest History</div>
                <div className="mt-2">
                    <div className="hidden p-1 md:grid md:grid-cols-6">
                        <div>Date</div>
                        <div>Reward Type</div>
                        <div>Value</div>
                        <div>Amount</div>
                        <div>APR</div>
                        <div>Transaction</div>
                    </div>
                    {harvests.slice(harvestPage * PAGE_SIZE, harvestPage + 1 * PAGE_SIZE + 1).map((h, i) => {
                        return (
                            <div key={`harvest-${h.token}-${i}`} className="grid grid-cols-1 py-1 md:grid-cols-6">
                                <div>{new Date(h.timestamp * 1000).toLocaleString()}</div>
                                <div>{h.rewardType}</div>
                                <div>{formatter.format(h.value)}</div>
                                <div>
                                    {h.amount.toFixed(3)} {h.token}
                                </div>
                                <div>{isNaN(h.apr) || !h.apr ? 0 : h.apr.toFixed(2)}%</div>
                                <div className="text-mint">
                                    <a className="flex" href={`${getChainExplorer(network)}/tx/${h.hash}`} target="_blank" rel="noreferrer">
                                        {shortenAddress(h.hash, 8)}
                                        <svg className="ml-2 mt-1" fill="#3bba9c" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15px" height="15px">
                                            <path d="M 5 3 C 3.9069372 3 3 3.9069372 3 5 L 3 19 C 3 20.093063 3.9069372 21 5 21 L 19 21 C 20.093063 21 21 20.093063 21 19 L 21 12 L 19 12 L 19 19 L 5 19 L 5 5 L 12 5 L 12 3 L 5 3 z M 14 3 L 14 5 L 17.585938 5 L 8.2929688 14.292969 L 9.7070312 15.707031 L 19 6.4140625 L 19 10 L 21 10 L 21 3 L 14 3 z" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                    <div className="my-2 flex items-center justify-center">
                        <svg
                            onClick={() => {
                                if (harvestPage > 0) {
                                    setHarvestPage(harvestPage - 1);
                                }
                            }}
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 ${harvestPage > 0 ? "hover:text-mint cursor-pointer" : "opacity-50"}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <div className="font-gray-400 mx-2 text-sm font-semibold">{harvestPage + 1}</div>
                        <svg
                            onClick={() => {
                                if (harvestPage + 1 < maxHarvestPages) {
                                    setHarvestPage(harvestPage + 1);
                                }
                            }}
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 ${harvestPage < maxHarvestPages ? "hover:text-mint cursor-pointer" : "opacity-50"}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>
            <div className="bg-calm mx-2 mt-4 rounded-lg p-3 md:mx-0 md:p-4">
                <div className="text-sm text-gray-400">Vault User History</div>
                <div className="mt-2">
                    <div className="hidden p-1 md:grid md:grid-cols-4">
                        <div>Date</div>
                        <div>Action</div>
                        <div>Amount</div>
                        <div>Transaction</div>
                    </div>
                    {transfers.slice(PAGE_SIZE * page, PAGE_SIZE * (page + 1) + 1).map((t, i) => {
                        return (
                            <div key={`${t.hash}-${i}`} className="grid grid-cols-1">
                                <div className="grid rounded-lg p-1 md:grid-cols-4">
                                    <div>{t.date}</div>
                                    <div>{t.transferType}</div>
                                    <div>
                                        {t.amount.toLocaleString()} ({formatter.format(prices[vault.vaultToken] * t.amount)})
                                    </div>
                                    <div className="text-mint">
                                        <a className="flex" href={`${getChainExplorer(network)}/tx/${t.hash}`} target="_blank" rel="noreferrer">
                                            {shortenAddress(t.hash, 8)}
                                            <svg className="ml-2 mt-1" fill="#3bba9c" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15px" height="15px">
                                                <path d="M 5 3 C 3.9069372 3 3 3.9069372 3 5 L 3 19 C 3 20.093063 3.9069372 21 5 21 L 19 21 C 20.093063 21 21 20.093063 21 19 L 21 12 L 19 12 L 19 19 L 5 19 L 5 5 L 12 5 L 12 3 L 5 3 z M 14 3 L 14 5 L 17.585938 5 L 8.2929688 14.292969 L 9.7070312 15.707031 L 19 6.4140625 L 19 10 L 21 10 L 21 3 L 14 3 z" />
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div className="my-2 flex items-center justify-center">
                        <svg
                            onClick={() => {
                                if (page > 0) {
                                    setPage(page - 1);
                                }
                            }}
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 ${page > 0 ? "hover:text-mint cursor-pointer" : "opacity-50"}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <div className="font-gray-400 mx-2 text-sm font-semibold">{page + 1}</div>
                        <svg
                            onClick={() => {
                                if (page < maxPages) {
                                    setPage(page + 1);
                                }
                            }}
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 ${page < maxPages ? "hover:text-mint cursor-pointer" : "opacity-50"}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VaultPage;
