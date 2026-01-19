'use client';

import { useState, useEffect } from 'react';
import { FundData, FundFilters } from '@/types/fund';
import { getAllFunds, getFilterOptions, getRangeValues, fundDataProcessor } from '@/lib/fundData';
import FilterPanel from './FilterPanel';
import FundList from './FundList';
import FundCard from './FundCard';

const STORAGE_KEY = 'fundwallet-filters';

export default function FundExplorer() {
  const [allFunds, setAllFunds] = useState<FundData[]>([]);
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const [rangeValues, setRangeValues] = useState<any>(null);
  const [filteredFunds, setFilteredFunds] = useState<FundData[]>([]);
  const [filters, setFilters] = useState<FundFilters>({});
  const [loading, setLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState('');
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadedSJson, setUploadedSJson] = useState<any>(null);
  const [uploadedUJson, setUploadedUJson] = useState<any>(null);
  const [fundChanges, setFundChanges] = useState<Map<string, any>>(new Map());
  const [activeTab, setActiveTab] = useState<'all' | 'changes'>('all');
  const [dataUrl, setDataUrl] = useState<string>('');

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setLoadingPhase('Initializing...');
      setLoadingPercent(0);
      const funds = await getAllFunds((phase, percent) => {
        setLoadingPhase(phase);
        setLoadingPercent(percent);
      });
      const options = await getFilterOptions((phase, percent) => {
        setLoadingPhase(phase);
        setLoadingPercent(percent);
      });
      const ranges = await getRangeValues((phase, percent) => {
        setLoadingPhase(phase);
        setLoadingPercent(percent);
      });
      setAllFunds(funds);
      setFilterOptions(options);
      setRangeValues(ranges);
      setFilteredFunds(funds);
      setLoading(false);
    }
    loadData();
  }, []);

  // Load data URL and filters from local storage on client side only
  useEffect(() => {
    const storedUrl = localStorage.getItem('fundwallet-data-url');
    if (storedUrl) {
      setDataUrl(storedUrl);
      fundDataProcessor.setDataUrl(storedUrl);
    }
    if (allFunds.length === 0) return;
    const storedFilters = loadFiltersFromStorage();
    if (storedFilters && Object.keys(storedFilters).length > 0) {
      // Use stored filters if they exist
      setFilters(storedFilters);
    } else {
      // Set default filters if no stored filters exist
      setFilters({
        plan: ['Direct'],
        dividendInterval: ['Growth'],
        sort: 'cagr1y-desc',
        purchaseAllowed: [true]
      });
    }
  }, []);

  // Save filters to local storage whenever they change
  useEffect(() => {
    saveFiltersToStorage(filters);
  }, [filters]);

  useEffect(() => {
    let result = allFunds;

    // Apply search filter
    if (filters.search) {
      const searchTerms = filters.search.toLowerCase().split(/\s+/).filter(term => term.length > 0);
      result = result.filter(fund => {
        const fundText = (fund.fundLowerCase + ' ' + fund.amc.toLowerCase() + ' ' + fund.scheme.toLowerCase() + ' ' + fund.manager.toLowerCase()).toLowerCase();
        return searchTerms.every(term => fundText.includes(term));
      });
    }

    // Apply exclude filter
    if (filters.excludeStrings && filters.excludeStrings.length > 0) {
      result = result.filter(fund => {
        const fundNameLower = fund.fundLowerCase;
        return !filters.excludeStrings!.some(excludeString =>
          fundNameLower.includes(excludeString.toLowerCase())
        );
      });
    }

    // Apply category filters
    if (filters.amc && filters.amc.length > 0) {
      result = result.filter(fund => filters.amc!.includes(fund.realAmcName || fund.amc));
    }

    if (filters.scheme && filters.scheme.length > 0) {
      result = result.filter(fund => filters.scheme!.includes(fund.scheme));
    }

    if (filters.plan && filters.plan.length > 0) {
      result = result.filter(fund => filters.plan!.includes(fund.plan));
    }

    if (filters.dividendInterval && filters.dividendInterval.length > 0) {
      result = result.filter(fund => filters.dividendInterval!.includes(fund.dividendInterval));
    }

    if (filters.risk && filters.risk.length > 0) {
      result = result.filter(fund => filters.risk!.includes(fund.risk));
    }

    if (filters.launchYearRange) {
      result = result.filter(fund => {
        const launchYear = new Date(fund.launchDate).getFullYear();
        return launchYear >= filters.launchYearRange![0] && launchYear <= filters.launchYearRange![1];
      });
    }

    if (filters.manager && filters.manager.length > 0) {
      result = result.filter(fund => filters.manager!.includes(fund.manager));
    }

    if (filters.settlementType && filters.settlementType.length > 0) {
      result = result.filter(fund => filters.settlementType!.includes(fund.settlementType));
    }

    if (filters.purchaseAllowed && filters.purchaseAllowed.length > 0) {
      result = result.filter(fund => filters.purchaseAllowed!.includes(fund.purchaseAllowed));
    }

    if (filters.redemptionAllowed && filters.redemptionAllowed.length > 0) {
      result = result.filter(fund => filters.redemptionAllowed!.includes(fund.redemptionAllowed));
    }

    if (filters.amcSipFlag && filters.amcSipFlag.length > 0) {
      result = result.filter(fund => filters.amcSipFlag!.includes(fund.amcSipFlag));
    }

    if (filters.subScheme && filters.subScheme.length > 0) {
      result = result.filter(fund => filters.subScheme!.includes(fund.subScheme));
    }

    if (filters.lockIn && filters.lockIn.length > 0) {
      result = result.filter(fund => filters.lockIn!.includes(fund.lockIn));
    }

    // Apply range filters
    if (filters.minInvestmentRange) {
      result = result.filter(fund =>
        fund.minPurchaseAmt >= filters.minInvestmentRange![0] &&
        fund.minPurchaseAmt <= filters.minInvestmentRange![1]
      );
    }

    if (filters.navRange) {
      result = result.filter(fund =>
        fund.lastPrice >= filters.navRange![0] &&
        fund.lastPrice <= filters.navRange![1]
      );
    }

    if (filters.expenseRatioRange) {
      result = result.filter(fund =>
        fund.expenseRatio >= filters.expenseRatioRange![0] &&
        fund.expenseRatio <= filters.expenseRatioRange![1]
      );
    }

    if (filters.exitLoadRange) {
      result = result.filter(fund => {
        // Extract exit load percentage from string
        let exitLoadValue = 0;
        // If exit load is absent/null/undefined/empty, treat as 0
        if (!fund.exitLoad || fund.exitLoad === "" || fund.exitLoad === "0" || fund.exitLoad === "Nil" || fund.exitLoad === "nil") {
          exitLoadValue = 0;
        } else {
          // Handle various exit load formats like "1%", "1.5%", "0.5% for 1 year", etc.
          const match = fund.exitLoad.match(/(\d+\.?\d*)%/);
          if (match) {
            exitLoadValue = parseFloat(match[1]);
          } else {
            // Try to extract any number that might be a percentage
            const numMatch = fund.exitLoad.match(/(\d+\.?\d*)/);
            if (numMatch) {
              const num = parseFloat(numMatch[1]);
              // If the number is between 0 and 100, assume it's a percentage
              if (num >= 0 && num <= 100) {
                exitLoadValue = num;
              }
            }
          }
        }
        return exitLoadValue >= filters.exitLoadRange![0] &&
          exitLoadValue <= filters.exitLoadRange![1];
      });
    }

    if (filters.oneYearReturn) {
      result = result.filter(fund =>
        fund.oneYearPercent >= filters.oneYearReturn![0] &&
        fund.oneYearPercent <= filters.oneYearReturn![1]
      );
    }

    if (filters.aumRange) {
      result = result.filter(fund =>
        fund.aum >= filters.aumRange![0] &&
        fund.aum <= filters.aumRange![1]
      );
    }

    // Apply sorting
    if (filters.sort) {
      result = [...result].sort((a, b) => {
        switch (filters.sort) {
          case 'cagr1y-asc':
            return a.oneYearPercent - b.oneYearPercent;
          case 'cagr1y-desc':
            return b.oneYearPercent - a.oneYearPercent;
          case 'minInvestment-asc':
            return a.minPurchaseAmt - b.minPurchaseAmt;
          case 'minInvestment-desc':
            return b.minPurchaseAmt - a.minPurchaseAmt;
          case 'exitLoad-asc':
            const aExitLoad = a.exitLoad && a.exitLoad !== "0" && a.exitLoad !== "Nil" ? parseFloat(a.exitLoad.match(/(\d+\.?\d*)%/)?.[1] || '0') : 0;
            const bExitLoad = b.exitLoad && b.exitLoad !== "0" && b.exitLoad !== "Nil" ? parseFloat(b.exitLoad.match(/(\d+\.?\d*)%/)?.[1] || '0') : 0;
            return aExitLoad - bExitLoad;
          case 'exitLoad-desc':
            const aExitLoadDesc = a.exitLoad && a.exitLoad !== "0" && a.exitLoad !== "Nil" ? parseFloat(a.exitLoad.match(/(\d+\.?\d*)%/)?.[1] || '0') : 0;
            const bExitLoadDesc = b.exitLoad && b.exitLoad !== "0" && b.exitLoad !== "Nil" ? parseFloat(b.exitLoad.match(/(\d+\.?\d*)%/)?.[1] || '0') : 0;
            return bExitLoadDesc - aExitLoadDesc;
          case 'expenseRatio-asc':
            return a.expenseRatio - b.expenseRatio;
           case 'expenseRatio-desc':
             return b.expenseRatio - a.expenseRatio;
           case 'priceChange-asc': {
             const aChange = fundChanges.get(a.tradingSymbol)?.lastPrice;
             const bChange = fundChanges.get(b.tradingSymbol)?.lastPrice;
             const aVal = aChange ? aChange.new - aChange.old : Number.MAX_VALUE;
             const bVal = bChange ? bChange.new - bChange.old : Number.MAX_VALUE;
             return aVal - bVal;
           }
           case 'priceChange-desc': {
             const aChange = fundChanges.get(a.tradingSymbol)?.lastPrice;
             const bChange = fundChanges.get(b.tradingSymbol)?.lastPrice;
             const aVal = aChange ? aChange.new - aChange.old : -Number.MAX_VALUE;
             const bVal = bChange ? bChange.new - bChange.old : -Number.MAX_VALUE;
             return bVal - aVal;
           }
           case 'expenseRatioChange-asc': {
             const aChange = fundChanges.get(a.tradingSymbol)?.expenseRatio;
             const bChange = fundChanges.get(b.tradingSymbol)?.expenseRatio;
             const aVal = aChange ? aChange.new - aChange.old : Number.MAX_VALUE;
             const bVal = bChange ? bChange.new - bChange.old : Number.MAX_VALUE;
             return aVal - bVal;
           }
           case 'expenseRatioChange-desc': {
             const aChange = fundChanges.get(a.tradingSymbol)?.expenseRatio;
             const bChange = fundChanges.get(b.tradingSymbol)?.expenseRatio;
             const aVal = aChange ? aChange.new - aChange.old : -Number.MAX_VALUE;
             const bVal = bChange ? bChange.new - bChange.old : -Number.MAX_VALUE;
             return bVal - aVal;
           }
           case 'aumChange-asc': {
             const aChange = fundChanges.get(a.tradingSymbol)?.aum;
             const bChange = fundChanges.get(b.tradingSymbol)?.aum;
             const aVal = aChange ? aChange.new - aChange.old : Number.MAX_VALUE;
             const bVal = bChange ? bChange.new - bChange.old : Number.MAX_VALUE;
             return aVal - bVal;
           }
           case 'aumChange-desc': {
             const aChange = fundChanges.get(a.tradingSymbol)?.aum;
             const bChange = fundChanges.get(b.tradingSymbol)?.aum;
             const aVal = aChange ? aChange.new - aChange.old : -Number.MAX_VALUE;
             const bVal = bChange ? bChange.new - bChange.old : -Number.MAX_VALUE;
             return bVal - aVal;
           }
           default:
             return 0;
        }
      });
    }

    setFilteredFunds(result);
  }, [allFunds, filters]);

  // Compare data when uploaded or funds change
  useEffect(() => {
    if (uploadedSJson && uploadedUJson && allFunds.length) {
      compareData();
    }
  }, [uploadedSJson, uploadedUJson, allFunds]);

  // Compute display funds based on tab
  const changesFilter = (fund: FundData) => {
    const change = fundChanges.get(fund.tradingSymbol);
    if (!change) return false;
    if (!filters.changedFields || filters.changedFields.length === 0) return true;
    return filters.changedFields.some(field => change.hasOwnProperty(field));
  };
  const displayFunds = activeTab === 'changes' ? filteredFunds.filter(changesFilter) : filteredFunds;
  const changesCount = filteredFunds.filter(changesFilter).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getChangeColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const handleManagerSort = (manager: string) => {
    setFilters(prev => ({
      ...prev,
      manager: [manager],
      sort: undefined // Clear any existing sort when filtering by manager
    }));
  };

  // Save filters to local storage
  const saveFiltersToStorage = (filters: FundFilters) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.error('Failed to save filters to local storage:', error);
    }
  };

  // Load filters from local storage
  const loadFiltersFromStorage = (): FundFilters | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load filters from local storage:', error);
      return null;
    }
  };

  // Copy filters to clipboard as JSON
  const copyFiltersToClipboard = () => {
    try {
      const filterJson = JSON.stringify(filters, null, 2);
      navigator.clipboard.writeText(filterJson);
      alert('Filters copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy filters:', error);
      alert('Failed to copy filters');
    }
  };

  // Paste filters from clipboard
  const pasteFiltersFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const parsedFilters = JSON.parse(clipboardText);
      setFilters(parsedFilters);
      alert('Filters applied from clipboard!');
    } catch (error) {
      console.error('Failed to paste filters:', error);
      alert('Failed to paste filters. Make sure the clipboard contains valid JSON.');
    }
  };

  // Handle data URL change
  const handleDataUrlChange = (url: string) => {
    setDataUrl(url);
    fundDataProcessor.setDataUrl(url);
    localStorage.setItem('fundwallet-data-url', url);
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 's' | 'u') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (type === 's') {
        setUploadedSJson(json.n9);
      } else {
        setUploadedUJson(json.n9);
      }
      // Trigger comparison if both are uploaded
      if ((type === 's' && uploadedUJson) || (type === 'u' && uploadedSJson)) {
        compareData();
      }
    } catch (error) {
      alert(`Error parsing ${type}.json: ${error}`);
    }
  };

  // Compare uploaded data with current
  const compareData = () => {
    if (!uploadedSJson || !uploadedUJson || !allFunds.length) return;

    const changes = new Map<string, any>();
    allFunds.forEach(fund => {
      const uploadedU = uploadedUJson.find((u: any) => u[0] === fund.tradingSymbol);
      const uploadedS = uploadedSJson.find((s: any) => s[0] === fund.tradingSymbol);
      if (uploadedU && uploadedS) {
        const change: any = {};
        // Compare prices (with epsilon for floats)
        if (Math.abs(uploadedU[5] - fund.lastPrice) > 0.01) change.lastPrice = { old: fund.lastPrice, new: uploadedU[5] };
        // Compare returns (with epsilon)
        if (Math.abs(uploadedU[8] - fund.oneYearPercent) > 0.01) change.oneYearPercent = { old: fund.oneYearPercent, new: uploadedU[8] };
        // Compare other returns
        if (Math.abs(uploadedU[9] - fund.twoYearPercent) > 0.01) change.twoYearPercent = { old: fund.twoYearPercent, new: uploadedU[9] };
        if (Math.abs(uploadedU[10] - fund.threeYearPercent) > 0.01) change.threeYearPercent = { old: fund.threeYearPercent, new: uploadedU[10] };
        // Compare AUM
        if (Math.abs((10000000 * uploadedU[13]) - fund.aum) > 100000) change.aum = { old: fund.aum, new: 10000000 * uploadedU[13] };
        // Compare dividend
        if (uploadedU[3] !== fund.lastDividendDate) change.lastDividendDate = { old: fund.lastDividendDate, new: uploadedU[3] };
        if (Math.abs(uploadedU[4] - fund.lastDividendPercent) > 0.01) change.lastDividendPercent = { old: fund.lastDividendPercent, new: uploadedU[4] };
        // Compare statuses
        if ((uploadedU[1] === 1) !== fund.purchaseAllowed) change.purchaseAllowed = { old: fund.purchaseAllowed, new: uploadedU[1] === 1 };
        if ((uploadedU[2] === 1) !== fund.redemptionAllowed) change.redemptionAllowed = { old: fund.redemptionAllowed, new: uploadedU[2] === 1 };
        // Compare SIP
        if ((uploadedS[18] === 1) !== fund.amcSipFlag) change.amcSipFlag = { old: fund.amcSipFlag, new: uploadedS[18] === 1 };
        // Compare expense ratio
        if (Math.abs(uploadedS[17] - fund.expenseRatio) > 0.01) change.expenseRatio = { old: fund.expenseRatio, new: uploadedS[17] };
        if (Object.keys(change).length > 0) changes.set(fund.tradingSymbol, change);
      }
    });
    setFundChanges(changes);
  };

  // Refresh data from remote
  const refreshData = async () => {
    setRefreshing(true);
    try {
      // Clear caches to force fresh data
      fundDataProcessor.clearCache();

      // Reload data
      const funds = await getAllFunds((phase, percent) => {
        setLoadingPhase(phase);
        setLoadingPercent(percent);
      });
      const options = await getFilterOptions((phase, percent) => {
        setLoadingPhase(phase);
        setLoadingPercent(percent);
      });
      const ranges = await getRangeValues((phase, percent) => {
        setLoadingPhase(phase);
        setLoadingPercent(percent);
      });

      setAllFunds(funds);
      setFilterOptions(options);
      setRangeValues(ranges);
      setFilteredFunds(funds);
      setLoading(false);

      alert('Data refreshed successfully!');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      alert('Failed to refresh data. Please check your internet connection.');
    } finally {
      setRefreshing(false);
    }
  };

  // Get active filter count and descriptions
  const getActiveFiltersInfo = () => {
    const activeFilters: string[] = [];

    if (filters.search) activeFilters.push(`Search: "${filters.search}"`);
    if (filters.amc?.length) activeFilters.push(`AMC: ${filters.amc.join(', ')}`);
    if (filters.scheme?.length) activeFilters.push(`Scheme: ${filters.scheme.join(', ')}`);
    if (filters.plan?.length) activeFilters.push(`Plan: ${filters.plan.join(', ')}`);
    if (filters.dividendInterval?.length) activeFilters.push(`Dividend: ${filters.dividendInterval.join(', ')}`);
    if (filters.risk?.length) {
      const riskLabels = filters.risk.map(r => r === 1 ? 'Low' : r === 3 ? 'Medium' : r === 5 ? 'High' : `Risk ${r}`);
      activeFilters.push(`Risk: ${riskLabels.join(', ')}`);
    }
    if (filters.settlementType?.length) activeFilters.push(`Settlement: ${filters.settlementType.join(', ')}`);
    if (filters.purchaseAllowed?.length) {
      const purchaseLabels = filters.purchaseAllowed.map(a => a ? 'Available' : 'Not Available');
      activeFilters.push(`Purchase: ${purchaseLabels.join(', ')}`);
    }
    if (filters.redemptionAllowed?.length) {
      const redemptionLabels = filters.redemptionAllowed.map(a => a ? 'Available' : 'Not Available');
      activeFilters.push(`Redemption: ${redemptionLabels.join(', ')}`);
    }
    if (filters.amcSipFlag?.length) {
      const sipLabels = filters.amcSipFlag.map(a => a ? 'Available' : 'Not Available');
      activeFilters.push(`SIP: ${sipLabels.join(', ')}`);
    }
    if (filters.subScheme?.length) activeFilters.push(`Sub-scheme: ${filters.subScheme.join(', ')}`);
    if (filters.lockIn?.length) activeFilters.push(`Lock-in: ${filters.lockIn.join(', ')} days`);
    if (filters.excludeStrings?.length) activeFilters.push(`Exclude: ${filters.excludeStrings.join(', ')}`);
    if (filters.oneYearReturn) activeFilters.push(`1Y Return: ${filters.oneYearReturn[0]}% - ${filters.oneYearReturn[1]}%`);
    if (filters.expenseRatioRange) activeFilters.push(`Expense Ratio: ${filters.expenseRatioRange[0]}% - ${filters.expenseRatioRange[1]}%`);
    if (filters.exitLoadRange) activeFilters.push(`Exit Load: ${filters.exitLoadRange[0]}% - ${filters.exitLoadRange[1]}%`);
    if (filters.aumRange) activeFilters.push(`AUM: ₹${(filters.aumRange[0]/10000000).toFixed(0)}Cr - ₹${(filters.aumRange[1]/10000000).toFixed(0)}Cr`);
    if (filters.minInvestmentRange) activeFilters.push(`Min Investment: ₹${filters.minInvestmentRange[0].toLocaleString()} - ₹${filters.minInvestmentRange[1].toLocaleString()}`);
    if (filters.navRange) activeFilters.push(`NAV: ₹${filters.navRange[0].toFixed(2)} - ₹${filters.navRange[1].toFixed(2)}`);
    if (filters.launchYearRange) activeFilters.push(`Launch Year: ${filters.launchYearRange[0]} - ${filters.launchYearRange[1]}`);
    if (filters.changedFields?.length) activeFilters.push(`Changed Fields: ${filters.changedFields.join(', ')}`);
    if (filters.sort) activeFilters.push(`Sort: ${filters.sort.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`);

    return {
      count: activeFilters.length,
      descriptions: activeFilters
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Fund Data</h2>
            <p className="text-gray-600 mb-4">{loadingPhase}</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${loadingPercent}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">{loadingPercent}% complete</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FundWallet</h1>
              <p className="text-gray-600 mt-1">Comprehensive Mutual Fund Explorer</p>
            </div>
            <div className="text-right flex items-center gap-4">
              <div>
                <div className="text-sm text-gray-500">Total Funds</div>
                <div className="text-2xl font-bold text-blue-600">{allFunds.length}</div>
              </div>
               <button
                 onClick={refreshData}
                 disabled={refreshing}
                 className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                 title="Refresh data from remote server"
               >
                 {refreshing ? (
                   <>
                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                     Refreshing...
                   </>
                 ) : (
                   <>
                     🔄 Refresh
                   </>
                 )}
               </button>
               <div className="flex gap-2">
                 <input
                   type="file"
                   accept=".json"
                   onChange={(e) => handleFileUpload(e, 's')}
                   className="text-sm"
                   title="Upload custom s.json"
                 />
                 <input
                   type="file"
                   accept=".json"
                   onChange={(e) => handleFileUpload(e, 'u')}
                   className="text-sm"
                   title="Upload custom u.json"
                 />
               </div>
               <input
                 type="text"
                 value={dataUrl}
                 onChange={(e) => handleDataUrlChange(e.target.value)}
                 placeholder="Data URL"
                 className="ml-4 px-2 py-1 text-sm border border-gray-300 rounded"
                 title="URL for funds data binary"
               />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Active Filters Display */}
        {(() => {
          const activeFiltersInfo = getActiveFiltersInfo();
          return activeFiltersInfo.count > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-sm font-medium text-blue-800">
                    Active Filters ({activeFiltersInfo.count})
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeFiltersInfo.descriptions.map((desc, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {desc}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyFiltersToClipboard}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    title="Copy filters as JSON"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={pasteFiltersFromClipboard}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    title="Paste filters from JSON"
                  >
                    📄 Paste
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Filter Panel */}
        {rangeValues && filterOptions && (
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            filterOptions={filterOptions}
            rangeValues={rangeValues}
          />
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Funds ({filteredFunds.length})
              </button>
              <button
                onClick={() => setActiveTab('changes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'changes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Changes Only ({changesCount})
              </button>
            </nav>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {displayFunds.length} Funds Found
            </h2>
            <div className="text-sm text-gray-500">
              Sorted by: {filters.sort ? filters.sort.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Relevance'}
            </div>
          </div>
        </div>

        {/* Fund List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayFunds.slice(0, 50).map((fund) => (
            <FundCard fund={fund} onManagerClick={handleManagerSort} changes={fundChanges.get(fund.tradingSymbol)}/>
          ))}
        </div>

        {displayFunds.length > 50 && (
          <div className="text-center mt-8">
            <p className="text-gray-500">Showing first 50 results. Use filters to narrow down results.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>FundWallet - Mutual Fund Explorer</p>
            <p className="text-sm mt-2">Data sourced from AMC information</p>
          </div>
        </div>
      </footer>
    </div>
  );
}