import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StyledComponentsRegistry from "@/lib/styled-components-registry";
import { AuthProvider } from "@/providers/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Mental Co(u)ach",
  description: "AI-powered mental coaching app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <StyledComponentsRegistry>
          <AuthProvider>{children}</AuthProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
