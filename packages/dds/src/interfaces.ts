import {
    ISharedObject,
    ISharedObjectEvents
} from "@fluidframework/shared-object-base";
import { Serializable } from "@fluidframework/datastore-definitions";

// Ledger events. "append" event fires when a new item gets appended to
// the list. "clear" event fires when the list is cleared.

/**
 * Ledger events.
 */
export interface ILedgerEvents<T> extends ISharedObjectEvents {
    /**
     * "append" event fires when a value is appended to the ledger.
     */
    (event: "append", listener: (value: Serializable<T>) => void): void;

    /**
     * "clear" event fires when the ledger is cleared by a "clear" op.
     */
    (event: "clear", listener: (values: Serializable<T>[]) => void): void;
}

// Ledger interface. get() iterates over the list, append() appends a value,
// clear() clears the ledger.

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

    /**
     * Clears the ledger. Actual clear happens only after op is sequenced,
     * wait for the "clear" event before assuming the ledger is clear.
     */
    clear(): void;
}
