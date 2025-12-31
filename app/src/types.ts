export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorSnapshot {
  williamsR: number | null;
  cci: number | null;
  forceIndex: number | null;
  volumeSpike: boolean;
  isDoji: boolean;
}

export interface SupplyDemandAnalysis {
  supplyLevel: number | null;
  demandLevel: number | null;
  dailyTrend: 'Bullish' | 'Bearish' | 'Sideways';
  bias: 'Bullish' | 'Bearish' | 'Neutral';
  distanceToSupply: number;
  distanceToDemand: number;
}

