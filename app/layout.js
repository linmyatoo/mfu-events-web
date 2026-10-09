import '../styles/variables.css';
import '../styles/globals.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/responsive.css';

import Script from 'next/script';

import BrandBadge from '../components/layout/BrandBadge';
import { inter } from '../lib/fonts';

export const metadata = {
  title: 'MFU-Events',
  description: 'Discover, book and attend university events.',
};

/**
 * Root layout holds the document and the stylesheets only.
 * The signed-in chrome (header, sidebar, mobile nav) lives in the `(app)`
 * route group so that /login can render without it.
 */
// Runs before paint so the page never flashes the wrong theme: reads the
// persisted choice (falling back to the OS preference) and stamps
// data-theme on <html> before React hydrates. Kept inline (not a module)
// since it must execute synchronously, pre-hydration.
const THEME_BOOT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Script id="theme-boot" strategy="beforeInteractive">
          {THEME_BOOT_SCRIPT}
        </Script>
        {children}
        <BrandBadge />
      </body>
    </html>
  );
}
