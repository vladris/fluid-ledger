import {
    IChannelAttributes,
    IFluidDataStoreRuntime,
    IChannelServices,
    IChannelFactory,
} from "@fluidframework/datastore-definitions";
import { Ledger } from "./ledger";
import { ILedger } from "./interfaces";

export class LedgerFactory implements IChannelFactory {
    public static readonly Type = "LedgerDDS"

    public static readonly Attributes: IChannelAttributes = {
        type: LedgerFactory.Type,
        snapshotFormatVersion: "0.1",
        packageVersion: "0.0.1",
    };

    public get type() {
        return LedgerFactory.Type;
    }

    public get attributes() {
        return LedgerFactory.Attributes;
    }

    public async load(
        runtime: IFluidDataStoreRuntime,
        id: string,
        services: IChannelServices,
        attributes: IChannelAttributes): Promise<ILedger> {
        const ledger = new Ledger(id, runtime, attributes);
        await ledger.load(services);
        return ledger;
    }

    public create(document: IFluidDataStoreRuntime, id: string): ILedger {
        const ledger = new Ledger(id, document, this.attributes);
        ledger.initializeLocal();
        return ledger;
    }
}