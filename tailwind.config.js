/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './apps/game-client/**/*.{ts,tsx,html}',
    './tools/**/*.{ts,tsx,html}',
    './packages/**/*.{ts,tsx,html}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
