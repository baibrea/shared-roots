import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { PeopleProvider } from "@/lib/PeopleContext";
import AuthRedirect from "@/lib/AuthRedirect";
import Header from "@/components/Header";
import { FamilyProvider } from "@/lib/FamilyContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shared Roots",
  icons: {
    icon: "/color-tree-decidious-svgrepo-com.svg"
  },
  description: "Family Tree App",
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#CAD7CA]">
        <FamilyProvider>
          <PeopleProvider>
            <AuthRedirect />

            {/* Page Content */}
            <main className="flex-1">{children}</main>
          </PeopleProvider>
        </FamilyProvider>
      </body>
    </html>
  );
}
