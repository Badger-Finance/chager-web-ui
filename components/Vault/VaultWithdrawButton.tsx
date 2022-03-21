import * as Dialog from "@radix-ui/react-dialog";
import { BigNumber, ethers } from "ethers";
import Link from "next/link";
import { FunctionComponent, useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useMutation, useQuery } from "react-query";
import VaultABI_1_5 from "../../abis/BadgerVault_1_5.json";
import ERC20ABI from "../../abis/ERC20.json";
import { MultiCallContract, MulticallProvider } from "../../utils/MulticallProvider";
import { TextAbbrLabel } from "../TextAbbrLabel";
import Button from "../Buttons/Button";
import { getExplorerTxLink } from "../Explorer";
import { useWalletContext } from "../Wallet";
import { VaultInfo } from "./useVaultApi";

type VaultWithdrawButtonProps = {
    vault: VaultInfo;
    onVaultAction?: (vault: VaultInfo) => Promise<void>;
};
const VaultWithdrawButton: FunctionComponent<VaultWithdrawButtonProps> = ({ vault, onVaultAction }) => {
    // Global states
    const { account, chain, provider, signer } = useWalletContext();

    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");

    const getTokenInfo = useCallback(
        async (token: string, account: string, spender: string) => {
            const multicallProvider = new MulticallProvider(provider, chain.chain.id);
            const contract = new MultiCallContract(token, ERC20ABI);
            const data = await multicallProvider.allDict([
                {
                    symbol: contract.symbol(),
                    decimals: contract.decimals(),
                    balance: contract.balanceOf(account),
                    allowance: contract.allowance(account, spender),
                },
            ]);
            return data[0];
        },
        [chain.chain.id, provider]
    );

    const {
        data,
        isLoading,
        refetch: refetchTokenInfo,
    } = useQuery(
        `VaultActions:TokenInfo:${vault.vault}:${account}`,
        async () => {
            const tokenInfo = await getTokenInfo(vault.tokenAddress, account || "", vault.vault);
            return {
                symbol: tokenInfo.symbol,
                decimals: tokenInfo.decimals,
                balance: tokenInfo.balance,
                allowance: tokenInfo.allowance,
                balanceFormatted: ethers.utils.formatUnits(tokenInfo.balance, tokenInfo.decimals),
                allowanceFormatted: ethers.utils.formatUnits(tokenInfo.allowance, tokenInfo.decimals),
            };
        },
        {
            enabled: !!account && open,
            retry: false,
        }
    );

    const withdraw = useMutation(async (args: { vault: VaultInfo; data: any; amount: BigNumber; amountFormatted: string | number; withdrawAll?: boolean }) => {
        const contract = new ethers.Contract(args.vault.vault, VaultABI_1_5, signer);
        const transactionResponse = await (async () => {
            if (args.withdrawAll) {
                return await contract.withdrawAll();
            } else {
                return await contract.withdraw(args.amount);
            }
        })();
        const receiptPromise = (async () => {
            const receipt = await transactionResponse.wait();
            await Promise.all([refetchTokenInfo(), ...[onVaultAction ? onVaultAction(vault) : []]]);
            return receipt;
        })();
        toast.promise(
            receiptPromise,
            {
                loading: `Withdrawing ${Number(args.amountFormatted).toFixed(4)} ${data?.symbol}...`,
                success: (receipt: any) => (
                    <div className="flex flex-row items-center">
                        <div className="flex flex-col">
                            <b className="mb-1">{`Successfully withdraw ${args.amountFormatted} ${args.data?.symbol}`}</b>
                            <a href={getExplorerTxLink(chain.chain, receipt.transactionHash)} target="_blank" rel="noreferrer" className="text-gray-text-center text-sm leading-6 text-gray-light-10 dark:text-gray-dark-10">
                                <span className="hover:underline">{receipt.status === 1 ? "Transaction is submitted" : "Something wrong with the receipt"}</span> &#8599;
                            </a>
                        </div>
                    </div>
                ),
                error: (error: any) => (
                    <div className="flex flex-row items-center">
                        <div className="flex flex-col">
                            <b className="mb-1">{`Withdraw failed`}</b>
                            <div className="overflow-hidden whitespace-nowrap">{error.message}</div>
                        </div>
                    </div>
                ),
            },
            {
                success: {
                    duration: 10000,
                },
                loading: {
                    duration: Infinity,
                },
                error: {
                    duration: 5000,
                },
            }
        );
        const receipt = await receiptPromise;
        return receipt;
    });

    const notEnoughBalance = Number(inputValue) > Number(data?.balanceFormatted || 0);

    return (
        <Dialog.Root
            open={open}
            onOpenChange={(value) => {
                setOpen(value);
            }}
        >
            <Dialog.Trigger asChild>
                <Button>Withdraw</Button>
            </Dialog.Trigger>
            <Dialog.Overlay className="fixed inset-0 z-30 bg-gray-dark-1/60 backdrop-blur dark:bg-black/60" />
            <Dialog.Content className="fixed left-0 bottom-0 z-30 w-screen sm:flex sm:h-screen sm:items-center">
                {/* Mint or Redeem container */}
                <div className="mx-4 mx-auto mb-4 flex-col border-2 border-[#E93BF8] bg-gray-dark-1 p-4 sm:m-auto sm:max-w-[376px] sm:flex-auto">
                    <Dialog.Title className="mb-4 flex flex-row items-center justify-between">
                        <div className="flex flex-row items-center space-x-4">
                            <div>
                                <h1 className="m-0 text-left text-base font-bold tracking-[-0.02em] text-gray-light-12 dark:text-gray-dark-12">Withdraw</h1>
                                <p className="text-sm leading-4 text-gray-light-10 dark:text-gray-dark-10">Withdraw your {data?.symbol} from Badger vault</p>
                            </div>
                        </div>
                        <Dialog.Close
                            asChild
                            onClick={() => {
                                setInputValue("");
                            }}
                        >
                            <button className="button basic h-[32px] p-0">
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="m-[9.5px] h-[11px] w-[11px] fill-gray-light-12 dark:fill-gray-dark-12">
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L7.5 6.79289L2.85355 2.14645C2.65829 1.95118 2.34171 1.95118 2.14645 2.14645C1.95118 2.34171 1.95118 2.65829 2.14645 2.85355L6.79289 7.5L2.14645 12.1464C1.95118 12.3417 1.95118 12.6583 2.14645 12.8536C2.34171 13.0488 2.65829 13.0488 2.85355 12.8536L7.5 8.20711L12.1464 12.8536C12.3417 13.0488 12.6583 13.0488 12.8536 12.8536C13.0488 12.6583 13.0488 12.3417 12.8536 12.1464L8.20711 7.5L12.8536 2.85355Z"
                                    />
                                </svg>
                            </button>
                        </Dialog.Close>
                    </Dialog.Title>

                    {!account && <div className="mt-20 mb-20 text-sm text-gray-300">Please connect your wallet first.</div>}
                    {account && (
                        <div className="mt-12 flex flex-col">
                            <div className="mb-4 flex flex-col text-sm text-gray-300">
                                <div className="flex flex-row justify-between">
                                    <div>Name: </div>
                                    <div className="ml-2 font-bold">{vault.name}</div>
                                </div>
                                <div className="flex flex-row justify-between">
                                    <div>Strategist: </div>
                                    <div className="ml-2">
                                        <TextAbbrLabel text={vault.strategist} front={6} end={4} />
                                    </div>
                                </div>
                                <div className="flex flex-row justify-between">
                                    <div>Token: </div>
                                    <div className="ml-2">{vault.tokenName}</div>
                                </div>
                            </div>
                            <div className="mb-1">
                                <div className="flex w-full flex-row border-b border-dashed border-[#CCCCCC] bg-[#2B2B2B] p-2">
                                    <input
                                        type="number"
                                        className="w-full flex-1 bg-[#2B2B2B]"
                                        min={0.001}
                                        max={Number(data?.balanceFormatted || 0)}
                                        step={0.001}
                                        value={inputValue}
                                        onChange={(event) => {
                                            setInputValue(event.target.value);
                                        }}
                                    />
                                    <div>
                                        <button
                                            className="text-sm font-medium text-[#E93BF8]"
                                            onClick={() => {
                                                if (!vault?.deposits) return;
                                                if (!data?.decimals) return;
                                                setInputValue(vault.deposits.div(BigNumber.from(10).pow(data.decimals)).toString() || "");
                                            }}
                                        >
                                            MAX
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-1 flex flex-col">
                                <div className="flex w-full flex-row justify-between text-sm text-gray-400">
                                    <div>Allowance</div>
                                    <div className="tabular-nums">
                                        <span className="font-medium text-[#f690ff]">{data ? data.allowanceFormatted : "-"}</span> <span>{data?.symbol}</span>
                                    </div>
                                </div>
                                <div className="flex w-full flex-row justify-between text-sm text-gray-400">
                                    <div>Balance</div>
                                    <div className="tabular-nums">
                                        <span className="font-medium text-[#f690ff]">{data ? data.balanceFormatted : "-"}</span> <span>{data?.symbol}</span>
                                    </div>
                                </div>
                                <div className="flex w-full flex-row justify-between text-sm text-gray-400">
                                    <div>Deposited</div>
                                    <div className="tabular-nums">
                                        <span className="font-medium text-[#f690ff]">
                                            {!vault.depositsInUSD && "-"}
                                            {vault.depositsInUSD &&
                                                Number(vault.depositsInUSD.div(BigNumber.from(10).pow(18)).toString()).toLocaleString("en-US", {
                                                    maximumFractionDigits: 2,
                                                    style: "currency",
                                                    currency: "USD",
                                                })}
                                        </span>{" "}
                                        <span>{data?.symbol}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Button
                                    disabled={!inputValue || withdraw.isLoading || notEnoughBalance}
                                    className="w-full"
                                    style={{
                                        backgroundColor: withdraw.isLoading ? "#3b3b3b" : "#E93BF8",
                                        borderColor: withdraw.isLoading ? "#3b3b3b" : undefined,
                                        cursor: withdraw.isLoading ? "not-allowed" : undefined,
                                        color: "white",
                                    }}
                                    onClick={async () => {
                                        if (!data) return null;
                                        if (!inputValue) return null;
                                        if (!vault?.deposits) return null;
                                        const amount = ethers.utils.parseUnits(inputValue, data.decimals);
                                        const isWithdrawAll = ethers.utils.parseUnits(inputValue, data.decimals).eq(vault.deposits);
                                        await withdraw.mutateAsync({ vault: vault, amount: amount, data, amountFormatted: inputValue, withdrawAll: isWithdrawAll });
                                        setInputValue("");
                                        setOpen(false);
                                    }}
                                >
                                    {notEnoughBalance && "Not Enough Balance"}
                                    {!notEnoughBalance && withdraw.isLoading && "Withdraw..."}
                                    {!notEnoughBalance && isLoading && "Loading..."}
                                    {!notEnoughBalance && !withdraw.isLoading && !isLoading && "Withdraw"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default VaultWithdrawButton;
