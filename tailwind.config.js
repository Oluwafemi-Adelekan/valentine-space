/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                serif: ['"Playfair Display"', 'serif'],
                sans: ['Inter', 'sans-serif'],
                unifraktur: ['"UnifrakturCook"', 'cursive'],
            },
            animation: {
                'scroll': 'scroll 1.5s cubic-bezier(0.15, 0.41, 0.69, 0.94) infinite',
            },
        },
    },
    plugins: [],
}
