import classNames from "classnames";
import { BigNumber, ethers } from "ethers";
import _ from "lodash";
import Table from "rc-table";
import { ColumnType } from "rc-table/lib/interface";
import { FunctionComponent, useMemo, useState } from "react";
import ExternalLinkIcon from "../../public/icons/external-link.svg";
import { TextAbbrLabel } from "../TextAbbrLabel";
import EnsLabel from "../EnsLabel";
import { getExplorerTokenLink } from "../Explorer";
import { VaultInfo } from "../Vault/useVaultApi";
import VaultActions from "../Vault/VaultActions";
import { useWalletContext } from "../Wallet";
import { Link } from "react-router-dom";

type VaultListProps = {
    isLoading?: boolean;
    vaults?: VaultInfo[];
    onVaultAction?: (vault: VaultInfo) => Promise<void>;
};
const VaultList: FunctionComponent<VaultListProps> = (props) => {
    const { chain } = useWalletContext();

    const [searchValue, setSearchValue] = useState("");
    const [sortBy, setSortBy] = useState("apy");
    const [filterStrategist, setFilterStrategist] = useState("_all");
    const [filterMyDeposits, setFilterMyDeposits] = useState(false);
    const [filterHideDust, setFilterHideDust] = useState(false);

    const columns: ColumnType<VaultInfo>[] = [
        {
            title: "Strategist",
            dataIndex: "strategist",
            key: "strategist",
            align: "left",
            render: (value) => {
                return <EnsLabel address={value} renderAddress={(address) => <TextAbbrLabel text={address} front={6} end={4} />} />;
            },
        },
        {
            title: "Vault Name",
            dataIndex: "name",
            key: "name",
            align: "left",
            render: (value, item) => {
                return (
                    <Link to={`/vault/${item.vault}`}>
                        <div className="text-[#E6F44F] underline">{item.name}</div>
                    </Link>
                );
            },
        },
        {
            title: "Deposit Token",
            dataIndex: "tokenAddress",
            key: "tokenAddress",
            align: "right",
            render: (value, item) => {
                return (
                    <a href={getExplorerTokenLink(chain.chain, item.tokenAddress)} target="_blank" rel="noreferrer">
                        <div className="flex flex-row items-center justify-end">
                            <div className="mr-1">{item.tokenName}</div>
                            <img src={ExternalLinkIcon.src} style={{ width: 10, height: 10 }} alt={"export icon"} />
                        </div>
                    </a>
                );
            },
        },
        {
            title: "TVL",
            dataIndex: "tvl",
            key: "tvl",
            align: "right",
            render: (value, item) => {
                return (
                    <div>
                        {Number(item.tvl.div(BigNumber.from(10).pow(18))).toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                            style: "currency",
                            currency: "USD",
                        })}
                    </div>
                );
            },
        },
        {
            title: "YIELD",
            dataIndex: "yield",
            key: "yield",
            align: "right",
            render: (value, item) => {
                return (
                    <div>
                        {Number(item.yield.div(100).toString()).toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                        })}
                        %
                    </div>
                );
            },
        },
        {
            title: "My Deposits",
            dataIndex: "depositsInUSD",
            key: "depositsInUSD",
            align: "right",
            render: (value, item) => {
                return (
                    <div>
                        {!item.depositsInUSD && "-"}
                        {item.depositsInUSD &&
                            Number(item.depositsInUSD.div(BigNumber.from(10).pow(18)).toString()).toLocaleString("en-US", {
                                maximumFractionDigits: 2,
                                style: "currency",
                                currency: "USD",
                            })}
                    </div>
                );
            },
        },
        {
            title: "--------- Ape ---------",
            dataIndex: "ape",
            key: "ape",
            align: "center",
            render: (value, item) => {
                return (
                    <div className="flex flex-row justify-center">
                        <VaultActions vault={item} onVaultAction={props.onVaultAction} />
                    </div>
                );
            },
        },
    ];

    const strategistOptions = useMemo(() => {
        if (!props.vaults) return [];
        return _.chain(props.vaults)
            .map((i) => i.strategist.toLowerCase())
            .uniq()
            .map((i) => {
                return {
                    label: ethers.utils.getAddress(i),
                    value: i,
                };
            })
            .value();
    }, [props.vaults]);

    const filteredVaults = useMemo(() => {
        if (!props.vaults) return [];
        return props.vaults
            .filter((i) => {
                if (searchValue) {
                    if (i.name && i.name.toLowerCase().includes(searchValue.toLowerCase())) return true;
                    if (i.tokenName && i.tokenName.toLowerCase().includes(searchValue.toLowerCase())) return true;
                    if (i.vault && i.vault.toLowerCase().includes(searchValue.toLowerCase())) return true;
                    if (i.strategist && i.strategist.toLowerCase().includes(searchValue.toLowerCase())) return true;
                    if (i.tokenAddress && i.tokenAddress.toLowerCase().includes(searchValue.toLowerCase())) return true;
                    return false;
                }
                if (filterMyDeposits && i.depositsInUSD) {
                    if (i.depositsInUSD.lte(0)) return false;
                }
                if (filterHideDust && i.depositsInUSD) {
                    if (i.depositsInUSD.mul(100).div(BigNumber.from(10).pow(18)).lte(1)) return false;
                }
                if (filterStrategist !== "_all") {
                    if (i.strategist.toLowerCase() !== filterStrategist) return false;
                }
                return true;
            })
            .sort((a, b) => {
                if (sortBy === "apy") {
                    return b.yield.sub(a.yield).div(10000).toNumber();
                } else {
                    return b.tvl.sub(a.tvl).div(BigNumber.from(10).pow(18)).toNumber();
                }
            });
    }, [props.vaults, filterStrategist, filterMyDeposits, filterHideDust, sortBy, searchValue]);

    return (
        <div className="w-full">
            {/* List Query Options */}
            <div className="mb-4 flex flex-row flex-wrap text-base">
                <div className="mr-8 mb-2 flex flex-row items-center">
                    <div>Strategist:</div>
                    <div className="ml-2">
                        <select
                            className="w-[120px] border-b border-dashed border-[#CCCCCC] bg-[#2B2B2B] text-[#E93BF8]"
                            value={filterStrategist}
                            onChange={(event) => {
                                setFilterStrategist(event.target.value);
                            }}
                        >
                            <option value="_all">All</option>
                            {strategistOptions.map((i) => {
                                return (
                                    <option key={i.value} value={i.value}>
                                        {i.label}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>
                <div className="mr-8 mb-2 flex flex-row items-center">
                    <div>Search:</div>
                    <div className="ml-2">
                        <input
                            className="w-[300px] border-b border-dashed border-[#CCCCCC] bg-[#2B2B2B]"
                            placeholder="Vaults, tokens, addresses…"
                            value={searchValue}
                            onChange={(event) => {
                                setSearchValue(event.target.value);
                            }}
                        />
                    </div>
                </div>
                <div className="mr-8 mb-2 flex flex-row items-center">
                    <div>Filter:</div>
                    <div className="ml-2 flex flex-row items-center">
                        <div className="flex flex-row items-center">
                            <input
                                className="after:color-red-200"
                                type="checkbox"
                                id="FilterMyDeposits"
                                name="FilterMyDeposits"
                                defaultChecked={filterMyDeposits}
                                onClick={() => {
                                    setFilterMyDeposits((value) => !value);
                                }}
                            />
                            <label htmlFor="FilterMyDeposits" className="ml-1 cursor-pointer select-none">
                                My Deposits
                            </label>
                        </div>
                        <div className="ml-2 flex flex-row items-center">
                            <input
                                type="checkbox"
                                id="FilterHideDust"
                                name="FilterHideDust"
                                defaultChecked={filterHideDust}
                                onClick={() => {
                                    setFilterHideDust((value) => !value);
                                }}
                            />
                            <label htmlFor="FilterHideDust" className="ml-1 cursor-pointer select-none">
                                Hide Dust
                            </label>
                        </div>
                    </div>
                </div>
                <div className="mr-8 mb-2 flex flex-row items-center">
                    <div>Sort By:</div>
                    <div className="ml-2 flex flex-row items-center">
                        <div className="flex flex-row items-center">
                            <input
                                type="radio"
                                id="SortByApy"
                                name="SortBy"
                                value="apy"
                                checked={sortBy === "apy"}
                                onChange={(event) => {
                                    setSortBy(event.target.value);
                                }}
                            />
                            <label htmlFor="SortByApy" className="ml-1 cursor-pointer select-none">
                                YIELD
                            </label>
                        </div>
                        <div className="ml-2 flex flex-row items-center">
                            <input
                                type="radio"
                                id="SortByTvl"
                                name="SortBy"
                                value="tvl"
                                checked={sortBy === "tvl"}
                                onChange={(event) => {
                                    setSortBy(event.target.value);
                                }}
                            />
                            <label htmlFor="SortByTvl" className="ml-1 cursor-pointer select-none">
                                TVL
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="mb-4 flex flex-row">
                <Table
                    className="w-full"
                    columns={columns}
                    data={filteredVaults}
                    rowKey={(row) => `${row.vault}:${row.strategist}:${row.tokenAddress}`}
                    components={{
                        table: VaultTable,
                        header: {
                            row: Tr,
                            cell: Th,
                        },
                        body: {
                            cell: Td,
                        },
                    }}
                    emptyText={props.isLoading ? <div>loading...</div> : "No Vaults"}
                    scroll={{ x: true }}
                />
            </div>
        </div>
    );
};

function VaultTable(props: any) {
    return (
        <table {...props} className="w-full table-auto">
            {props.children}
        </table>
    );
}

function Tr(props: { children: React.ReactNode }) {
    return (
        <tr {...props} className=" bg-[#2B2B2B]">
            {props.children}
        </tr>
    );
}

function Th(props: any) {
    return (
        <th {...props}>
            <div className="whitespace-nowrap py-4 px-2 text-base font-medium text-primary">{props.children}</div>
        </th>
    );
}

function Td(props: any) {
    return (
        <td {...props} className={classNames([props.className, "border-t border-b border-dashed py-4 px-2 text-base font-normal"])}>
            {props.children}
        </td>
    );
}

export default VaultList;
