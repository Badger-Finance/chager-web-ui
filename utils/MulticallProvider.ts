import { Contract, ContractCall, Provider } from "ethers-multicall";
import { chain } from "lodash";

export class MulticallProvider extends Provider {


    async allDict<
        K extends string,
        T extends { [key in K]: ContractCall | string },
        R extends { [key in keyof T]: any },
        >(objCalls: T[]): Promise<R[]> {
        if (objCalls.length === 0) return [] as R[];

        const callKeys = chain(objCalls[0])
            .pickBy((value) => this.isContractCall(value))
            .keys()
            .value() as K[];

        const arrCalls = chain(objCalls)
            .map((objCall) => callKeys.map((i) => objCall[i]) as ContractCall[])
            .flatten()
            .value()
        const arrResults = await this.all(arrCalls);
        const callObjResults = chain(arrResults)
            .chunk(callKeys.length)
            .map((results) => {
                return chain(callKeys)
                    .zip(results)
                    .fromPairs()
                    .value() as R;
            })
            .value();

        const objResults = chain(objCalls)
            .zipWith(callObjResults, (objCall, objResult) => {
                return {
                    ...objCall,
                    ...objResult,
                };
            })
            .value() as R[];

        return objResults
    }

    private isContractCall(call: any): call is ContractCall {
        if (!call.contract || !call.contract.address) return false;
        if (!call.name) return false;
        if (!call.inputs) return false;
        if (!call.outputs) return false;
        if (!call.params) return false;

        return true;
    }
}

export { Contract as MultiCallContract }