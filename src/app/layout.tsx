import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Proov | AI 기반 코드 독해력 평가 및 학습 플랫폼",
  description: "실제 GitHub PR 코드를 바탕으로 AI가 출제하는 맞춤형 문제를 풀며, 실무 코드 독해력과 아키텍처 이해도를 증명하세요.",
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistMono.variable}`}>
      <body className="antialiased min-h-screen bg-background text-text">
        {children}
      </body>
    </html>
  );
}

