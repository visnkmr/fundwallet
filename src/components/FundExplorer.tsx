'use client';

import { useState, useEffect } from 'react';
import { FundData, FundFilters } from '@/types/fund';
import { getAllFunds, getFilterOptions } from '@/lib/fundData';
import FilterPanel from './FilterPanel';
import FundList from './FundList';
import FundCard from './FundCard';

export default function FundExplorer() {
  const [allFunds] = useState<FundData[]>(getAllFunds());
  const [filterOptions] = useState(getFilterOptions());
  const [filteredFunds, setFilteredFunds] = useState<FundData[]>(allFunds);
  const [filters, setFilters] = useState<FundFilters>({});

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
      result = result.filter(fund => filters.amc!.includes(fund.amc));
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
        if (fund.exitLoad && fund.exitLoad !== "0" && fund.exitLoad !== "Nil") {
          const match = fund.exitLoad.match(/(\d+\.?\d*)%/);
          exitLoadValue = match ? parseFloat(match[1]) : 0;
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
        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
        />

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