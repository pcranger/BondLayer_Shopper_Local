import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BondLayer Shopper",
  description:
    "A local shopper-facing experience for comparing retailer prices, loyalty benefits, and private member offers.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
