import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SpeakChuk Video — AI Subtitle Generator",
  description: "Generate and edit SRT subtitles with AI-powered transcription and grammar correction",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${manrope.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-[var(--surface)] text-[var(--on-surface)] font-[family-name:var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}
