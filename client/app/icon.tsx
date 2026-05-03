import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";

export const size = {
    width: 512,
    height: 512,
};

export const contentType = "image/png";

export default function Icon() {
    const imagePath = path.join(process.cwd(), "public", "assets", "iict_darkmode.png");
    const imageData = fs.readFileSync(imagePath);
    const imageBase64 = imageData.toString("base64");

    return new ImageResponse(
        <img
            src={`data:image/png;base64,${imageBase64}`}
            alt="IICT"
            style={{ width: "100%", height: "100%" }}
        />,
        {
            ...size,
        },
    );
}
