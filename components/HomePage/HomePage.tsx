/* eslint-disable react/jsx-no-comment-textnodes */
import { BigNumber } from "ethers";
import _ from "lodash";
import Head from "next/head";
import { FunctionComponent, useCallback, useMemo } from "react";
import { useQuery } from "react-query";
import { abbreviateBigNumber } from "../../utils/abbreviateNumber";
import Favicon from "../Favicon";
import { useVaultApi, VaultBaseInfo, VaultDepositorInfo, VaultInfo } from "../Vault/useVaultApi";
import { useWalletContext } from "../Wallet";
import PageMeta from "../PageMeta";
import VaultList from "./VaultList";
import Header from "../Header";

const HomePage: FunctionComponent<{}> = ({}) => {
    const { chain, account } = useWalletContext();
    const { getAllVaultsBaseData, getAllVaultsDepositorData } = useVaultApi();

    const {
        data: vaultsBaseData,
        isLoading,
        isRefetching,
        refetch: refetchVaults,
    } = useQuery<VaultBaseInfo[], Error>(
        `${chain.chain.id}:Home:VaultList:BaseData`,
        async () => {
            return await getAllVaultsBaseData();
        },
        {
            retry: false,
        }
    );

    const {
        data: vaultsDepositorData,
        isLoading: isLoadingDepositorData,
        isRefetching: isRefetchingDepositorData,
        refetch: refetchVaultsDepositorData,
    } = useQuery<VaultDepositorInfo[], Error>(
        `${chain.chain.id}:Home:VaultList:DepositorData:${account}`,
        async () => {
            if (!account) return [] as VaultDepositorInfo[];
            return await getAllVaultsDepositorData(account);
        },
        {
            retry: false,
        }
    );

    const vaultTotals = useMemo(() => {
        if (!vaultsBaseData) {
            return {
                strategist: 0,
                vault: 0,
                tvl: BigNumber.from(0),
            };
        }
        const strategist = _.chain(vaultsBaseData)
            .map((i) => i.strategist.toLowerCase())
            .uniq()
            .value().length;
        const vault = vaultsBaseData.length;
        const tvl = _.chain(vaultsBaseData)
            .reduce((result, i) => result.add(i.tvl.div(BigNumber.from(10).pow(18))), BigNumber.from(0))
            .value();

        return {
            strategist,
            vault,
            tvl,
        };
    }, [vaultsBaseData]);

    const vaults = useMemo<VaultInfo[]>(() => {
        const depositorData = account ? vaultsDepositorData : [];
        const depositorDataMap = _.keyBy(depositorData, (i) => i.vault);

        return (
            vaultsBaseData?.map((i) => {
                const _depositorData = depositorDataMap[i.vault];
                return {
                    ...i,
                    ..._depositorData,
                };
            }) || []
        );
    }, [vaultsBaseData, vaultsDepositorData, account]);

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col overflow-hidden bg-gray-light-1 py-4 px-2 font-inter dark:bg-gray-dark-1 md:px-8">
            <Head>
                {/* <!-- HTML Meta Tags --> */}
                <title>Chadger Experimental Vaults</title>
                <meta name="description" content="Chadger Experimental Vaults" />
                <PageMeta />
            </Head>
            <Favicon />

            <div className="container mx-auto mb-8 max-w-full">
                <Header />
            </div>

            <div className="container mx-auto mb-8 max-w-full text-white">
                {/* Totals */}
                <div className="mb-4 flex flex-row text-xl">
                    <div className="mr-4">
                        <span style={{ color: "#78F34D" }}>{isLoading ? "--" : vaultTotals.strategist}</span>
                        <span className="ml-2">Strategists</span>
                    </div>
                    <div className="mr-4">//</div>
                    <div className="mr-4">
                        <span style={{ color: "#78F34D" }}>{isLoading ? "--" : vaultTotals.vault}</span>
                        <span className="ml-2">Vaults</span>
                    </div>
                    <div className="mr-4">//</div>
                    <div className="mr-4">
                        {/* <div>{vaultTotals.tvl.toString()}</div> */}
                        <span style={{ color: "#78F34D" }}>${isLoading ? "--" : abbreviateBigNumber(vaultTotals.tvl)}</span>
                        <span className="ml-2">TVL</span>
                    </div>
                </div>

                {/* VaultList */}
                <div className="mb-4 flex w-full flex-row text-xl">
                    <VaultList
                        vaults={vaults}
                        isLoading={isLoading}
                        onVaultAction={async () => {
                            await refetchVaultsDepositorData();
                            refetchVaults();
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default HomePage;
