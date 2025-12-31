import { useEffect, useMemo, useState } from 'react';
import './App.css';
import type { Candle } from './types';
import { analyzeSupplyDemand, buildIndicatorSnapshot } from './utils/indicators';
import {
  appendNewCandle,
  assetClassOptions,
  binaryTimeframes,
  calculateTPSL,
  estimateConfidenceScore,
  forexTimeframes,
  formatPrice,
  generateInitialCandles,
  getAssetMeta,
  getBidAsk,
  getSecondsForTimeframe,
  type AssetClass,
  type TimeframeCode,
} from './utils/market';

type TradingMode = 'binary' | 'forex';

const binaryBrokers = ['Quotex', 'Binanny'];
const forexBrokers = ['OctaFX', 'XM'];

const defaultBinaryTimeframe: TimeframeCode = 'M5';
const defaultForexTimeframe: TimeframeCode = 'M15';

const formatCountdown = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
};

const determineDirectionalBias = (
  williamsR: number | null,
  cci: number | null,
  forceIndex: number | null,
  supplyBias: 'Bullish' | 'Bearish' | 'Neutral',
): 'Bullish' | 'Bearish' | 'Neutral' => {
  let bullishVotes = 0;
  let bearishVotes = 0;

  if (williamsR !== null) {
    if (williamsR < -80) bullishVotes += 1;
    if (williamsR > -20) bearishVotes += 1;
  }
  if (cci !== null) {
    if (cci > 0) bullishVotes += 1;
    if (cci < 0) bearishVotes += 1;
  }
  if (forceIndex !== null) {
    if (forceIndex > 0) bullishVotes += 1;
    if (forceIndex < 0) bearishVotes += 1;
  }
  if (supplyBias === 'Bullish') bullishVotes += 1;
  if (supplyBias === 'Bearish') bearishVotes += 1;

  if (bullishVotes > bearishVotes) return 'Bullish';
  if (bearishVotes > bullishVotes) return 'Bearish';
  return 'Neutral';
};

const App = () => {
  const [mode, setMode] = useState<TradingMode>('binary');
  const [assetClass, setAssetClass] = useState<AssetClass>('Forex');
  const [customAssets, setCustomAssets] = useState<string[]>(['Custom-Index-1']);
  const [customInput, setCustomInput] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('EUR/USD');
  const [timeframe, setTimeframe] = useState<TimeframeCode>(defaultBinaryTimeframe);
  const [candles, setCandles] = useState<Candle[]>(() =>
    generateInitialCandles('EUR/USD', defaultBinaryTimeframe),
  );
  const [countdown, setCountdown] = useState(getSecondsForTimeframe(defaultBinaryTimeframe));

  const timeframeOptions = mode === 'binary' ? binaryTimeframes : forexTimeframes;

  const availableAssets =
    assetClass === 'Custom'
      ? customAssets
      : assetClassOptions[assetClass].length > 0
        ? assetClassOptions[assetClass]
        : customAssets;

  useEffect(() => {
    if (mode === 'binary' && !binaryTimeframes.some((tf) => tf.value === timeframe)) {
      setTimeframe(defaultBinaryTimeframe);
    }
    if (mode === 'forex' && !forexTimeframes.some((tf) => tf.value === timeframe)) {
      setTimeframe(defaultForexTimeframe);
    }
  }, [mode, timeframe]);

  useEffect(() => {
    const nextAsset = availableAssets[0];
    if (nextAsset && nextAsset !== selectedAsset) {
      setSelectedAsset(nextAsset);
    }
    if (!nextAsset) {
      setSelectedAsset(customAssets[0] ?? 'Custom-Index-1');
    }
  }, [assetClass, availableAssets, customAssets, selectedAsset]);

  useEffect(() => {
    setCandles(generateInitialCandles(selectedAsset, timeframe));
  }, [selectedAsset, timeframe]);

  useEffect(() => {
    setCountdown(getSecondsForTimeframe(timeframe));
  }, [timeframe, mode]);

  useEffect(() => {
    if (mode !== 'binary') {
      return;
    }
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return getSecondsForTimeframe(timeframe);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, timeframe]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCandles((prev) => appendNewCandle(prev, selectedAsset, timeframe));
    }, Math.max(1000, Math.min(4000, getSecondsForTimeframe(timeframe) * 250)));

    return () => clearInterval(interval);
  }, [selectedAsset, timeframe]);

  const latestPrice = candles[candles.length - 1]?.close ?? getAssetMeta(selectedAsset).basePrice;
  const marketMeta = useMemo(() => getAssetMeta(selectedAsset), [selectedAsset]);
  const { bid, ask } = useMemo(
    () => getBidAsk(latestPrice, selectedAsset),
    [latestPrice, selectedAsset],
  );

  const indicatorSnapshot = useMemo(() => buildIndicatorSnapshot(candles), [candles]);
  const supplyDemand = useMemo(() => analyzeSupplyDemand(candles), [candles]);
  const directionalBias = useMemo(
    () =>
      determineDirectionalBias(
        indicatorSnapshot.williamsR,
        indicatorSnapshot.cci,
        indicatorSnapshot.forceIndex,
        supplyDemand.bias,
      ),
    [indicatorSnapshot, supplyDemand.bias],
  );

  const confidence = useMemo(
    () =>
      estimateConfidenceScore(
        {
          williamsR: indicatorSnapshot.williamsR,
          cci: indicatorSnapshot.cci,
          forceIndex: indicatorSnapshot.forceIndex,
        },
        supplyDemand.bias,
      ),
    [indicatorSnapshot, supplyDemand.bias],
  );

  const binaryExecution = useMemo(() => {
    const action =
      directionalBias === 'Bullish' ? 'CALL' : directionalBias === 'Bearish' ? 'PUT' : 'WAIT';

    const commentaries: string[] = [];
    if (indicatorSnapshot.williamsR !== null) {
      commentaries.push(
        indicatorSnapshot.williamsR < -80
          ? 'Oversold mendukung CALL'
          : indicatorSnapshot.williamsR > -20
            ? 'Overbought mendukung PUT'
            : 'Will%R netral',
      );
    }
    if (indicatorSnapshot.cci !== null) {
      commentaries.push(
        indicatorSnapshot.cci > 0 ? 'CCI positif' : indicatorSnapshot.cci < 0 ? 'CCI negatif' : 'CCI datar',
      );
    }
    if (indicatorSnapshot.forceIndex !== null) {
      commentaries.push(
        indicatorSnapshot.forceIndex > 0 ? 'Force Index mendukung bullish' : 'Force Index mendukung bearish',
      );
    }
    if (indicatorSnapshot.volumeSpike) {
      commentaries.push('Volume tinggi: konfirmasi momentum');
    }
    if (indicatorSnapshot.isDoji) {
      commentaries.push('Doji terdeteksi: potensi reversal');
    }

    return {
      action,
      commentaries,
    };
  }, [directionalBias, indicatorSnapshot]);

  const forexExecution = useMemo(() => {
    const action =
      directionalBias === 'Bullish' ? 'Buy' : directionalBias === 'Bearish' ? 'Sell' : 'Wait';
    const entryPrice = directionalBias === 'Bullish' ? ask : bid;
    const tpSl = calculateTPSL(
      entryPrice,
      directionalBias === 'Bearish' ? 'Bearish' : 'Bullish',
      selectedAsset,
    );

    let pendingType: 'Buy Limit' | 'Buy Stop' | 'Sell Limit' | 'Sell Stop' | null = null;
    let pendingPrice: number | null = null;

    if (directionalBias === 'Bullish') {
      if (supplyDemand.distanceToDemand < supplyDemand.distanceToSupply && supplyDemand.demandLevel) {
        pendingType = 'Buy Limit';
        pendingPrice = supplyDemand.demandLevel + marketMeta.pipSize * 5;
      } else if (supplyDemand.supplyLevel) {
        pendingType = 'Buy Stop';
        pendingPrice = supplyDemand.supplyLevel + marketMeta.pipSize * 8;
      }
    } else if (directionalBias === 'Bearish') {
      if (supplyDemand.distanceToSupply < supplyDemand.distanceToDemand && supplyDemand.supplyLevel) {
        pendingType = 'Sell Limit';
        pendingPrice = supplyDemand.supplyLevel - marketMeta.pipSize * 5;
      } else if (supplyDemand.demandLevel) {
        pendingType = 'Sell Stop';
        pendingPrice = supplyDemand.demandLevel - marketMeta.pipSize * 8;
      }
    }

    return {
      action,
      entryPrice,
      tpSl,
      pendingType,
      pendingPrice,
    };
  }, [ask, bid, directionalBias, marketMeta.pipSize, selectedAsset, supplyDemand]);

  const handleAddCustomAsset = () => {
    const trimmed = customInput.trim();
    if (trimmed.length === 0) return;
    setCustomAssets((prev) => {
      const next = trimmed.toUpperCase();
      if (prev.includes(next)) return prev;
      return [...prev, next];
    });
    const nextSymbol = trimmed.toUpperCase();
    setCustomInput('');
    setAssetClass('Custom');
    setSelectedAsset(nextSymbol);
  };

  const tfLabel = timeframeOptions.find((tf) => tf.value === timeframe)?.label ?? timeframe;

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Agentic Signal Hub</h1>
          <p>Kombinasi multi-indikator untuk Binary Options &amp; Forex dalam satu dashboard.</p>
        </div>
        <div className="header-badges">
          <span>William %R</span>
          <span>CCI</span>
          <span>Force Index</span>
          <span>Supply/Demand</span>
        </div>
      </header>

      <div className="mode-toggle">
        <button
          type="button"
          className={`toggle-button ${mode === 'binary' ? 'active' : ''}`}
          onClick={() => setMode('binary')}
        >
          Binary Options
        </button>
        <button
          type="button"
          className={`toggle-button ${mode === 'forex' ? 'active' : ''}`}
          onClick={() => setMode('forex')}
        >
          Forex Trading
        </button>
      </div>

      <main className="layout">
        <section className="control-panel">
          <h2>Pengaturan Pasar</h2>
          <div className="control-group">
            <span className="control-label">Kelas Aset</span>
            <div className="control-grid">
              {(Object.keys(assetClassOptions) as AssetClass[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`control-chip ${assetClass === option ? 'selected' : ''}`}
                  onClick={() => setAssetClass(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <span className="control-label">Instrumen</span>
            <select
              className="control-select"
              value={selectedAsset}
              onChange={(event) => setSelectedAsset(event.target.value)}
            >
              {availableAssets.map((asset) => (
                <option key={asset} value={asset}>
                  {asset}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <span className="control-label">
              Timeframe ({mode === 'binary' ? 'Expiry' : 'Analisis'})
            </span>
            <div className="control-grid">
              {timeframeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`control-chip ${timeframe === option.value ? 'selected' : ''}`}
                  onClick={() => setTimeframe(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="custom-asset">
            <input
              value={customInput}
              onChange={(event) => setCustomInput(event.target.value)}
              placeholder="Tambah simbol custom"
            />
            <button type="button" onClick={handleAddCustomAsset}>
              Tambah
            </button>
          </div>

          <div className="trend-card">
            <div>
              <p className="trend-title">Analisis Supply / Demand</p>
              <p>
                Daily Trend: <strong>{supplyDemand.dailyTrend}</strong>
              </p>
              <p>
                Bias: <strong>{supplyDemand.bias}</strong>
              </p>
            </div>
            <div className="levels">
              <p>
                Supply:{' '}
                <span>
                  {supplyDemand.supplyLevel
                    ? formatPrice(supplyDemand.supplyLevel, selectedAsset)
                    : '-'}
                </span>
              </p>
              <p>
                Demand:{' '}
                <span>
                  {supplyDemand.demandLevel
                    ? formatPrice(supplyDemand.demandLevel, selectedAsset)
                    : '-'}
                </span>
              </p>
            </div>
          </div>
        </section>

        <section className="market-panel">
          <div className="market-header">
            <div>
              <h2>{selectedAsset}</h2>
              <p>Format harga MT4 · Timeframe {tfLabel}</p>
            </div>
            {mode === 'binary' ? (
              <div className="timer">
                <span>Expiry Timer</span>
                <strong>{formatCountdown(countdown)}</strong>
              </div>
            ) : (
              <div className="timer">
                <span>Trend Harian</span>
                <strong>{supplyDemand.dailyTrend}</strong>
              </div>
            )}
          </div>

          <div className="price-board">
            <div>
              <p>BID</p>
              <strong>{formatPrice(bid, selectedAsset)}</strong>
            </div>
            <div>
              <p>LAST</p>
              <strong>{formatPrice(latestPrice, selectedAsset)}</strong>
            </div>
            <div>
              <p>ASK</p>
              <strong>{formatPrice(ask, selectedAsset)}</strong>
            </div>
          </div>

          <div className="indicator-grid">
            <div className="indicator-card">
              <span>William %R (14)</span>
              <strong>{indicatorSnapshot.williamsR ?? '...'}</strong>
              <small>Threshold -80 / -20</small>
            </div>
            <div className="indicator-card">
              <span>CCI (5)</span>
              <strong>{indicatorSnapshot.cci ?? '...'}</strong>
              <small>Ambang 0</small>
            </div>
            <div className="indicator-card">
              <span>Force Index (13)</span>
              <strong>{indicatorSnapshot.forceIndex ?? '...'}</strong>
              <small>Ambang 0</small>
            </div>
            <div className="indicator-card">
              <span>Volume Filter</span>
              <strong className={indicatorSnapshot.volumeSpike ? 'bullish' : 'neutral'}>
                {indicatorSnapshot.volumeSpike ? 'Spike' : 'Normal'}
              </strong>
              <small>Deteksi aktivitas tinggi</small>
            </div>
            <div className="indicator-card">
              <span>Doji Detection</span>
              <strong className={indicatorSnapshot.isDoji ? 'bearish' : 'neutral'}>
                {indicatorSnapshot.isDoji ? 'Doji' : 'Tidak'}
              </strong>
              <small>Candlestick terkini</small>
            </div>
          </div>

          <div className="confidence-card">
            <div className="confidence-header">
              <span>Confidence Score</span>
              <strong>{confidence}%</strong>
            </div>
            <div className="progress">
              <span style={{ width: `${confidence}%` }} />
            </div>
            <p>
              Kombinasi indikator dan supply/demand memberikan bias <strong>{directionalBias}</strong>.
            </p>
          </div>
        </section>

        <section className="signal-panel">
          <h2>Sinyal Eksekusi</h2>

          {mode === 'binary' ? (
            <>
              {binaryBrokers.map((broker) => (
                <div key={broker} className="signal-card binary">
                  <header>
                    <h3>{broker}</h3>
                    <span className={`badge ${binaryExecution.action.toLowerCase()}`}>
                      {binaryExecution.action}
                    </span>
                  </header>
                  <ul>
                    <li>Instrumen: {selectedAsset}</li>
                    <li>Expiry: {tfLabel}</li>
                    <li>Confidence: {confidence}%</li>
                  </ul>
                  <div className="signal-notes">
                    {binaryExecution.commentaries.map((note) => (
                      <p key={note}>• {note}</p>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {forexBrokers.map((broker) => (
                <div key={broker} className="signal-card forex">
                  <header>
                    <h3>{broker}</h3>
                    <span className={`badge ${forexExecution.action.toLowerCase()}`}>
                      {forexExecution.action}
                    </span>
                  </header>
                  <ul>
                    <li>
                      Market Order: {forexExecution.action} @{' '}
                      {formatPrice(forexExecution.entryPrice, selectedAsset)}
                    </li>
                    <li>
                      TP: {formatPrice(forexExecution.tpSl.tp, selectedAsset)} · SL:{' '}
                      {formatPrice(forexExecution.tpSl.sl, selectedAsset)} (Rasio 1:4)
                    </li>
                    <li>Confidence: {confidence}%</li>
                  </ul>
                  <div className="pending-block">
                    <p>Pending Orders</p>
                    {forexExecution.pendingType && forexExecution.pendingPrice ? (
                      <span>
                        {forexExecution.pendingType} @{' '}
                        {formatPrice(forexExecution.pendingPrice, selectedAsset)}
                      </span>
                    ) : (
                      <span>Menunggu konfirmasi level</span>
                    )}
                  </div>
                  <div className="signal-notes">
                    <p>• Trend harian: {supplyDemand.dailyTrend}</p>
                    <p>• Bias H1: {supplyDemand.bias}</p>
                    <p>
                      • Volume: {indicatorSnapshot.volumeSpike ? 'Spike (konfirmasi)' : 'Normal'} · Doji:{' '}
                      {indicatorSnapshot.isDoji ? 'Ya' : 'Tidak'}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;

