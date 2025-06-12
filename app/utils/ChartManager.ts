// src/app/utils/ChartManager.ts

import {
  createChart,
  IChartApi,
  ISeriesApi,
  TimeScaleOptions,
  ChartOptions,
  DeepPartial,
  UTCTimestamp,
} from "lightweight-charts";
import { ProcessedKlineData } from "../components/TradeView"; // Adjust if your import path differs

// Extend IChartApi to allow storing the resize observer
interface ExtendedChartApi extends IChartApi {
  _resizeObserver?: ResizeObserver;
}

export class ChartManager {
  chart: ExtendedChartApi;
  candlestickSeries: ISeriesApi<"Candlestick">;
  chartContainer: HTMLElement;

  constructor(
    container: HTMLElement,
    initialData: ProcessedKlineData[],
    options?: {
      layout?: DeepPartial<ChartOptions["layout"]>;
      timeScale?: TimeScaleOptions;
    }
  ) {
    this.chartContainer = container;
    this.chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: options?.layout,
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        ...options?.timeScale,
      },
      grid: {
        vertLines: { color: "#2b2b43" },
        horzLines: { color: "#2b2b43" },
      },
      crosshair: {
        mode: 0, // CrosshairMode.Normal
      },
    }) as ExtendedChartApi;

    this.candlestickSeries = this.chart.addCandlestickSeries({
      upColor: "#4CAF50",
      downColor: "#F44336",
      borderVisible: false,
      wickUpColor: "#4CAF50",
      wickDownColor: "#F44336",
    });

    this.candlestickSeries.setData(initialData);

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || entries[0].contentRect.width === 0) return;
      this.chart.applyOptions({
        width: entries[0].contentRect.width,
        height: entries[0].contentRect.height,
      });
    });

    resizeObserver.observe(container);
    this.chart._resizeObserver = resizeObserver;
  }

  update(kline: {
    open: number;
    high: number;
    low: number;
    close: number;
    time: UTCTimestamp;
    newCandleInitiated: boolean;
  }) {
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
    this.chart._resizeObserver?.disconnect();
    this.chart.remove();
    console.log("Chart destroyed.");
  }
}
