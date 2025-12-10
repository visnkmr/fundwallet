import { FundData, FilterOptions, RangeValues } from '@/types/fund';
// Import JSON data from external files
import uData from '../../u.json';
import sData from '../../s.json';

// Helper function from the original export_amc_data.js
const l = {
  qz: (str: string) => String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-')
};

// Use imported data instead of embedded JSON
const u = uData;
const s = sData;

class FundDataProcessor {
  private cachedFunds: FundData[] | null = null;
  private cachedFilterOptions: FilterOptions | null = null;
  private cachedRangeValues: any | null = null;

  private amcToIconIndex = {
    AXISMUTUALFUND_MF: 0,
    BARODAMUTUALFUND_MF: 1,
    BHARTIAXAMUTUALFUND_MF: 2,
    BirlaSunLifeMutualFund_MF: 3,
    BNPPARIBAS_MF: 4,
    SUNDARAMMUTUALFUND_MF: 5,
    CANARAROBECOMUTUALFUND_MF: 6,
    DSP_MF: 7,
    EDELWEISSMUTUALFUND_MF: 8,
    ESSELMUTUALFUND_MF: 9,
    FRANKLINTEMPLETON: 10,
    HDFCMutualFund_MF: 11,
    HSBCMUTUALFUND_MF: 12,
    ICICIPrudentialMutualFund_MF: 13,
    IDBIMUTUALFUND_MF: 14,
    IDFCMUTUALFUND_MF: 15,
    IIFLMUTUALFUND_MF: 16,
    INDIABULLSMUTUALFUND_MF: 17,
    INVESCOMUTUALFUND_MF: 18,
    "ITI MUTUAL FUND_MF": 19,
    "JM FINANCIAL MUTUAL FUND_MF": 20,
    KOTAKMAHINDRAMF: 21,
    "L&TMUTUALFUND_MF": 22,
    LICMUTUALFUND_MF: 23,
    "MAHINDRA MUTUAL FUND_MF": 24,
    MIRAEASSET: 25,
    MOTILALOSWAL_MF: 26,
    NipponIndiaMutualFund_MF: 27,
    PGIMINDIAMUTUALFUND_MF: 28,
    PPFAS_MF: 29,
    PRINCIPALMUTUALFUND_MF: 30,
    QUANTMUTUALFUND_MF: 31,
    QUANTUMMUTUALFUND_MF: 32,
    SBIMutualFund_MF: 33,
    SHRIRAMMUTUALFUND_MF: 34,
    TATAMutualFund_MF: 35,
    TAURUSMUTUALFUND_MF: 36,
    UNIONMUTUALFUND_MF: 37,
    UTIMUTUALFUND_MF: 38,
    YESMUTUALFUND_MF: 39,
    "-": 40,
    ZERODHAMUTUALFUND_MF: 41
  };

  private schemeToIconIndex = {
    equity: 1,
    "index funds": 7,
    "fund of funds": 3,
    hybrid: 4,
    debt: 5,
    "solution oriented": 6,
    "-": 2
  };

  private dividendTypeToIdcw = {
    "dividend annual payout": "IDCW Annual",
    "dividend semi annual payout": "IDCW Semi Annual",
    "dividend quarterly payout": "IDCW Quarterly",
    "dividend monthly payout": "IDCW Monthly",
    "dividend fortnightly payout": "IDCW Fortnightly",
    "dividend weekly payout": "IDCW Weekly",
    "dividend interim payout": "IDCW Interim",
    "dividend daily payout": "IDCW Daily",
    "dividend payout": "IDCW Payout",
    growth: "Growth",
    "dividend reinvest": "Dividend reinvest"
  };

  getInstrumentsDaily() {
    let e = u.n9 || [];
    return e;
  }

  getInstrumentsMeta() {
    let e = s.n9 || [];
    return e;
  }

  getFactsheetData() {
    // @ts-ignore
    return u.FC || [];
  }

  stripPlanName(e: string) {
    return e.replace("  ", " ").replace(" - Direct Plan", "").replace(" - Regular Plan", "");
  }

  formatDividendTypeWithInterval(e: string, t: string) {
    if ("G" === e) return "Growth";
    if ("P" === e) return "Dividend " + (null === t ? "" : t.toLowerCase() + " ") + "payout";
    if ("R" === e) return "dividend reinvest";
    {
      let result = null === e ? "" : e.toLowerCase() + " ";
      return result;
    }
  }

  getFileName(e: any) {
    let t = e.scheme.toLowerCase();
    let a = e.amc;
    let n = this.amcToIconIndex["-"];
    if (a in this.amcToIconIndex) {
      n = this.amcToIconIndex[a as keyof typeof this.amcToIconIndex];
    }
    let i = this.schemeToIconIndex["-"];
    if (t in this.schemeToIconIndex) {
      i = this.schemeToIconIndex[t as keyof typeof this.schemeToIconIndex];
    }
    let o = 7 * n + i;
    return `mf-amc-${o}.svg`;
  }

  getUniqueValues(e: any[]) {
    return Array.from(new Set(e));
  }

  parseInstrumentsData(): FundData[] {
    // Return cached data if available
    if (this.cachedFunds !== null) {
      console.log('Using cached fund data');
      return this.cachedFunds;
    }

    console.log('Parsing fund data from JSON...');

    let e = this.getInstrumentsDaily();
    let t = this.getInstrumentsMeta();
    let fc = this.getFactsheetData();
    let fcMap = new Map(fc.map((item: any) => [item[0], { link: item[1], name: item[2] }]));
    let n: FundData[] = [];
    let i: string[] = [];
    let d = new Map(t.map((item: any) => [item[0], true]));

    e.map((e: any[]) => {
      let a = {} as FundData;
      let r = e[0];
      if (d.has(r)) {
        let d = t.findIndex((item: any) => item[0] === r);
        let u = t[d];

        a.tradingSymbol = e[0] as string;
        a.purchaseAllowed = 1 === e[1];
        a.redemptionAllowed = 1 === e[2];
        a.lastDividendDate = (e[3] as string) || "";
        a.lastDividendPercent = (e[4] as number) || 0;
        a.lastPrice = e[5] as number;
        a.lastPriceDate = e[6] as string;
        a.changePercent = e[7] as number;
        a.oneYearPercent = e[8] as number;
        a.twoYearPercent = e[9] as number;
        a.threeYearPercent = e[10] as number;
        a.fourYearPercent = e[11] as number;
        a.fiveYearPercent = e[12] as number;
        a.aum = 10000000 * (e[13] as number);
        a.amc = u[1] as string;

        const amcData = fcMap.get(a.amc);
        if (amcData) {
          a.realAmcName = amcData.name;
          a.factsheetLink = amcData.link;
        }
        a.fund = this.stripPlanName(u[2] as string);
        a.fundLowerCase = this.stripPlanName(u[2] as string).toLowerCase();
        a.minPurchaseAmt = u[3] as number;
        a.purchaseAmtMulti = u[4] as number;
        a.minAdditionalPurchaseAmt = u[5] as number;
        a.minRedemptionQty = u[6] as number;
        a.redemptionQtyMulti = u[7] as number;
        a.dividendType = u[8] as string;
        a.dividendInterval = (u[9] as string) || this.formatDividendTypeWithInterval(u[8] as string, u[9] as string);
        a.scheme = u[10] as string;
        a.subScheme = u[11] as string;
        a.plan = 0 == u[12] ? "Regular" : "Direct";
        a.settlementType = u[13] as string;
        a.launchDate = u[14] as string;
        a.exitLoad = u[15] as string;
        a.exitLoadSlab = u[16] as number;
        a.expenseRatio = u[17] as number;
        a.amcSipFlag = 1 === u[18];
        a.manager = u[19] as string;
        a.lockIn = u[20] as number;
        a.risk = u[21] as number;
        a.fileNamePath = this.getFileName(a);
        a.fundPrimaryDetail = (u[0] as string).toLowerCase() + " " + this.stripPlanName(u[2] as string).toLowerCase() + " " + (u[10] as string).toLowerCase() + " " + (u[11] as string).toLowerCase() + " " + a.dividendInterval.toLowerCase();
        a.fundSlug = l.qz(`${a.fund} ${a.plan} ${a.dividendInterval}`);

        i.push(a.dividendInterval);
        n.push(a);
      }
    });

    // Cache the parsed data
    this.cachedFunds = n;
    return n;
  }

  getFilterOptions(): FilterOptions {
    // Return cached filter options if available
    if (this.cachedFilterOptions !== null) {
      console.log('Using cached filter options');
      return this.cachedFilterOptions;
    }

    console.log('Generating filter options...');

    const funds = this.parseInstrumentsData();

    const amcList = this.getUniqueValues(funds.map(f => f.amc));
    const schemeList = this.getUniqueValues(funds.map(f => f.scheme));
    const planList = this.getUniqueValues(funds.map(f => f.plan));
    const dividendIntervalList = this.getUniqueValues(funds.map(f => f.dividendInterval));
    const riskList = this.getUniqueValues(funds.map(f => f.risk));
    const minPurchaseAmtList = this.getUniqueValues(funds.map(f => f.minPurchaseAmt));
    const expenseRatioList = this.getUniqueValues(funds.map(f => f.expenseRatio));
    const launchYearList = Array.from(new Set(funds.map(f => {
      const date = new Date(f.launchDate);
      return date.getFullYear();
    }).filter(year => !isNaN(year))));
    const managerList = this.getUniqueValues(funds.map(f => f.manager).filter(m => m && m.trim() !== ''));
    const settlementTypeList = this.getUniqueValues(funds.map(f => f.settlementType).filter(s => s && s.trim() !== ''));
    const purchaseAllowedList = this.getUniqueValues(funds.map(f => f.purchaseAllowed));
    const redemptionAllowedList = this.getUniqueValues(funds.map(f => f.redemptionAllowed));
    const amcSipFlagList = this.getUniqueValues(funds.map(f => f.amcSipFlag));
    const subSchemeList = this.getUniqueValues(funds.map(f => f.subScheme).filter(s => s && s.trim() !== ''));
    const lockInList = this.getUniqueValues(funds.map(f => f.lockIn).filter(l => l > 0));

    const filterOptions: FilterOptions = {
      amc: amcList,
      scheme: schemeList,
      plan: planList,
      dividendInterval: dividendIntervalList,
      risk: riskList,
      minPurchaseAmt: minPurchaseAmtList,
      expenseRatio: expenseRatioList,
      launchYear: launchYearList,
      manager: managerList,
      settlementType: settlementTypeList,
      purchaseAllowed: purchaseAllowedList,
      redemptionAllowed: redemptionAllowedList,
      amcSipFlag: amcSipFlagList,
      subScheme: subSchemeList,
      lockIn: lockInList
    };

    // Cache the filter options
    this.cachedFilterOptions = filterOptions;
    return filterOptions;
  }

  getRangeValues(): RangeValues {
    // Return cached range values if available
    if (this.cachedRangeValues !== null) {
      console.log('Using cached range values');
      return this.cachedRangeValues;
    }

    console.log('Calculating range values...');

    const funds = this.parseInstrumentsData();

    const oneYearReturns = funds.map(f => f.oneYearPercent).filter(v => v !== null && v !== undefined);
    const expenseRatios = funds.map(f => f.expenseRatio).filter(v => v !== null && v !== undefined);
    const aums = funds.map(f => f.aum).filter(v => v !== null && v !== undefined);
    const minInvestments = funds.map(f => f.minPurchaseAmt).filter(v => v !== null && v !== undefined);
    const navs = funds.map(f => f.lastPrice).filter(v => v !== null && v !== undefined);

    // Extract exit load percentages from exit load strings
    const exitLoads = funds.map(f => {
      if (!f.exitLoad || f.exitLoad === "0" || f.exitLoad === "Nil" || f.exitLoad === "nil") return 0;

      // Handle various exit load formats like "1%", "1.5%", "0.5% for 1 year", etc.
      const match = f.exitLoad.match(/(\d+\.?\d*)%/);
      if (match) {
        return parseFloat(match[1]);
      } else {
        // Try to extract any number that might be a percentage
        const numMatch = f.exitLoad.match(/(\d+\.?\d*)/);
        if (numMatch) {
          const num = parseFloat(numMatch[1]);
          // If the number is between 0 and 100, assume it's a percentage
          if (num >= 0 && num <= 100) {
            return num;
          }
        }
      }
      return 0;
    }).filter(v => v !== null && v !== undefined && v !== 0);

    // Extract launch years
    const launchYears = funds.map(f => {
      const date = new Date(f.launchDate);
      return date.getFullYear();
    }).filter(year => !isNaN(year));

    const rangeValues: RangeValues = {
      oneYearReturn: {
        min: Math.min(...oneYearReturns),
        max: Math.max(...oneYearReturns)
      },
      expenseRatio: {
        min: Math.min(...expenseRatios),
        max: Math.max(...expenseRatios)
      },
      exitLoad: {
        min: Math.min(...exitLoads),
        max: Math.max(...exitLoads)
      },
      aum: {
        min: Math.min(...aums),
        max: Math.max(...aums)
      },
      minInvestment: {
        min: Math.min(...minInvestments),
        max: Math.max(...minInvestments)
      },
      nav: {
        min: Math.min(...navs),
        max: Math.max(...navs)
      },
      launchYear: {
        min: Math.min(...launchYears),
        max: Math.max(...launchYears)
      }
    };

    // Cache the range values
    this.cachedRangeValues = rangeValues;
    return rangeValues;
  }

  // Method to clear cache (useful for development/testing)
  clearCache(): void {
    this.cachedFunds = null;
    this.cachedFilterOptions = null;
    this.cachedRangeValues = null;
  }
}

export const fundDataProcessor = new FundDataProcessor();
export const getAllFunds = () => fundDataProcessor.parseInstrumentsData();
export const getFilterOptions = () => fundDataProcessor.getFilterOptions();
export const getRangeValues = () => fundDataProcessor.getRangeValues();