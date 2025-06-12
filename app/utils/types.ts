export interface Detail {
  symbol: string;
  currentPrice: number;
  quotevolume: number;
  percentagechange: number;
  maxhigh:number,
  maxlow:number
}

export interface KLine {
  close: string;
  end: string;
  high: string;
  low: string;
  open: string;
  quoteVolume: string;
  start: string;
  trades: string;
  volume: string;
}


export interface Trade {
  "id": number,
  "isBuyerMaker": boolean,
  "price": string,
  "quantity": string,
  "quoteQuantity": string,
  "timestamp": number
}

export interface Depth {
  bids: [string, string][],
  asks: [string, string][],
  lastUpdateId: string
}

export interface Ticker {
  symbol: string;
  lastPrice: string;
  firstPrice: string;
  high: string;
  low: string;
  volume: string;
  quoteVolume: string;
  priceChange: string;
  priceChangePercent: string;
  trades: string;
  // Perp Futures specific fields
  fundingRate?: string;
  nextFundingTime?: string;
  openInterest?: string;
}

export interface RegisteredUser {
    email:string,
    password:string,
    username:string
}