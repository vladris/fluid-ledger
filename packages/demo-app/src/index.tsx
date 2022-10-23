import { Ledger } from "@fluid-ledger/dds";
import { useState } from "react";
import ReactDOM from "react-dom/client";
import { ColoringCanvas } from "./coloringCanvas";
import { ColorOperation } from "./colorOperation";
import { ColorPalette } from "./colorPalette";
import { getLedger } from "./container";
import { OpList } from "./opList";

type ColoringProps = { ledger: Ledger<ColorOperation> }

function Coloring(props: ColoringProps) {
    const { ledger } = props;
    const [currentColor, setCurrentColor] = useState(0xffffff);

    return (<div style={{ display: "flex" }}>
        <div>
            <ColorPalette onColorChange={(color) => setCurrentColor(color)}></ColorPalette>
            <ColoringCanvas image="./llama.png" ledger={ledger} currentColor={currentColor}></ColoringCanvas>
        </div>
        <div>
            <OpList ledger={ledger}></OpList>
        </div>
    </div>)
}

getLedger().then((ledger) => {
    const root = ReactDOM.createRoot(document.getElementById("root")!);
    
    root.render(
        <Coloring ledger={ledger}></Coloring>
    );
});
