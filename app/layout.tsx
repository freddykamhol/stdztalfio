import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Stundenalfio",
  description: "Zeiterfassungs-Starter mit Next.js, Prisma und Tailwind.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="antialiased transition-colors duration-500">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
