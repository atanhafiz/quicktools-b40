/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1e90ff", // biru utama
          dark: "#176dbe",    // hover / dark state
          light: "#e6f2ff",   // background lembut
        },
      },
    },
  },
  plugins: [],
};
