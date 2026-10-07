import { Inter, Space_Grotesk } from 'next/font/google';

/** Body font — Bold Campus Energy direction. */
export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

/** Display/heading font — Bold Campus Energy direction. */
export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});
