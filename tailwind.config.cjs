const plugin = require('tailwindcss/plugin');

module.exports = {
    content: [
        './src/pages/**/*.{astro,js,jsx,ts,tsx}',
        './src/components/**/*.{astro,js,jsx,ts,tsx}',
        './src/layouts/**/*.{astro,js,jsx,ts,tsx}',
        './src/content.config.ts'
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                serif: ['Playfair Display', 'Georgia', 'serif']
            },
            colors: {
                'vox-yellow': '#FAFF00',
                'dark-bg': '#121212'
            }
        }
    },
    plugins: [
        require('@tailwindcss/aspect-ratio'),
        plugin(function({ addBase }) {
            addBase({
                '::selection': {
                    backgroundColor: '#FAFF00',
                    color: '#000',
                },
                '::-moz-selection': {
                    backgroundColor: '#FAFF00',
                    color: '#000',
                },
            })
        })
    ]
};
