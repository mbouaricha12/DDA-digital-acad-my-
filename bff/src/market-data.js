'use strict';

// Lot 8 (cahier des charges — instruments de marché) : adaptateur serveur
// pour les 6 instruments demandés par la maquette "Marchés"
// (XAUUSD, EURUSD, GBPUSD, USDJPY, US30, BTCUSD).
//
// Doctrine identique à la BRVM et à Chariow : aucune clé de fournisseur
// n'est jamais exposée au navigateur, et aucune cotation n'est jamais
// affichée comme réelle sans un appel serveur réussi et récent. Tant
// qu'aucune clé n'est configurée (état réel en production aujourd'hui,
// voir docs/DDA_MARKET_DATA_SOURCE_COMPARISON_2026-11-14.md), chaque
// instrument répond honnêtement `not_configured` — jamais une valeur
// fabriquée ou une dernière valeur connue périmée.
//
// Un seul fournisseur ne couvre pas honnêtement les 6 instruments sur un
// palier gratuit (voir le comparatif) : ce module reste donc multi-
// fournisseur par construction — chaque instrument déclare son propre
// fournisseur dans INSTRUMENT_REGISTRY, jamais un fournisseur unique
// supposé universel.

const INSTRUMENT_REGISTRY = Object.freeze({
  XAUUSD: { provider: 'twelvedata', providerSymbol: 'XAU/USD', label: 'Or / Dollar' },
  EURUSD: { provider: 'twelvedata', providerSymbol: 'EUR/USD', label: 'Euro / Dollar' },
  GBPUSD: { provider: 'twelvedata', providerSymbol: 'GBP/USD', label: 'Livre / Dollar' },
  USDJPY: { provider: 'twelvedata', providerSymbol: 'USD/JPY', label: 'Dollar / Yen' },
  US30: { provider: 'twelvedata', providerSymbol: 'DJI', label: 'Indice Dow Jones' },
  BTCUSD: { provider: 'coingecko', providerSymbol: 'bitcoin', label: 'Bitcoin / Dollar' }
});

function marketDataConfigFromEnv(env = process.env) {
  return {
    twelveDataApiKey: env.TWELVEDATA_API_KEY || null,
    coinGeckoApiKey: env.COINGECKO_API_KEY || null,
    // A quote older than this is never served — the caller gets
    // 'unavailable' instead of a stale number silently re-served.
    maxAgeMs: Number(env.MARKET_DATA_MAX_AGE_MS) || 5 * 60 * 1000
  };
}

function providerConfigured(provider, config) {
  if (provider === 'twelvedata') return Boolean(config.twelveDataApiKey);
  if (provider === 'coingecko') return Boolean(config.coinGeckoApiKey);
  return false;
}

async function fetchTwelveData(providerSymbol, config, fetchImpl) {
  const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(providerSymbol)}&apikey=${encodeURIComponent(config.twelveDataApiKey)}`;
  const response = await fetchImpl(url);
  const data = await response.json();
  if (!response.ok || !data || typeof data.price === 'undefined' || data.status === 'error') {
    throw Object.assign(new Error('twelvedata_request_failed'), { status: response.status, details: data });
  }
  const price = Number(data.price);
  if (!Number.isFinite(price)) throw new Error('twelvedata_invalid_price');
  return price;
}

async function fetchCoinGecko(providerSymbol, config, fetchImpl) {
  const headers = config.coinGeckoApiKey ? { 'x-cg-demo-api-key': config.coinGeckoApiKey } : {};
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(providerSymbol)}&vs_currencies=usd`;
  const response = await fetchImpl(url, { headers });
  const data = await response.json();
  const price = Number(data?.[providerSymbol]?.usd);
  if (!response.ok || !Number.isFinite(price)) {
    throw Object.assign(new Error('coingecko_request_failed'), { status: response.status, details: data });
  }
  return price;
}

const FETCHERS = Object.freeze({ twelvedata: fetchTwelveData, coingecko: fetchCoinGecko });

/**
 * Returns the real, server-verified status of every instrument in
 * INSTRUMENT_REGISTRY. Never throws — a per-instrument provider failure is
 * reported as `unavailable` for that instrument alone, so one bad call
 * never takes the whole panel down with it.
 */
async function fetchMarketQuotes({ config = marketDataConfigFromEnv(), fetchImpl = fetch, clock = () => new Date() } = {}) {
  const now = clock();
  const entries = await Promise.all(Object.entries(INSTRUMENT_REGISTRY).map(async ([symbol, meta]) => {
    if (!providerConfigured(meta.provider, config)) {
      return [symbol, { status: 'not_configured', label: meta.label }];
    }
    try {
      const price = await FETCHERS[meta.provider](meta.providerSymbol, config, fetchImpl);
      return [symbol, { status: 'ok', label: meta.label, price, asOf: now.toISOString(), provider: meta.provider }];
    } catch {
      return [symbol, { status: 'unavailable', label: meta.label }];
    }
  }));
  return Object.fromEntries(entries);
}

module.exports = { INSTRUMENT_REGISTRY, marketDataConfigFromEnv, providerConfigured, fetchMarketQuotes };
