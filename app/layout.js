import AppShell from '../components/layout/AppShell';
import { mockPoints, mockUser } from '../data/mockData';

import '../styles/variables.css';
import '../styles/globals.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/responsive.css';

export const metadata = {
  title: 'TripNest',
  description: 'Discover, book and attend university events.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell user={mockUser} pointsBalance={mockPoints.balance}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
