import { type Candle, type IndicatorSnapshot, type SupplyDemandAnalysis } from '../types';

const safeDiv = (a: number, b: number) => {
  if (b === 0) {
    return 0;
  }
  return a / b;
};

const simpleMovingAverage = (values: number[], period: number): number | null => {
  if (values.length < period) {
    return null;
  }
  const slice = values.slice(values.length - period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return sum / period;
};

export const calculateWilliamsR = (candles: Candle[], period = 14): number | null => {
  if (candles.length < period) {
    return null;
  }
  const relevant = candles.slice(-period);
  const highestHigh = Math.max(...relevant.map((c) => c.high));
  const lowestLow = Math.min(...relevant.map((c) => c.low));
  const { close } = candles[candles.length - 1];

  if (highestHigh === lowestLow) {
    return 0;
  }

  const value = -100 * safeDiv(highestHigh - close, highestHigh - lowestLow);
  return Number(value.toFixed(2));
};

export const calculateCCI = (candles: Candle[], period = 5): number | null => {
  if (candles.length < period) {
    return null;
  }

  const relevant = candles.slice(-period);
  const typicalPrices = relevant.map((c) => (c.high + c.low + c.close) / 3);
  const typicalPrice =
    (candles[candles.length - 1].high +
      candles[candles.length - 1].low +
      candles[candles.length - 1].close) /
    3;
  const smaTypical = simpleMovingAverage(typicalPrices, period);

  if (smaTypical === null) {
    return null;
  }

  const meanDeviation =
    typicalPrices.reduce((acc, price) => acc + Math.abs(price - smaTypical), 0) / period;

  if (meanDeviation === 0) {
    return 0;
  }

  const cci = (typicalPrice - smaTypical) / (0.015 * meanDeviation);
  return Number(cci.toFixed(2));
};

export const calculateForceIndex = (candles: Candle[], period = 13): number | null => {
  if (candles.length < period + 1) {
    return null;
  }
  const forceValues: number[] = [];

  for (let i = period * -1; i < 0; i += 1) {
    const current = candles[candles.length + i];
    const prev = candles[candles.length + i - 1];
    if (!current || !prev) {
      continue;
    }
    forceValues.push((current.close - prev.close) * current.volume);
  }

  if (forceValues.length === 0) {
    return null;
  }

  const force = forceValues.reduce((acc, val) => acc + val, 0) / forceValues.length;
  return Number(force.toFixed(2));
};

export const detectVolumeSpike = (candles: Candle[], period = 20, multiplier = 1.5): boolean => {
  if (candles.length < period) {
    return false;
  }
  const recent = candles.slice(-period);
  const volumes = recent.map((c) => c.volume);
  const averageVolume = simpleMovingAverage(volumes, period);
  const latestVolume = candles[candles.length - 1].volume;

  if (averageVolume === null) {
    return false;
  }

  return latestVolume > averageVolume * multiplier;
};

export const detectDoji = (candle: Candle | undefined, tolerance = 0.1): boolean => {
  if (!candle) {
    return false;
  }
  const body = Math.abs(candle.close - candle.open);
  const range = candle.high - candle.low;

  if (range === 0) {
    return false;
  }
  return body / range <= tolerance;
};

export const buildIndicatorSnapshot = (candles: Candle[]): IndicatorSnapshot => ({
  williamsR: calculateWilliamsR(candles),
  cci: calculateCCI(candles),
  forceIndex: calculateForceIndex(candles),
  volumeSpike: detectVolumeSpike(candles),
  isDoji: detectDoji(candles[candles.length - 1]),
});

const calculateRegressionSlope = (values: number[]): number => {
  const n = values.length;
  if (n === 0) {
    return 0;
  }
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((acc, val) => acc + val, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i += 1) {
    const x = i - meanX;
    const y = values[i] - meanY;
    numerator += x * y;
    denominator += x * x;
  }

  if (denominator === 0) {
    return 0;
  }
  return numerator / denominator;
};

export const analyzeSupplyDemand = (
  candles: Candle[],
  lookback = 120,
): SupplyDemandAnalysis => {
  if (candles.length === 0) {
    return {
      supplyLevel: null,
      demandLevel: null,
      dailyTrend: 'Sideways',
      bias: 'Neutral',
      distanceToSupply: 0,
      distanceToDemand: 0,
    };
  }

  const relevant = candles.slice(-Math.max(lookback, 30));
  const highs = relevant.map((c) => c.high);
  const lows = relevant.map((c) => c.low);
  const closes = relevant.map((c) => c.close);

  const supplyLevel = Math.max(...highs);
  const demandLevel = Math.min(...lows);
  const lastClose = closes[closes.length - 1];

  const slope = calculateRegressionSlope(closes);
  const dailyTrend: SupplyDemandAnalysis['dailyTrend'] =
    slope > 0.0005 ? 'Bullish' : slope < -0.0005 ? 'Bearish' : 'Sideways';

  let bias: SupplyDemandAnalysis['bias'] = 'Neutral';
  if (lastClose >= supplyLevel * 0.995) {
    bias = 'Bearish';
  } else if (lastClose <= demandLevel * 1.005) {
    bias = 'Bullish';
  } else if (dailyTrend === 'Bullish') {
    bias = 'Bullish';
  } else if (dailyTrend === 'Bearish') {
    bias = 'Bearish';
  }

  return {
    supplyLevel,
    demandLevel,
    dailyTrend,
    bias,
    distanceToSupply: supplyLevel - lastClose,
    distanceToDemand: lastClose - demandLevel,
  };
};

