import "./globals.css";

export const metadata = {
  title: "NSR Console — Backup Service Simulator",
  description: "Simulate NSR backup service failures and restarts across Windows and AIX servers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
