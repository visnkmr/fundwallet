'use client';

import { useState, useEffect } from 'react';
import { FundData, FundFilters } from '@/types/fund';
import { getAllFunds, getFilterOptions } from '@/lib/fundData';
import FilterPanel from './FilterPanel';
import FundList from './FundList';

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
              Sorted by: Relevance
            </div>
          </div>
        </div>

        {/* Fund List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFunds.slice(0, 12).map((fund) => (
            <div key={fund.tradingSymbol} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{fund.fund}</h3>
                  <p className="text-sm text-gray-600 mb-2">{fund.amc}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {fund.scheme}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {fund.plan}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-800">{formatCurrency(fund.lastPrice)}</div>
                  <div className={`text-sm font-medium ${getChangeColor(fund.changePercent)}`}>
                    {formatPercent(fund.changePercent)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">1Y Return</p>
                  <p className={`text-sm font-semibold ${getChangeColor(fund.oneYearPercent)}`}>
                    {formatPercent(fund.oneYearPercent)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">AUM</p>
                  <p className="text-sm font-semibold text-gray-700">
                    ₹{(fund.aum / 10000000).toFixed(0)}Cr
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Min Investment</p>
                    <p className="font-medium text-gray-700">₹{fund.minPurchaseAmt.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Expense Ratio</p>
                    <p className="font-medium text-gray-700">{fund.expenseRatio}%</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredFunds.length > 12 && (
          <div className="text-center mt-8">
            <p className="text-gray-500">Showing first 12 results. Use filters to narrow down results.</p>
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