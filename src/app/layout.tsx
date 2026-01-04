import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cursor Discord Bot',
  description: 'Manage Cursor Cloud Agents from Discord',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

