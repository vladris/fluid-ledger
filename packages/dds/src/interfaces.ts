import {
    ISharedObject,
    ISharedObjectEvents
} from "@fluidframework/shared-object-base";
import { Serializable } from "@fluidframework/datastore-definitions";

// Ledger events. Currently only supporting an "append" event fired when a new
// item gets appended to the list.

/**
 * Ledger events.
 */
export interface ILedgerEvents<T> extends ISharedObjectEvents {
    /**
     * "append" event fires when a value is appended to the ledger.
     */
    (event: "append", listener: (value: Serializable<T>) => void): void;
}

// Ledger interface. get() iterates over the list, append() appends a value.

/**
 * Ledger interface.
 */
export interface ILedger<T = any> extends ISharedObject<ILedgerEvents<T>> {
    /**
     * Gets an iterable iterator over the ledger.
     *
     * @returns - iterable iterator.
     */
    get(): IterableIterator<Serializable<T>>;

    /**
     * Appends a value to the ledger. Actual append happens only after op is
     * sequenced, wait for the "append" event before assuming the value is
     * part of the ledger.
     *
     * @param value - value to append to the ledger.
     */
    append(value: Serializable<T>): void;
}
