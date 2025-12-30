import { FundData, FilterOptions, RangeValues } from '@/types/fund';
import * as parquet_wasm from 'parquet-wasm';
import { Table } from 'apache-arrow';

// Helper from original
const l = {
  qz: (str: string) => String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-')
};

// IndexedDB caching (unchanged)
const DB_NAME = 'FundWalletCache';
const DB_VERSION = 1;
const DATA_STORE = 'fundData';
const CACHE_KEY = 'mainDataParquet'; // Updated key to avoid conflict

interface CachedData {
  key: string;
  data: FundData[];
  timestamp: number;
  version: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DATA_STORE)) {
        db.createObjectStore(DATA_STORE, { keyPath: 'key' });
      }
    };
  });
}

import { tableFromIPC } from 'apache-arrow';
// import * as parquet_wasm from 'parquet-wasm';

async function loadParquetFromUrl(
  url: string,
  onProgress?: (phase: string, percent: number) => void
): Promise<FundData[]> {
  onProgress?.('Downloading Parquet file...', 0);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

  const contentLength = Number(response.headers.get('content-length') || '0');
  const reader = response.body!.getReader();
  let received = 0;
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (contentLength > 0) {
      onProgress?.('Downloading...', Math.round((received / contentLength) * 90));
    }
  }

  const buffer = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }

  onProgress?.('Initializing WASM & parsing...', 95);

  // Initialize WASM if not already done (idempotent in most cases)
  await parquet_wasm.default();

  // Now use the function
  const wasmTable = parquet_wasm.readParquet(buffer);
  const ipcStream = wasmTable.intoIPCStream();
  const arrowTable = tableFromIPC(ipcStream);

  const records: FundData[] = Array.from(arrowTable);

  onProgress?.('Data loaded', 100);
  return records;
}

let dataCache: FundData[] | null = null;

async function getCachedDataEntry(): Promise<CachedData | null> {
  try {
    const db = await openDB();
    const tx = db.transaction([DATA_STORE], 'readonly');
    const store = tx.objectStore(DATA_STORE);
    const request = store.get(CACHE_KEY);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const result = request.result as CachedData | undefined;
        if (result && result.version === '2.0') {
          console.log('Loaded fund data from IndexedDB cache');
          resolve(result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Cache read error:', err);
    return null;
  }
}

async function setCachedData(data: FundData[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([DATA_STORE], 'readwrite');
    const store = tx.objectStore(DATA_STORE);

    await new Promise<void>((resolve, reject) => {
      const request = store.put({
        key: CACHE_KEY,
        data,
        timestamp: Date.now(),
        version: '2.0'
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('Parquet-derived data cached to IndexedDB');
  } catch (err) {
    console.warn('Failed to cache data:', err);
  }
}

async function getData(onProgress?: (phase: string, percent: number) => void): Promise<FundData[]> {
  if (dataCache) {
    onProgress?.('Using in-memory cache', 100);
    return dataCache;
  }

  const cached = await getCachedDataEntry();
  if (cached) {
    dataCache = cached.data;
    return dataCache;
  }

  onProgress?.('Fetching from network...', 0);
  const url = 'https://cdn.jsdelivr.net/gh/visnkmr/fasttest@main/data.parquet';
  
  dataCache = await loadParquetFromUrl(url, onProgress);
  await setCachedData(dataCache);

  return dataCache;
}

class FundDataProcessor {
  private cachedFunds: FundData[] | null = null;
  private cachedFilterOptions: FilterOptions | null = null;
  private cachedRangeValues: RangeValues | null = null;

  private amcToIconIndex: Record<string, number> = {
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

  private schemeToIconIndex: Record<string, number> = {
    equity: 1,
    "index funds": 7,
    "fund of funds": 3,
    hybrid: 4,
    debt: 5,
    "solution oriented": 6,
    "-": 2
  };

  stripPlanName(name: string): string {
    return name.replace("  ", " ").replace(" - Direct Plan", "").replace(" - Regular Plan", "");
  }

  getFileName(fund: FundData): string {
    const schemeKey = fund.scheme.toLowerCase();
    const amcKey = fund.amc || "-";

    const amcIndex = this.amcToIconIndex[amcKey] ?? this.amcToIconIndex["-"];
    const schemeIndex = this.schemeToIconIndex[schemeKey] ?? this.schemeToIconIndex["-"];

    const iconId = 7 * amcIndex + schemeIndex;
    return `mf-amc-${iconId}.svg`;
  }

  getUniqueValues<T>(arr: T[]): T[] {
    return Array.from(new Set(arr));
  }

  async parseInstrumentsData(onProgress?: (phase: string, percent: number) => void): Promise<FundData[]> {
    if (this.cachedFunds) {
      onProgress?.('Using cached processed funds', 100);
      return this.cachedFunds;
    }

    onProgress?.('Loading fund data...', 0);
    const rawFunds = await getData(onProgress);

    onProgress?.('Enhancing fund objects...', 50);

    const enhancedFunds: FundData[] = rawFunds.map((f: any) => ({
      ...f,
      fundLowerCase: f.fund.toLowerCase(),
      plan: f.plan === 0 || f.plan === "Regular" ? "Regular" : "Direct",
      fileNamePath: this.getFileName(f),
      fundPrimaryDetail: [
        f.tradingSymbol.toLowerCase(),
        this.stripPlanName(f.fund).toLowerCase(),
        f.scheme.toLowerCase(),
        f.subScheme.toLowerCase(),
        (f.dividendInterval || "").toLowerCase()
      ].join(" "),
      fundSlug: l.qz(`${this.stripPlanName(f.fund)} ${f.plan} ${f.dividendInterval || ''}`)
    }));

    this.cachedFunds = enhancedFunds;
    onProgress?.('Processing complete', 100);
    return enhancedFunds;
  }

  async getFilterOptions(onProgress?: (phase: string, percent: number) => void): Promise<FilterOptions> {
    if (this.cachedFilterOptions) {
      onProgress?.('Filter options from cache', 100);
      return this.cachedFilterOptions;
    }

    const funds = await this.parseInstrumentsData(onProgress);

    const filterOptions: FilterOptions = {
      amc: this.getUniqueValues(funds.map(f => f.realAmcName || f.amc)),
      scheme: this.getUniqueValues(funds.map(f => f.scheme)),
      plan: this.getUniqueValues(funds.map(f => f.plan)),
      dividendInterval: this.getUniqueValues(funds.map(f => f.dividendInterval || '')),
      risk: this.getUniqueValues(funds.map(f => f.risk)),
      minPurchaseAmt: this.getUniqueValues(funds.map(f => f.minPurchaseAmt)),
      expenseRatio: this.getUniqueValues(funds.map(f => f.expenseRatio)),
      launchYear: this.getUniqueValues(
        funds
          .map(f => new Date(f.launchDate).getFullYear())
          .filter(y => !isNaN(y))
      ),
      manager: this.getUniqueValues(funds.map(f => f.manager).filter(m => m?.trim())),
      settlementType: this.getUniqueValues(funds.map(f => f.settlementType).filter(s => s?.trim())),
      purchaseAllowed: this.getUniqueValues(funds.map(f => f.purchaseAllowed)),
      redemptionAllowed: this.getUniqueValues(funds.map(f => f.redemptionAllowed)),
      amcSipFlag: this.getUniqueValues(funds.map(f => f.amcSipFlag)),
      subScheme: this.getUniqueValues(funds.map(f => f.subScheme).filter(s => s?.trim())),
      lockIn: this.getUniqueValues(funds.map(f => f.lockIn).filter(l => l > 0))
    };

    this.cachedFilterOptions = filterOptions;
    return filterOptions;
  }

  async getRangeValues(onProgress?: (phase: string, percent: number) => void): Promise<RangeValues> {
    if (this.cachedRangeValues) {
      onProgress?.('Range values from cache', 100);
      return this.cachedRangeValues;
    }

    const funds = await this.parseInstrumentsData(onProgress);

    const oneYearReturns = funds.map(f => f.oneYearPercent).filter(v => v != null);
    const expenseRatios = funds.map(f => f.expenseRatio).filter(v => v != null);
    const aums = funds.map(f => f.aum).filter(v => v != null);
    const minInvestments = funds.map(f => f.minPurchaseAmt).filter(v => v != null);
    const navs = funds.map(f => f.lastPrice).filter(v => v != null);

    const exitLoads = funds.map(f => {
      if (!f.exitLoad || /^0|nil$/i.test(f.exitLoad)) return 0;
      const match = f.exitLoad.match(/(\d+(?:\.\d+)?)%/);
      return match ? parseFloat(match[1]) : 0;
    });

    const launchYears = funds
      .map(f => new Date(f.launchDate).getFullYear())
      .filter(y => !isNaN(y));

    const rangeValues: RangeValues = {
      oneYearReturn: { min: Math.min(...oneYearReturns), max: Math.max(...oneYearReturns) },
      expenseRatio: { min: Math.min(...expenseRatios), max: Math.max(...expenseRatios) },
      exitLoad: { min: Math.min(...exitLoads), max: Math.max(...exitLoads) },
      aum: { min: Math.min(...aums), max: Math.max(...aums) },
      minInvestment: { min: Math.min(...minInvestments), max: Math.max(...minInvestments) },
      nav: { min: Math.min(...navs), max: Math.max(...navs) },
      launchYear: { min: Math.min(...launchYears), max: Math.max(...launchYears) }
    };

    this.cachedRangeValues = rangeValues;
    return rangeValues;
  }

  clearCache(): void {
    this.cachedFunds = null;
    this.cachedFilterOptions = null;
    this.cachedRangeValues = null;
    dataCache = null;
  }
}

export const fundDataProcessor = new FundDataProcessor();
export const getAllFunds = (onProgress?: (phase: string, percent: number) => void) =>
  fundDataProcessor.parseInstrumentsData(onProgress);
export const getFilterOptions = (onProgress?: (phase: string, percent: number) => void) =>
  fundDataProcessor.getFilterOptions(onProgress);
export const getRangeValues = (onProgress?: (phase: string, percent: number) => void) =>
  fundDataProcessor.getRangeValues(onProgress);