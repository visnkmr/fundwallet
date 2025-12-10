import './globals.css'

export const metadata = {
  title: 'FundWallet - Mutual Fund Explorer',
  description: 'Comprehensive mutual fund filtering and exploration platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}