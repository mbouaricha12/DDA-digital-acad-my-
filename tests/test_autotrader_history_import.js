'use strict';

const assert = require('node:assert/strict');
const { MAX_BARS, MIN_BARS, parseHistoricalCsv } = require('../dist/autotrader-history-import');

const asOf = new Date('2026-10-18T00:00:00.000Z');
const metadata = { symbol: 'TEST', venue: 'USER_IMPORT', assetClass: 'equity', currency: 'USD', timeframe: '1d', licenseRef: 'user-authorized-history' };
function csvRows(count = MIN_BARS) {
  const rows = ['timestamp,open,high,low,close,volume'];
  const start = Date.parse('2026-09-01T00:00:00.000Z');
  for (let i = 0; i < count; i += 1) {
    const close = 100 + i;
    rows.push(`${new Date(start + i * 86_400_000).toISOString()},${close - 0.5},${close + 1},${close - 1},${close},${1000 + i}`);
  }
  return rows.join('\n');
}
function expectCode(fn, code) {
  assert.throws(fn, error => error.code === code, `expected error code ${code}`);
}

const series = parseHistoricalCsv(csvRows(), metadata, { asOf });
assert.equal(series.contract_version, 'dda.market-series.v1');
assert.equal(series.data_mode, 'historical');
assert.equal(series.source.kind, 'historical_import');
assert.equal(series.source.license_ref, 'user-authorized-history');
assert.equal(series.bars.length, MIN_BARS);
assert.equal(series.bars.at(-1).timestamp, '2026-09-20T00:00:00.000Z');
const quotedCsv = csvRows().split('\n').map(line => line.split(',').map(value => `"${value}"`).join(',')).join('\n');
assert.equal(parseHistoricalCsv(quotedCsv, metadata, { asOf }).bars.length, MIN_BARS);

expectCode(() => parseHistoricalCsv(csvRows(), { ...metadata, timeframe: '1s' }, { asOf }), 'timeframe_invalid');
expectCode(() => parseHistoricalCsv(csvRows().replace('timestamp,open,high,low,close,volume', 'date,open,high,low,close,volume'), metadata, { asOf }), 'csv_header_invalid');
expectCode(() => parseHistoricalCsv(csvRows().replace('99.5,101,99,100,1000', '100,99,101,100,1000'), metadata, { asOf }), 'csv_ohlc_2_invalid');
expectCode(() => parseHistoricalCsv(csvRows().replace('2026-09-01T00:00:00.000Z', '2026-09-01 00:00:00'), metadata, { asOf }), 'csv_timestamp_2_invalid');
expectCode(() => parseHistoricalCsv(csvRows().replace('2026-09-02T00:00:00.000Z', '2026-09-01T00:00:00.000Z'), metadata, { asOf }), 'csv_time_order_3_invalid');
expectCode(() => parseHistoricalCsv(csvRows().replace('2026-09-01T00:00:00.000Z', '2026-10-19T00:00:00.000Z'), metadata, { asOf }), 'csv_future_timestamp_2');
expectCode(() => parseHistoricalCsv(csvRows(MIN_BARS - 1), metadata, { asOf }), 'csv_row_count');
expectCode(() => parseHistoricalCsv(csvRows(MAX_BARS + 1), metadata, { asOf }), 'csv_row_count');
expectCode(() => parseHistoricalCsv('x'.repeat(24 * 1024 + 1), metadata, { asOf }), 'csv_too_large');
expectCode(() => parseHistoricalCsv(csvRows(), { ...metadata, symbol: ' ' }, { asOf }), 'metadata_invalid');

console.log('AutoTrader historical CSV import tests: 11 passed');
