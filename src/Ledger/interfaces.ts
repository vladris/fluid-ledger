import { ISharedObject, ISharedObjectEvents } from "@fluidframework/shared-object-base";
import { Serializable } from "@fluidframework/datastore-definitions";

// Ledger events. Currently only supporting an "append" event fired when a new
// item gets appended to the list. 
export interface ILedgerEvents<T> extends ISharedObjectEvents {
    (event: "append", listener: (value: Serializable<T>) => void): void;
}

// Ledger interface. get() iterates over the list, append() appends a value.
export interface ILedger<T = any> extends ISharedObject<ILedgerEvents<T>> {
    get(): IterableIterator<Serializable<T>>;

    append(value: Serializable<T>): void;
}