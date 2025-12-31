import { type Candle } from '../types';

interface AssetMeta {
  symbol: string;
  assetClass: AssetClass;
  basePrice: number;
  pipSize: number;
  decimals: number;
  volatility: number;
  spread: number;
}

export type AssetClass =
  | 'Forex'
  | 'Cryptocurrency'
  | 'Commodities'
  | 'Stocks & Indices'
  | 'OTC'
  | 'Custom';

const defaultMetas: Record<string, AssetMeta> = {
  'EUR/USD': {
    symbol: 'EUR/USD',
    assetClass: 'Forex',
    basePrice: 1.08345,
    pipSize: 0.0001,
    decimals: 5,
    volatility: 0.002,
    spread: 0.0002,
  },
  'GBP/JPY': {
    symbol: 'GBP/JPY',
    assetClass: 'Forex',
    basePrice: 182.452,
    pipSize: 0.01,
    decimals: 3,
    volatility: 0.6,
    spread: 0.03,
  },
  'USD/JPY': {
    symbol: 'USD/JPY',
    assetClass: 'Forex',
    basePrice: 149.251,
    pipSize: 0.01,
    decimals: 3,
    volatility: 0.4,
    spread: 0.02,
  },
  'AUD/USD': {
    symbol: 'AUD/USD',
    assetClass: 'Forex',
    basePrice: 0.6684,
    pipSize: 0.0001,
    decimals: 5,
    volatility: 0.0015,
    spread: 0.00025,
  },
  'USD/CAD': {
    symbol: 'USD/CAD',
    assetClass: 'Forex',
    basePrice: 1.3542,
    pipSize: 0.0001,
    decimals: 5,
    volatility: 0.0018,
    spread: 0.00025,
  },
  'BTC/USD': {
    symbol: 'BTC/USD',
    assetClass: 'Cryptocurrency',
    basePrice: 63750,
    pipSize: 1,
    decimals: 2,
    volatility: 1200,
    spread: 15,
  },
  'ETH/USD': {
    symbol: 'ETH/USD',
    assetClass: 'Cryptocurrency',
    basePrice: 3250,
    pipSize: 0.5,
    decimals: 2,
    volatility: 60,
    spread: 2,
  },
  'SOL/USD': {
    symbol: 'SOL/USD',
    assetClass: 'Cryptocurrency',
    basePrice: 145,
    pipSize: 0.1,
    decimals: 2,
    volatility: 3.5,
    spread: 0.35,
  },
  'XAU/USD': {
    symbol: 'XAU/USD',
    assetClass: 'Commodities',
    basePrice: 2350,
    pipSize: 0.1,
    decimals: 2,
    volatility: 12,
    spread: 0.4,
  },
  'XAG/USD': {
    symbol: 'XAG/USD',
    assetClass: 'Commodities',
    basePrice: 29.45,
    pipSize: 0.01,
    decimals: 3,
    volatility: 0.35,
    spread: 0.05,
  },
  US30: {
    symbol: 'US30',
    assetClass: 'Stocks & Indices',
    basePrice: 39050,
    pipSize: 1,
    decimals: 1,
    volatility: 85,
    spread: 5,
  },
  NAS100: {
    symbol: 'NAS100',
    assetClass: 'Stocks & Indices',
    basePrice: 15120,
    pipSize: 0.5,
    decimals: 1,
    volatility: 55,
    spread: 3,
  },
  'IDR/OTC': {
    symbol: 'IDR/OTC',
    assetClass: 'OTC',
    basePrice: 1.5023,
    pipSize: 0.0001,
    decimals: 5,
    volatility: 0.0008,
    spread: 0.00035,
  },
  'Weekend Index': {
    symbol: 'Weekend Index',
    assetClass: 'OTC',
    basePrice: 875.5,
    pipSize: 0.1,
    decimals: 1,
    volatility: 6.4,
    spread: 1.2,
  },
};

export const getAssetMeta = (symbol: string): AssetMeta => {
  if (defaultMetas[symbol]) {
    return defaultMetas[symbol];
  }
  return {
    symbol,
    assetClass: 'Custom',
    basePrice: 100,
    pipSize: 0.01,
    decimals: 2,
    volatility: 1.5,
    spread: 0.08,
  };
};

export const assetClassOptions: Record<AssetClass, string[]> = {
  Forex: ['EUR/USD', 'GBP/JPY', 'USD/JPY', 'AUD/USD', 'USD/CAD'],
  Cryptocurrency: ['BTC/USD', 'ETH/USD', 'SOL/USD'],
  Commodities: ['XAU/USD', 'XAG/USD'],
  'Stocks & Indices': ['US30', 'NAS100'],
  OTC: ['IDR/OTC', 'Weekend Index'],
  Custom: [],
};

export type TimeframeCode =
  | 'S5'
  | 'S15'
  | 'S30'
  | 'M1'
  | 'M3'
  | 'M5'
  | 'M15'
  | 'M30'
  | 'H1'
  | 'H4'
  | 'D1'
  | 'W1'
  | 'MN';

export const binaryTimeframes: { label: string; value: TimeframeCode; seconds: number }[] = [
  { label: '5 detik', value: 'S5', seconds: 5 },
  { label: '15 detik', value: 'S15', seconds: 15 },
  { label: '30 detik', value: 'S30', seconds: 30 },
  { label: '1 menit', value: 'M1', seconds: 60 },
  { label: '3 menit', value: 'M3', seconds: 180 },
  { label: '5 menit', value: 'M5', seconds: 300 },
  { label: '15 menit', value: 'M15', seconds: 900 },
  { label: '30 menit', value: 'M30', seconds: 1800 },
  { label: '1 jam', value: 'H1', seconds: 3600 },
];

export const forexTimeframes: { label: string; value: TimeframeCode; seconds: number }[] = [
  { label: '1 menit', value: 'M1', seconds: 60 },
  { label: '5 menit', value: 'M5', seconds: 300 },
  { label: '15 menit', value: 'M15', seconds: 900 },
  { label: '30 menit', value: 'M30', seconds: 1800 },
  { label: '1 jam', value: 'H1', seconds: 3600 },
  { label: '4 jam', value: 'H4', seconds: 14400 },
  { label: '1 hari', value: 'D1', seconds: 86400 },
  { label: '1 minggu', value: 'W1', seconds: 604800 },
  { label: '1 bulan', value: 'MN', seconds: 2592000 },
];

export const getSecondsForTimeframe = (code: TimeframeCode): number => {
  const all = [...binaryTimeframes, ...forexTimeframes];
  return all.find((entry) => entry.value === code)?.seconds ?? 60;
};

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

const createNextCandle = (prev: Candle | null, meta: AssetMeta, seconds: number): Candle => {
  const base = prev?.close ?? meta.basePrice;
  const volatilityFactor = meta.volatility * Math.sqrt(seconds / 60);
  const change = randomBetween(-volatilityFactor, volatilityFactor);
  const close = Math.max(0.0001, base + change);

  const wickRange = Math.abs(change) * randomBetween(1, 2.5);
  const high = close + wickRange * 0.5;
  const low = Math.max(0.0001, close - wickRange * 0.5);
  const open = prev?.close ?? base;
  const volume =
    (Math.abs(change) / meta.pipSize + randomBetween(10, 40)) * (seconds / 60 + 0.5) * 100;

  const time = prev ? prev.time + seconds * 1000 : Date.now();

  return {
    time,
    open,
    high,
    low,
    close,
    volume,
  };
};

export const generateInitialCandles = (
  symbol: string,
  timeframe: TimeframeCode,
  length = 240,
): Candle[] => {
  const meta = getAssetMeta(symbol);
  const seconds = getSecondsForTimeframe(timeframe);
  const candles: Candle[] = [];
  let prev: Candle | null = null;

  for (let i = 0; i < length; i += 1) {
    const candle = createNextCandle(prev, meta, seconds);
    candles.push(candle);
    prev = candle;
  }
  return candles;
};

export const appendNewCandle = (
  candles: Candle[],
  symbol: string,
  timeframe: TimeframeCode,
): Candle[] => {
  const meta = getAssetMeta(symbol);
  const seconds = getSecondsForTimeframe(timeframe);
  const prev = candles[candles.length - 1] ?? null;
  const next = createNextCandle(prev, meta, seconds);
  const nextCandles = [...candles.slice(-(Math.max(500, candles.length) - 1)), next];
  return nextCandles;
};

export const formatPrice = (value: number, symbol: string): string => {
  const { decimals } = getAssetMeta(symbol);
  return value.toFixed(decimals);
};

export const getBidAsk = (price: number, symbol: string) => {
  const { spread } = getAssetMeta(symbol);
  return {
    bid: price - spread / 2,
    ask: price + spread / 2,
  };
};

export const calculateTPSL = (price: number, direction: 'Bullish' | 'Bearish', symbol: string) => {
  const { pipSize } = getAssetMeta(symbol);
  const stopPips = 25;
  const tpMultiplier = 4;
  const stopDistance = pipSize * stopPips;
  const takeDistance = stopDistance * tpMultiplier;

  if (direction === 'Bullish') {
    return {
      sl: price - stopDistance,
      tp: price + takeDistance,
    };
  }
  return {
    sl: price + stopDistance,
    tp: price - takeDistance,
  };
};

export const estimateConfidenceScore = (
  indicators: { williamsR: number | null; cci: number | null; forceIndex: number | null },
  supplyBias: 'Bullish' | 'Bearish' | 'Neutral',
): number => {
  let score = 50;

  if (indicators.williamsR !== null) {
    if (indicators.williamsR < -80) score += 12;
    if (indicators.williamsR > -20) score -= 12;
  }
  if (indicators.cci !== null) {
    if (indicators.cci > 100) score += 10;
    if (indicators.cci < -100) score -= 10;
  }
  if (indicators.forceIndex !== null) {
    if (indicators.forceIndex > 0) score += 8;
    if (indicators.forceIndex < 0) score -= 8;
  }

  if (supplyBias === 'Bullish') score += 8;
  if (supplyBias === 'Bearish') score -= 8;

  return Math.max(0, Math.min(100, Math.round(score)));
};

