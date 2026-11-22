import { ImageResponse } from "next/og";

export const alt =
  "Tokenscope — monthly LLM prompt cost at 5,000 requests per day";
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
          justifyContent: "center",
          padding: "72px 80px",
          backgroundColor: "#0a1226",
          backgroundImage:
            "radial-gradient(900px 600px at 12% 0%, rgba(40, 70, 130, 0.45), transparent)",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <h1
          style={{
            margin: 0,
            marginBottom: 28,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "#d7e0ea",
          }}
        >
          Tokenscope
        </h1>
        <p
          style={{
            margin: 0,
            marginBottom: 20,
            fontSize: 96,
            fontWeight: 600,
            letterSpacing: "-0.04em",
            color: "#f3f7fb",
            lineHeight: 1.05,
          }}
        >
          ₹67,276/mo
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 400,
            lineHeight: 1.35,
            color: "#8c9bb2",
            maxWidth: 820,
          }}
        >
          What one support-bot prompt costs at 5,000 requests a day.
        </p>
      </div>
    ),
    { ...size },
  );
}