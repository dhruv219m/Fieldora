import type { Metadata } from "next";
import "./globals.css";
import "./redesign.css";

export const metadata: Metadata = {
  title: "Fieldora — Your farm. More possibilities.",
  description: "From better crop decisions to better market access. Plan crops, compare sample buyer offers, and understand your net sale proceeds.",
  icons: {
    icon: "/fieldora-mark.png",
    shortcut: "/fieldora-mark.png",
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
