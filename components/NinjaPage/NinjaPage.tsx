import dynamic from "next/dynamic";

const NinjaContents = dynamic(() => import("./NinjaPageInternal"), { ssr: false });

const VaultPage: FunctionComponent<VaultPageProps> = ({}) => {
    return <NinjaContents />;
};

export default VaultPage;
