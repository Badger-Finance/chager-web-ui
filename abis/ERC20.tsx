import { utils } from "ethers";

const UDSC_ADDRESS = "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75"; // usdc fantom
const WETH_ADDRESS = "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83"; // wftm

const INTERFACE = new utils.Interface([
    // Read only
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)",

    // Write
    "function approve(address spender, uint256 amount) external",

    // Events
    "event Approval(address indexed owner, address indexed spender, uint256 value)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

export default {
    interface: INTERFACE,
    usdc: UDSC_ADDRESS,
    weth: WETH_ADDRESS,
};
