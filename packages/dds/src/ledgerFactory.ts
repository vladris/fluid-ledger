import {
    IChannel,
    IChannelAttributes,
    IFluidDataStoreRuntime,
    IChannelServices,
    IChannelFactory
} from "@fluidframework/datastore-definitions";
import { SharedObject } from "@fluidframework/shared-object-base";

/**
 * SharedObject with constructor and a Type attribute.
 */
interface ITypedSharedObject {
    new (
        id: string,
        runtime: IFluidDataStoreRuntime,
        attributes: IChannelAttributes
    ): SharedObject;
    Type: string;
}

/**
 * Factory for the various Ledger types.
 */
export class LedgerFactory implements IChannelFactory {
    public static readonly BaseAttributes = {
        snapshotFormatVersion: "0.1",
        packageVersion: "0.0.4"
    };

    constructor(private sharedObject: ITypedSharedObject) {}

    public get type() {
        return this.sharedObject.Type;
    }

    public get attributes() {
        return {
            type: this.sharedObject.Type,
            ...LedgerFactory.BaseAttributes
        };
    }

    /*
     * {@inheritDoc @fluidframework/datastore-definitions#IChannelFactory.load}
     */
    public async load(
        runtime: IFluidDataStoreRuntime,
        id: string,
        services: IChannelServices,
        attributes: IChannelAttributes
    ): Promise<IChannel> {
        const ledger = new this.sharedObject(id, runtime, attributes);
        await ledger.load(services);
        return ledger;
    }

    /**
     * {@inheritDoc @fluidframework/datastore-definitions#IChannelFactory.create}
     */
    public create(document: IFluidDataStoreRuntime, id: string): IChannel {
        const ledger = new this.sharedObject(id, document, this.attributes);
        ledger.initializeLocal();
        return ledger;
    }
}
