/** @type {import('tailwindcss').Config} */
export default {
	// ESTA LÍNEA ES LA CLAVE 👇
	// El asterisco ** significa "cualquier carpeta" y *.astro significa "cualquier archivo Astro"
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],

	theme: {
		extend: {
			fontFamily: {
				sans: ['Work Sans', 'Inter', 'sans-serif'],
				display: ['Work Sans', 'sans-serif'],
			},
			colors: {
				"primary": "#BF4F26",         // El Naranja Quemado
				"primary-hover": "#A34320",   // Versión más oscura para hover
				"deep-black": "#1A1A1A",      // Negro profundo para textos y footer
				"background-light": "#FFFFFF",
				"background-alt": "#F9F9F9",  // Gris muy clarito para secciones alternas
				"muted-gray": "#6B7280",      // Gris para textos secundarios
			},
			/*colors: {
				"primary": "#CC5500", // Burnt Orange
				"primary-dark": "#A34400", // Darker Burnt Orange
				"background-light": "#ffffff",
				"background-dark": "#121212",
				"secondary-gray": "#F4F4F5",
				"text-main": "#000000",
				"verified-dark": "#0A0A0A",
				"primary-light": "#E06E1A",
				"accent": "#CC5500",
				"neutral-black": "#0F0F0F",
				"neutral-gray-dark": "#4B5563",
				"neutral-gray": "#9CA3AF",
				"neutral-gray-light": "#F3F4F6",

				// Keeping existing just in case, mapped to new or similar
				secondary: '#2c3e50',
			}*/
			borderRadius: {
				"DEFAULT": "0.375rem",
				"lg": "0.5rem",
				"xl": "1rem",
				"2xl": "1.5rem",
				"3xl": "2rem",
				"full": "9999px"
			},
		},
	},
	plugins: [],
}