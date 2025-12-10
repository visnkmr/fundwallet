export interface FundData {
  tradingSymbol: string;
  purchaseAllowed: boolean;
  redemptionAllowed: boolean;
  lastDividendDate: string;
  lastDividendPercent: number;
  lastPrice: number;
  lastPriceDate: string;
  changePercent: number;
  oneYearPercent: number;
  twoYearPercent: number;
  threeYearPercent: number;
  fourYearPercent: number;
  fiveYearPercent: number;
  aum: number;
  amc: string;
  fund: string;
  fundLowerCase: string;
  minPurchaseAmt: number;
  purchaseAmtMulti: number;
  minAdditionalPurchaseAmt: number;
  minRedemptionQty: number;
  redemptionQtyMulti: number;
  dividendType: string;
  dividendInterval: string;
  scheme: string;
  subScheme: string;
  plan: string;
  settlementType: string;
  launchDate: string;
  exitLoad: string;
  exitLoadSlab: number;
  expenseRatio: number;
  amcSipFlag: boolean;
  manager: string;
  lockIn: number;
  risk: number;
  fileNamePath: string;
  fundPrimaryDetail: string;
  fundSlug: string;
  realAmcName?: string;
  factsheetLink?: string;
}

export interface FilterOptions {
  amc: string[];
  scheme: string[];
  plan: string[];
  dividendInterval: string[];
  risk: number[];
  minPurchaseAmt: number[];
  expenseRatio: number[];
  launchYear: number[];
  manager: string[];
  settlementType: string[];
  purchaseAllowed: boolean[];
  redemptionAllowed: boolean[];
  amcSipFlag: boolean[];
  subScheme: string[];
  lockIn: number[];
}

export interface FundFilters {
  amc?: string[];
  scheme?: string[];
  plan?: string[];
  dividendInterval?: string[];
  risk?: number[];
  minPurchaseAmt?: string[];
  expenseRatio?: string[];
  search?: string;
  oneYearReturn?: [number, number];
  expenseRatioRange?: [number, number];
  exitLoadRange?: [number, number];
  aumRange?: [number, number];
  minInvestmentRange?: [number, number];
  navRange?: [number, number];
  launchYearRange?: [number, number];
  manager?: string[];
  sort?: string;
  excludeStrings?: string[];
  settlementType?: string[];
  purchaseAllowed?: boolean[];
  redemptionAllowed?: boolean[];
  amcSipFlag?: boolean[];
  subScheme?: string[];
  lockIn?: number[];
}

export interface RangeValues {
  oneYearReturn: { min: number; max: number };
  expenseRatio: { min: number; max: number };
  exitLoad: { min: number; max: number };
  aum: { min: number; max: number };
  minInvestment: { min: number; max: number };
  nav: { min: number; max: number };
  launchYear: { min: number; max: number };
}