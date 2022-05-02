/* eslint-disable react/jsx-no-comment-textnodes */
import { BigNumber, ethers } from "ethers";
import _ from "lodash";
import { useCallback } from "react";
import { ChadgerRegistryContractAddresses } from "../../config/ContractConfig";
import { useWalletContext } from "../Wallet";
import { MultiCallContract, MulticallProvider } from "../../utils/MulticallProvider";
import { Promise as P } from "bluebird";

import ChadgerRegistryABI from "../../abis/ChadgerRegistry.json";
import VaultABI_1_5 from "../../abis/BadgerVault_1_5.json";
import StrategyABI_1_5 from "../../abis/BadgerStrategy_1_5.json";
import ERC20ABI from "../../abis/ERC20.json";

export interface VaultBaseInfo {
    vault: string;
    strategist: string;
    strategy: string;
    name: string;
    version: string;
    tokenAddress: string;
    tokenName: string;
    performanceFeeGovernance: BigNumber;
    performanceFeeStrategist: BigNumber;
    withdrawalFee: BigNumber;
    managementFee: BigNumber;
    lastHarvestedAt: Date;
    tvl: BigNumber;
    tvlInUSD: BigNumber;
    apr: BigNumber;
    tokenAprs: {
        address: string;
        name: string;
        symbol: string;
        apr: BigNumber;
    }[];
    rewardTokenAddresses: string[];
    rewardTokens: {
        address: string;
        name: string;
        symbol: string;
    }[];
}
export interface VaultDepositorInfo {
    vault: string;
    deposits: BigNumber;
    depositsInUSD: BigNumber;
}

export type VaultInfo = Partial<Pick<VaultDepositorInfo, "deposits" | "depositsInUSD">> & VaultBaseInfo;

export function useVaultApi() {
    const { provider, chain } = useWalletContext();

    const getVaultDepositorData = useCallback(
        async (vaultAddress: string, account: string): Promise<VaultDepositorInfo | null> => {
            const chadgerRegistryContractAddress = ChadgerRegistryContractAddresses[chain.chain.id];
            console.log("Chadger Registry ", chadgerRegistryContractAddress);
            if (!chadgerRegistryContractAddress) return null;

            const chadgerRegistryContract = new ethers.Contract(chadgerRegistryContractAddress, ChadgerRegistryABI, provider);

            const depositorData = await chadgerRegistryContract.getVaultDepositorData(vaultAddress, account);

            return {
                vault: vaultAddress,
                deposits: depositorData.deposits,
                depositsInUSD: depositorData.depositsInUSD,
            };
        },
        [chain.chain, provider]
    );

    const getAllVaultsDepositorData = useCallback(
        async (account: string): Promise<VaultDepositorInfo[]> => {
            const multicallProvider = new MulticallProvider(provider, chain.chain.id);
            const chadgerRegistryContractAddress = ChadgerRegistryContractAddresses[chain.chain.id];
            if (!chadgerRegistryContractAddress) return [];

            const chadgerRegistryMulticallContract = new MultiCallContract(chadgerRegistryContractAddress, ChadgerRegistryABI);
            const chadgerRegistryContract = new ethers.Contract(chadgerRegistryContractAddress, ChadgerRegistryABI, provider);

            const strategists: string[] = await chadgerRegistryContract.getStrategists();

            const vaultAddressGroup: string[][] = await multicallProvider.all(
                strategists.map((strategist) => {
                    return chadgerRegistryMulticallContract.getStrategistVaults(strategist);
                })
            );
            const vaultAddresses = _.flatten(vaultAddressGroup);

            const depositorData = await multicallProvider.allDict(
                vaultAddresses.map((vaultAdress) => {
                    return {
                        vault: vaultAdress,
                        data: chadgerRegistryMulticallContract.getVaultDepositorData(vaultAdress, account),
                    };
                })
            );

            return depositorData.map((i): VaultDepositorInfo => {
                return {
                    vault: i.vault,
                    deposits: i.data.deposits,
                    depositsInUSD: i.data.depositsInUSD,
                };
            });
        },
        [chain.chain, provider]
    );

    const getVaultBaseData = useCallback(
        async (vaultAddress: string): Promise<VaultBaseInfo | null> => {
            const multicallProvider = new MulticallProvider(provider, chain.chain.id);

            const chadgerRegistryContractAddress = ChadgerRegistryContractAddresses[chain.chain.id];
            if (!chadgerRegistryContractAddress) return null;

            const chadgerRegistryContract = new ethers.Contract(chadgerRegistryContractAddress, ChadgerRegistryABI, provider);
            const vaultContract = new ethers.Contract(vaultAddress, VaultABI_1_5, provider);

            try {
                let harvested: {
                    token: any;
                    amount: any;
                }[] = [];

                const strategy = await (async () => {
                    try {
                        return await vaultContract.strategy();
                    } catch (error) {
                        return null;
                    }
                })();

                if (strategy) {
                    const strategyContract = new ethers.Contract(strategy, StrategyABI_1_5, provider);

                    const governance = await (async () => {
                        try {
                            return await vaultContract.governance();
                        } catch (error) {
                            return null;
                        }
                    })();

                    if (governance) {
                        const data: any[] = await strategyContract.callStatic.harvest({
                            from: governance,
                        });
                        harvested = data.map((i: any) => {
                            return {
                                token: i.token,
                                amount: i.amount,
                            };
                        });
                    }
                }

                const vaultData = await chadgerRegistryContract.getVaultData(
                    vaultAddress,
                    harvested.map((i) => [i.token, i.amount])
                );

                const rewardTokenAddresses = _.chain(vaultData.apr.map((a: any) => a.token) as string[])
                    .map((i: string) => i.toLowerCase())
                    .uniq()
                    .value();
                const tokenInfo = await multicallProvider.allDict(
                    rewardTokenAddresses.map((address) => {
                        const contract = new MultiCallContract(address, ERC20ABI);
                        return {
                            address: address,
                            name: contract.name(),
                            symbol: contract.symbol(),
                        };
                    })
                );
                const tokenInfoMap = _.keyBy(tokenInfo, (i) => i.address as string);
                const vault = {
                    vault: vaultData.vault,
                    strategist: vaultData.strategist,
                    strategy: vaultData.strategy,
                    name: vaultData.name,
                    version: vaultData.version,
                    tokenAddress: vaultData.tokenAddress,
                    tokenName: vaultData.tokenName,
                    performanceFeeGovernance: vaultData.performanceFeeGovernance,
                    performanceFeeStrategist: vaultData.performanceFeeStrategist,
                    withdrawalFee: vaultData.withdrawalFee,
                    managementFee: vaultData.managementFee,
                    deposits: vaultData.deposits,
                    depositsInUSD: vaultData.depositsInUSD,
                    lastHarvestedAt: new Date(vaultData.lastHarvestedAt.toNumber() * 1000),
                    tvl: vaultData.tvl,
                    tvlInUSD: vaultData.tvlInUSD,
                    apr: vaultData.apr.reduce((acc: BigNumber, i: any) => acc.add(i.apr), BigNumber.from(0)),
                    tokenAprs: vaultData.apr.map((i: any) => {
                        return {
                            ...tokenInfoMap[i.token.toLowerCase()],
                            apr: i.apr,
                        };
                    }),
                    rewardTokenAddresses: vaultData.apr.map((a: any) => a.token),
                    rewardTokens: _.chain(vaultData.apr.map((a: any) => a.token) as string[])
                        .map((i) => tokenInfoMap[i.toLowerCase()])
                        .compact()
                        .value(),
                } as VaultBaseInfo;

                return vault;
            } catch (error) {
                console.error(error);
                throw error;
            }
        },
        [chain.chain, provider]
    );

    const getAllVaultsBaseData = useCallback(async (): Promise<VaultBaseInfo[]> => {
        const multicallProvider = new MulticallProvider(provider, chain.chain.id);

        const chadgerRegistryContractAddress = ChadgerRegistryContractAddresses[chain.chain.id];
        if (!chadgerRegistryContractAddress) return [];

        const chadgerRegistryMulticallContract = new MultiCallContract(chadgerRegistryContractAddress, ChadgerRegistryABI);
        const chadgerRegistryContract = new ethers.Contract(chadgerRegistryContractAddress, ChadgerRegistryABI, provider);

        try {
            const strategists: string[] = await chadgerRegistryContract.getStrategists();

            const vaultAddressGroup: string[][] = await multicallProvider.all(
                strategists.map((strategist) => {
                    return chadgerRegistryMulticallContract.getStrategistVaults(strategist);
                })
            );
            const vaultAddresses = _.flatten(vaultAddressGroup);

            const vaultStrategyInfo = await multicallProvider.allDict(
                vaultAddresses.map((vaultAddress) => {
                    const vaultMulticallContract = new MultiCallContract(vaultAddress, VaultABI_1_5);
                    return {
                        vault: vaultAddress,
                        strategy: vaultMulticallContract.strategy(),
                    };
                })
            );

            const vaultInfo = await P.map(
                vaultStrategyInfo,
                (info) => {
                    return (async () => {
                        try {
                            const strategyContract = new ethers.Contract(info.strategy, StrategyABI_1_5, provider);
                            const governance = await strategyContract.governance();
                            const data: any[] = await strategyContract.callStatic.harvest({
                                from: governance,
                            });
                            const harvested = data.map((i: any) => {
                                return {
                                    token: i.token,
                                    amount: i.amount,
                                };
                            });
                            return {
                                ...info,
                                harvested,
                            };
                        } catch (error) {
                            return {
                                ...info,
                                harvested: [],
                            };
                        }
                    })();
                },
                { concurrency: 3 }
            );

            const vaultData = await multicallProvider.all(
                vaultInfo.map((info) => {
                    return chadgerRegistryMulticallContract.getVaultData(
                        info.vault,
                        info.harvested.map((i) => [i.token, i.amount])
                    );
                })
            );

            const rewardTokenAddresses = _.chain(vaultData)
                .map((i) => i.apr.map((a: any) => a.token) as string[])
                .flatten()
                .map((i: string) => i.toLowerCase())
                .uniq()
                .value();
            const tokenInfo = await multicallProvider.allDict(
                rewardTokenAddresses.map((address) => {
                    const contract = new MultiCallContract(address, ERC20ABI);
                    return {
                        address: address,
                        name: contract.name(),
                        symbol: contract.symbol(),
                    };
                })
            );
            const tokenInfoMap = _.keyBy(tokenInfo, (i) => i.address as string);
            const vaults = vaultData.map((i): VaultBaseInfo => {
                return {
                    vault: i.vault,
                    strategist: i.strategist,
                    strategy: i.strategy,
                    name: i.name,
                    version: i.version,
                    tokenAddress: i.tokenAddress,
                    tokenName: i.tokenName,
                    performanceFeeGovernance: i.performanceFeeGovernance,
                    performanceFeeStrategist: i.performanceFeeStrategist,
                    withdrawalFee: i.withdrawalFee,
                    managementFee: i.managementFee,
                    lastHarvestedAt: new Date(i.lastHarvestedAt.toNumber() * 1000),
                    tvl: i.tvl,
                    tvlInUSD: i.tvlInUSD,
                    apr: i.apr.reduce((acc: BigNumber, i: any) => acc.add(i.apr), BigNumber.from(0)),
                    tokenAprs: i.apr.map((i: any) => {
                        return {
                            ...tokenInfoMap[i.token.toLowerCase()],
                            apr: i.apr,
                        };
                    }),
                    rewardTokenAddresses: i.apr.map((a: any) => a.token),
                    rewardTokens: _.chain(i.apr.map((a: any) => a.token) as string[])
                        .map((i) => tokenInfoMap[i.toLowerCase()])
                        .compact()
                        .value(),
                };
            });
            return vaults;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }, [chain.chain, provider]);

    return {
        getVaultBaseData,
        getAllVaultsBaseData,

        getVaultDepositorData,
        getAllVaultsDepositorData,
    };
}
