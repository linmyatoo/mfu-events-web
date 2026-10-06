import '../styles/variables.css';
import '../styles/globals.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/responsive.css';

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
