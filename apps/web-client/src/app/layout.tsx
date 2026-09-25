import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tetris RL Web Client',
  description: 'Tetris Web Client with User and AI Mode integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0f172a' }}>
        {children}
      </body>
    </html>
  );
}
