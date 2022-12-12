# Demo app - llama coloring

This app demonstrates the use of the Fluid `Ledger` DDS with a collaborative
coloring app. Call `npm run start` to launch a local Azure Fluid Relay
service and start a client.

Once the first client connects, the address bar should update with a UUID for
the container. Copy paste that into another browser window to get another
client to connect.

Clients can select colors and color parts of the picture. Changes made by one
client are immediately reflected in all other clients.

The demo also includes an *Op list* view, showing the messages exchanges
between clients (through the `Ledger` DDS).

## Details

`src/container.ts` provides a `getLedger()` function and wraps the logic for
creating or loading a Fluid container with a `Ledger`. The demo uses the local
Azure service. More details on connecting to an Azure Fluid Relay service can
be found [here](https://learn.microsoft.com/en-us/azure/azure-fluid-relay/how-tos/connect-fluid-azure-service).
If the window location (address) does not contain a UUID, a new container is
created and the address is updated to include its UUID. If the window location
already includes a UUID, the client connects and loads an existing container.

*This file shows how to declare a Fluid container which includes a Ledger, how
to create/load a container, and access the data structure.*

---

`src/opList.tsx` is a React component that provides a view into the ledger. It
displays all contained `ColorOperation` objects in a text area. The component
takes a `Ledger<ColorOperation>` as a prop, it logs all existing ledger
objects (as returned by `get()`), and subscribes to the `append` and `clear`
events. It also logs all future incoming operations. The op list is cleared on
`clear`.

*This is a simple example of consuming a `Ledger` DDS.*

---

`src/colorOperation.ts` describes a coloring operation for the demo app, which
consists of `x` and `y` coordinates, and a `color` value. The demo uses a
list of `ColorOperation` objects (`Ledger<ColorOperation>`).

`src/coloringHelper.ts` implements the flood fill algorithm for an HTML canvas.

`src/colorPalette.tsx` is a React component that renders the colors the user can
pick for coloring.

*These files are implementation-specific and less interesting from an
educational perspective.*

---

`src/coloringCanvas.tsx` is a React component representing the coloring canvas.
It loads the llama image and takes a `Ledger<ColorOperation>` as a prop. It
maintains a `colorOperations` state which is kept in sync with the ledger.
Whenever an `append` fires, the state is updated and the canvas is repainted.
Whenever a `clear` firest, the canvas is repainted (to initial state).

*This is a more complex example of using a `Ledger` DDS in a collaborative
scenario, powered by a React component.*

---

`public/llama.png` - 🦙

*This is a llama.*
