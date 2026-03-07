import './globals.css'

export const metadata = {
  title: 'LaunchPard — Where Education Becomes Adventure',
  description: 'AI-powered learning for exam preparation. Adaptive learning, instant feedback, and space-themed missions.',
  icons: {
    // Custom SVG recreated from the uploaded design, safely URL-encoded for the favicon
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><path d="M55 20A32 32 0 1 0 75 75" stroke="url(%23s)" stroke-width="12" stroke-linecap="round"/><circle cx="18" cy="45" r="2.5" fill="%2300f2fe"/><circle cx="50" cy="85" r="2" fill="%234facfe"/><path d="M70 55Q75 55 75 50Q75 55 80 55Q75 55 75 60Q75 55 70 55Z" fill="%2300f2fe"/><path d="M80 65Q83 65 83 62Q83 65 86 65Q83 65 83 68Q83 65 80 65Z" fill="%234facfe"/><g transform="rotate(45 50 50) translate(0 -5)"><path d="M35 60L25 75L45 65Z" fill="%23e11d48"/><path d="M65 60L75 75L55 65Z" fill="%23e11d48"/><path d="M42 68L50 85L58 68Z" fill="%23fef08a"/><path d="M45 68L50 80L55 68Z" fill="%23f97316"/><path d="M50 15C65 30 65 60 50 70C35 60 35 30 50 15Z" fill="%231e1b4b" stroke="%230f172a" stroke-width="4" stroke-linejoin="round"/><circle cx="50" cy="40" r="6" fill="%230f172a"/></g><defs><linearGradient id="s" x1="0%25" y1="100%25" x2="0%25" y2="0%25"><stop offset="0%25" stop-color="%230ea5e9"/><stop offset="100%25" stop-color="%233b82f6"/></linearGradient></defs></svg>',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}