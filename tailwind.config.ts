import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: "#F7F1E8",
        card: "#FFFDFA",
        cream: "#FBF4EB",
        cream2: "#F4EDE3",
        ink: "#3D332C",
        ink2: "#5C5149",
        muted: "#8F8177",
        muted2: "#A2968B",
        faint: "#BCB0A4",
        line: "#E6DCD0",
        line2: "#D8CCBE",
        accent: "#C98B84",
        accentHover: "#B57169",
        sage: "#7C9A73",
        sageInk: "#3D5A37",
        mustard: "#D9A441",
        mustardInk: "#7A5410",
        terra: "#C4685C",
        terraInk: "#8A3A31",
        stone: "#B3A99F",
        stoneInk: "#615850",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-work-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        zoiaIn: { from: { opacity: "0", transform: "translateY(-8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        zoiaSheet: { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        zoiaPulse: { "0%,100%": { opacity: "1" }, "50%": { opacity: ".5" } },
      },
      animation: {
        "zoia-in": "zoiaIn .22s ease",
        "zoia-sheet": "zoiaSheet .22s ease",
        "zoia-pulse": "zoiaPulse 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
