import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCReactProvider } from "@/trpc/client";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vibe | AI-Powered Website Creation",
  description: "An AI platform that creates Next.js websites using intelligent agents, automating development and design.",
  keywords: ["AI website builder", "Next.js", "autonomous agents", "web development", "AI automation", "vibe"],
  openGraph: {
    title: "Vibe | AI-Powered Website Creation",
    description: "An AI platform that creates Next.js websites using intelligent agents, automating development and design.",
    type: "website",
    locale: "en_US",
    siteName: "Vibe",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibe | AI-Powered Website Creation",
    description: "An AI platform that creates Next.js websites using intelligent agents, automating development and design.",
  },
  metadataBase: new URL("https://vibecode-ai.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables : {
          colorPrimary : "#C96342"
        }
      }}
    >
      <TRPCReactProvider>
        <html lang="en" suppressHydrationWarning>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Toaster position="bottom-right" />
              {children}
            </ThemeProvider>
          </body>
        </html>
      </TRPCReactProvider>
    </ClerkProvider>
  );
}
