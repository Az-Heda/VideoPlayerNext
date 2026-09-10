import { Geist, Geist_Mono, Outfit } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip"
const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const validThemes: string[] = [
    // 'default',

    ...[
      // // 'blush-pink',
      // // 'claude',
      // // 'marshmallow',
      // // 'material-design',
      // // 'midnight-bloom',
      // // 'slack',
      // // 'seo-katana',
      // 'caffeine',
      // 'spotify',
      // 'vs-code',
    ],

    ...[
      'cosmic-night',
      'darkmatter',
      'amethyst-haze',
      // 'northern-lights',
      // 'supabase',
      // 'violet-bloom',
    ],

    ...[
      // // "sakura-blossom-neon",
      // "sakura",
      // "cyberpunk-2077",
      // "twitter",
    ],

    ...[
      "sage-garden",
      "vikasana",
    ],
  ].sort()
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", outfit.variable)}
    >
      <body>
        <ThemeProvider
          defaultTheme="system"
          attribute="data-theme"
          themes={validThemes}
          disableTransitionOnChange
          enableSystem={false}
        >
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
