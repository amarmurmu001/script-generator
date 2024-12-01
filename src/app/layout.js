import Navbar from "@/components/Navbar"
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from "react-hot-toast";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Script Genius",
  description: "ScriptGenius uses AI to generate captivating video scripts for your content. Save time, boost engagement, and never run out of ideas.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-[#0B0F1A] text-gray-900 dark:text-white min-h-screen`}>
        <AuthProvider>
          <Navbar />
          {children}
          <Toaster position="bottom-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
