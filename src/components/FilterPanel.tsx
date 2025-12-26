'use client';

import { useState } from 'react';
import { FundFilters } from '@/types/fund';
import RangeSlider from './RangeSlider';
import { getRangeValues } from '@/lib/fundData';

interface FilterPanelProps {
  filters: FundFilters;
  onFiltersChange: (filters: FundFilters) => void;
  filterOptions: any;
  rangeValues: any;
}

export default function FilterPanel({ filters, onFiltersChange, filterOptions, rangeValues }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [amcSearch, setAmcSearch] = useState('');
  const [managerSearch, setManagerSearch] = useState('');
  const [selectAllAmc, setSelectAllAmc] = useState(true);
  const [selectAllManager, setSelectAllManager] = useState(true);

  const handleCheckboxChange = (category: keyof FundFilters, value: string) => {
    // Handle different filter types appropriately
    if (category === 'risk' || category === 'lockIn') {
      // These are number arrays
      const currentValues = (filters[category] as number[]) || [];
      const numValue = parseInt(value);
      const newValues = currentValues.includes(numValue)
        ? currentValues.filter(v => v !== numValue)
        : [...currentValues, numValue];

      onFiltersChange({
        ...filters,
        [category]: newValues.length > 0 ? newValues : undefined
      });
    } else if (category === 'purchaseAllowed' || category === 'redemptionAllowed' || category === 'amcSipFlag') {
      // These are boolean arrays
      const currentValues = (filters[category] as boolean[]) || [];
      const boolValue = value === 'true';
      const newValues = currentValues.includes(boolValue)
        ? currentValues.filter(v => v !== boolValue)
        : [...currentValues, boolValue];

      onFiltersChange({
        ...filters,
        [category]: newValues.length > 0 ? newValues : undefined
      });
    } else {
      // Default string array handling
      const currentValues = (filters[category] as string[]) || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];

      onFiltersChange({
        ...filters,
        [category]: newValues.length > 0 ? newValues : undefined
      });
    }
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      search: value || undefined
    });
  };

  const handleExcludeChange = (value: string) => {
    const excludeStrings = value ? value.split(',').map(s => s.trim()).filter(s => s.length > 0) : undefined;
    onFiltersChange({
      ...filters,
      excludeStrings
    });
  };

  const handleRangeChange = (category: keyof FundFilters, value: [number, number]) => {
    onFiltersChange({
      ...filters,
      [category]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Filter Funds</h2>
        <div className="flex gap-2">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

       {/* Search */}
       <div className="mb-6">
         <label className="block text-sm font-medium text-gray-700 mb-2">Search Funds</label>
         <input
           type="text"
           placeholder="Search by fund name, AMC, or scheme..."
           value={filters.search || ''}
           onChange={(e) => handleSearchChange(e.target.value)}
           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
         />
       </div>

       {/* Exclude Filter */}
       <div className="mb-6">
         <label className="block text-sm font-medium text-gray-700 mb-2">Exclude Funds</label>
         <input
           type="text"
           placeholder="Enter strings to exclude (comma-separated, e.g., 'bonus, dividend')"
           value={filters.excludeStrings ? filters.excludeStrings.join(', ') : ''}
           onChange={(e) => handleExcludeChange(e.target.value)}
           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
         />
         <p className="text-xs text-gray-500 mt-1">Funds containing these strings in their name will be hidden</p>
       </div>

       {/* Sort Options */}
       <div className="mb-6">
         <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
         <select
           value={filters.sort || ''}
           onChange={(e) => onFiltersChange({ ...filters, sort: e.target.value || undefined })}
           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
         >
           <option value="">Relevance</option>
           <option value="cagr1y-asc">CAGR 1Y (Low to High)</option>
           <option value="cagr1y-desc">CAGR 1Y (High to Low)</option>
           <option value="minInvestment-asc">Min Investment (Low to High)</option>
           <option value="minInvestment-desc">Min Investment (High to Low)</option>
           <option value="exitLoad-asc">Exit Load (Low to High)</option>
           <option value="exitLoad-desc">Exit Load (High to Low)</option>
           <option value="expenseRatio-asc">Expense Ratio (Low to High)</option>
           <option value="expenseRatio-desc">Expense Ratio (High to Low)</option>
         </select>
       </div>

      {isExpanded && (
        <>
          {/* Range Filters Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Range Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Min Investment Range */}
              <RangeSlider
                label="Min Investment"
                min={rangeValues.minInvestment.min}
                max={rangeValues.minInvestment.max}
                value={filters.minInvestmentRange || [rangeValues.minInvestment.min, rangeValues.minInvestment.max]}
                onChange={(value) => handleRangeChange('minInvestmentRange', value)}
                format={(v) => `₹${v.toLocaleString('en-IN')}`}
                step={100}
              />

              {/* NAV Range */}
              <RangeSlider
                label="NAV (Price)"
                min={rangeValues.nav.min}
                max={rangeValues.nav.max}
                value={filters.navRange || [rangeValues.nav.min, rangeValues.nav.max]}
                onChange={(value) => handleRangeChange('navRange', value)}
                format={(v) => `₹${v.toFixed(2)}`}
                step={0.01}
              />

              {/* Expense Ratio Range */}
              <RangeSlider
                label="Expense Ratio"
                min={rangeValues.expenseRatio.min}
                max={rangeValues.expenseRatio.max}
                value={filters.expenseRatioRange || [rangeValues.expenseRatio.min, rangeValues.expenseRatio.max]}
                onChange={(value) => handleRangeChange('expenseRatioRange', value)}
                format={(v) => `${v.toFixed(2)}%`}
                step={0.01}
              />

              {/* Exit Load Range */}
              <RangeSlider
                label="Exit Load"
                min={rangeValues.exitLoad.min}
                max={rangeValues.exitLoad.max}
                value={filters.exitLoadRange || [rangeValues.exitLoad.min, rangeValues.exitLoad.max]}
                onChange={(value) => handleRangeChange('exitLoadRange', value)}
                format={(v) => `${v.toFixed(2)}%`}
                step={0.01}
              />

              {/* 1-Year Return (CAGR) Range */}
              <RangeSlider
                label="1-Year Return (CAGR)"
                min={rangeValues.oneYearReturn.min}
                max={rangeValues.oneYearReturn.max}
                value={filters.oneYearReturn || [rangeValues.oneYearReturn.min, rangeValues.oneYearReturn.max]}
                onChange={(value) => handleRangeChange('oneYearReturn', value)}
                format={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`}
                step={0.1}
              />

               {/* AUM Range */}
               <RangeSlider
                 label="AUM (Assets Under Management)"
                 min={rangeValues.aum.min}
                 max={rangeValues.aum.max}
                 value={filters.aumRange || [rangeValues.aum.min, rangeValues.aum.max]}
                 onChange={(value) => handleRangeChange('aumRange', value)}
                 format={(v) => `₹${(v / 10000000).toFixed(0)}Cr`}
                 step={1000000}
               />

               {/* Launch Year Range */}
               <RangeSlider
                 label="Launch Year"
                 min={rangeValues.launchYear.min}
                 max={rangeValues.launchYear.max}
                 value={filters.launchYearRange || [rangeValues.launchYear.min, rangeValues.launchYear.max]}
                 onChange={(value) => handleRangeChange('launchYearRange', value)}
                 format={(v) => v.toString()}
                 step={1}
               />
             </div>
           </div>

          {/* Checkbox Filters Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Category Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {/* AMC Filter */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">AMC</label>
                  <input
                    type="text"
                    placeholder="Search AMC..."
                    value={amcSearch}
                    onChange={(e) => setAmcSearch(e.target.value)}
                    className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                   <label className="flex items-center hover:bg-gray-50 p-1 rounded mb-2">
                     <input
                       type="checkbox"
                       checked={selectAllAmc}
                       onChange={(e) => {
                         setSelectAllAmc(e.target.checked);
                         if (e.target.checked) {
                           onFiltersChange({ ...filters, amc: undefined });
                         } else {
                           onFiltersChange({ ...filters, amc: [] });
                         }
                       }}
                       className="mr-2 rounded text-blue-500 focus:ring-blue-500"
                     />
                     <span className="text-sm font-medium text-gray-700">Select All AMCs</span>
                   </label>
                   <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                     {filterOptions.amc?.sort().filter((amc: string) => amc.toLowerCase().includes(amcSearch.toLowerCase())).map((amc: string) => (
                      <label key={amc} className="flex items-center hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={selectAllAmc || (filters.amc?.includes(amc) || false)}
                          onChange={() => {
                            const current = filters.amc || [];
                            let newAmc;
                            if (current.includes(amc)) {
                              newAmc = current.filter(v => v !== amc);
                            } else {
                              newAmc = [...current, amc];
                            }
                            if (newAmc.length === filterOptions.amc?.length) {
                              setSelectAllAmc(true);
                              newAmc = undefined;
                            } else {
                              setSelectAllAmc(false);
                            }
                            onFiltersChange({ ...filters, amc: newAmc });
                          }}
                          className="mr-2 rounded text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{amc}</span>
                      </label>
                    ))}
                </div>
              </div>

              {/* Scheme Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scheme Type</label>
                <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                   {filterOptions.scheme?.sort().map((scheme: string) => (
                    <label key={scheme} className="flex items-center hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={filters.scheme?.includes(scheme) || false}
                        onChange={() => handleCheckboxChange('scheme', scheme)}
                        className="mr-2 rounded text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{scheme}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Plan Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
                <div className="space-y-2 border border-gray-200 rounded-lg p-3">
                   {filterOptions.plan?.sort().map((plan: string) => (
                    <label key={plan} className="flex items-center hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={filters.plan?.includes(plan) || false}
                        onChange={() => handleCheckboxChange('plan', plan)}
                        className="mr-2 rounded text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{plan}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dividend Interval Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dividend Interval</label>
                <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                   {filterOptions.dividendInterval?.sort().map((interval: string) => (
                    <label key={interval} className="flex items-center hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={filters.dividendInterval?.includes(interval) || false}
                        onChange={() => handleCheckboxChange('dividendInterval', interval)}
                        className="mr-2 rounded text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{interval}</span>
                    </label>
                  ))}
                </div>
              </div>

               {/* Risk Filter */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
                 <div className="space-y-2 border border-gray-200 rounded-lg p-3">
                    {filterOptions.risk?.sort((a: number, b: number) => a - b).map((risk: number) => (
                     <label key={risk} className="flex items-center hover:bg-gray-50 p-1 rounded">
                       <input
                         type="checkbox"
                         checked={filters.risk?.includes(risk) || false}
                         onChange={() => handleCheckboxChange('risk', risk.toString())}
                         className="mr-2 rounded text-blue-500 focus:ring-blue-500"
                       />
                       <span className="text-sm text-gray-700">
                         {risk === 1 ? 'Low Risk' : risk === 3 ? 'Medium Risk' : risk === 5 ? 'High Risk' : `Risk ${risk}`}
                       </span>
                     </label>
                   ))}
                 </div>
               </div>



                {/* Fund Manager Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fund Manager</label>
                  <input
                    type="text"
                    placeholder="Search Fund Manager..."
                    value={managerSearch}
                    onChange={(e) => setManagerSearch(e.target.value)}
                    className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                   <label className="flex items-center hover:bg-gray-50 p-1 rounded mb-2">
                     <input
                       type="checkbox"
                       checked={selectAllManager}
                       onChange={(e) => {
                         setSelectAllManager(e.target.checked);
                         if (e.target.checked) {
                           onFiltersChange({ ...filters, manager: undefined });
                         } else {
                           onFiltersChange({ ...filters, manager: [] });
                         }
                       }}
                       className="mr-2 rounded text-blue-500 focus:ring-blue-500"
                     />
                     <span className="text-sm font-medium text-gray-700">Select All Fund Managers</span>
                   </label>
                   <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                     {filterOptions.manager?.sort().filter((manager: string) => manager.toLowerCase().includes(managerSearch.toLowerCase())).map((manager: string) => (
                      <label key={manager} className="flex items-center hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={selectAllManager || (filters.manager?.includes(manager) || false)}
                          onChange={() => {
                            const current = filters.manager || [];
                            let newManager;
                            if (current.includes(manager)) {
                              newManager = current.filter(v => v !== manager);
                            } else {
                              newManager = [...current, manager];
                            }
                            if (newManager.length === filterOptions.manager?.length) {
                              setSelectAllManager(true);
                              newManager = undefined;
                            } else {
                              setSelectAllManager(false);
                            }
                            onFiltersChange({ ...filters, manager: newManager });
                          }}
                          className="mr-2 rounded text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{manager}</span>
                      </label>
                    ))}
                 </div>
               </div>

               {/* Settlement Type Filter */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Settlement Type</label>
                 <div className="space-y-2 border border-gray-200 rounded-lg p-3">
                   {filterOptions.settlementType?.sort().map((settlementType: string) => (
                     <label key={settlementType} className="flex items-center hover:bg-gray-50 p-1 rounded">
                       <input
                         type="checkbox"
                         checked={filters.settlementType?.includes(settlementType) || false}
                         onChange={() => handleCheckboxChange('settlementType', settlementType)}
                         className="mr-2 rounded text-blue-500 focus:ring-blue-500"
                       />
                       <span className="text-sm text-gray-700">{settlementType}</span>
                     </label>
                   ))}
                 </div>
               </div>

               {/* Availability Filters */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Fund Availability</label>
                 <div className="space-y-2 border border-gray-200 rounded-lg p-3">
                   <div className="space-y-1">
                     <label className="flex items-center hover:bg-gray-50 p-1 rounded">
                       <input
                         type="checkbox"
                         checked={filters.purchaseAllowed?.includes(true) || false}
                         onChange={(e) => {
                           const currentValues = filters.purchaseAllowed || [];
                           const newValues = e.target.checked
                             ? [...currentValues, true]
                             : currentValues.filter(v => v !== true);
                           onFiltersChange({
                             ...filters,
                             purchaseAllowed: newValues.length > 0 ? newValues : undefined
                           });
                         }}
                         className="mr-2 rounded text-green-500 focus:ring-green-500"
                       />
                       <span className="text-sm text-gray-700">Purchase Available</span>
                     </label>
                     <label className="flex items-center hover:bg-gray-50 p-1 rounded">
                       <input
                         type="checkbox"
                         checked={filters.purchaseAllowed?.includes(false) || false}
                         onChange={(e) => {
                           const currentValues = filters.purchaseAllowed || [];
                           const newValues = e.target.checked
                             ? [...currentValues, false]
                             : currentValues.filter(v => v !== false);
                           onFiltersChange({
                             ...filters,
                             purchaseAllowed: newValues.length > 0 ? newValues : undefined
                           });
                         }}
                         className="mr-2 rounded text-red-500 focus:ring-red-500"
                       />
                       <span className="text-sm text-gray-700">Purchase Not Available</span>
                     </label>
                   </div>

                   <div className="space-y-1">
                     <label className="flex items-center hover:bg-gray-50 p-1 rounded">
                       <input
                         type="checkbox"
                         checked={filters.redemptionAllowed?.includes(true) || false}
                         onChange={(e) => {
                           const currentValues = filters.redemptionAllowed || [];
                           const newValues = e.target.checked
                             ? [...currentValues, true]
                             : currentValues.filter(v => v !== true);
                           onFiltersChange({
                             ...filters,
                             redemptionAllowed: newValues.length > 0 ? newValues : undefined
                           });
                         }}
                         className="mr-2 rounded text-green-500 focus:ring-green-500"
                       />
                       <span className="text-sm text-gray-700">Redemption Available</span>
                     </label>
                     <label className="flex items-center hover:bg-gray-50 p-1 rounded">
                       <input
                         type="checkbox"
                         checked={filters.redemptionAllowed?.includes(false) || false}
                         onChange={(e) => {
                           const currentValues = filters.redemptionAllowed || [];
                           const newValues = e.target.checked
                             ? [...currentValues, false]
                             : currentValues.filter(v => v !== false);
                           onFiltersChange({
                             ...filters,
                             redemptionAllowed: newValues.length > 0 ? newValues : undefined
                           });
                         }}
                         className="mr-2 rounded text-red-500 focus:ring-red-500"
                       />
                       <span className="text-sm text-gray-700">Redemption Not Available</span>
                     </label>
                   </div>

                   <div className="space-y-1">
                     <label className="flex items-center hover:bg-gray-50 p-1 rounded">
                       <input
                         type="checkbox"
                         checked={filters.amcSipFlag?.includes(true) || false}
                         onChange={(e) => {
                           const currentValues = filters.amcSipFlag || [];
                           const newValues = e.target.checked
                             ? [...currentValues, true]
                             : currentValues.filter(v => v !== true);
                           onFiltersChange({
                             ...filters,
                             amcSipFlag: newValues.length > 0 ? newValues : undefined
                           });
                         }}
                         className="mr-2 rounded text-green-500 focus:ring-green-500"
                       />
                       <span className="text-sm text-gray-700">SIP Available</span>
                     </label>
                     <label className="flex items-center hover:bg-gray-50 p-1 rounded">
                       <input
                         type="checkbox"
                         checked={filters.amcSipFlag?.includes(false) || false}
                         onChange={(e) => {
                           const currentValues = filters.amcSipFlag || [];
                           const newValues = e.target.checked
                             ? [...currentValues, false]
                             : currentValues.filter(v => v !== false);
                           onFiltersChange({
                             ...filters,
                             amcSipFlag: newValues.length > 0 ? newValues : undefined
                           });
                         }}
                         className="mr-2 rounded text-red-500 focus:ring-red-500"
                       />
                       <span className="text-sm text-gray-700">SIP Not Available</span>
                     </label>
                   </div>
                 </div>
               </div>

               {/* Sub Scheme Filter */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Sub Scheme</label>
                 <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                   {filterOptions.subScheme?.sort().map((subScheme: string) => (
                     <label key={subScheme} className="flex items-center hover:bg-gray-50 p-1 rounded">
                       <input
                         type="checkbox"
                         checked={filters.subScheme?.includes(subScheme) || false}
                         onChange={() => handleCheckboxChange('subScheme', subScheme)}
                         className="mr-2 rounded text-blue-500 focus:ring-blue-500"
                       />
                       <span className="text-sm text-gray-700">{subScheme}</span>
                     </label>
                   ))}
                 </div>
               </div>

               {/* Lock-in Period Filter */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Lock-in Period</label>
                 <div className="space-y-2 border border-gray-200 rounded-lg p-3">
                   {filterOptions.lockIn?.sort((a: number, b: number) => a - b).map((lockIn: number) => (
                     <label key={lockIn} className="flex items-center hover:bg-gray-50 p-1 rounded">
                       <input
                         type="checkbox"
                         checked={filters.lockIn?.includes(lockIn) || false}
                         onChange={() => handleCheckboxChange('lockIn', lockIn.toString())}
                         className="mr-2 rounded text-blue-500 focus:ring-blue-500"
                       />
                       <span className="text-sm text-gray-700">{lockIn} days</span>
                     </label>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}