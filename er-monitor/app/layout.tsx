import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ICU Monitor Simulator",
  description: "Educational bedside patient monitor simulator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black">{children}</body>
    </html>
  );
}
