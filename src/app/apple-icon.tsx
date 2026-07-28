import { ImageResponse } from "next/og";

/** Apple touch icon 180×180 — mark tas hijau KantinKu */
export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f97316",
          borderRadius: 40,
        }}
      >
        <svg
          width="110"
          height="110"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6.5 8.5h11l.9 11.2a1.5 1.5 0 01-1.5 1.6H7.1a1.5 1.5 0 01-1.5-1.6L6.5 8.5z"
            stroke="#1c1917"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M9 8.5V7a3 3 0 016 0v1.5"
            stroke="#1c1917"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
