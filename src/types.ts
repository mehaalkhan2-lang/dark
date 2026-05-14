
export const TRADING_PAIRS = [
  "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "USD/CHF", "NZD/USD",
  "EUR/GBP", "EUR/JPY", "GBP/JPY", "AUD/JPY", "CAD/JPY", 
  "BTC/USD", "ETH/USD", "XAU/USD"
];

export type SignalStatus = "pending" | "active" | "win" | "loss" | "expired";
export type TradeDirection = "CALL" | "PUT";

export interface Signal {
  id: string;
  pair: string;
  direction?: TradeDirection;
  entryPrice?: string;
  expiry: number; // timestamp
  durationMinutes: number;
  type: "public" | "vip";
  status: SignalStatus;
  createdAt: number; // timestamp
  authorId: string;
}
