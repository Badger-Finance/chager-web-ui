import type { NextPage } from "next";
import { HashRouter, Route, Routes } from "react-router-dom";
// Import components
import HomePage from "../components/HomePage/HomePage";
import VaultPage from "../components/VaultPage/VaultPage";
import NinjaPage from "../components/NinjaPage/NinjaPage";
import { Link } from "react-router-dom";

const Home: NextPage = () => {
    if (typeof window === "undefined") return <div suppressHydrationWarning></div>;
    return (
        <div suppressHydrationWarning>
            <HashRouter>
                <Link to="/ninja/0x96d4dBdc91Bef716eb407e415c9987a9fAfb8906">
                    <p>NINJA</p>
                </Link>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/vault/:address" element={<VaultPage />} />
                    <Route path="/ninja/:address" element={<NinjaPage />} />
                </Routes>
            </HashRouter>
        </div>
    );
};

export default Home;
