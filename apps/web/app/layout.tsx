import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import { SiteNavbar } from "@/components/site-navbar";
import { ReactQueryProvider } from "@/lib/react-query/provider";

const bodyFont = Noto_Sans_KR({
  variable: "--font-body",
  weight: ["400", "500", "700"],
  display: "swap",
});

const displayFont = Noto_Serif_KR({
  variable: "--font-display",
  weight: ["500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "상상단 모임 신청 시스템",
  description: "상상단 단톡방 모임 신청을 위한 인증 및 신청 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <ReactQueryProvider>
          <SiteNavbar />
          {children}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
