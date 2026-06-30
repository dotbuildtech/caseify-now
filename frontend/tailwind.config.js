/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: 'var(--color-primary)',
                'primary-light': 'var(--color-primary-light)',
                'primary-dark': 'var(--color-primary-dark)',
                secondary: 'var(--color-secondary)',
                accent: 'var(--color-accent)',
                background: 'var(--color-background)',
                'background-light': 'var(--color-background-light)',
                surface: 'var(--color-surface)',
                text: 'var(--color-text)',
                'text-light': 'var(--color-text-light)',
                border: 'var(--color-border)',
                ink: 'var(--color-ink)',
                cream: 'var(--color-cream)',
                bronze: 'var(--color-bronze)',
                success: '#6E8E59',
                error: '#B8472A'
            },
            fontFamily: {
                sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
                display: ['var(--font-display)', 'Georgia', 'serif'],
                mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
                elegant: ['var(--font-elegant)', 'Palatino', 'serif'],
                modern: ['var(--font-modern)', 'Helvetica', 'sans-serif'],
                gothic: ['var(--font-gothic)', 'Century Gothic', 'sans-serif']
            },
            letterSpacing: {
                'editorial': '-0.04em'
            },
            animation: {
                marquee: 'marquee 30s linear infinite',
                'marquee-fast': 'marquee 18s linear infinite',
                float: 'floatY 6s ease-in-out infinite'
            },
            keyframes: {
                marquee: {
                    '0%': { transform: 'translate(0)' },
                    '100%': { transform: 'translate(-50%)' }
                },
                floatY: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-8px)' }
                }
            }
        }
    },
    plugins: []
};
