import { FundData, FilterOptions, RangeValues } from '@/types/fund';

// Helper function from the original export_amc_data.js
const l = {
  qz: (str: string) => String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-')
};

// IndexedDB utilities for offline caching
const DB_NAME = 'FundWalletCache';
const DB_VERSION = 1;
const DATA_STORE = 'fundData';
const CACHE_KEY = 'mainData';

interface CachedData {
  key: string;
  data: any;
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

async function getCachedData(): Promise<{u: any, s: any} | null> {
  const entry = await getCachedDataEntry();
  return entry ? entry.data : null;
}

async function getCachedDataEntry(): Promise<CachedData | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction([DATA_STORE], 'readonly');
    const store = transaction.objectStore(DATA_STORE);
    const request = store.get(CACHE_KEY);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result: CachedData | undefined = request.result;
        if (result && result.data) {
          console.log('Loaded data from IndexedDB cache');
          resolve(result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to load from cache:', error);
    return null;
  }
}

async function setCachedData(data: {u: any, s: any}): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([DATA_STORE], 'readwrite');
    const store = transaction.objectStore(DATA_STORE);

    const cachedData: CachedData = {
      key: CACHE_KEY,
      data,
      timestamp: Date.now(),
      version: '1.0' // Increment this when data format changes
    };

    return new Promise((resolve, reject) => {
      const request = store.put(cachedData);
      request.onsuccess = () => {
        console.log('Data cached to IndexedDB');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
}

// Data loading from URL
const key = new TextEncoder().encode('0123456789abcdef0123456789abcdef');

async function downloadChunk(url: string, onProgress?: (phase: string, percent: number) => void): Promise<Uint8Array> {
  onProgress?.('Downloading chunk...', 0);
  const response = await fetch(url);
  const contentLength = parseInt(response.headers.get('content-length') || '0');
  const reader = response.body?.getReader();
  let received = 0;
  const chunks: Uint8Array[] = [];
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (contentLength > 0) {
        onProgress?.('Downloading chunk...', Math.round((received / contentLength) * 100));
      }
    }
  }
  // Concatenate chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const concatenated = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    concatenated.set(chunk, offset);
    offset += chunk.length;
  }
  return concatenated;
}

async function decryptChunk(base64: string): Promise<Uint8Array> {
  const encryptedWithTag = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const iv = encryptedWithTag.slice(0, 16);
  const encrypted = encryptedWithTag.slice(16, -16);
  const authTag = encryptedWithTag.slice(-16);
  const keyBuffer = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['decrypt']);
  const algorithm = { name: 'AES-GCM', iv: iv, tagLength: 128 };
  const decrypted = await crypto.subtle.decrypt(algorithm, keyBuffer, new Uint8Array([...encrypted, ...authTag]));
  return new Uint8Array(decrypted);
}

// Global variables for background loading
let backgroundLoadPromise: Promise<{u: any, s: any}> | null = null;
let isBackgroundLoadingComplete = false;
let completeDataCache: {u: any, s: any} | null = null;

// Event listeners for background loading completion
const backgroundLoadListeners: Array<(data: {u: any, s: any}) => void> = [];

function addBackgroundLoadListener(callback: (data: {u: any, s: any}) => void) {
  backgroundLoadListeners.push(callback);
}

function notifyBackgroundLoadComplete(data: {u: any, s: any}) {
  backgroundLoadListeners.forEach(callback => callback(data));
  isBackgroundLoadingComplete = true;
  completeDataCache = data;
}

async function loadPriorityChunkOnly(baseUrl: string, onProgress?: (phase: string, percent: number) => void): Promise<{u: Partial<any>, s: Partial<any>}> {
  // Load just the first chunk for quick UI initialization
  onProgress?.('Loading priority chunk...', 10);
  const url = `${baseUrl.replace('.b64', '_part1.b64')}`;
  
  const chunkData = await downloadChunk(url);
  onProgress?.('Decrypting priority chunk...', 40);
  const decryptedChunk = await decryptChunk(new TextDecoder().decode(chunkData));
  
  // Since we only have the first chunk, we can't decompress the full gzip stream yet
  // Instead, we'll return a partial data structure that indicates loading state
  onProgress?.('Preparing UI...', 80);
  
  // Start background loading of all chunks
  backgroundLoadPromise = loadAllChunksInBackground(baseUrl);
  backgroundLoadPromise.then(completeData => {
    notifyBackgroundLoadComplete(completeData);
  }).catch(error => {
    console.warn('Background loading failed:', error);
  });
  
  onProgress?.('UI Ready', 100);
  
  // Return partial data structure that the UI can work with
  return {
    u: { _loading: true, _partial: true },
    s: { _loading: true, _partial: true }
  };
}

async function loadAllChunksInBackground(baseUrl: string): Promise<{u: any, s: any}> {
  try {
    console.log('Background loading of all chunks started');
    
    const chunks: Uint8Array[] = [];
    
    // Load all 6 chunks
    for (let i = 1; i <= 6; i++) {
      const chunkUrl = `${baseUrl.replace('.b64', `_part${i}.b64`)}`;
      const chunkData = await downloadChunk(chunkUrl);
      const decryptedChunk = await decryptChunk(new TextDecoder().decode(chunkData));
      chunks.push(decryptedChunk);
    }
    
    // Combine all chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Decompress and parse
    const decompressedResponse = new Response(combined);
    const decompressed = await decompressedResponse.arrayBuffer();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(decompressed));
        controller.close();
      }
    }).pipeThrough(new DecompressionStream('gzip'));
    const decompressedBlob = await new Response(stream).blob();
    const jsonString = await decompressedBlob.text();
    const combinedData = JSON.parse(jsonString);
    
    console.log('Background loading completed successfully');
    return { u: combinedData.u, s: combinedData.s };
    
  } catch (error) {
    console.warn('Background loading failed:', error);
    throw error;
  }
}

async function loadDataFromUrl(baseUrl: string, onProgress?: (phase: string, percent: number) => void): Promise<{u: any, s: any}> {
  // Check if we already have complete data from background loading
  if (isBackgroundLoadingComplete && completeDataCache) {
    onProgress?.('Using cached complete data', 100);
    return completeDataCache;
  }
  
  // If background loading is in progress, wait for it
  if (backgroundLoadPromise) {
    onProgress?.('Waiting for background data...', 50);
    const completeData = await backgroundLoadPromise;
    onProgress?.('Complete data loaded', 100);
    return completeData;
  }
  
  // If no background loading, load priority chunk only for fast UI
  onProgress?.('Loading priority data for fast UI...', 0);
  return loadPriorityChunkOnly(baseUrl, onProgress);
}

// Function to get complete data (waits for background loading if needed)
async function getCompleteData(): Promise<{u: any, s: any} | null> {
  if (isBackgroundLoadingComplete && completeDataCache) {
    return completeDataCache;
  }
  
  if (backgroundLoadPromise) {
    return await backgroundLoadPromise;
  }
  
  return null;
}

let dataCache: {u: any, s: any} | null = null;
let isPartialData = false;

async function getData(onProgress?: (phase: string, percent: number) => void): Promise<{u: any, s: any}> {
  if (dataCache && !isPartialData) return dataCache;

  // Try to load from IndexedDB cache first
  const cachedEntry = await getCachedDataEntry();
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const now = Date.now();

  if (cachedEntry && cachedEntry.data) {
    dataCache = cachedEntry.data;
    isPartialData = false;
    onProgress?.('Data loaded from cache', 100);

    // Check if cache is stale (older than 24 hours)
    const isStale = (now - cachedEntry.timestamp) > CACHE_DURATION;

    if (isStale) {
      console.log('Cache is stale, fetching fresh data in background...');
      // Fetch fresh data in background without blocking
      fetchFreshData().catch(error => {
        console.warn('Failed to fetch fresh data in background:', error);
      });
    }

    // dataCache is guaranteed to be set here
    return dataCache!;
  }

  // If not in cache, fetch from URL with priority loading
  onProgress?.('Fetching data from network...', 0);
  const baseUrl = 'https://cdn.jsdelivr.net/gh/visnkmr/fasttest@main/data.b64';
  const loadedData = await loadDataFromUrl(baseUrl, onProgress);
  
  // Check if this is partial data
  if (loadedData.u._partial && loadedData.s._partial) {
    dataCache = loadedData;
    isPartialData = true;
    
    // Set up listener for when complete data is available
    addBackgroundLoadListener((completeData) => {
      dataCache = completeData;
      isPartialData = false;
      // Cache the complete data
      setCachedData(completeData);
    });
    
    return loadedData;
  } else {
    dataCache = loadedData;
    isPartialData = false;
    // Cache the complete data
    await setCachedData(dataCache);
    return dataCache;
  }
}

// Function to check if current data is partial
function isDataPartial(): boolean {
  return isPartialData;
}

// Function to get complete data (blocks if background loading is in progress)
async function ensureCompleteData(): Promise<{u: any, s: any}> {
  if (!isPartialData && dataCache) {
    return dataCache;
  }
  
  const completeData = await getCompleteData();
  if (completeData) {
    dataCache = completeData;
    isPartialData = false;
    return completeData;
  }
  
  // Fallback to getData if no background loading
  return getData();
}

// Background fetch function
async function fetchFreshData(): Promise<void> {
  try {
    const baseUrl = 'https://cdn.jsdelivr.net/gh/visnkmr/fasttest@main/data.b64';
    const freshData: {u: any, s: any} = await loadDataFromUrl(baseUrl);

    // Update cache with fresh data
    await setCachedData(freshData);

    // Update in-memory cache if it exists
    if (dataCache) {
      dataCache = freshData;
    }

    console.log('Fresh data fetched and cached successfully');
  } catch (error) {
    console.warn('Failed to fetch fresh data:', error);
  }
}

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

  // Method to get quick data for UI (can work with partial data)
  async getQuickData(onProgress?: (phase: string, percent: number) => void) {
    const data = await getData(onProgress);
    return data;
  }

  async getInstrumentsDaily(onProgress?: (phase: string, percent: number) => void) {
    // Ensure we have complete data for instrument operations
    const data = await ensureCompleteData();
    let e = data.u.n9 || [];
    return e;
  }

  async getInstrumentsMeta(onProgress?: (phase: string, percent: number) => void) {
    // Ensure we have complete data for meta operations
    const data = await ensureCompleteData();
    let e = data.s.n9 || [];
    return e;
  }

  async getFactsheetData(onProgress?: (phase: string, percent: number) => void) {
    // Ensure we have complete data for factsheet operations
    const data = await ensureCompleteData();
    // @ts-ignore
    return data.u.FC || [];
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

  async parseInstrumentsData(onProgress?: (phase: string, percent: number) => void): Promise<FundData[]> {
    // Return cached data if available
    if (this.cachedFunds !== null) {
      console.log('Using cached fund data');
      onProgress?.('Using cached data', 100);
      return this.cachedFunds;
    }

    console.log('Parsing fund data from JSON...');
    onProgress?.('Fetching instruments data...', 0);

    let e = await this.getInstrumentsDaily((phase, percent) => onProgress?.(phase, percent));
    onProgress?.('Fetching meta data...', 10);
    let t = await this.getInstrumentsMeta();
    onProgress?.('Fetching factsheet data...', 20);
    let fc = await this.getFactsheetData();
    let fcMap = new Map(fc.map((item: any) => [item[0], { link: item[1], name: item[2] }]));
    let n: FundData[] = [];
    let i: string[] = [];
    let d = new Map(t.map((item: any) => [item[0], true]));

    onProgress?.('Processing fund data...', 30);
    const total = e.length;
    e.forEach((e: any[], index: number) => {
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

        const amcData = fcMap.get(a.amc) as {link: string, name: string} | undefined;
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
      if (index % 100 === 0) {
        onProgress?.('Processing fund data...', 30 + Math.round((index / total) * 70));
      }
    });

    onProgress?.('Data processed', 100);
    // Cache the parsed data
    this.cachedFunds = n;
    return n;
  }

  async getFilterOptions(onProgress?: (phase: string, percent: number) => void): Promise<FilterOptions> {
    // Return cached filter options if available
    if (this.cachedFilterOptions !== null) {
      console.log('Using cached filter options');
      onProgress?.('Filter options ready', 100);
      return this.cachedFilterOptions;
    }

    console.log('Generating filter options...');
    onProgress?.('Generating filter options...', 0);

    const funds = await this.parseInstrumentsData(onProgress);

    const amcList = this.getUniqueValues(funds.map(f => f.realAmcName || f.amc));
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

  async getRangeValues(onProgress?: (phase: string, percent: number) => void): Promise<RangeValues> {
    // Return cached range values if available
    if (this.cachedRangeValues !== null) {
      console.log('Using cached range values');
      onProgress?.('Range values ready', 100);
      return this.cachedRangeValues;
    }

    console.log('Calculating range values...');
    onProgress?.('Calculating range values...', 0);

    const funds = await this.parseInstrumentsData(onProgress);

    const oneYearReturns = funds.map(f => f.oneYearPercent).filter(v => v !== null && v !== undefined);
    const expenseRatios = funds.map(f => f.expenseRatio).filter(v => v !== null && v !== undefined);
    const aums = funds.map(f => f.aum).filter(v => v !== null && v !== undefined);
    const minInvestments = funds.map(f => f.minPurchaseAmt).filter(v => v !== null && v !== undefined);
    const navs = funds.map(f => f.lastPrice).filter(v => v !== null && v !== undefined);

    // Extract exit load percentages from exit load strings
    const exitLoads = funds.map(f => {
      // If exit load is absent/null/undefined/empty, treat as 0
      if (!f.exitLoad || f.exitLoad === "" || f.exitLoad === "0" || f.exitLoad === "Nil" || f.exitLoad === "nil") return 0;

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
    }).filter(v => v !== null && v !== undefined);

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
export const getAllFunds = async (onProgress?: (phase: string, percent: number) => void) => await fundDataProcessor.parseInstrumentsData(onProgress);
export const getFilterOptions = async (onProgress?: (phase: string, percent: number) => void) => await fundDataProcessor.getFilterOptions(onProgress);
export const getRangeValues = async (onProgress?: (phase: string, percent: number) => void) => await fundDataProcessor.getRangeValues(onProgress);