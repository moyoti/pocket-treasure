import type { Metadata } from 'next'
import './globals.css'
import { P2PProvider } from '@/lib/p2p'

export const metadata: Metadata = {
  title: '寻宝记 - Treasure Hunt',
  description: 'Location-based treasure hunting game',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>
        <P2PProvider>
          {children}
        </P2PProvider>
      </body>
    </html>
  )
}