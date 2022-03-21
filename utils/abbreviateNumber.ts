import { BigNumber } from "ethers";

export function abbreviateBigNumber(value: BigNumber) {
    let newValue = BigNumber.from(value)
    const suffixes = ["", "K", "M", "B"];
    let suffixNum = 0;
    while (newValue.gte(1000) && suffixNum < suffixes.length - 1) {
        newValue = newValue.div(1000);
        suffixNum++;
    }
    const suffix = suffixes[suffixNum];
    return `${newValue.toString()}${suffix}`;
}