import { useState } from "react";

type ColorPaletteProps = {
    onColorChange(color: number): void;
};

export function ColorPalette(props: ColorPaletteProps) {
    const { onColorChange } = props;

    const colors = [0xffffff, 0xd2b48c, 0xffff00, 0xffa500, 0xff0000,
        0xffc0cb, 0x00ff00, 0x006400, 0x40e0d0, 0x0000ff, 0x000080,
        0x800080, 0x800000];
    
    const [currentColor, setCurrentColor] = useState(colors[0]);

    const toCSSColor = (color: number) => {
        return "#" + color.toString(16).padStart(6, "0");
    }

    return (<div>
        <div>
        {colors.map((color) => {
            return <button 
                style={{ backgroundColor: toCSSColor(color), height: 50, width: 50 }}
                key={color}
                onClick={() => {
                    setCurrentColor(color);
                    onColorChange(color);
                }}></button>
        })}
        </div>
        <p>Current color: <span style={{ 
            backgroundColor: toCSSColor(currentColor),
            border: "1px solid black",
            display: "inline-block",
            width: 50 }}>&nbsp;</span>
        </p>
    </div>);
}
