/* eslint-disable react/jsx-no-comment-textnodes */
import type { FunctionComponent } from "react";
import MintTokenButton from "./MintTokenButton";
import { VaultInfo } from "./useVaultApi";
import VaultApproveButton from "./VaultApproveButton";
import VaultDepositButton from "./VaultDepositButton";
import VaultWithdrawButton from "./VaultWithdrawButton";

/**
 * VaultActionsProps is a React Component properties that passed to React Component VaultActions
 */
type VaultActionsProps = {
    vault: VaultInfo;
    onVaultAction?: (vault: VaultInfo) => Promise<void>;
};

/**
 * VaultActions is just yet another react component
 *
 * @link https://fettblog.eu/typescript-react/components/#functional-components
 */
const VaultActions: FunctionComponent<VaultActionsProps> = (props) => {
    return (
        <div className="flex flex-row justify-end gap-1">
            <VaultApproveButton vault={props.vault} onVaultAction={props.onVaultAction} />
            <VaultDepositButton vault={props.vault} onVaultAction={props.onVaultAction} />
            <VaultWithdrawButton vault={props.vault} onVaultAction={props.onVaultAction} />
            <MintTokenButton vault={props.vault} />
        </div>
    );
};

export default VaultActions;
