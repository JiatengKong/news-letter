import type { Metadata } from "next";
import { Geist, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daily Brief",
  description:
    "A once-a-day world news digest. Choose your hour, pick your desks, leave when you want.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
