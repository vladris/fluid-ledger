import TinyliciousClient from '@fluidframework/tinylicious-client';
import { IFluidContainer } from 'fluid-framework';
import { Ledger } from './Ledger/ledger';

export class FluidClient {
    private myLedger: Ledger | undefined;

    async initialize() {
        const client = new TinyliciousClient();
        const containerSchema = {
            initialObjects: { myLedger: Ledger }
        };

        let container: IFluidContainer;
        const containerId = window.location.hash.substring(1);
        if (!containerId) {
            ({ container } = await client.createContainer(containerSchema));
            const id = await container.attach();
            window.location.hash = id;
        } else {
            ({ container } = await client.getContainer(containerId, containerSchema));
        }

        this.myLedger = container.initialObjects.myLedger as Ledger;
    }

    getLedger() {
        if (!this.myLedger) {
            throw Error('initialize() was not called');
        }

        return this.myLedger;
    }
}
  