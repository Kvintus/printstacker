import { ImageResponse } from "next/og";

export const alt = "Print Stacker — stack an STL into a 3MF";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          color: "#fafafa",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                width: 72,
                height: 14,
                borderRadius: 7,
                background: "#fafafa",
              }}
            />
            <div
              style={{
                width: 72,
                height: 14,
                borderRadius: 7,
                background: "#f5a524",
              }}
            />
            <div
              style={{
                width: 72,
                height: 14,
                borderRadius: 7,
                background: "#a1a1a1",
              }}
            />
          </div>
          <div style={{ fontSize: 32, letterSpacing: -0.5 }}>Print Stacker</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 68,
              lineHeight: 1.02,
              letterSpacing: -2,
              maxWidth: 980,
            }}
          >
            Stack an STL into a 3MF
          </div>
          <div style={{ fontSize: 30, color: "#a1a1aa" }}>
            Vertical copies for Bambu Studio, packed in the browser.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
