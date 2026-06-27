/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // This app is touch-first (kiosk display, mobile drawer): a plain `:hover`
    // gets stuck "on" after a tap until the user taps elsewhere. Gate every
    // hover/group-hover utility behind real hover capability instead.
    function ({ addVariant }) {
      addVariant("hover", "@media (hover: hover) and (pointer: fine) { &:hover }");
      addVariant("group-hover", "@media (hover: hover) and (pointer: fine) { :merge(.group):hover & }");
    },
  ],
}