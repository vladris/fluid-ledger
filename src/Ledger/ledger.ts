import { ISequencedDocumentMessage, MessageType } from "@fluidframework/protocol-definitions";
import {
    IChannelAttributes,
    IFluidDataStoreRuntime,
    IChannelStorageService,
    IChannelFactory,
    Serializable,
} from "@fluidframework/datastore-definitions";
import { ISummaryTreeWithStats } from "@fluidframework/runtime-definitions";
import { readAndParse } from "@fluidframework/driver-utils";
import { createSingleBlobSummary, IFluidSerializer, SharedObject } from "@fluidframework/shared-object-base";
import { ILedger, ILedgerEvents } from "./interfaces";
import { LedgerFactory } from "./ledgerFactory";

// Ledger operations - currently only supporting an Append operation.
type ILedgerOperation = IAppendOperation;

// An Append operation consists of a value (to be appended to the list).
interface IAppendOperation {
    type: "append";
    value: any;
}

const snapshotFileName = "header";

// Ledger DDS. This represents a distributed append-only list. Clients use the
// append() API to submit new values. We rely on the service-side sequencing to
// guarantee ordering of items, which means calling append() locally does not
// update the underlying list until the we get the op back from the service.
export class Ledger<T = any> extends SharedObject<ILedgerEvents<T>>
    implements ILedger<T> {

    public static create(runtime: IFluidDataStoreRuntime, id?: string) {
        return runtime.createChannel(id, LedgerFactory.Type) as Ledger;
    }

    public static getFactory(): IChannelFactory {
        return new LedgerFactory();
    }

    // Internally the ledger is an array of values.
    private data: Serializable<T>[] = [];

    constructor(id: string, runtime: IFluidDataStoreRuntime, attributes: IChannelAttributes) {
        super(id, runtime, attributes, "fluid_ledger_");
    }

    // Return an iterable iterator over the values in the list.
    public *get(): IterableIterator<Serializable<T>> {
        for (const item of this.data) {
            yield item;
        }
    }

    // Append a value to the list.
    public append(value: Serializable<T>) {
        const opValue = this.serializer.encode(value, this.handle);

        // We have very different code paths depending on whether container is attached or not.
        // When attached, we submit the op and only update data once the op gets sequenced.
        if (this.isAttached()) {
            const op: IAppendOperation = {
                type: "append",
                value: opValue
            };

            this.applyInnerOp(op);
        }
        // If container is detached, we update data right away and emit the append event.
        else {
            this.appendCore(opValue);
        }
    }

    protected summarizeCore(serializer: IFluidSerializer): ISummaryTreeWithStats {
        return createSingleBlobSummary(snapshotFileName, serializer.stringify(this.data, this.handle));
    }

    protected async loadCore(storage: IChannelStorageService): Promise<void> {
        const content = await readAndParse<Serializable<T>[]>(storage, snapshotFileName);
        this.data = this.serializer.decode(content);
    }

    protected initializeLocalCore() {
        this.data = [];
    }

    protected onDisconnect() { }

    private applyInnerOp(content: ILedgerOperation) {
        switch (content.type) {
            case "append":
                // "Applying the op" in our case means just submitting the message.
                // We don't update the actual list until we get the op back from the service.
                this.submitLocalMessage(content);
                break;

            default:
                throw new Error("Unknown operation");
        }
    }

    protected processCore(message: ISequencedDocumentMessage) {
        // For incoming messages, we don't really care which client they come from.
        // We append them to the list in the order they arrive and emit "append" events for each. 
        if (message.type === MessageType.Operation) {
            const op = message.contents as ILedgerOperation;
            this.appendCore(op.value);
        }
    }

    protected applyStashedOp(content: unknown) {
        const op = content as ILedgerOperation;
        this.applyInnerOp(op);
    }

    private appendCore(value: Serializable<T>) {
        this.data.push(value);
        this.emit("append", value);
    }
}