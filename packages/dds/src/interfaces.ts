import {
    ISharedObject,
    ISharedObjectEvents
} from "@fluidframework/shared-object-base";
import { Serializable } from "@fluidframework/datastore-definitions";

/**
 * Base interface for common ledger actions.
 */
interface ILedgerActions<T = any> {
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

/**
 * Ledger events.
 */
export interface ILedgerEvents<T> extends ISharedObjectEvents {
    /**
     * "append" event fires when a value is appended to the ledger.
     */
    (event: "append", listener: (value: Serializable<T>) => void): void;
}

/**
 * Ledger interface.
 */
export interface ILedger<T = any>
    extends ILedgerActions<T>,
        ISharedObject<ILedgerEvents<T>> {}

/**
 * Clearable ledger events
 */
export interface IClearableLedgerEvents<T> extends ILedgerEvents<T> {
    /**
     * "clear" event fires on clear and hands off a copy of the ledger to
     * subscribers.
     */
    (event: "clear", listener: (values: Serializable<T>[]) => void): void;
}

/**
 * Clearable ledger interface.
 */
export interface IClearableLedger<T = any>
    extends ILedgerActions<T>,
        ISharedObject<IClearableLedgerEvents<T>> {
    /**
     * Clears the ledger.
     */
    clear(): void;
}

/**
 * A function that processes the values in the ledger and returns an updated
 * version.
 */
export type LedgerCompactor<T> = (values: T[]) => T[];
