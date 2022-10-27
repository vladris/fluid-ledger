# Fluid Ledger DDS

`Ledger` is a simple append-only list distributed data structure (DDS) for
[Fluid Framework](https://fluidframework.com).

Clients submit appends to the DDS but the underlying list gets update only
after the op has been sequenced by the service. This ensures all clients end up
with the same ordering of objects in the list.

The DDS provides an `append` event which fires whenever a new item is appended
to the list. Listeners can use this to react to changes.

The DDS provides a `get()` method which returns an iterable iterator over the
underlying list and an `append()` method which submits a new item to be
appended to the list. Client shouldn't assume the data is immediately appended,
rather wait for the `append` event (other appends incoming from other clients
might be interleaved).

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

for (const value of ledger.get()) {
  // Iterate over existing values
}
```
