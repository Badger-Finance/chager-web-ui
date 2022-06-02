import dynamic from "next/dynamic";
import type { FunctionComponent } from "react";

const NinjaContents = dynamic(() => import("./NinjaPageInternal"), { ssr: false });

const VaultPage: FunctionComponent = ({}) => {
    return <NinjaContents />;
};

export default VaultPage;
