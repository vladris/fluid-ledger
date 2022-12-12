# Fluid Ledger

![CI status](https://github.com/vladris/fluid-ledger/actions/workflows/ci.yml/badge.svg)

`Ledger` is a simple append-only list distributed data structure (DDS) for
[Fluid Framework](https://fluidframework.com). See the [dds package
README](./packages/dds/README.md) for details.

## Getting started

Install:

`npm install fluid-ledger-dds`

Set up and use a `Ledger`:

```typescript
import { Ledger } from "fluid-ledger-dds";

let ledger: Ledger<number> = ...

ledger.on("append", (value) => {
  console.log(`New value appended to ledger: ${value}`);
});

ledger.on("clear", (values) => {
  console.log(`Ledger was cleared. It contained: ${values}`);
});

// Append a value to the ledger
ledger.append(42);

for (const value of ledger.get()) {
  // Iterate over existing values
}

// Clear ledger
ledger.clear();
```

## Demo app

A demo app (`/packages/demo-app`) shows how `Ledger` can be used with the Fluid
local Azure client. See the [demo-app README](./packages/demo-app/README.md)
for more details.
