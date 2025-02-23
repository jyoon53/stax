// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#C0392B", // Primary red (action buttons, CTA)
        accent: "#E8433F", // Brighter variant for hover
        softPink: "#F8DADA", // Soft pink for panels/backgrounds
        lightGray: "#F2F2F2", // Light gray for sidebar/hover
        darkGray: "#333333", // Dark gray for primary text
      },
      fontFamily: {
        serif: ["Merriweather", "Georgia", "serif"],
        sans: ["Open Sans", "Lato", "sans-serif"],
      },
    },
  },
  plugins: [],
};
