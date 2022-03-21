/* eslint-disable react/jsx-no-comment-textnodes */
import type { FunctionComponent } from "react";
import { useQuery } from "react-query";
import { useWalletContext } from "./Wallet";

type EnsLabelProps = {
    address: string;
    renderAddress?: (address: string) => React.ReactNode;
    renderName?: (name: string) => React.ReactNode;
};
const EnsLabel: FunctionComponent<EnsLabelProps> = (props) => {
    const { provider, chain } = useWalletContext();
    const { data: ensName } = useQuery(
        `ENS:${props.address}`,
        async () => {
            return await provider.lookupAddress(props.address);
        },
        {
            enabled: chain.chain.id === 1,
            retry: false,
            retryOnMount: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            refetchOnWindowFocus: false,
        }
    );

    if (ensName) {
        return <span>{props.renderName ? props.renderName(ensName) : ensName}</span>;
    }

    return <span>{props.renderAddress ? props.renderAddress(props.address) : props.address}</span>;
};

export default EnsLabel;
