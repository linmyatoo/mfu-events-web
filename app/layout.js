import '../styles/variables.css';
import '../styles/globals.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/responsive.css';

import BrandBadge from '../components/layout/BrandBadge';
import { inter, spaceGrotesk } from '../lib/fonts';

export const metadata = {
  title: 'MFU-Events',
  description: 'Discover, book and attend university events.',
};

/**
 * Root layout holds the document and the stylesheets only.
 * The signed-in chrome (header, sidebar, mobile nav) lives in the `(app)`
 * route group so that /login can render without it.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>
        {children}
        <BrandBadge />
      </body>
    </html>
  );
}
