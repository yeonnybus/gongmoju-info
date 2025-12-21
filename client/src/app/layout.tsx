import { Header } from '@/components/layout/Header';
import { MobileWrapper } from '@/components/layout/MobileWrapper';
import { Toaster } from '@/components/ui/sonner';
import ReactQueryProvider from '@/providers/ReactQueryProvider';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "공모주 알리미 - 실시간 청약 일정 및 분석",
  description: "이번 주 공모주 청약 일정, 기관 경쟁률, 유통 가능 물량 등 핵심 정보를 한눈에 확인하세요. 매주 월요일 아침 주간 리포트를 메일로 보내드립니다.",
  keywords: ["공모주", "청약", "IPO", "주식", "투자", "상장", "공모주 알리미"],
  openGraph: {
    title: "공모주 알리미 - 실시간 청약 일정 및 분석",
    description: "이번 주 공모주 청약 일정과 핵심 분석 리포트를 받아보세요.",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReactQueryProvider>
          <MobileWrapper>
            <Header />
              {children}
            <Toaster />
          </MobileWrapper>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
