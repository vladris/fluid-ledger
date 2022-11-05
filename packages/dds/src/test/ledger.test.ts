import { ILedger } from "../interfaces";
import { Ledger } from "../ledger";
import { LedgerFactory } from "../ledgerFactory";
import {
    MockContainerRuntimeFactory,
    MockContainerRuntimeFactoryForReconnection,
    MockContainerRuntimeForReconnection,
    MockFluidDataStoreRuntime,
    MockSharedObjectServices,
    MockStorage
} from "@fluidframework/test-runtime-utils";

function createLocalLedger() {
    return new Ledger(
        "ledger",
        new MockFluidDataStoreRuntime(),
        new LedgerFactory(Ledger).attributes
    );
}

function createConnectedLedger(
    id: string,
    runtimeFactory: MockContainerRuntimeFactory
) {
    const dataStoreRuntime = new MockFluidDataStoreRuntime();
    const containerRuntime =
        runtimeFactory.createContainerRuntime(dataStoreRuntime);

    const ledger = new Ledger(
        id,
        dataStoreRuntime,
        new LedgerFactory(Ledger).attributes
    );
    ledger.connect({
        deltaConnection: containerRuntime.createDeltaConnection(),
        objectStorage: new MockStorage()
    });
    return ledger;
}

function createLedgerForReconnection(
    id: string,
    runtimeFactory: MockContainerRuntimeFactoryForReconnection
): [ILedger, MockContainerRuntimeForReconnection] {
    const dataStoreRuntime = new MockFluidDataStoreRuntime();
    const containerRuntime =
        runtimeFactory.createContainerRuntime(dataStoreRuntime);

    const ledger = new Ledger(
        id,
        dataStoreRuntime,
        new LedgerFactory(Ledger).attributes
    );
    ledger.connect({
        deltaConnection: containerRuntime.createDeltaConnection(),
        objectStorage: new MockStorage()
    });
    return [ledger, containerRuntime];
}

describe("Ledger", () => {
    describe("Local state", () => {
        let ledger: ILedger;

        beforeEach(() => {
            ledger = createLocalLedger();
        });

        it("Can create ledger", () => {
            expect(ledger).not.toBeNull();
        });

        it("Can append value", () => {
            ledger.append("item");

            expect(Array.from(ledger.get())).toStrictEqual(["item"]);
        });

        it("Can append multiple values", () => {
            ledger.append("item1");
            ledger.append("item2");

            expect(Array.from(ledger.get())).toStrictEqual(["item1", "item2"]);
        });

        it("Can load from snapshot", async () => {
            ledger.append("item1");
            ledger.append("item2");

            const services = MockSharedObjectServices.createFromSummary(
                ledger.getAttachSummary().summary
            );

            const loadedLedger = new Ledger(
                "loadedLedger",
                new MockFluidDataStoreRuntime(),
                new LedgerFactory(Ledger).attributes
            );
            await loadedLedger.load(services);

            expect(Array.from(loadedLedger.get())).toStrictEqual([
                "item1",
                "item2"
            ]);
        });

        it("Append fires immediately", () => {
            let called = false;
            ledger.on("append", () => {
                called = true;
            });

            ledger.append("item");

            expect(called).toBe(true);
        });
    });

    describe("Connected state", () => {
        let ledger1: ILedger;
        let ledger2: ILedger;

        let containerRuntimeFactory: MockContainerRuntimeFactory;

        beforeEach(() => {
            containerRuntimeFactory = new MockContainerRuntimeFactory();
            ledger1 = createConnectedLedger("ledger1", containerRuntimeFactory);
            ledger2 = createConnectedLedger("ledger2", containerRuntimeFactory);
        });

        it("Can append value", () => {
            // Client 1 appends
            ledger1.append("value1");

            containerRuntimeFactory.processAllMessages();

            expect(Array.from(ledger1.get())).toStrictEqual(["value1"]);
            expect(Array.from(ledger2.get())).toStrictEqual(["value1"]);

            // Client 2 appends
            ledger2.append("value2");

            containerRuntimeFactory.processAllMessages();

            expect(Array.from(ledger1.get())).toStrictEqual([
                "value1",
                "value2"
            ]);
            expect(Array.from(ledger2.get())).toStrictEqual([
                "value1",
                "value2"
            ]);
        });

        it("Append fires after sequencing", () => {
            let called1 = false;
            let called2 = false;

            ledger1.on("append", () => {
                called1 = true;
            });
            ledger2.on("append", () => {
                called2 = true;
            });

            ledger1.append("value");

            expect(called1).toBe(false);
            expect(called2).toBe(false);

            containerRuntimeFactory.processAllMessages();

            expect(called1).toBe(true);
            expect(called2).toBe(true);
        });
    });

    describe("Reconnection", () => {
        let containerRuntimeFactory: MockContainerRuntimeFactoryForReconnection;
        let ledger1: ILedger;
        let containerRuntime1: MockContainerRuntimeForReconnection;
        let ledger2: ILedger;
        let containerRuntime2: MockContainerRuntimeForReconnection;

        beforeEach(() => {
            containerRuntimeFactory =
                new MockContainerRuntimeFactoryForReconnection();

            [ledger1, containerRuntime1] = createLedgerForReconnection(
                "ledger1",
                containerRuntimeFactory
            );
            [ledger2, containerRuntime2] = createLedgerForReconnection(
                "ledger2",
                containerRuntimeFactory
            );
        });

        it("Can resend unacked op on reconnection", async () => {
            ledger1.append("value1");

            // Disconnect then reconnect client
            containerRuntime1.connected = false;
            containerRuntime1.connected = true;

            containerRuntimeFactory.processAllMessages();

            expect(Array.from(ledger1.get())).toStrictEqual(["value1"]);
            expect(Array.from(ledger2.get())).toStrictEqual(["value1"]);
        });

        it("Can store op in disconnected state and resend on reconnection", () => {
            containerRuntime1.connected = false;

            ledger1.append("value");

            containerRuntime1.connected = true;

            containerRuntimeFactory.processAllMessages();

            expect(Array.from(ledger1.get())).toStrictEqual(["value"]);
            expect(Array.from(ledger2.get())).toStrictEqual(["value"]);
        });

        it("Append fires after sequencing", () => {
            let called = false;
            ledger1.on("append", () => {
                called = true;
            });

            containerRuntime1.connected = false;

            // Append while disconnected
            ledger1.append("value");

            containerRuntimeFactory.processAllMessages();

            // Append should not have fired
            expect(called).toBe(false);

            // Reconnect
            containerRuntime1.connected = true;

            containerRuntimeFactory.processAllMessages();

            // Append should have fired after connecting
            expect(called).toBe(true);
        });
    });
});
