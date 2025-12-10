import { FundData } from '@/types/fund';
import FundCard from './FundCard';

interface FundListProps {
  funds: FundData[];
  loading?: boolean;
}

export default function FundList({ funds, loading = false }: FundListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (funds.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No funds found</h3>
        <p className="text-gray-500">Try adjusting your filters or search criteria</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {funds.map((fund) => (
        // <div key={fund.tradingSymbol} className="fade-in">
        //   {/* FundCard component would go here */}
        //   <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        //     <div className="flex justify-between items-start mb-4">
        //       <div className="flex-1">
        //         <h3 className="text-lg font-semibold text-gray-800 mb-1">{fund.fund}</h3>
        //         <p className="text-sm text-gray-600 mb-2">{fund.amc}</p>
        //         <div className="flex gap-2 flex-wrap">
        //           <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
        //             {fund.scheme}
        //           </span>
        //           <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
        //             {fund.plan}
        //           </span>
        //         </div>
        //       </div>
        //       <div className="text-right">
        //         <div className="text-2xl font-bold text-gray-800">₹{fund.lastPrice.toFixed(2)}</div>
        //         <div className={`text-sm font-medium ${fund.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        //           {fund.changePercent >= 0 ? '+' : ''}{fund.changePercent.toFixed(2)}%
        //         </div>
        //       </div>
        //     </div>

        //     <div className="grid grid-cols-2 gap-4 mb-4">
        //       <div>
        //         <p className="text-xs text-gray-500 mb-1">1Y Return</p>
        //         <p className={`text-sm font-semibold ${fund.oneYearPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        //           {fund.oneYearPercent >= 0 ? '+' : ''}{fund.oneYearPercent.toFixed(2)}%
        //         </p>
        //       </div>
        //       <div>
        //         <p className="text-xs text-gray-500 mb-1">AUM</p>
        //         <p className="text-sm font-semibold text-gray-700">
        //           ₹{(fund.aum / 10000000).toFixed(0)}Cr
        //         </p>
        //       </div>
        //     </div>

        //     <div className="border-t pt-4">
        //       <div className="flex justify-between items-center text-sm">
        //         <div>
        //           <p className="text-xs text-gray-500 mb-1">Min Investment</p>
        //           <p className="font-medium text-gray-700">₹{fund.minPurchaseAmt.toLocaleString()}</p>
        //         </div>
        //         <div>
        //           <p className="text-xs text-gray-500 mb-1">Expense Ratio</p>
        //           <p className="font-medium text-gray-700">{fund.expenseRatio}%</p>
        //         </div>
        //       </div>
        //     </div>
        //   </div>
        // </div>
        <FundCard fund={fund} />
      ))}
    </div>
  );
}