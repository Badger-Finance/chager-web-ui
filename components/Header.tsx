import { FunctionComponent } from "react";

import ButtonConnectWalletDesktop from "./Buttons/ConnectWalletDesktop";
import ButtonNetworkSwitcher from "./Buttons/NetworkSwitcher";

const Header: FunctionComponent<{}> = ({}) => {
    return (
        <div className="flex flex-row items-start justify-between">
            <div className="flex flex-col md:flex-row">
                <div className="hidden md:block">
                    <img style={{ width: 100, height: 100 }} src="/chadger.png" alt="Chadger Logo" />
                </div>
                <div className="block md:hidden">
                    <img style={{ width: 52, height: 52 }} src="/chadger.png" alt="Chadger Logo" />
                </div>
                <div className="ml-4 flex hidden flex-col justify-between md:block">
                    <div className=" font-pixel text-2xl font-medium" style={{ color: "#78F34D" }}>
                        Chadger Experimental Vaults // By Chad Strategists, For Chad Badgers
                    </div>
                    <div className="mt-2 max-w-2xl overflow-hidden rounded-lg" style={{ backgroundColor: "#C08181" }}>
                        <div className="flex flex-row items-stretch overflow-hidden">
                            <div className="hidden h-full md:block" style={{ width: 56, height: 56 }}>
                                <img className="h-full" src="/giga.png" alt="know your risks" />
                            </div>
                            <div className="flex-1 px-1.5 py-1 font-pixel" style={{ color: "#860000", height: 56 }}>
                                When we say experimental, we mean it. These vaults are built by community strategists and have not been vetted by BadgerDAO. Ape at your own risk.{" "}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="inline-block flex flex-none flex-row space-x-2">
                <div className="inline-block">
                    <ButtonNetworkSwitcher />
                </div>

                <div className="inline-block">
                    <ButtonConnectWalletDesktop />
                </div>
            </div>
        </div>
    );
};

export default Header;
