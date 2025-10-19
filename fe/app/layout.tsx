import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./vp.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Video player",
  description: "Video player Go+NextJS",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {

  const validThemes: string[] = [
    'default',

    ...[
      'material-design',
      'slack',
      'spotify',
      'vs-code',
      'caffeine',
      'marshmallow',
      'midnight-bloom',
    ],

    ...[
      'amethyst-haze',
      'darkmatter',
      'northern-lights',
      'supabase',
      'violet-bloom',
    ],
  ].sort();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          themes={validThemes}
          disableTransitionOnChange
          enableSystem={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
