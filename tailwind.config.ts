import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			// Clinical Design System
  			clinical: {
  				bg: '#F7F9FB',
  				card: '#FFFFFF',
  				border: '#DDE5EE',
  				primary: '#0D8F9C',
  				secondary: '#0BBCD4',
  				text: {
  					primary: '#1E2D3D',
  					secondary: '#94A3B8',
  				},
  				accent: {
  					teal: '#E0F4F6',
  					green: '#DCFCE7',
  				},
  				message: {
  					ai: '#F7F9FB',
  					user: '#0B2545',
  				},
  			},
  			navy: '#0B2545',
  			teal: {
  				DEFAULT: '#0D8F9C',
  				light: '#E0F4F6',
  				bright: '#0BBCD4',
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: ['var(--font-dm-sans)', 'DM Sans', 'system-ui', 'sans-serif'],
  			display: ['Instrument Serif', 'Georgia', 'serif'],
  		},
  		lineHeight: {
  			'relaxed': '1.6',
  			'comfortable': '1.7',
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		padding: {
  			'safe-b': 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
  			'safe-t': 'env(safe-area-inset-top, 0px)',
  			'safe-l': 'env(safe-area-inset-left, 0px)',
  			'safe-r': 'env(safe-area-inset-right, 0px)',
  		},
  		margin: {
  			'safe-b': 'env(safe-area-inset-bottom, 0px)',
  			'safe-t': 'env(safe-area-inset-top, 0px)',
  		},
  		height: {
  			'screen-dynamic': '100dvh',
  		},
  		minHeight: {
  			'screen-dynamic': '100dvh',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
