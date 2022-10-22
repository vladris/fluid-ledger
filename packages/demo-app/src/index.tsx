import React from "react";
import ReactDOM from "react-dom";
import { FluidClient } from "./container";
import { Ledger } from "@fluid-ledger/dds"

async function setup() {
    const fc = new FluidClient();

    await fc.initialize();

    fc.getLedger().on("append", (value) => {
        console.log(value);
    });

    return fc.getLedger();
};

let ledger: Ledger | undefined;

ReactDOM.render(
    <React.StrictMode>
        <span>Hello!</span>
        <form><input id="inp"></input></form>
        <button onClick={async () => ledger = await setup()}>Init</button>
        <button onClick={() => ledger!.append((document.getElementById("inp") as HTMLInputElement).value)}>Append</button>
        <button onClick={() => {
            console.clear();
            for (const item of ledger!.get()) {
                console.log(item);
            }
        }}>Iterate</button>
    </React.StrictMode>, 

    document.getElementById("root")
);