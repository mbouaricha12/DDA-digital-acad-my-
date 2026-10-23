(function (root) {
  'use strict';

  const TIMEFRAMES = new Set(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w']);
  const REQUIRED_HEADERS = ['timestamp', 'open', 'high', 'low', 'close', 'volume'];
  const MIN_BARS = 20;
  const MAX_BARS = 250;
  const MAX_CSV_BYTES = 24 * 1024;
  const MAX_REQUEST_BYTES = 48 * 1024;

  function fail(code) {
    const error = new Error(code);
    error.code = code;
    throw error;
  }

  function bytes(value) {
    if (typeof TextEncoder === 'function') return new TextEncoder().encode(value).length;
    return unescape(encodeURIComponent(value)).length;
  }

  function requiredText(value, maxLength) {
    return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
  }

  function parseNumber(value, code) {
    const text = value.trim();
    if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) fail(code);
    const number = Number(text);
    if (!Number.isFinite(number)) fail(code);
    return number;
  }

  function parseCsvLine(line, code) {
    const cells = [];
    let value = '';
    let quoted = false;
    let quoteClosed = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (quoted) {
        if (character === '"' && line[index + 1] === '"') {
          value += '"';
          index += 1;
        } else if (character === '"') {
          quoted = false;
          quoteClosed = true;
        } else {
          value += character;
        }
      } else if (character === ',') {
        cells.push(value);
        value = '';
        quoteClosed = false;
      } else if (character === '"' && value.trim() === '' && !quoteClosed) {
        value = '';
        quoted = true;
      } else if (character === '"' || (quoteClosed && character.trim() !== '')) {
        fail(code);
      } else {
        value += character;
      }
    }
    if (quoted) fail(code);
    cells.push(value);
    return cells;
  }

  function parseHistoricalCsv(csv, metadata, options = {}) {
    if (typeof csv !== 'string' || !csv.trim()) fail('csv_required');
    if (bytes(csv) > MAX_CSV_BYTES) fail('csv_too_large');
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) fail('metadata_invalid');

    const { symbol, venue, assetClass, currency, timeframe, licenseRef = '' } = metadata;
    if (![symbol, venue, assetClass, currency].every(value => requiredText(value, 32))) fail('metadata_invalid');
    if (!TIMEFRAMES.has(timeframe)) fail('timeframe_invalid');
    if (typeof licenseRef !== 'string' || licenseRef.length > 200) fail('metadata_invalid');

    const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length < MIN_BARS + 1 || lines.length > MAX_BARS + 1) fail('csv_row_count');
    const headers = parseCsvLine(lines[0], 'csv_header_invalid').map(value => value.trim().toLowerCase());
    if (headers.length !== REQUIRED_HEADERS.length || headers.some((value, index) => value !== REQUIRED_HEADERS[index])) {
      fail('csv_header_invalid');
    }

    const asOf = options.asOf === undefined ? new Date() : new Date(options.asOf);
    if (!Number.isFinite(asOf.getTime())) fail('analysis_time_invalid');
    const bars = [];
    let previousTimestamp = -Infinity;

    for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
      const cells = parseCsvLine(lines[lineIndex], `csv_row_${lineIndex + 1}_invalid`);
      if (cells.length !== REQUIRED_HEADERS.length) fail(`csv_row_${lineIndex + 1}_invalid`);
      const timeText = cells[0].trim();
      if (!/T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(timeText)) fail(`csv_timestamp_${lineIndex + 1}_invalid`);
      const parsedTime = Date.parse(timeText);
      if (!Number.isFinite(parsedTime)) fail(`csv_timestamp_${lineIndex + 1}_invalid`);
      if (parsedTime <= previousTimestamp) fail(`csv_time_order_${lineIndex + 1}_invalid`);
      if (parsedTime > asOf.getTime()) fail(`csv_future_timestamp_${lineIndex + 1}`);
      previousTimestamp = parsedTime;

      const [open, high, low, close, volume] = cells.slice(1).map(value => parseNumber(value, `csv_number_${lineIndex + 1}_invalid`));
      if ([open, high, low, close].some(value => value <= 0) || volume < 0) fail(`csv_price_${lineIndex + 1}_invalid`);
      if (high < Math.max(open, close, low) || low > Math.min(open, close, high)) fail(`csv_ohlc_${lineIndex + 1}_invalid`);
      bars.push({ timestamp: new Date(parsedTime).toISOString(), open, high, low, close, volume });
    }

    const retrievedAt = asOf.toISOString();
    const series = {
      contract_version: 'dda.market-series.v1',
      instrument: {
        symbol: symbol.trim(),
        venue: venue.trim(),
        asset_class: assetClass.trim(),
        currency: currency.trim()
      },
      timeframe,
      data_mode: 'historical',
      source: {
        id: 'user-csv-import',
        kind: 'historical_import',
        ...(licenseRef.trim() ? { license_ref: licenseRef.trim() } : {})
      },
      retrieved_at: retrievedAt,
      bars
    };
    if (bytes(JSON.stringify({ series })) > MAX_REQUEST_BYTES) fail('csv_payload_too_large');
    return series;
  }

  const api = Object.freeze({
    MIN_BARS,
    MAX_BARS,
    MAX_CSV_BYTES,
    MAX_REQUEST_BYTES,
    parseHistoricalCsv
  });

  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.DDAAutoTraderHistoryImport = api;
})(typeof window !== 'undefined' ? window : globalThis);
