import type { Metadata, Viewport } from "next";
import { Providers } from "./Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAX — Мессенджер",
  description: "Мессенджер для общения через MAX.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#17181c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="antialiased">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
