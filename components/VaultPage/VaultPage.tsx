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

type VaultPageProps = {};
const VaultPage: FunctionComponent<VaultPageProps> = ({}) => {
    const { chain, account } = useWalletContext();
    let { address: vaultAddress } = useParams();

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
                {!isLoading && vault && (
                    <>
                        <div className="mb-4 flex w-full min-w-[700px] flex-row text-2xl">
                            <div className="w-full max-w-[700px]">
                                <div className="border-t border-b border-dashed bg-[#2B2B2B]">
                                    <div className="border-t border-b border-dashed py-1">
                                        <div className="text-[#78F34D]">{vault.name}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4 w-full max-w-[700px] text-base font-normal">
                            <div className="mb-1 flex flex-row justify-between">
                                <div className="opacity-75">Strategist</div>
                                <div className="text-[#E6F44F] underline">
                                    <EnsLabel
                                        address={vault.strategist}
                                        renderName={(name) => {
                                            return (
                                                <span>
                                                    {name}({vault.strategist})
                                                </span>
                                            );
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="mb-1 flex flex-row justify-between">
                                <div className="opacity-75">Strategy Address</div>
                                <div>
                                    <a href={getExplorerContractLink(chain.chain, vault.strategy)} target="_blank" rel="noreferrer">
                                        <div className="flex flex-row items-center justify-end">
                                            <div className="mr-1">{vault.strategy}</div>
                                            <img src={ExternalLinkIcon.src} style={{ width: 10, height: 10 }} alt={"export icon"} />
                                        </div>
                                    </a>
                                </div>
                            </div>

                            <div className="mb-10"></div>

                            <div className="mb-1 flex flex-row justify-between">
                                <div className="opacity-75">Vault Name</div>
                                <div>{vault.name}</div>
                            </div>
                            <div className="mb-1 flex flex-row justify-between">
                                <div className="opacity-75">Vault Address</div>
                                <div>
                                    <a href={getExplorerContractLink(chain.chain, vault.vault)} target="_blank" rel="noreferrer">
                                        <div className="flex flex-row items-center justify-end">
                                            <div className="mr-1">{vault.vault}</div>
                                            <img src={ExternalLinkIcon.src} style={{ width: 10, height: 10 }} alt={"export icon"} />
                                        </div>
                                    </a>
                                </div>
                            </div>
                            <div className="mb-1 flex flex-row justify-between">
                                <div className="opacity-75">Version</div>
                                <div>{vault.version}</div>
                            </div>

                            <div className="mb-10"></div>

                            <div className="mb-1 flex flex-row justify-between">
                                <div className="opacity-75">Deposit Token</div>
                                <div>{vault.tokenName}</div>
                            </div>
                            <div className="mb-1 flex flex-row justify-between">
                                <div className="opacity-75">Deposit Token Address</div>
                                <div>
                                    <a href={getExplorerTokenLink(chain.chain, vault.tokenAddress)} target="_blank" rel="noreferrer">
                                        <div className="flex flex-row items-center justify-end">
                                            <div className="mr-1">{vault.tokenAddress}</div>
                                            <img src={ExternalLinkIcon.src} style={{ width: 10, height: 10 }} alt={"export icon"} />
                                        </div>
                                    </a>
                                </div>
                            </div>

                            <div className="mb-10"></div>

                            <div className="mb-1 flex flex-row justify-between">
                                <div className="opacity-75">APR</div>
                                <div className="flex flex-col items-end">
                                    {vault.tokenAprs
                                        .filter((tokenApr) => {
                                            return tokenApr.address.toLowerCase() === vault.tokenAddress.toLowerCase();
                                        })
                                        .map((tokenApr) => {
                                            return (
                                                <div key={tokenApr.address}>
                                                    <div className="flex flex-row items-center justify-end">
                                                        <div className="tabular-nums">
                                                            {Number(tokenApr.apr.div(100).toString()).toLocaleString("en-US", {
                                                                maximumFractionDigits: 2,
                                                            })}
                                                            %
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                            <div className="mb-1 flex flex-row justify-between">
                                <div className="opacity-75">Additional Reward Tokens</div>
                                <div>
                                    {vault.tokenAprs
                                        .filter((tokenApr) => {
                                            return tokenApr.address.toLowerCase() !== vault.tokenAddress.toLowerCase();
                                        })
                                        .map((rewardToken) => {
                                            return (
                                                <div key={rewardToken.address}>
                                                    <a href={getExplorerTokenLink(chain.chain, rewardToken.address)} target="_blank" rel="noreferrer">
                                                        <div className="flex flex-row items-center justify-end">
                                                            <div className="mr-1">
                                                                {rewardToken.name} ({rewardToken.symbol})
                                                            </div>
                                                            <div className="flex flex-row items-center justify-end">
                                                                <div className="tabular-nums">
                                                                    {Number(rewardToken.apr.div(100).toString()).toLocaleString("en-US", {
                                                                        maximumFractionDigits: 2,
                                                                    })}
                                                                    %
                                                                </div>
                                                            </div>
                                                            <img className="ml-1" src={ExternalLinkIcon.src} style={{ width: 10, height: 10 }} alt={"export icon"} />
                                                        </div>
                                                    </a>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>

                            <div className="mb-10"></div>

                            <div className="mb-1 flex flex-row justify-between">
                                <div className="opacity-75">Performance Fee, Strategist</div>
                                <div>
                                    {vault.performanceFeeStrategist.div(100).toNumber().toLocaleString("en-US", {
                                        maximumFractionDigits: 1,
                                    })}
                                    %
                                </div>
                            </div>
                            <div className="mb-1 flex flex-row justify-between">
                                <div className="opacity-75">Performance Fee, Governance</div>
                                <div>
                                    {vault.performanceFeeGovernance.div(100).toNumber().toLocaleString("en-US", {
                                        maximumFractionDigits: 1,
                                    })}
                                    %
                                </div>
                            </div>
                            <div className="mb-1 flex flex-row justify-between">
                                <div className="opacity-75">Withdrawal Fee</div>
                                <div>
                                    {vault.withdrawalFee.div(100).toNumber().toLocaleString("en-US", {
                                        maximumFractionDigits: 2,
                                    })}
                                    %
                                </div>
                            </div>
                            <div className="mb-1 flex flex-row justify-between">
                                <div className="opacity-75">Management Fee</div>
                                <div>
                                    {vault.managementFee.div(100).toNumber().toLocaleString("en-US", {
                                        maximumFractionDigits: 2,
                                    })}
                                    %
                                </div>
                            </div>

                            <div className="mb-10"></div>

                            <div className="mb-1 flex flex-row justify-between">
                                <div className="opacity-75">My Deposits</div>
                                <div>
                                    {!vault.depositsInUSD && "-"}
                                    {vault.depositsInUSD &&
                                        Number(vault.depositsInUSD.div(BigNumber.from(10).pow(18)).toString()).toLocaleString("en-US", {
                                            maximumFractionDigits: 2,
                                            style: "currency",
                                            currency: "USD",
                                        })}
                                </div>
                            </div>
                        </div>

                        <div className="mb-4 w-full max-w-[700px] text-sm">
                            <VaultActions
                                vault={vault}
                                onVaultAction={async () => {
                                    await refetchVaultDepositorData();
                                    refetchVault();
                                }}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default VaultPage;
