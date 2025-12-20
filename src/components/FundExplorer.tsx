'use client';

import { useState, useEffect } from 'react';
import { FundData, FundFilters } from '@/types/fund';
import { getAllFunds, getFilterOptions, getRangeValues } from '@/lib/fundData';
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

  // Load data
  useEffect(() => {
    async function loadData() {
      const funds = await getAllFunds();
      const options = await getFilterOptions();
      const ranges = await getRangeValues();
      setAllFunds(funds);
      setFilterOptions(options);
      setRangeValues(ranges);
      setFilteredFunds(funds);
    }
    loadData();
  }, []);

  // Load filters from local storage on client side only
  useEffect(() => {
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
      const searchLower = filters.search.toLowerCase();
      result = result.filter(fund =>
        fund.fundLowerCase.includes(searchLower) ||
        fund.amc.toLowerCase().includes(searchLower) ||
        fund.scheme.toLowerCase().includes(searchLower) ||
        fund.manager.toLowerCase().includes(searchLower)
      );
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
          default:
            return 0;
        }
      });
    }

    setFilteredFunds(result);
  }, [allFunds, filters]);

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
    if (filters.manager?.length) activeFilters.push(`Manager: ${filters.manager.join(', ')}`);
    if (filters.excludeStrings?.length) activeFilters.push(`Exclude: ${filters.excludeStrings.join(', ')}`);
    if (filters.oneYearReturn) activeFilters.push(`1Y Return: ${filters.oneYearReturn[0]}% - ${filters.oneYearReturn[1]}%`);
    if (filters.expenseRatioRange) activeFilters.push(`Expense Ratio: ${filters.expenseRatioRange[0]}% - ${filters.expenseRatioRange[1]}%`);
    if (filters.exitLoadRange) activeFilters.push(`Exit Load: ${filters.exitLoadRange[0]}% - ${filters.exitLoadRange[1]}%`);
    if (filters.aumRange) activeFilters.push(`AUM: ₹${(filters.aumRange[0]/10000000).toFixed(0)}Cr - ₹${(filters.aumRange[1]/10000000).toFixed(0)}Cr`);
    if (filters.minInvestmentRange) activeFilters.push(`Min Investment: ₹${filters.minInvestmentRange[0].toLocaleString()} - ₹${filters.minInvestmentRange[1].toLocaleString()}`);
    if (filters.navRange) activeFilters.push(`NAV: ₹${filters.navRange[0].toFixed(2)} - ₹${filters.navRange[1].toFixed(2)}`);
    if (filters.launchYearRange) activeFilters.push(`Launch Year: ${filters.launchYearRange[0]} - ${filters.launchYearRange[1]}`);
    if (filters.sort) activeFilters.push(`Sort: ${filters.sort.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`);

    return {
      count: activeFilters.length,
      descriptions: activeFilters
    };
  };

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
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Funds</div>
              <div className="text-2xl font-bold text-blue-600">{allFunds.length}</div>
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

        {/* Results Summary */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {filteredFunds.length} Funds Found
            </h2>
            <div className="text-sm text-gray-500">
              Sorted by: {filters.sort ? filters.sort.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Relevance'}
            </div>
          </div>
        </div>

        {/* Fund List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFunds.slice(0, 50).map((fund) => (
            <FundCard fund={fund} onManagerClick={handleManagerSort}/>
          ))}
        </div>

        {filteredFunds.length > 50 && (
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