/** @type {import('tailwindcss').Config} */
export default {
	// ESTA LÍNEA ES LA CLAVE 👇
	// El asterisco ** significa "cualquier carpeta" y *.astro significa "cualquier archivo Astro"
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],

	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
				heading: ['Montserrat', 'sans-serif'],
			},
			colors: {
				primary: '#e67e22',   // Naranja
				secondary: '#2c3e50', // Azul Oscuro
				accent: '#1d9bf0',    // Azul Verificado
			},
		},
	},
	plugins: [],
}