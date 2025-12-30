# convert_to_parquet.py
import json
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from pathlib import Path

# -----------------------------
# 1. Load the JSON files
# -----------------------------
print("Loading JSON files...")
with open('u.json', 'r', encoding='utf-8') as f:
    u = json.load(f)

with open('s.json', 'r', encoding='utf-8') as f:
    s = json.load(f)

# -----------------------------
# 2. Create static data map: tradingSymbol → static fields
# -----------------------------
print("Building static data map...")
static_map = {}
for row in s['n9']:
    (
        tradingSymbol, amc, fund, minPurchaseAmt, purchaseAmtMulti,
        minAdditionalPurchaseAmt, minRedemptionQty, redemptionQtyMulti,
        dividendType, dividendInterval, scheme, subScheme, plan,
        settlementType, launchDate, exitLoad, exitLoadSlab,
        expenseRatio, amcSipFlag, manager, lockIn, risk
    ) = row
    
    static_map[tradingSymbol] = {
        'amc': amc,
        'fund': fund,
        'minPurchaseAmt': minPurchaseAmt,
        'purchaseAmtMulti': purchaseAmtMulti,
        'minAdditionalPurchaseAmt': minAdditionalPurchaseAmt,
        'minRedemptionQty': minRedemptionQty,
        'redemptionQtyMulti': redemptionQtyMulti,
        'dividendType': dividendType,
        'dividendInterval': dividendInterval,
        'scheme': scheme,
        'subScheme': subScheme,
        'plan': plan,
        'settlementType': settlementType,
        'launchDate': launchDate,
        'exitLoad': exitLoad,
        'exitLoadSlab': exitLoadSlab,
        'expenseRatio': expenseRatio,
        'amcSipFlag': amcSipFlag,
        'manager': manager,
        'lockIn': lockIn,
        'risk': risk
    }

# -----------------------------
# 3. Create factsheet map: amc → {link, name}
# -----------------------------
factsheet_map = {row[0]: {'link': row[1], 'name': row[2]} for row in u['FC']}

# -----------------------------
# 4. Build the final list of fund records
# -----------------------------
print("Merging dynamic and static data...")
funds = []
for row in u['n9']:
    (
        tradingSymbol, purchaseAllowed, redemptionAllowed, lastDividendDate,
        lastDividendPercent, lastPrice, lastPriceDate, changePercent,
        oneYearPercent, twoYearPercent, threeYearPercent,
        fourYearPercent, fiveYearPercent, aum
    ) = row
    
    static = static_map.get(tradingSymbol, {})
    factsheet = factsheet_map.get(static.get('amc'), {})
    
    fund_record = {
        'tradingSymbol': tradingSymbol,
        'purchaseAllowed': bool(purchaseAllowed),
        'redemptionAllowed': bool(redemptionAllowed),
        'lastDividendDate': lastDividendDate or '',
        'lastDividendPercent': lastDividendPercent or 0.0,
        'lastPrice': lastPrice or 0.0,
        'lastPriceDate': lastPriceDate or '',
        'changePercent': changePercent or 0.0,
        'oneYearPercent': oneYearPercent or 0.0,
        'twoYearPercent': twoYearPercent or 0.0,
        'threeYearPercent': threeYearPercent or 0.0,
        'fourYearPercent': fourYearPercent or 0.0,
        'fiveYearPercent': fiveYearPercent or 0.0,
        'aum': (aum * 10_000_000) if aum is not None else 0.0,  # same as JS
        'amc': static.get('amc', ''),
        'fund': static.get('fund', ''),
        'minPurchaseAmt': static.get('minPurchaseAmt', 0.0),
        'purchaseAmtMulti': static.get('purchaseAmtMulti', 0.0),
        'minAdditionalPurchaseAmt': static.get('minAdditionalPurchaseAmt', 0.0),
        'minRedemptionQty': static.get('minRedemptionQty', 0.0),
        'redemptionQtyMulti': static.get('redemptionQtyMulti', 0.0),
        'dividendType': static.get('dividendType', ''),
        'dividendInterval': static.get('dividendInterval', ''),
        'scheme': static.get('scheme', ''),
        'subScheme': static.get('subScheme', ''),
        'plan': static.get('plan', 0),
        'settlementType': static.get('settlementType', ''),
        'launchDate': static.get('launchDate', ''),
        'exitLoad': static.get('exitLoad', ''),
        'exitLoadSlab': str(static.get('exitLoadSlab', 0)),
        'expenseRatio': static.get('expenseRatio', 0.0),
        'amcSipFlag': bool(static.get('amcSipFlag')),
        'manager': static.get('manager', ''),
        'lockIn': static.get('lockIn', 0),
        'risk': static.get('risk', 0),
        'factsheetLink': factsheet.get('link', ''),
        'realAmcName': factsheet.get('name', '')
    }
    funds.append(fund_record)

# -----------------------------
# 5. Convert to DataFrame → PyArrow Table
# -----------------------------
print(f"Created {len(funds)} fund records. Converting to Parquet...")
df = pd.DataFrame(funds)

# Ensure correct dtypes (especially integers vs floats)
dtypes = {
    'plan': 'int32',
    'lockIn': 'int32',
    'risk': 'int32',
    'minPurchaseAmt': 'float64',
    'purchaseAmtMulti': 'float64',
    'minAdditionalPurchaseAmt': 'float64',
    'minRedemptionQty': 'float64',
    'redemptionQtyMulti': 'float64',
    'expenseRatio': 'float64',
    'lastDividendPercent': 'float64',
    'lastPrice': 'float64',
    'changePercent': 'float64',
    'oneYearPercent': 'float64',
    'twoYearPercent': 'float64',
    'threeYearPercent': 'float64',
    'fourYearPercent': 'float64',
    'fiveYearPercent': 'float64',
    'aum': 'float64'
}
df = df.astype(dtypes)
# Sort for better run-length/dictionary efficiency
df = df.sort_values(['amc', 'risk', 'scheme', 'dividendType']).reset_index(drop=True)
table = pa.Table.from_pandas(df, preserve_index=False)

# -----------------------------
# 6. Write highly compressed Parquet file
# -----------------------------
output_path = Path('data.parquet')
pq.write_table(
    table,
    output_path,
    compression='zstd',          # Best compression ratio + fast decompression
    compression_level=19,        # Higher = better compression (max 22, 19 is great balance)
    use_dictionary=True,         # Crucial for repetitive strings (amc, scheme, risk, etc.)
    write_statistics=True,
    flavor='spark'               # Optional: better compatibility if needed
)

print(f"Conversion completed! Saved to '{output_path}'")
print(f"File size: {output_path.stat().st_size / (1024*1024):.2f} MB")

# Optional: compare with original JSON sizes
u_size = Path('u.json').stat().st_size / (1024*1024)
s_size = Path('s.json').stat().st_size / (1024*1024)
print(f"Original u.json: {u_size:.2f} MB, s.json: {s_size:.2f} MB")