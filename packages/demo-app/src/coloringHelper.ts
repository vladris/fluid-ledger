export class ColoringHelper {
    constructor(private ctx: CanvasRenderingContext2D) {}

    // Flood fill canvas area starting with x, y coordinates & color
    floodFill(x: number, y: number, color: number) {
        const data = this.ctx.getImageData(
            0,
            0,
            this.ctx.canvas.width,
            this.ctx.canvas.height
        );

        let stack: number[][] = [[x, y, color]];

        while (stack.length > 0) {
            const pt = stack.shift();

            // Stop at canvas bounds
            if (pt![0] < 0 || pt![0] >= this.ctx.canvas.width) {
                continue;
            }
            if (pt![1] < 0 || pt![1] >= this.ctx.canvas.height) {
                continue;
            }

            // Get pixel at coordinates
            const px = this.getPixel(
                data.data,
                pt![0],
                pt![1],
                this.ctx.canvas.width
            );

            // Stop if black or same as fill color
            if (px === 0 || px === color) {
                continue;
            }

            // Color pixel
            this.setPixel(
                data.data,
                pt![0],
                pt![1],
                this.ctx.canvas.width,
                color
            );

            // Process adjacent pixels
            stack.push([pt![0] - 1, pt![1]]);
            stack.push([pt![0] + 1, pt![1]]);
            stack.push([pt![0], pt![1] - 1]);
            stack.push([pt![0], pt![1] + 1]);
        }

        // Update canvas context
        this.ctx.putImageData(data, 0, 0);
    }

    // A pixel is represented as 4 Uint8 values (red, green, blue, alpha). We
    // ignore alpha. We get/set the pixel by determining its offset in the
    // image data array.

    // Gets pixel color value
    private getPixel(
        data: Uint8ClampedArray,
        x: number,
        y: number,
        width: number
    ) {
        const offset = (x + y * width) * 4;
        return (
            data[offset] * 0x10000 + data[offset + 1] * 0x100 + data[offset + 2]
        );
    }

    // Sets pixel color value
    private setPixel(
        data: Uint8ClampedArray,
        x: number,
        y: number,
        width: number,
        color: number
    ) {
        const offset = (x + y * width) * 4;
        data[offset] = (color & 0xff0000) >> 16;
        data[offset + 1] = (color & 0x00ff00) >> 8;
        data[offset + 2] = color & 0x0000ff;
    }
}
