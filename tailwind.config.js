/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
    safelist: [
      'active:scale-[0.98]',
      'active:bg-muted',
      'card-item',
      'from-purple-500', 'to-purple-700',
      'from-blue-500', 'to-blue-700',
      'from-amber-500', 'to-amber-700',
      'from-rose-500', 'to-rose-700',
      'bg-purple-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500',
      'bg-green-100', 'text-green-700',
      'bg-amber-100', 'text-amber-700',
      'bg-red-100', 'text-red-700',
      'bg-purple-100', 'text-purple-700', 'border-purple-200', 'border-l-purple-400', 'bg-purple-50/60',
      'bg-blue-100', 'text-blue-700', 'border-blue-200', 'border-l-blue-400', 'bg-blue-50/60',
      'bg-emerald-100', 'text-emerald-700', 'border-emerald-200', 'border-l-emerald-400', 'bg-emerald-50/60',
      'border-l-amber-400', 'bg-amber-50/60', 'border-amber-200',
      'bg-rose-100', 'text-rose-700', 'border-rose-200', 'border-l-rose-400', 'bg-rose-50/60',
      'bg-cyan-100', 'text-cyan-700', 'border-cyan-200', 'border-l-cyan-400', 'bg-cyan-50/60',
      'bg-indigo-100', 'text-indigo-700', 'border-indigo-200', 'border-l-indigo-400', 'bg-indigo-50/60',
      'bg-orange-100', 'text-orange-700', 'border-orange-200', 'border-l-orange-400', 'bg-orange-50/60',
    ],
  theme: {
  	extend: {
  		fontFamily: {
  			inter: ['var(--font-inter)']
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
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
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}