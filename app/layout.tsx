import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { TooltipProvider } from "@/components/ui/tooltip"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "RAV4 Finance Control - Sala de Guerra Financeira",
  description: "Painel financeiro pessoal hiperpersonalizado",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning style={{ 
      colorScheme: 'dark',
      backgroundColor: 'hsl(222.2, 84%, 4.9%)'
    }}>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            * {
              box-sizing: border-box;
            }
            html { 
              background-color: hsl(222.2, 84%, 4.9%) !important;
              color-scheme: dark !important;
            }
            body { 
              background-color: hsl(222.2, 84%, 4.9%) !important;
              color: hsl(210, 40%, 98%) !important;
              margin: 0;
              padding: 0;
            }
            main {
              background-color: hsl(222.2, 84%, 4.9%) !important;
              color: hsl(210, 40%, 98%) !important;
            }
          `
        }} />
      </head>
      <body className={inter.className} style={{
        backgroundColor: 'hsl(222.2, 84%, 4.9%)',
        color: 'hsl(210, 40%, 98%)'
      }}>
        <TooltipProvider delayDuration={200}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}

