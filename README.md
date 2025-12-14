# FundWallet - Mutual Fund Explorer

A Next.js SSG application built with Bun for filtering and exploring mutual funds across all dimensions.

## Features

- **Static Site Generation (SSG)**: Fast loading with pre-built pages
- **Comprehensive Filtering**: Filter funds by AMC, scheme type, plan, dividend interval, risk level, and more
- **Search Functionality**: Search funds by name, AMC, scheme, or fund manager
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **TypeScript**: Full type safety for better development experience
- **Bun Runtime**: Fast and efficient JavaScript runtime

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 14 with SSG
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Data Processing**: Custom fund data parser

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your system

### Installation

```bash
cd fundwallet
bun install
```

### Development

```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

### Build

```bash
bun run build
```

### Start Production

```bash
bun run start
```

## Project Structure

```
fundwallet/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # React components
│   │   ├── FilterPanel.tsx  # Fund filtering interface
│   │   ├── FundCard.tsx     # Individual fund display
│   │   └── FundList.tsx     # Fund list component
│   ├── lib/                 # Utility libraries
│   │   └── fundData.ts      # Fund data processing
│   └── types/               # TypeScript type definitions
│       └── fund.ts          # Fund-related types
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Data Source

The application processes fund data from `export_amc_data.js`, which contains comprehensive mutual fund information including:

- Fund details and NAV data
- AMC information
- Scheme types and categories
- Risk levels and performance metrics
- Expense ratios and minimum investments

## Filtering Options

Users can filter funds by:

- **AMC (Asset Management Company)**
- **Scheme Type** (Equity, Debt, Hybrid, etc.)
- **Plan** (Regular, Direct)
- **Dividend Interval** (Growth, IDCW, etc.)
- **Risk Level** (Low, Medium, High)
- **Minimum Purchase Amount**
- **Expense Ratio**
- **Search** (by fund name, AMC, manager)

## Performance

- SSG ensures fast page loads
- Optimized filtering with client-side JavaScript
- Responsive images and lazy loading
- Efficient data processing with Bun runtime

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).


## Self notes

s.json data:
amc, fund, minPurchaseAmt, purchaseAmtMulti, minAdditionalPurchaseAmt, minRedemptionQty, redemptionQtyMulti, dividendType, dividendInterval, scheme, subScheme, plan, settlementType, launchDate, exitLoad, exitLoadSlab, expenseRatio, amcSipFlag, manager, lockIn, risk

u.json data:
tradingSymbol, purchaseAllowed, redemptionAllowed, lastDividendDate, lastDividendPercent, lastPrice, lastPriceDate, changePercent, oneYearPercent, twoYearPercent, threeYearPercent, fourYearPercent, fiveYearPercent, aum, factsheetLink, realAmcName