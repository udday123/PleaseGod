// app/utils/ChartManager.ts
import { createChart, IChartApi, ISeriesApi, CandlestickSeriesPartialOptions, UTCTimestamp, TimeScaleOptions, Time } from "lightweight-charts";
import { ProcessedKlineData } from "../components/TradeView"; // Correct import path

export class ChartManager {
  chart: IChartApi;
  candlestickSeries: ISeriesApi<"Candlestick">;
  chartContainer: HTMLElement;

  constructor(
    container: HTMLElement,
    initialData: ProcessedKlineData[],
    options?: { layout?: any; timeScale?: TimeScaleOptions }
  ) {
    this.chartContainer = container;
    this.chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: options?.layout,
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        // You might want to adjust these further based on your preference
        // rightOffset: 5, // Keep a small gap on the right
        // barSpacing: 6, // Adjust bar spacing
        ...options?.timeScale, // Merge any provided timeScale options
      },
      grid: {
        vertLines: { color: "#2b2b43" },
        horzLines: { color: "#2b2b43" },
      },
      crosshair: {
        mode: 0, // CrosshairMode.Normal
      },
      // ... other chart options
    });

    this.candlestickSeries = this.chart.addCandlestickSeries({
      upColor: "#4CAF50", // Green
      downColor: "#F44336", // Red
      borderVisible: false,
      wickUpColor: "#4CAF50",
      wickDownColor: "#F44336",
    });

    this.candlestickSeries.setData(initialData);

    // Resize observer for responsiveness
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || entries[0].contentRect.width === 0) {
        return;
      }
      this.chart.applyOptions({
        width: entries[0].contentRect.width,
        height: entries[0].contentRect.height,
      });
    });
    resizeObserver.observe(container);

    // Store the observer to disconnect later
    (this.chart as any)._resizeObserver = resizeObserver;
  }

  update(kline: { open: number; high: number; low: number; close: number; time: UTCTimestamp; newCandleInitiated: boolean }) {
    this.candlestickSeries.update({
      time: kline.time,
      open: kline.open,
      high: kline.high,
      low: kline.low,
      close: kline.close,
    });
  }

  setHistoricalData(data: ProcessedKlineData[]) {
      this.candlestickSeries.setData(data);
  }

  destroy() {
    if ((this.chart as any)._resizeObserver) {
      (this.chart as any)._resizeObserver.disconnect();
    }
    this.chart.remove();
    console.log("Chart destroyed.");
  }
}