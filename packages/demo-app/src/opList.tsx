import { Ledger } from "fluid-ledger-dds";
import { useEffect, useRef } from "react";
import { ColorOperation } from "./colorOperation";

type OpListProps = {
    ledger: Ledger<ColorOperation>;
};

// Displays a log of all color operations
export function OpList(props: OpListProps) {
    const { ledger } = props;
    const textArea = useRef<HTMLTextAreaElement>(null);

    // Appends op to text area
    const logOp = (op: ColorOperation) => {
        if (!textArea.current) {
            return;
        }

        textArea.current.value += `x: ${op.x}, y: ${op.y}, color: #${op.color.toString(16).padStart(6, "0")}\n`;
    }

    useEffect(() => {
        if (textArea.current) {
            textArea.current.value = "";
        }

        // Log all color operations
        for (const op of ledger.get()) {
            logOp(op);
        }

        // Log future color operations
        ledger.on("append", logOp);
    }, [ledger]);

    return (<div style={{ padding: 50 }}>
        <p>Op list</p>
        <textarea readOnly={true} ref={textArea} style={{ height: 500, width: 400 }}></textarea>
    </div>);
}