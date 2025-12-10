import { FundData } from '@/types/fund';

interface FundCardProps {
  fund: FundData;
}

export default function FundCard({ fund }: FundCardProps) {
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

  const getRiskColor = (risk: number) => {
    if (risk <= 2) return 'bg-green-100 text-green-800';
    if (risk <= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getRiskLabel = (risk: number) => {
    if (risk <= 2) return 'Low Risk';
    if (risk <= 4) return 'Medium Risk';
    return 'High Risk';
  };

  const getChangeColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
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
            <span className={`px-2 py-1 text-xs rounded-full ${getRiskColor(fund.risk)}`}>
              {getRiskLabel(fund.risk)}
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">1Y Return</p>
          <p className={`text-sm font-semibold ${getChangeColor(fund.oneYearPercent)}`}>
            {formatPercent(fund.oneYearPercent)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">3Y Return</p>
          <p className={`text-sm font-semibold ${getChangeColor(fund.threeYearPercent)}`}>
            {formatPercent(fund.threeYearPercent)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">5Y Return</p>
          <p className={`text-sm font-semibold ${getChangeColor(fund.fiveYearPercent)}`}>
            {formatPercent(fund.fiveYearPercent)}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1">Min Investment</p>
            <p className="font-medium text-gray-700">{formatCurrency(fund.minPurchaseAmt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Expense Ratio</p>
            <p className="font-medium text-gray-700">{fund.expenseRatio}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Dividend</p>
            <p className="font-medium text-gray-700">{fund.dividendInterval}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">
            Fund Manager: <span className="font-medium text-gray-700">{fund.manager}</span>
          </p>
          <p className="text-xs text-gray-500">
            Launch: <span className="font-medium text-gray-700">{fund.launchDate}</span>
          </p>
        </div>
        {fund.exitLoad && fund.exitLoad !== '0' && (
          <p className="text-xs text-orange-600 mt-2">
            Exit Load: {fund.exitLoad}
          </p>
        )}
      </div>
    </div>
  );
}