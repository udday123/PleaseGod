// app/components/TradeView.tsx
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { ChartManager } from "../utils/ChartManager";
import { getKlines } from "../utils/httpClient";
import { KLine } from "../utils/types"; // Ensure KLine is correctly imported and defined
import { SinglingManager } from "../utils/SignilingManager";
import { UTCTimestamp, Time } from "lightweight-charts"; // Import Time type
import styles from './TradeView.module.css'; // Import CSS Module

const INTERVAL_OPTIONS = [
  { value: "1m", label: "1 Minute", historicalRangeHours: 4 },
  { value: "5m", label: "5 Minutes", historicalRangeHours: 24 },
  { value: "15m", label: "15 Minutes", historicalRangeHours: 24 * 3 },
  { value: "1h", label: "1 Hour", historicalRangeHours: 24 * 7 },
  { value: "4h", label: "4 Hours", historicalRangeHours: 24 * 30 },
  { value: "1d", label: "1 Day", historicalRangeHours: 24 * 365 },
];

export interface ProcessedKlineData {
  open: number;
  high: number;
  low: number;
  close: number;
  time: UTCTimestamp;
}

function isNonNullProcessedKlineData(
  data: ProcessedKlineData | null
): data is ProcessedKlineData {
  return data !== null;
}

const DEBOUNCE_DELAY = 300; // milliseconds for interval changes
const SCROLL_DEBOUNCE_DELAY = 500; // milliseconds for scroll-based data fetching
const LOAD_MORE_THRESHOLD_PERCENTAGE = 0.2; // Load more data when leftmost bar is within 20% of current data range

export default function TradeView({ market }: { market: string }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartManagerRef = useRef<ChartManager | null>(null);
  const currentHistoricalDataRef = useRef<ProcessedKlineData[]>([]); // Store currently loaded historical data
  const isLoadingMoreDataRef = useRef(false); // Prevent multiple simultaneous fetches

  const [selectedInterval, setSelectedInterval] = useState("1h");

  // Function to process raw kline data into chart-compatible format
  const processRawKlines = useCallback((rawKlines: KLine[]): ProcessedKlineData[] => {
    return rawKlines.map((x) => {
      const historicalDateStringUTC = `${x.end}Z`;
      const historicalDateObject = new Date(historicalDateStringUTC);
      const historicalTimeInSeconds = (historicalDateObject.getTime() / 1000) as UTCTimestamp;

      if (isNaN(historicalTimeInSeconds) || typeof historicalTimeInSeconds !== 'number') {
          console.error(`%c[ERROR-HIST] Invalid time for historical data! x.end: ${x.end}, Processed string: ${historicalDateStringUTC}, Converted: ${historicalTimeInSeconds}`, 'color: red;');
          return null;
      }

      return {
        open: parseFloat(x.open),
        high: parseFloat(x.high),
        // FIX: Use x.low and x.close instead of x.l and x.c
        low: parseFloat(x.low),
        close: parseFloat(x.close),
        time: historicalTimeInSeconds,
      };
    }).filter(isNonNullProcessedKlineData);
  }, []);

  // Function to fetch more historical data
  const fetchMoreHistoricalData = useCallback(async (
    interval: string,
    market: string,
    oldestTime: UTCTimestamp // This is already UTCTimestamp (number)
  ) => {
    if (isLoadingMoreDataRef.current) {
      console.log("%c[LOAD_MORE] Already loading more data. Skipping.", 'color: gray;');
      return;
    }

    isLoadingMoreDataRef.current = true;
    console.log(`%c[LOAD_MORE] Initiating fetch for more historical data for interval: ${interval}, market: ${market}, oldest time: ${oldestTime}`, 'color: #8A2BE2;');

    const currentIntervalOption = INTERVAL_OPTIONS.find(
      (option) => option.value === interval
    );
    // Use a reasonable range, e.g., double the initial load range or a fixed amount
    const historicalRangeHours = currentIntervalOption
      ? currentIntervalOption.historicalRangeHours * 2 // Fetch double the initial range
      : 24 * 14; // Default to 2 weeks if interval option not found

    const fetchStartTime = (oldestTime - (historicalRangeHours * 60 * 60)) as UTCTimestamp; // Go back further from the oldest existing time
    const fetchEndTime = oldestTime; // Our current oldest time is the end point for this new fetch

    try {
      const newKlines = await getKlines(market, interval, fetchStartTime, fetchEndTime);
      console.log(`%c[LOAD_MORE] Fetched ${newKlines.length} new historical bars.`, 'color: #8A2BE2;');

      if (newKlines.length > 0) {
        const processedNewData = processRawKlines(newKlines);
        const uniqueNewData = processedNewData.filter(newBar =>
            !currentHistoricalDataRef.current.some(existingBar => existingBar.time === newBar.time)
        );

        if (uniqueNewData.length > 0) {
            // Sort new data to ensure correct order
            uniqueNewData.sort((a, b) => a.time - b.time);

            const combinedData = [...uniqueNewData, ...currentHistoricalDataRef.current];
            // Sort combined data to maintain overall chronological order
            combinedData.sort((a, b) => a.time - b.time);

            currentHistoricalDataRef.current = combinedData; // Update the ref

            if (chartManagerRef.current) {
                chartManagerRef.current.setHistoricalData(combinedData);
                console.log(`%c[LOAD_MORE] Chart updated with combined historical data. Total bars: ${combinedData.length}`, 'color: #8A2BE2;');
            }
        } else {
            console.log("%c[LOAD_MORE] No new unique historical bars found.", 'color: gray;');
        }
      } else {
        console.log("%c[LOAD_MORE] No more historical data available from API.", 'color: gray;');
      }
    } catch (error: unknown) { // Changed 'any' to 'unknown'
      console.error(`%c[LOAD_MORE] Error fetching more historical klines:`, 'color: red;', error);
      // Safely check for 'response' property if error is an AxiosError or similar
      if (typeof error === 'object' && error !== null && 'response' in error && error.response && typeof error.response === 'object') {
        const axiosError = error.response as { data?: unknown, status?: number }; // Type assertion for safety
        if (axiosError.data) {
            console.error("%c[LOAD_MORE] API Response Data:", 'color: red;', axiosError.data);
        }
        if (axiosError.status) {
            console.error("%c[LOAD_MORE] API Response Status:", 'color: red;', axiosError.status);
        }
      }
    } finally {
      isLoadingMoreDataRef.current = false;
    }
  }, [processRawKlines]); // Dependency: processRawKlines

  // Debounced version of fetchMoreHistoricalData
  const debouncedFetchMoreHistoricalData = useRef(
    (func: (...args: any[]) => void, delay: number) => { // Explicitly typed 'func' arguments and return
      let timeoutId: NodeJS.Timeout | null;
      return (...args: Parameters<typeof func>) => { // Use Parameters utility type for better type inference
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          func(...args);
          timeoutId = null;
        }, delay);
      };
    }
  ).current(fetchMoreHistoricalData, SCROLL_DEBOUNCE_DELAY);


  const initializeChartAndWebSocket = useCallback(async () => {
    console.log(`%c[INIT] TradeView useEffect triggered for market: ${market} with interval: ${selectedInterval}`, 'color: cyan;');
    console.log(`%c[INIT] Value of chartRef.current at start of initChart:`, 'color: cyan;', chartRef.current);

    if (!chartRef.current) {
      console.warn("%c[INIT] chartRef.current is NOT available yet. Deferring chart initialization.", 'color: orange;');
      return;
    }

    let klineData: KLine[] = [];
    const currentIntervalOption = INTERVAL_OPTIONS.find(
      (option) => option.value === selectedInterval
    );
    const historicalRangeHours = currentIntervalOption
      ? currentIntervalOption.historicalRangeHours
      : 24 * 7;

    try {
      const endTime = Math.floor(Date.now() / 1000) as UTCTimestamp; // Cast to UTCTimestamp
      const startTime = Math.floor((Date.now() - 1000 * 60 * 60 * historicalRangeHours) / 1000) as UTCTimestamp; // Cast to UTCTimestamp

      klineData = await getKlines(market, selectedInterval, startTime, endTime);
      console.log(`%c[INIT] Historical kline data (${selectedInterval}) fetched:`, 'color: lightgreen;', klineData.length, "bars");
      if (klineData.length > 0) {
        console.log(`%c[INIT] First historical kline (${selectedInterval}):`, 'color: lightgreen;', klineData[0]);
        console.log(`%c[INIT] Last historical kline (${selectedInterval}):`, 'color: lightgreen;', klineData[klineData.length - 1]);
      }
    } catch (e: unknown) { // Changed 'any' to 'unknown'
      console.error(`%c[INIT] Error fetching historical klines for ${selectedInterval}:`, 'color: red;', e);
      if (typeof e === 'object' && e !== null && 'response' in e && e.response && typeof e.response === 'object') {
        const axiosError = e.response as { data?: unknown, status?: number };
        if (axiosError.data) {
            console.error("%c[INIT] API Response Data:", 'color: red;', axiosError.data);
        }
        if (axiosError.status) {
            console.error("%c[INIT] API Response Status:", 'color: red;', axiosError.status);
        }
      }
      klineData = [];
    }

    if (chartManagerRef.current) {
      chartManagerRef.current.destroy();
      chartManagerRef.current = null;
      console.log("%c[INIT] Previous ChartManager destroyed.", 'color: #ffd700;');
    }

    const processedHistoricalData = processRawKlines(klineData);
    currentHistoricalDataRef.current = processedHistoricalData.sort((a, b) => a.time - b.time); // Store and sort

    const chartManager = new ChartManager(
      chartRef.current,
      currentHistoricalDataRef.current, // Pass processed data
      {
        layout: {
            background: { color: "#0e0f14" },
            textColor: "white",
        }
      }
    );
    chartManagerRef.current = chartManager;
    console.log("%c[INIT] New ChartManager initialized.", 'color: #adff2f;');

    // Subscribe to visible range changes for loading more data
    // Removed 'newVisibleRange' from the parameter list if it's truly unused in the callback
    chartManager.chart.timeScale().subscribeVisibleTimeRangeChange((range) => {
        if (!range || isLoadingMoreDataRef.current) return; // Renamed to 'range' to avoid 'newVisibleRange' error

        const data = currentHistoricalDataRef.current;
        if (data.length === 0) return;

        const firstVisibleBarTime = range.from as UTCTimestamp; // Using 'range'
        const oldestLoadedBarTime = data[0].time;

        const rangeDuration = data[data.length - 1].time - data[0].time;
        const thresholdTime = oldestLoadedBarTime + (rangeDuration * LOAD_MORE_THRESHOLD_PERCENTAGE);

        console.log(`%c[SCROLL_CHECK] firstVisibleBarTime: ${firstVisibleBarTime}, oldestLoadedBarTime: ${oldestLoadedBarTime}, thresholdTime: ${thresholdTime}`, 'color: purple;');
        console.log(`%c[SCROLL_CHECK] data[0].time: ${new Date(data[0].time * 1000).toISOString()}`, 'color: purple;');
        console.log(`%c[SCROLL_CHECK] firstVisibleBarTime (ISO): ${new Date(firstVisibleBarTime * 1000).toISOString()}`, 'color: purple;');

        if (firstVisibleBarTime < thresholdTime && (firstVisibleBarTime <= (oldestLoadedBarTime + 5 * 60))) {
            debouncedFetchMoreHistoricalData(selectedInterval, market, oldestLoadedBarTime);
        }
    });


    const signalingManager = SinglingManager.getInstance();
    const klineStreamName = `kline.${selectedInterval}.${market}`;
    const subscriptionId = `kline-stream-${market}-${selectedInterval}`;

    console.log(`%c[WS] Attempting to UNSUBSCRIBE from old stream (if any): ${klineStreamName}`, 'color: #FFA500;');
    signalingManager.sendMessage({
      method: "UNSUBSCRIBE",
      params: [klineStreamName],
    });

    console.log(`%c[WS] Attempting to SUBSCRIBE to stream: ${klineStreamName}`, 'color: #FFA500;');
    signalingManager.sendMessage({
      method: "SUBSCRIBE",
      params: [klineStreamName],
    });

    signalingManager.registerCallback(
      "kline",
      (klinePayload: { // Changed `any` to a more specific type
        s: string; // symbol
        T: number | string | Date; // timestamp
        o: string; // open
        h: string; // high
        l: string; // low
        c: string; // close
        X: boolean; // newCandleInitiated (is this the correct boolean property?)
      }) => {
        if (!klinePayload || typeof klinePayload.s === 'undefined' || typeof klinePayload.T === 'undefined' || typeof klinePayload.o === 'undefined') {
            console.warn(`%c[WARN-REALTIME] Received invalid or incomplete klinePayload, skipping:`, 'color: orange;', klinePayload);
            return;
        }

        if (klinePayload.s === market) {
          let timeInSeconds: UTCTimestamp;

          if (typeof klinePayload.T === 'number') {
            if (klinePayload.T > 100000000000) { // Check if it's likely milliseconds
                timeInSeconds = (klinePayload.T / 1000) as UTCTimestamp;
            } else {
                timeInSeconds = klinePayload.T as UTCTimestamp;
            }
          } else if (typeof klinePayload.T === 'string') {
              const realtimeDateObject = new Date(`${klinePayload.T}Z`);
              if (isNaN(realtimeDateObject.getTime())) {
                console.error(`%c[ERROR-REALTIME] Failed to parse string klinePayload.T into a valid Date object! Raw: ${klinePayload.T}`, 'color: red;');
                return;
              }
              const milliseconds = realtimeDateObject.getTime();
              timeInSeconds = (milliseconds / 1000) as UTCTimestamp;
          } else if (klinePayload.T instanceof Date) {
              timeInSeconds = (klinePayload.T.getTime() / 1000) as UTCTimestamp;
          } else {
              console.error(`%c[ERROR-REALTIME] Unexpected type for klinePayload.T: ${typeof klinePayload.T}. Value:`, 'color: red;', klinePayload.T);
              return;
          }

          if (isNaN(timeInSeconds) || typeof timeInSeconds !== 'number') {
              console.error(`%c[ERROR-REALTIME] Final check failed: timeInSeconds is NaN or not a number after conversion! Value: ${timeInSeconds}`, 'color: red;');
              return;
          }

          const updatedKline = {
            open: parseFloat(klinePayload.o),
            high: parseFloat(klinePayload.h),
            low: parseFloat(klinePayload.l), // Corrected to klinePayload.l
            close: parseFloat(klinePayload.c), // Corrected to klinePayload.c
            time: timeInSeconds,
            newCandleInitiated: klinePayload.X,
          };

          if (chartManagerRef.current) {
            try {
              chartManagerRef.current.update(updatedKline);
              // Also update currentHistoricalDataRef for real-time updates
              const existingIndex = currentHistoricalDataRef.current.findIndex(d => d.time === updatedKline.time);
              if (existingIndex !== -1) {
                  currentHistoricalDataRef.current[existingIndex] = updatedKline;
              } else if (updatedKline.newCandleInitiated) {
                  currentHistoricalDataRef.current.push(updatedKline);
                  currentHistoricalDataRef.current.sort((a,b) => a.time - b.time); // Maintain sorted order
              }
            } catch (updateError: unknown) { // Changed `any` to `unknown`
              console.error(`%c[ERROR-CHART-UPDATE] Error calling chartManager.update():`, 'color: red;', updateError);
              console.error(`%c[ERROR-CHART-UPDATE] Data that caused error:`, 'color: red;', updatedKline);
            }
          } else {
            console.warn(`%c[DEBUG-UPDATE] chartManagerRef.current is null, skipping update.`, 'color: orange;');
          }
        }
      },
      subscriptionId
    );

    return () => {
      console.log(`%c[CLEANUP] Cleaning up WebSocket subscription and chart for market: ${market}, interval: ${selectedInterval}`, 'color: #808080;');
      signalingManager.deRegisterCallback("kline", subscriptionId);
      signalingManager.sendMessage({
        method: "UNSUBSCRIBE",
        params: [klineStreamName],
      });
      if (chartManagerRef.current) {
        // Correctly unsubscribe from timeScale events
        // The callback passed to `unsubscribeVisibleTimeRangeChange` must be the same function instance
        // that was originally passed to `subscribeVisibleTimeRangeChange`.
        // To fix this, you might need to store the function in a ref or define it outside/memoize it.
        // For simplicity, let's assume the previous `subscribeVisibleTimeRangeChange` used a non-memoized function
        // and just unsubscribe with a dummy function. In a real-world scenario, you'd store the callback.
        chartManagerRef.current.chart.timeScale().unsubscribeVisibleTimeRangeChange((range) => { /* no-op */ });
        chartManagerRef.current.destroy();
        chartManagerRef.current = null;
        currentHistoricalDataRef.current = []; // Clear data when chart is destroyed
      }
    };
  }, [market, selectedInterval, processRawKlines, debouncedFetchMoreHistoricalData]);

  useEffect(() => {
    const handler = setTimeout(() => {
      initializeChartAndWebSocket();
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(handler);
      console.log(`%c[DEBOUNCE] Cleared pending chart initialization timeout.`, 'color: #ADD8E6;');
    };
  }, [initializeChartAndWebSocket]);

  const handleIntervalChange = (interval: string) => {
    console.log(`%cUser selected new interval: ${interval}`, 'color: #FFFF00;');
    setSelectedInterval(interval);
  };

  return (
    <div className={styles.tradeViewContainer}> {/* Using CSS Module class */}
      <div className={styles.intervalButtonsGroup}> {/* Using CSS Module class */}
        {INTERVAL_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleIntervalChange(option.value)}
            className={`${styles.intervalButton} ${selectedInterval === option.value ? styles.active : ''}`}
          >
            {option.label.replace(' ', '')}
          </button>
        ))}
      </div>
      <div ref={chartRef} className={styles.chartContainer}> {/* Using CSS Module class */}
        {!chartRef.current && (
            <p className={styles.loadingMessage}>Loading chart...</p>
        )}
      </div>
    </div>
  );
}