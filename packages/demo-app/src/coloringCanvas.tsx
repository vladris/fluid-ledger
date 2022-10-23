import { Ledger } from "@fluid-ledger/dds";
import { useCallback, useEffect, useRef, useState } from "react";
import { ColoringHelper } from "./coloringHelper";
import { ColorOperation } from "./colorOperation";

type ColoringCanvasProps = {
    image: string;
    ledger: Ledger<ColorOperation>;
    currentColor: number;
};

export function ColoringCanvas(props: ColoringCanvasProps) {
    const { image, ledger, currentColor } = props;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const coloringHelper = useRef<ColoringHelper | null>(null);

    const [colorOperations, setColorOperations] = useState(Array.from(ledger.get()));

    // Color llama
    const applyColors = useCallback(() => {
        const helper = coloringHelper.current; 

        if (helper) {
            for (const op of colorOperations) {
                helper.floodFill(op.x, op.y, op.color);
            }
        }
    }, [colorOperations]);

    // Loads image to be colored and initializes coloring helper
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        const img = new Image();
        img.onload = () => { 
            ctx.drawImage(img, 0, 0, 651, 800);
            
            // Apply existing colors once image is loaded
            applyColors();
        }
        img.src = image;

        coloringHelper.current = new ColoringHelper(ctx);
    }, [applyColors, image]);

    // Update list of colors on each append
    useEffect(() => {
        ledger.on("append", (op) => {
            setColorOperations(Array.from(ledger.get()));
        });
        setColorOperations(Array.from(ledger.get()));
    }, [ledger]);

    applyColors();

    return (<canvas height="800px" width="651px" ref={canvasRef}
        onClick={(e) => {
            // Submit new color operation
            ledger.append({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, color: currentColor });
        }}>
    </canvas>);
}