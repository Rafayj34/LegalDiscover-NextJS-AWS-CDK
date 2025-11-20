/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				'primary-blue': '#1D4ED8',
				'accent': '#2563EB',
				"light-gray": "#f3f4f6",
				'medium-gray': '#6b7280',
				'cool-gray': '#6b7280',
			},
			fontFamily: {
				sans: [
					'Inter',
					'sans-serif'
				]
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}