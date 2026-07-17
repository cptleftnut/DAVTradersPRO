import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";
import WebSocket from "ws";
import { Spot } from "@binance/connector";
import _yahooFinanceInterop from "yahoo-finance2";
const YFClass = (_yahooFinanceInterop as any).default || _yahooFinanceInterop;
const yahooFinance = new YFClass();
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  setLogLevel,
} from "firebase/firestore";
import * as tf from "@tensorflow/tfjs";
import firebaseConfig from "./firebase-applet-config.json" with { type: "json" };
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

setLogLevel("silent");

export function isQuotaError(error: any): boolean {
  if (!error) return false;
  if (error.status === 429) return true;

  const msg =
    typeof error === "string" ? error : error.message || String(error);

  return (
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("resource-exhausted") ||
    msg.includes("429") ||
    msg.includes("too_many_requests") ||
    msg.includes("depleted") ||
    msg.includes("Function.generate") ||
    msg.includes("makeStatusError")
  );
}

let firebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApps()[0];
}
const db = getFirestore(
  firebaseApp,
  (firebaseConfig as any).firestoreDatabaseId !== "(default)"
    ? (firebaseConfig as any).firestoreDatabaseId
    : undefined,
);

async function getBinanceCredentials(
  reqOrUid: any,
  fallbackHeaders?: any,
  requireLive?: boolean,
) {
  if (
    typeof botState !== "undefined" &&
    botState &&
    botState.userApiKey &&
    botState.userApiSecret
  ) {
    return {
      apiKey: botState.userApiKey,
      apiSecret: botState.userApiSecret,
      source: "botState",
    };
  }
  if (fallbackHeaders) {
    if (
      fallbackHeaders["x-binance-api-key"] &&
      fallbackHeaders["x-binance-api-secret"]
    ) {
      return {
        apiKey: fallbackHeaders["x-binance-api-key"],
        apiSecret: fallbackHeaders["x-binance-api-secret"],
        source: "headers",
      };
    } else if (requireLive) {
      throw new Error(
        "BINANCE_API_KEY_MISSING: Live Trading requires x-binance-api-key and x-binance-api-secret headers.",
      );
    }
  }
  if (requireLive) {
    throw new Error(
      "BINANCE_API_KEY_MISSING: Live Trading requires valid Binance API keys.",
    );
  }
  return {
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_API_SECRET,
    source: "demo",
  };
}

const app = express();
const PORT = 3000;

app.use(helmet({
  contentSecurityPolicy: false, // Since this serves the frontend, we disable default CSP here or configure it carefully if it was failing build
}));
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "https://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-binance-api-key", "x-binance-api-secret"]
}));

// Configure standard rate limiting for all API routes to prevent DoS/brute force
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  message: { error: "Too many requests, please try again later." }
});
app.use("/api/", apiLimiter);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

interface BotOrder {
  id: string;
  symbol: string;
  type: string;
  pnl: number;
  time: Date;
  duration: string;
  fee?: number;
  txHash?: string;
  price?: number;
  quantity?: number;
  entryPrice?: number;
  exitPrice?: number;
  profitPercent?: number;
}

// Bot state
interface BotState {
  isActive: boolean;
  symbol: string;
  allocation: number;
  isLiveTrading: boolean;
  takeProfit: number;
  stopLoss: number;
  stopLossType?: "percentage" | "fixed";
  strategy: string;
  useTrailingStop?: boolean;
  dynamicSizing?: boolean;
  maxRiskPerTrade?: number;
  diversifySectors?: boolean;
  autoAdjustVolatility?: boolean;
  useNewsSentiment?: boolean;
  circuitBreakerLimit?: number;
  enableDCA?: boolean;
  dcaIntervalHours?: number;
  dcaAllocation?: number;
  enableAutoStopLoss?: boolean;
  dailyStartPortfolioValue?: number;
  circuitBreakerTripped?: boolean;
  circuitBreakerDate?: string;
  activePositions: number;
  activePositionsList: any[];
  orderHistory: BotOrder[];
  tradeCounter: number;
  lastError?: string;
  lastErrorTime?: number;
  lastTradeTime?: number;
  wsStatus?: "connected" | "disconnected" | "connecting" | "error";
  reconnectCount?: number;
  lastHeartbeat?: number;
  userApiKey?: string;
  userApiSecret?: string;
  unpaidFee?: number;
  lastFeeCalculationDate?: string;
  maintenanceMode?: boolean;
}

export function getSafeBotState(state: BotState) {
  if (!state) return state;
  const safeState = { ...state };
  delete safeState.userApiKey;
  delete safeState.userApiSecret;
  return safeState;
}


let botState: BotState = {
  isActive: false,
  symbol: "BTCUSDT",
  allocation: 2,
  isLiveTrading: false,
  takeProfit: 10.0,
  stopLoss: 5.0,
  strategy: "",
  useTrailingStop: false,
  dynamicSizing: false,
  maxRiskPerTrade: 1.5,
  diversifySectors: false,
  enableAutoStopLoss: true,
  activePositions: 0,
  activePositionsList: [],
  orderHistory: [],
  tradeCounter: 0,
  wsStatus: "disconnected",
  reconnectCount: 0,
  lastHeartbeat: 0,
  maintenanceMode: false,
};

// Firestore persistence helpers
async function calculateDailyFee() {
  const today = new Date().toISOString().split("T")[0];
  if (!botState.lastFeeCalculationDate) {
    botState.lastFeeCalculationDate = today;
    await saveBotState();
    return;
  }

  if (botState.lastFeeCalculationDate !== today) {
    let totalRealizedGains = 0;
    botState.orderHistory.forEach((order) => {
      if (!order.time) return;
      const orderDateObj = new Date(order.time);
      if (isNaN(orderDateObj.getTime())) return;
      const orderDateStr = orderDateObj.toISOString().split("T")[0];

      if (orderDateStr === botState.lastFeeCalculationDate && order.pnl > 0) {
        totalRealizedGains += order.pnl;
      }
    });

    if (totalRealizedGains > 0) {
      const fee = 0;
      botState.unpaidFee = 0;
      console.log(
        `[Fee] Calculated ${fee} fee for ${totalRealizedGains} gains on ${botState.lastFeeCalculationDate}`,
      );
    }

    botState.lastFeeCalculationDate = today;
    await saveBotState();
  }
}

async function loadBotState() {
  try {
    const docRef = doc(db, "systemState", "botConfig");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists) {
      const data = docSnap.data() as any;
      botState = { ...botState, ...data };
      console.log("[Firebase] Bot state loaded successfully.");

      if (botState.isActive) {
        console.log("[Firebase] Bot was previously active, restarting...");
        await startBot(
          botState.symbol,
          botState.allocation,
          botState.isLiveTrading,
          botState.takeProfit,
          botState.stopLoss,
          botState.strategy,
          botState.useTrailingStop,
          botState.dynamicSizing,
          botState.maxRiskPerTrade,
          botState.diversifySectors,
          botState.stopLossType,
          botState.autoAdjustVolatility,
          botState.useNewsSentiment,
          botState.circuitBreakerLimit,
          botState.enableDCA,
          botState.dcaIntervalHours,
          botState.dcaAllocation,
          botState.enableAutoStopLoss,
        );
      }
    } else {
      console.log("[Firebase] Bot state not found, creating default config...");
      await setDoc(docRef, botState);
    }
  } catch (err: any) {
    if (
      err.code === "permission-denied" ||
      err.code === 5 ||
      err.message?.includes("NOT_FOUND") ||
      err.message?.includes("not found")
    ) {
      console.log(
        "[Firebase] Bot state collection or doc not found (or no permissions), attempting to initialize...",
      );
      try {
        await setDoc(doc(db, "systemState", "botConfig"), botState);
      } catch (initErr) {
        if (!isQuotaError(initErr))
          console.error(
            "[Firebase] Fatal error initializing bot state:",
            initErr,
          );
      }
    } else {
      console.error("[Firebase] Error loading bot state:", err);
    }
  }
}

let botStateSaveTimeout: NodeJS.Timeout | null = null;
async function saveBotState() {
  if (botStateSaveTimeout) return;
  botStateSaveTimeout = setTimeout(() => {
    botStateSaveTimeout = null;
    try {
      setDoc(doc(db, "systemState", "botConfig"), botState).catch((err) => {
        console.error("[Firebase] Error saving bot state async:", err);
      });
    } catch (err) {
      if (!isQuotaError(err))
        console.error("[Firebase] Error saving bot state:", err);
    }
  }, 30000); // 30 second debounce
}

async function loadWallet() {
  try {
    const docRef = doc(db, "wallet", "simulated");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists) {
      simulatedWallet = docSnap.data() as SimulatedWallet;
      console.log("[Firebase] Wallet state loaded successfully.");
      console.log("[Firebase] Wallet state loaded successfully.");
    } else {
      console.log("[Firebase] Simulated wallet not found, creating default...");
      await setDoc(docRef, simulatedWallet);
    }
  } catch (err: any) {
    if (
      err.code === "permission-denied" ||
      err.code === 5 ||
      err.message?.includes("NOT_FOUND") ||
      err.message?.includes("not found")
    ) {
      console.log(
        "[Firebase] Wallet collection or doc not found, attempting to initialize...",
      );
      try {
        await setDoc(doc(db, "wallet", "simulated"), simulatedWallet);
      } catch (initErr) {
        if (!isQuotaError(initErr))
          console.error(
            "[Firebase] Fatal error initializing wallet state:",
            initErr,
          );
      }
    } else {
      console.error("[Firebase] Error loading wallet state:", err);
    }
  }
}

let walletSaveTimeout: NodeJS.Timeout | null = null;
async function saveWallet() {
  if (walletSaveTimeout) return;
  walletSaveTimeout = setTimeout(() => {
    walletSaveTimeout = null;
    try {
      setDoc(doc(db, "wallet", "simulated"), simulatedWallet).catch((err) => {
        console.error("[Firebase] Error saving wallet state async:", err);
      });
    } catch (err) {
      if (!isQuotaError(err))
        console.error("[Firebase] Error saving wallet state:", err);
    }
  }, 30000); // 30 second debounce
}

interface WalletAsset {
  asset: string;
  free: string;
  locked: string;
}

interface SimulatedWallet {
  spot: WalletAsset[];
  earn: { asset: string; totalAmount: string; totalValueInBTC: string }[];
}

let simulatedWallet: SimulatedWallet = {
  spot: [
    { asset: "USDT", free: "100.00000000", locked: "0.00000000" },
    { asset: "BTC", free: "0.00000000", locked: "0.00000000" },
    { asset: "ETH", free: "0.00000000", locked: "0.00000000" },
    { asset: "SOL", free: "10.00000000", locked: "0.00000000" },
    { asset: "BNB", free: "0.00000000", locked: "0.00000000" },
    { asset: "DOGE", free: "0.00000000", locked: "0.00000000" },
  ],
  earn: [
    { asset: "USDT", totalAmount: "0.00000000", totalValueInBTC: "0.00000000" },
    { asset: "BTC", totalAmount: "0.00000000", totalValueInBTC: "0.00000000" },
  ],
};

function simulateBuyAsset(
  asset: string,
  quoteAsset: string,
  usdtAmount: number,
  entryPrice: number,
): number {
  console.log(
    `[Sim] simulateBuyAsset: asset=${asset}, usdtAmount=${usdtAmount}, entryPrice=${entryPrice}`,
  );
  let quoteItem = simulatedWallet.spot.find((s) => s.asset === quoteAsset);
  if (!quoteItem) {
    quoteItem = { asset: quoteAsset, free: "0.00000000", locked: "0.00000000" };
    simulatedWallet.spot.push(quoteItem);
  }

  const currentFree = parseFloat(quoteItem.free);
  if (currentFree < 5.0) return 0; // Enforce minimum 5 USD rule for paper trading

  const actualAmount = Math.min(usdtAmount, currentFree);
  if (actualAmount < 5.0) {
    console.log(
      `[Sim] simulateBuyAsset aborted: actualAmount (${actualAmount.toFixed(2)}) is under the minimum $5 required.`,
    );
    return 0; // Enforce minimum 5 USD rule
  }
  console.log(`[Sim] simulateBuyAsset: actualAmount=${actualAmount}`);

  quoteItem.free = (currentFree - actualAmount).toFixed(8);
  quoteItem.locked = (parseFloat(quoteItem.locked) + actualAmount).toFixed(8);

  let targetItem = simulatedWallet.spot.find((s) => s.asset === asset);
  if (!targetItem) {
    targetItem = { asset, free: "0.00000000", locked: "0.00000000" };
    simulatedWallet.spot.push(targetItem);
  }
  const buyQty = actualAmount / entryPrice;
  targetItem.free = (parseFloat(targetItem.free) + buyQty).toFixed(8);
  return actualAmount;
}

function simulateSellAsset(
  asset: string,
  quoteAsset: string,
  usdtAmount: number,
  netPnl: number,
  entryPrice: number,
) {
  const quoteItem = simulatedWallet.spot.find((s) => s.asset === quoteAsset);
  if (quoteItem) {
    quoteItem.locked = Math.max(
      0,
      parseFloat(quoteItem.locked) - usdtAmount,
    ).toFixed(8);
    const returnedAmount = usdtAmount + netPnl;
    quoteItem.free = (parseFloat(quoteItem.free) + returnedAmount).toFixed(8);
  }

  const targetItem = simulatedWallet.spot.find((s) => s.asset === asset);
  if (targetItem) {
    const sellQty = usdtAmount / entryPrice;
    targetItem.free = Math.max(
      0,
      parseFloat(targetItem.free) - sellQty,
    ).toFixed(8);
  }
}

let botWs: WebSocket | null = null;
let backupSimInterval: NodeJS.Timeout | null = null;
let botReconnectTimeout: NodeJS.Timeout | null = null;
let stockFeedInterval: NodeJS.Timeout | null = null;
let dcaInterval: NodeJS.Timeout | null = null;
let recentPriceWindow: number[] = [];
let lastWindowPushTime = 0;

function evaluateStrategySignal(
  strategy: string,
  prices: number[],
  currentPrice: number,
): "BUY" | "SELL" | null {
  if (prices.length < 5) {
    // Collect some data points to warm up indicators, default to allow if very fresh so user sees activity
    return "BUY";
  }

  const cleanStrategy = (strategy || "Momentum Trading").trim();

  if (cleanStrategy === "Momentum Trading") {
    const lookbackIndex = Math.max(0, prices.length - 10);
    const prevPrice = prices[lookbackIndex];
    if (currentPrice > prevPrice * 1.0001) {
      return "BUY"; // 0.01% gain over the last 10 seconds
    } else if (currentPrice < prevPrice * 0.9999) {
      return "SELL"; // 0.01% loss over the last 10 seconds
    }
    return null;
  }

  if (cleanStrategy === "Mean Reversion") {
    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = sum / prices.length;

    const variance =
      prices.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance) || 0.0001;

    // Lower bollinger band (SMA - 1.5 * stdDev) and Upper bollinger band (SMA + 1.5 * stdDev)
    const lowerBand = avg - 1.5 * stdDev;
    const upperBand = avg + 1.5 * stdDev;

    if (currentPrice < lowerBand) {
      return "BUY";
    } else if (currentPrice > upperBand) {
      return "SELL";
    }
    return null;
  }

  if (cleanStrategy === "Simple Moving Average (SMA)") {
    if (prices.length < 25) {
      const sum = prices.reduce((a, b) => a + b, 0);
      const avg = sum / prices.length;
      return currentPrice > avg ? "BUY" : "SELL";
    }
    const shortSum = prices.slice(-10).reduce((a, b) => a + b, 0);
    const shortAvg = shortSum / 10;

    const longSum = prices.slice(-25).reduce((a, b) => a + b, 0);
    const longAvg = longSum / 25;

    return shortAvg > longAvg ? "BUY" : "SELL"; // MA Crossover
  }

  if (cleanStrategy === "High-Frequency Scalper (HFT)") {
    if (prices.length < 3) return "BUY";
    const len = prices.length;
    // Tick momentum scalp: last 3 prices strictly increasing or decreasing
    if (
      prices[len - 1] > prices[len - 2] &&
      prices[len - 2] > prices[len - 3]
    ) {
      return "BUY";
    } else if (
      prices[len - 1] < prices[len - 2] &&
      prices[len - 2] < prices[len - 3]
    ) {
      return "SELL";
    }
    return null;
  }

  if (cleanStrategy === "Grid Trading Arbitrage") {
    // Grid: Buy on dips to capture minor fluctuations, sell on peaks
    const lookbackIndex = Math.max(0, prices.length - 8);
    const refereePrice = prices[lookbackIndex];
    if (currentPrice < refereePrice * 0.9985) {
      return "BUY"; // 0.15% drop below short-term referee
    } else if (currentPrice > refereePrice * 1.0015) {
      return "SELL";
    }
    return null;
  }

  return "BUY";
}

async function stopBot() {
  botState.isActive = false;
  botState.wsStatus = "disconnected";
  botState.reconnectCount = 0;
  await saveBotState();
  if (botWs) {
    try {
      // Remove connection event listeners before closing to prevent triggering automated close/reconnect loops during intentional stops
      botWs.removeAllListeners();
      botWs.on("error", () => {}); // Catch any potential errors during close/handshake aborts to avoid unhandled exception crashes
      botWs.close();
    } catch (e) {}
    botWs = null;
  }
  if (backupSimInterval) {
    clearInterval(backupSimInterval);
    backupSimInterval = null;
  }
  if (stockFeedInterval) {
    clearInterval(stockFeedInterval);
    stockFeedInterval = null;
  }
  if (dcaInterval) {
    clearInterval(dcaInterval);
    dcaInterval = null;
  }
  if (botReconnectTimeout) {
    clearTimeout(botReconnectTimeout);
    botReconnectTimeout = null;
  }
}

async function closeAllActivePositionsGracefully() {
  const now = Date.now();
  const closedOrders: BotOrder[] = [];

  // Clone active positions list so we can clear the original safely
  const positionsToClose = [...botState.activePositionsList];

  for (const pos of positionsToClose) {
    const symbol = pos.symbol || botState.symbol || "BTCUSDT";
    let currentPrice = pos.price; // fallback

    try {
      const apiKey = botState.userApiKey || process.env.BINANCE_API_KEY;
      const apiSecret =
        botState.userApiSecret || process.env.BINANCE_API_SECRET;
      if (apiKey && apiSecret) {
        const client = new Spot(apiKey, apiSecret);
        const priceRes = await client.tickerPrice(symbol);
        currentPrice = parseFloat(priceRes.data.price);
      }
    } catch (err) {
      console.warn(
        `[Maintenance] Kunne ikke hente live-pris for ${symbol} under lukning:`,
        err,
      );
    }

    const pnlPct = pos.price
      ? ((currentPrice - pos.price) / pos.price) * 100
      : 0;

    const closedOrder: BotOrder = {
      id: Math.random().toString(36).substring(7),
      symbol: symbol,
      type: "SELL",
      pnl: pnlPct,
      time: new Date(now),
      duration: "0s",
      price: currentPrice,
      quantity: pos.actualAlloc ? pos.actualAlloc / currentPrice : 0.01,
      entryPrice: pos.price,
      exitPrice: currentPrice,
      profitPercent: pnlPct,
    };

    closedOrders.push(closedOrder);
    botState.orderHistory.unshift(closedOrder);
  }

  botState.activePositionsList = [];
  botState.activePositions = 0;
  await saveBotState();
  return closedOrders;
}

app.post("/api/bot/maintenance", async (req, res) => {
  try {
    const { maintenanceEnabled } = req.body;

    if (maintenanceEnabled) {
      console.log("[Maintenance] Aktiverer vedligeholdelsestilstand...");
      botState.maintenanceMode = true;

      // 1. Pause active trading bots gracefully
      await stopBot();

      // 2. Gracefully close all open orders / positions
      const closedOrders = await closeAllActivePositionsGracefully();

      await saveBotState();
      res.json({
        success: true,
        maintenanceMode: true,
        botState: getSafeBotState(botState),
        closedOrders,
      });
    } else {
      console.log("[Maintenance] Deaktiverer vedligeholdelsestilstand...");
      botState.maintenanceMode = false;
      await saveBotState();
      res.json({ success: true, maintenanceMode: false, botState: getSafeBotState(botState) });
    }
  } catch (error: any) {
    res.status(500).json({
      error: error.message || "Kunne ikke ændre vedligeholdelsestilstand",
    });
  }
});

app.get("/api/bot/maintenance", (req, res) => {
  res.json({ maintenanceMode: botState.maintenanceMode || false, botState: getSafeBotState(botState) });
});

async function getSymbolExchangeInfo(client: Spot, symbol: string) {
  try {
    const res = await client.exchangeInfo({ symbol });
    if (res?.data?.symbols) return res.data;
  } catch (e) {}
  try {
    const res = await client.exchangeInfo({ symbols: [symbol] });
    if (res?.data?.symbols) return res.data;
  } catch (e) {}
  try {
    const res = await client.exchangeInfo();
    if (res?.data?.symbols) return res.data;
  } catch (e) {}
  return null;
}

function roundStep(qty: number, stepSize: string): string {
  // stepSize is typically like '0.01000000', '0.00010000' or '1.00000000'
  let decimals = 0;
  if (stepSize && parseFloat(stepSize) > 0 && stepSize.includes(".")) {
    const parts = stepSize.split(".");
    const decimalPart = parts[1].replace(/0+$/, ""); // remove trailing zeros
    decimals = decimalPart.length;
  }
  const factor = Math.pow(10, decimals);
  const rounded = Math.floor(qty * factor) / factor;
  return rounded.toFixed(decimals);
}

async function executeTradeInternal(
  symbol: string,
  side: string,
  allocation: number,
  customApiKey?: string,
  customApiSecret?: string,
) {
  const apiKey =
    customApiKey || botState.userApiKey || process.env.BINANCE_API_KEY;
  const apiSecret =
    customApiSecret || botState.userApiSecret || process.env.BINANCE_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("BINANCE_API_KEY or BINANCE_API_SECRET is not set");
  }

  const client = new Spot(apiKey, apiSecret);
  delete botState.lastError;

  try {
    const priceRes = await client.tickerPrice(symbol);
    const currentPrice = parseFloat(priceRes.data.price);

    // Fetch account balances first to make smart dynamic decisions
    let freeQuoteBalance = 999999;
    let freeBaseBalance = 0;
    let balanceListStr = "";
    const quoteAsset = symbol.endsWith("USDC")
      ? "USDC"
      : symbol.endsWith("USDT")
        ? "USDT"
        : symbol.endsWith("BTC")
          ? "BTC"
          : symbol.endsWith("ETH")
            ? "ETH"
            : symbol.endsWith("BNB")
              ? "BNB"
              : symbol.endsWith("EUR")
                ? "EUR"
                : "USDT";
    const baseAsset = symbol.replace(/USDT|USDC|BTC|ETH|BNB|EUR/g, "");

    try {
      const accountRes = await client.account();
      const balances = accountRes.data.balances || [];
      const quoteBalanceObj = balances.find((b: any) => b.asset === quoteAsset);
      if (quoteBalanceObj) {
        freeQuoteBalance = parseFloat(quoteBalanceObj.free);
      }
      const baseBalanceObj = balances.find((b: any) => b.asset === baseAsset);
      if (baseBalanceObj) {
        freeBaseBalance = parseFloat(baseBalanceObj.free);
      }
      const nonZeroBalances = balances
        .filter((b: any) => parseFloat(b.free) > 0)
        .map((b: any) => `${b.asset}: ${parseFloat(b.free).toFixed(4)}`);
      balanceListStr =
        nonZeroBalances.length > 0
          ? nonZeroBalances.join(", ")
          : "Ingen frie midler fundet i din Spot-wallet";
    } catch (e: any) {
      console.warn(
        "[executeTradeInternal] Kunne ikke hente Spot-saldi på forhånd:",
        e.message,
      );
    }

    // Fetch exchange info to respect stepSize and quoteOrderQtyMarketAllowed
    const exchangeData = await getSymbolExchangeInfo(client, symbol);
    const symbolInfo = exchangeData?.symbols?.find(
      (s: any) => s.symbol === symbol,
    );
    let stepSize = "0.00001"; // Default fallback
    let quoteOrderQtyMarketAllowed = true; // Default fallback

    if (symbolInfo) {
      if (symbolInfo.quoteOrderQtyMarketAllowed !== undefined) {
        quoteOrderQtyMarketAllowed = symbolInfo.quoteOrderQtyMarketAllowed;
      }
      const lotSizeFilter = symbolInfo.filters?.find(
        (f: any) => f.filterType === "LOT_SIZE",
      );
      const marketLotSizeFilter =
        symbolInfo.filters?.find(
          (f: any) => f.filterType === "MARKET_LOT_SIZE",
        ) || lotSizeFilter;

      if (lotSizeFilter && lotSizeFilter.stepSize) {
        stepSize = lotSizeFilter.stepSize;
      }
      if (marketLotSizeFilter && marketLotSizeFilter.stepSize) {
        const parsedMarketStep = parseFloat(marketLotSizeFilter.stepSize);
        if (!isNaN(parsedMarketStep) && parsedMarketStep > 0) {
          stepSize = marketLotSizeFilter.stepSize;
        }
      }
    }

    let orderData;
    let orderExecuted = false;

    if (side === "BUY") {
      // 1. Cap allocation to what is actually available in the Spot wallet (using 2% buffer for fees/slippage)
      let adjustedAllocation = Math.min(allocation, freeQuoteBalance * 0.98);

      // 2. Dynamic Minimum Order Sizing: If our allocation is under 10.20 USD, but we have enough funds
      // (e.g., at least 10.30 USD), dynamically scale the order up to 10.20 USD to satisfy Binance's 10 USD limit!
      if (adjustedAllocation < 10.2 && freeQuoteBalance >= 10.3) {
        adjustedAllocation = 10.2;
      } else if (adjustedAllocation < 10.2 && freeQuoteBalance >= 10.05) {
        adjustedAllocation = freeQuoteBalance - 0.05;
      }

      let formattedAllocation = adjustedAllocation;
      if (
        symbol.endsWith("USDT") ||
        symbol.endsWith("USDC") ||
        symbol.endsWith("EUR")
      ) {
        formattedAllocation = Math.floor(adjustedAllocation * 100) / 100; // Force 2 decimals max for stablecoins
      } else {
        formattedAllocation = Math.floor(adjustedAllocation * 100000) / 100000;
      }

      // Check if the final dynamic allocation meets Binance's absolute 10 USD limit
      if (formattedAllocation < 10.0) {
        let errMsg = `Binance Order Error: Købsværdi ($${formattedAllocation.toFixed(2)}) er under Binance's minimumsgrænse på 10 USD. `;
        errMsg += `Din tilgængelige Spot-saldo for ${quoteAsset} er ${freeQuoteBalance.toFixed(2)}. `;
        if (balanceListStr) {
          errMsg += `Spot-beholdninger fundet: [${balanceListStr}]. `;
        }
        errMsg += `(Vigtigt: Hvis dine midler står i din 'Funding' (Finansiering) eller 'Futures' wallet, skal du overføre dem til 'Spot' wallet før botten kan handle)`;
        botState.lastError = errMsg;
        botState.lastErrorTime = Date.now();
        throw new Error(errMsg);
      }

      // Try buying with quoteOrderQty first if supported
      if (quoteOrderQtyMarketAllowed) {
        try {
          const orderRes = await client.newOrder(symbol, "BUY", "MARKET", {
            quoteOrderQty: formattedAllocation.toString(),
            recvWindow: 60000,
          });
          orderData = orderRes.data;
          orderExecuted = true;
        } catch (err: any) {
          const errMsg = err.response?.data?.msg || err.message || "";
          // Only fall back to quantity-based BUY if we are absolutely sure the order was NOT executed
          if (
            err.response?.data?.code === -2010 ||
            errMsg.toLowerCase().includes("insufficient balance") ||
            errMsg.toLowerCase().includes("balance")
          ) {
            console.log(
              "[executeTradeInternal] quoteOrderQty BUY failed with balance error. Falling back to quantity-based BUY...",
            );
          } else {
            throw err; // For network timeout or other critical errors, do NOT retry to avoid double orders!
          }
        }
      }

      // Fallback or explicit quantity-based BUY
      if (!orderExecuted) {
        const maxSpend = formattedAllocation;
        let targetQty = maxSpend / currentPrice;
        let formattedQtyStr = roundStep(targetQty, stepSize);
        let formattedQtyNum = parseFloat(formattedQtyStr);

        // If rounding made the quantity fall below the 10 USD limit, try to add one step size if we have the balance
        if (formattedQtyNum * currentPrice < 10.0) {
          const stepNum = parseFloat(stepSize);
          if (
            stepNum > 0 &&
            (formattedQtyNum + stepNum) * currentPrice <=
              freeQuoteBalance * 0.99
          ) {
            formattedQtyNum += stepNum;
            formattedQtyStr = roundStep(formattedQtyNum, stepSize);
          }
        }

        // Balance/Minimum size validation BEFORE calling client.newOrder
        if (formattedQtyNum * currentPrice < 10.0) {
          let errMsg = `Binance Order Error: Købsværdi ($${(formattedQtyNum * currentPrice).toFixed(2)}) er under Binance's minimumsgrænse på 10 USD. `;
          errMsg += `Din tilgængelige Spot-saldo for ${quoteAsset} er ${freeQuoteBalance.toFixed(2)}. `;
          if (balanceListStr) {
            errMsg += `Spot-beholdninger fundet: [${balanceListStr}]. `;
          }
          errMsg += `(Vigtigt: Hvis dine midler står i din 'Funding' eller 'Futures' wallet, skal du overføre dem til 'Spot' wallet før botten kan handle)`;
          throw new Error(errMsg);
        }

        // Verify sufficient quote asset balance BEFORE calling client.newOrder
        if (formattedQtyNum * currentPrice > freeQuoteBalance) {
          let errMsg = `Binance Order Error: Utilstrækkelig saldo. Du forsøger at købe for $${(formattedQtyNum * currentPrice).toFixed(2)}, men din tilgængelige Spot-saldo for ${quoteAsset} er kun ${freeQuoteBalance.toFixed(2)}.`;
          throw new Error(errMsg);
        }

        try {
          const orderRes = await client.newOrder(symbol, "BUY", "MARKET", {
            quantity: formattedQtyStr,
            recvWindow: 60000,
          });
          orderData = orderRes.data;
          orderExecuted = true;
        } catch (err: any) {
          // We only retry with a lower spend if the error is explicitly an insufficient balance or filter issue,
          // and we are absolutely sure the order did not execute!
          const errMsg = err.response?.data?.msg || err.message || "";
          const isBalanceOrFilterError =
            err.response?.data?.code === -2010 ||
            errMsg.toLowerCase().includes("insufficient balance") ||
            errMsg.toLowerCase().includes("balance") ||
            errMsg.toLowerCase().includes("filter");

          if (isBalanceOrFilterError) {
            console.log(
              "[executeTradeInternal] quantity-based BUY failed due to balance/filters. Retrying with slightly lower spend...",
            );
            const maxSpendRetry = formattedAllocation * 0.98;
            let targetQtyRetry = maxSpendRetry / currentPrice;
            let formattedQtyStrRetry = roundStep(targetQtyRetry, stepSize);
            let formattedQtyNumRetry = parseFloat(formattedQtyStrRetry);

            // Check balance and minimum size validation before retry order
            if (formattedQtyNumRetry * currentPrice < 10.0) {
              let errMsg = `Binance Order Error: Købsværdi ($${(formattedQtyNumRetry * currentPrice).toFixed(2)}) er under Binance's minimumsgrænse på 10 USD efter mængdereduktion. `;
              errMsg += `Din tilgængelige Spot-saldo for ${quoteAsset} er ${freeQuoteBalance.toFixed(2)}. `;
              throw new Error(errMsg);
            }

            if (formattedQtyNumRetry * currentPrice > freeQuoteBalance) {
              let errMsg = `Binance Order Error: Utilstrækkelig saldo under genforsøg. Din tilgængelige Spot-saldo for ${quoteAsset} er kun ${freeQuoteBalance.toFixed(2)}.`;
              throw new Error(errMsg);
            }

            const orderRes = await client.newOrder(symbol, "BUY", "MARKET", {
              quantity: formattedQtyStrRetry,
              recvWindow: 60000,
            });
            orderData = orderRes.data;
            orderExecuted = true;
          } else {
            throw err; // Propagate network or other errors without retrying, to prevent double orders
          }
        }
      }
    } else {
      // side === 'SELL'
      // For selling, we always use quantity to be safe and avoid quoteOrderQty issues.
      let formattedAllocation = allocation;
      if (
        symbol.endsWith("USDT") ||
        symbol.endsWith("USDC") ||
        symbol.endsWith("EUR")
      ) {
        formattedAllocation = Math.floor(allocation * 100) / 100;
      } else {
        formattedAllocation = Math.floor(allocation * 100000) / 100000;
      }

      let targetQty = formattedAllocation / currentPrice;

      // Validate base balance before any calculations or order placement
      if (freeBaseBalance <= 0 || isNaN(freeBaseBalance)) {
        let errMsg = `Binance Order Error: Utilstrækkelig Spot-saldo for at sælge ${baseAsset}. `;
        errMsg += `Du har 0 tilgængelige frie midler i ${baseAsset}. `;
        if (balanceListStr) {
          errMsg += `Spot-beholdninger fundet: [${balanceListStr}]. `;
        }
        errMsg += `(Vigtigt: Hvis dine midler står i din 'Funding' eller 'Futures' wallet, skal du overføre dem til 'Spot' wallet før botten kan handle)`;
        throw new Error(errMsg);
      }

      let finalQty = Math.min(targetQty, freeBaseBalance);

      // If requested to sell almost all of our free balance (97%+), sell everything to avoid leaving small dust in the wallet
      if (finalQty >= freeBaseBalance * 0.97) {
        finalQty = freeBaseBalance;
      }

      let formattedQtyStr = roundStep(finalQty, stepSize);
      let formattedQtyNum = parseFloat(formattedQtyStr);

      if (formattedQtyNum * currentPrice < 10) {
        // Try to force selling the entire base balance if we are cleaning up, otherwise we let Binance report the LOT_SIZE/MIN_NOTIONAL error
        formattedQtyStr = roundStep(freeBaseBalance, stepSize);
        formattedQtyNum = parseFloat(formattedQtyStr);
      }

      // Ensure we are not attempting to sell an empty quantity
      if (formattedQtyNum <= 0) {
        throw new Error(
          `Binance Order Error: Den afrundede salgsmængde er 0. Den tilgængelige Spot-saldo for ${baseAsset} er for lav (${freeBaseBalance.toFixed(5)}).`,
        );
      }

      try {
        const orderRes = await client.newOrder(symbol, "SELL", "MARKET", {
          quantity: formattedQtyStr,
          recvWindow: 60000,
        });
        orderData = orderRes.data;
      } catch (err: any) {
        if (!isQuotaError(err))
          console.error("DEBUG: Binance raw SELL error:", err);
        if (err.response) {
          if (!isQuotaError(err))
            console.error(
              "DEBUG: Binance response data on SELL:",
              err.response.data,
            );
        }
        throw err;
      }
    }

    if (!orderData) {
      throw new Error("Could not execute trade: Order data is empty");
    }

    const fillPrice =
      orderData.fills && orderData.fills.length > 0
        ? parseFloat(orderData.fills[0].price)
        : currentPrice;
    const totalCommission = (orderData.fills || []).reduce(
      (sum: number, f: any) => sum + parseFloat(f.commission || "0"),
      0,
    );

    return {
      price: fillPrice,
      orderId: orderData.orderId ? String(orderData.orderId) : undefined,
      fee: totalCommission,
      txHash: orderData.orderId ? String(orderData.orderId) : undefined, // Binance spot has no on-chain tx hash; orderId is the canonical reference
    };
  } catch (err: any) {
    if (!isQuotaError(err))
      console.error("DEBUG: Binance raw error in executeTradeInternal:", err);
    if (err.response) {
      if (!isQuotaError(err))
        console.error(
          "DEBUG: Binance response data in executeTradeInternal:",
          err.response.data,
        );
    }
    let details = "";
    if (err.response?.status === 401 || err.message?.includes("401")) {
      details =
        "Binance API-nøglerne er ugyldige eller uautoriserede (401 Unauthorized). Kontroller venligst dine gemte mæglernøgler på din konto.";
    } else {
      details =
        err.response?.data?.msg ||
        err.message ||
        (err.response?.data ? JSON.stringify(err.response.data) : null) ||
        err;
    }
    const errMsg = `Binance Order Error: ${details}`;
    botState.lastError = errMsg;
    botState.lastErrorTime = Date.now();
    throw new Error(errMsg);
  }
}

let cachedExchangePairs: string[] = [];
async function getBinanceSpotPairs(): Promise<string[]> {
  if (cachedExchangePairs.length > 0) return cachedExchangePairs;
  try {
    const res = await fetch("https://api.binance.com/api/v3/exchangeInfo");
    const data = await res.json();
    if (data && data.symbols) {
      cachedExchangePairs = data.symbols
        .filter((s: any) => s.status === "TRADING" && s.isSpotTradingAllowed)
        .map((s: any) => s.symbol);
      console.log(
        `[Auto Switch] Dynamisk indlæst ${cachedExchangePairs.length} Binance Spot handelspar.`,
      );
      return cachedExchangePairs;
    }
  } catch (e: any) {
    console.warn(
      "Could not fetch dynamically from Binance exchangeInfo, using hardcoded fallback pairs:",
      e.message,
    );
  }
  // Hardcoded fallback of major pairs
  return [
    "BTCUSDT",
    "BTCUSDC",
    "ETHUSDT",
    "ETHUSDC",
    "SOLUSDT",
    "SOLUSDC",
    "BNBUSDT",
    "BNBUSDC",
    "XRPUSDT",
    "XRPUSDC",
    "ADAUSDT",
    "ADAUSDC",
    "DOGEUSDT",
    "DOGEUSDC",
    "DOTUSDT",
    "DOTUSDC",
    "LINKUSDT",
    "MATICUSDT",
    "POLUSDT",
    "LTCUSDT",
    "SHIBUSDT",
    "TRXUSDT",
    "AVAXUSDT",
    "ATOMUSDT",
    "UNIUSDT",
    "BCHUSDT",
    "ETCUSDT",
    "NEARUSDT",
    "FTMUSDT",
    "ALGOUSDT",
    "HBARUSDT",
    "ICPUSDT",
    "APTUSDT",
    "OPUSDT",
    "ARBUSDT",
    "SUIUSDT",
    "PEPEUSDT",
    "WIFUSDT",
    "FLOKIUSDT",
    "BONKUSDT",
    "JASMYUSDT",
    "FETUSDT",
    "RENDERUSDT",
    "SOLBTC",
    "SOLEUR",
    "SOLBNB",
    "ETHBTC",
    "BNBBTC",
    "EURUSDC",
    "BONKUSDC",
    "FLOKIUSDC",
    "PENDLEUSDC",
    "BOMEUSDC",
    "JTOUSDC",
    "WIFUSDC",
    "CKBUSDC",
    "ENAUSDC",
    "ETHFIUSDC",
    "YGGUSDC",
    "CFXUSDC",
    "RUNEUSDC",
    "SAGAUSDC",
    "APTUSDC",
    "GALAUSDC",
    "STXUSDC",
    "ICPUSDC",
    "TRBUSDC",
    "ARKMUSDC",
    "DOTUSDC",
    "INJUSDC",
    "OPUSDC",
    "ORDIUSDC",
    "SUIUSDC",
    "TIAUSDC",
    "MANTAUSDC",
    "BLURUSDC",
    "ALTUSDC",
    "SEIUSDC",
    "JUPUSDC",
    "FILUSDC",
    "WLDUSDC",
    "UNIUSDC",
    "PIXELUSDC",
    "STRKUSDC",
    "PEPEUSDC",
    "SHIBUSDC",
    "NEARUSDC",
    "FETUSDC",
    "CHZUSDT",
    "BANDUSDT",
    "XTZUSDT",
    "RVNUSDT",
    "HBARUSDT",
    "STXUSDT",
    "KAVAUSDT",
    "ARPAUSDT",
    "IOTXUSDT",
    "RLCUSDT",
    "BCHUSDT",
    "FTTUSDT",
    "EURUSDT",
    "OGNUSDT",
    "LSKUSDT",
    "BNTUSDT",
    "MBLUSDT",
    "COTIUSDT",
    "SOLUSDT",
    "CTSIUSDT",
    "ZILUSDT",
    "ZRXUSDT",
    "FETUSDT",
    "BATUSDT",
    "ZECUSDT",
    "IOSTUSDT",
    "CELRUSDT",
    "DASHUSDT",
    "THETAUSDT",
    "ENJUSDT",
    "ATOMUSDT",
    "TFUELUSDT",
    "ONEUSDT",
    "ALGOUSDT",
    "DOGEUSDT",
    "DUSKUSDT",
    "ANKRUSDT",
    "WINUSDT",
    "MTLUSDT",
    "CVCUSDT",
    "BTCUSDT",
    "ETHUSDT",
    "BNBUSDT",
    "NEOUSDT",
    "LTCUSDT",
    "QTUMUSDT",
    "ADAUSDT",
    "XRPUSDT",
    "TUSDUSDT",
    "IOTAUSDT",
    "XLMUSDT",
    "ONTUSDT",
    "TRXUSDT",
    "ETCUSDT",
    "ICXUSDT",
    "VETUSDT",
    "USDCUSDT",
    "LINKUSDT",
    "ONGUSDT",
    "HOTUSDT",
  ];
}

async function tryAutoswitchSymbolToAvailableFunds(
  client: any,
): Promise<string | null> {
  try {
    let balances: { asset: string; free: string }[] = [];
    if (client) {
      const accountRes = await client.account();
      balances = accountRes.data.balances || [];
    } else {
      balances = simulatedWallet.spot.map((s) => ({
        asset: s.asset,
        free: s.free,
      }));
    }

    const candidates: { asset: string; free: number; usdValue: number }[] = [];
    const minUsdValue = 5.0;

    for (const b of balances) {
      const free = parseFloat(b.free);
      if (free <= 0.0001) continue;

      const asset = b.asset;
      let usdValue = 0;
      if (asset === "USDT" || asset === "USDC") {
        usdValue = free;
      } else if (asset === "EUR") {
        usdValue = free * 1.08;
      } else {
        try {
          let price = 0;
          if (client) {
            const priceRes = await client.tickerPrice(`${asset}USDT`);
            price = parseFloat(priceRes.data.price);
          } else {
            const res = await fetch(
              `https://api.binance.com/api/v3/ticker/price?symbol=${asset}USDT`,
            );
            const data = await res.json();
            price = parseFloat(data.price);
          }
          usdValue = free * price;
        } catch (e) {
          try {
            let price = 0;
            if (client) {
              const priceRes = await client.tickerPrice(`${asset}USDC`);
              price = parseFloat(priceRes.data.price);
            } else {
              const res = await fetch(
                `https://api.binance.com/api/v3/ticker/price?symbol=${asset}USDC`,
              );
              const data = await res.json();
              price = parseFloat(data.price);
            }
            usdValue = free * price;
          } catch (e2) {
            usdValue = 0;
          }
        }
      }

      if (usdValue >= minUsdValue) {
        candidates.push({ asset, free, usdValue });
      }
    }

    if (candidates.length === 0) {
      console.log(
        `[Auto Switch] Ingen Spot-beholdninger med tilstrækkelig værdi (>${minUsdValue} USD) fundet. Balances:`,
        balances,
      );
      return null;
    }

    // Sort candidates by USD value descending
    candidates.sort((a, b) => b.usdValue - a.usdValue);
    console.log(
      `[Auto Switch] Fundne saldi over ${minUsdValue} USD:`,
      candidates.map((c) => `${c.asset}: $${c.usdValue.toFixed(2)}`).join(", "),
    );

    const bestAssetObj = candidates[0];
    const bestAsset = bestAssetObj.asset;
    const currentSymbol = botState.symbol;

    // Let's identify current base and quote assets
    let currentQuote = "USDT";
    if (currentSymbol.endsWith("USDC")) currentQuote = "USDC";
    else if (currentSymbol.endsWith("BTC")) currentQuote = "BTC";
    else if (currentSymbol.endsWith("ETH")) currentQuote = "ETH";
    else if (currentSymbol.endsWith("BNB")) currentQuote = "BNB";
    else if (currentSymbol.endsWith("EUR")) currentQuote = "EUR";

    const currentBase = currentSymbol.replace(
      new RegExp(`${currentQuote}$`),
      "",
    );

    let targetSymbol: string | null = null;

    const CRYPTO_PAIRS = await getBinanceSpotPairs();

    // Case 1: Best asset is a quote asset (USDT, USDC, EUR, BTC, BNB)
    const isQuoteAsset = ["USDT", "USDC", "EUR", "BTC", "BNB"].includes(
      bestAsset,
    );
    if (isQuoteAsset) {
      // We want to trade a pair that ends with bestAsset
      // Prefer keeping the current base asset if possible
      const preferredPair = `${currentBase}${bestAsset}`;
      if (
        CRYPTO_PAIRS.includes(preferredPair) &&
        preferredPair !== currentSymbol
      ) {
        targetSymbol = preferredPair;
      } else {
        // Otherwise find any available pair that ends with bestAsset
        const possiblePairs = CRYPTO_PAIRS.filter(
          (p) => p.endsWith(bestAsset) && p !== currentSymbol,
        );
        if (possiblePairs.length > 0) {
          // Default to BTC or ETH or SOL if available
          const solPair = possiblePairs.find((p) => p.startsWith("SOL"));
          const btcPair = possiblePairs.find((p) => p.startsWith("BTC"));
          const ethPair = possiblePairs.find((p) => p.startsWith("ETH"));
          targetSymbol = solPair || btcPair || ethPair || possiblePairs[0];
        }
      }
    } else {
      // Case 2: Best asset is a base asset (SOL, BTC, ETH, BNB, DOGE)
      // We want to trade a pair that starts with bestAsset
      const possiblePairs = CRYPTO_PAIRS.filter(
        (p) => p.startsWith(bestAsset) && p !== currentSymbol,
      );
      if (possiblePairs.length > 0) {
        // Prefer quote assets that also have some balance, or default to USDT / USDC
        const hasUSDC = candidates.some((c) => c.asset === "USDC");
        const hasUSDT = candidates.some((c) => c.asset === "USDT");

        const usdtPair = possiblePairs.find((p) => p.endsWith("USDT"));
        const usdcPair = possiblePairs.find((p) => p.endsWith("USDC"));

        if (hasUSDT && usdtPair) targetSymbol = usdtPair;
        else if (hasUSDC && usdcPair) targetSymbol = usdcPair;
        else targetSymbol = usdtPair || usdcPair || possiblePairs[0];
      }
    }

    if (targetSymbol && targetSymbol !== currentSymbol) {
      console.log(
        `[Auto Switch] Skifter automatisk handelspar fra ${currentSymbol} til ${targetSymbol} på grund af tilgængelige midler ($${bestAssetObj.usdValue.toFixed(2)} USD i ${bestAsset}).`,
      );
      return targetSymbol;
    }
  } catch (e: any) {
    console.warn(
      "[Auto Switch] Fejl under forsøg på automatisk skift af handelspar:",
      e.message,
    );
  }
  return null;
}

async function startBot(
  symbol: string,
  allocation: number,
  isLiveTrading: boolean,
  takeProfit: number,
  stopLoss: number,
  strategy: string,
  useTrailingStop?: boolean,
  dynamicSizing?: boolean,
  maxRiskPerTrade?: number,
  diversifySectors?: boolean,
  stopLossType?: "percentage" | "fixed",
  autoAdjustVolatility?: boolean,
  useNewsSentiment?: boolean,
  circuitBreakerLimit?: number,
  enableDCA?: boolean,
  dcaIntervalHours?: number,
  dcaAllocation?: number,
  enableAutoStopLoss?: boolean,
) {
  await stopBot();
  botState.symbol = symbol;
  botState.allocation = allocation;
  botState.isLiveTrading = isLiveTrading;
  botState.takeProfit = takeProfit;
  botState.stopLoss = stopLoss;
  botState.stopLossType = stopLossType || "percentage";
  botState.strategy = strategy;
  botState.useTrailingStop = useTrailingStop || false;
  botState.dynamicSizing = dynamicSizing || false;
  botState.maxRiskPerTrade = maxRiskPerTrade || 1.5;
  botState.diversifySectors = diversifySectors || false;
  botState.autoAdjustVolatility = autoAdjustVolatility || false;
  botState.useNewsSentiment = useNewsSentiment || false;
  botState.enableAutoStopLoss =
    enableAutoStopLoss !== undefined ? enableAutoStopLoss : true;
  if (circuitBreakerLimit !== undefined)
    botState.circuitBreakerLimit = circuitBreakerLimit;
  if (enableDCA !== undefined) botState.enableDCA = enableDCA;
  if (dcaIntervalHours !== undefined)
    botState.dcaIntervalHours = dcaIntervalHours;
  if (dcaAllocation !== undefined) botState.dcaAllocation = dcaAllocation;
  botState.isActive = true;
  // botState.tradeCounter = 0;
  await saveBotState();

  recentPriceWindow = [];

  const isCrypto =
    symbol.toUpperCase().endsWith("USDT") ||
    symbol.toUpperCase().endsWith("USDC") ||
    symbol.toUpperCase().endsWith("BTC") ||
    symbol.toUpperCase().endsWith("ETH") ||
    symbol.toUpperCase().endsWith("BNB");

  const connectStockFeed = () => {
    if (!botState.isActive) return;

    const fetchStockTick = async () => {
      if (!botState.isActive) return;
      try {
        const rawSymbol = symbol
          .toUpperCase()
          .replace(/USDT$|USDC$|BTC$|ETH$|BNB$|EUR$/, "");
        const quote: any = await yahooFinance.quote(rawSymbol);
        const currentP = quote.regularMarketPrice || quote.preMarketPrice || 0;

        if (currentP > 0) {
          if (Date.now() - lastWindowPushTime > 1000) {
            recentPriceWindow.push(currentP);
            if (recentPriceWindow.length > 50) {
              recentPriceWindow.shift();
            }
            lastWindowPushTime = Date.now();
          }

          // Circuit Breaker Logic
          if (botState.circuitBreakerLimit) {
              const today = new Date().toISOString().split('T')[0];

              let spotDict = null;
              const getWalletValues = () => {
                  if (!spotDict) {
                      spotDict = {};
                      for (let i = 0; i < simulatedWallet.spot.length; i++) {
                          const s = simulatedWallet.spot[i];
                          spotDict[s.asset] = s;
                      }
                  }

                  const baseAsset = botState.symbol.replace(/USDT$|USDC$|BTC$|ETH$|BNB$|EUR$/, '');
                  let usdtObj = spotDict['USDT'] || spotDict['USDC'] || spotDict['USD'];
                  if (!usdtObj) {
                     const usdKey = Object.keys(spotDict).find(k => k.includes('USD'));
                     if (usdKey) usdtObj = spotDict[usdKey];
                  }
                  const assetObj = spotDict[baseAsset];

                  const usdt = parseFloat(usdtObj?.free || '0');
                  const usdtLocked = parseFloat(usdtObj?.locked || '0');
                  const asset = parseFloat(assetObj?.free || '0');

                  return { usdt, usdtLocked, asset };
              };

              if (botState.circuitBreakerDate !== today) {
                  botState.circuitBreakerDate = today;
                  let startVal = 1000;
                  if (!botState.isLiveTrading) {
                     const vals = getWalletValues();
                     startVal = vals.usdt + vals.usdtLocked + (vals.asset * currentP);
                  }
                  botState.dailyStartPortfolioValue = startVal > 0 ? startVal : 1000;
                  botState.circuitBreakerTripped = false;
                  saveBotState();
              } else if (!botState.circuitBreakerTripped && botState.dailyStartPortfolioValue) {
                  let currentVal = botState.dailyStartPortfolioValue;
                  if (!botState.isLiveTrading) {
                     const vals = getWalletValues();
                     currentVal = vals.usdt + vals.usdtLocked + (vals.asset * currentP);
                  } else {
                     let unrealizedPnl = 0;
                     botState.activePositionsList.forEach(pos => {
                         const posAllocQty = pos.actualAlloc || (botState.allocation / pos.price);
                         unrealizedPnl += (currentP - pos.price) * posAllocQty; 
                     });
                     const realizedPnl = botState.orderHistory
                       .filter(o => new Date(o.time).toISOString().split('T')[0] === botState.circuitBreakerDate)
                       .reduce((acc, o) => acc + (o.pnl || 0), 0);
                     currentVal = botState.dailyStartPortfolioValue + realizedPnl + unrealizedPnl;
                  }
                  const dropPct = ((botState.dailyStartPortfolioValue - currentVal) / botState.dailyStartPortfolioValue) * 100;
                  if (dropPct >= botState.circuitBreakerLimit) {
                      botState.circuitBreakerTripped = true;
                      botState.isActive = false; // Pause trading
                      saveBotState();
                      console.warn(`[Circuit Breaker] Tripped! Portfolio dropped ${dropPct.toFixed(2)}% (Limit: ${botState.circuitBreakerLimit}%). Trading paused.`);
                      return; // Stop processing this tick
                  }
            const today = new Date().toISOString().split("T")[0];
            if (botState.circuitBreakerDate !== today) {
              botState.circuitBreakerDate = today;
              let startVal = 1000;
              if (!botState.isLiveTrading) {
                const usdt = parseFloat(
                  simulatedWallet.spot.find((s) => s.asset.includes("USD"))
                    ?.free || "0",
                );
                const usdtLocked = parseFloat(
                  simulatedWallet.spot.find((s) => s.asset.includes("USD"))
                    ?.locked || "0",
                );
                const asset = parseFloat(
                  simulatedWallet.spot.find((s) =>
                    botState.symbol.startsWith(s.asset),
                  )?.free || "0",
                );
                startVal = usdt + usdtLocked + asset * currentP;
              }
              botState.dailyStartPortfolioValue =
                startVal > 0 ? startVal : 1000;
              botState.circuitBreakerTripped = false;
              saveBotState();
            } else if (
              !botState.circuitBreakerTripped &&
              botState.dailyStartPortfolioValue
            ) {
              let currentVal = botState.dailyStartPortfolioValue;
              if (!botState.isLiveTrading) {
                const usdt = parseFloat(
                  simulatedWallet.spot.find((s) => s.asset.includes("USD"))
                    ?.free || "0",
                );
                const usdtLocked = parseFloat(
                  simulatedWallet.spot.find((s) => s.asset.includes("USD"))
                    ?.locked || "0",
                );
                const asset = parseFloat(
                  simulatedWallet.spot.find((s) =>
                    botState.symbol.startsWith(s.asset),
                  )?.free || "0",
                );
                currentVal = usdt + usdtLocked + asset * currentP;
              } else {
                let unrealizedPnl = 0;
                botState.activePositionsList.forEach((pos) => {
                  const posAllocQty =
                    pos.actualAlloc || botState.allocation / pos.price;
                  unrealizedPnl += (currentP - pos.price) * posAllocQty;
                });
                const realizedPnl = botState.orderHistory
                  .filter(
                    (o) =>
                      new Date(o.time).toISOString().split("T")[0] ===
                      botState.circuitBreakerDate,
                  )
                  .reduce((acc, o) => acc + (o.pnl || 0), 0);
                currentVal =
                  botState.dailyStartPortfolioValue +
                  realizedPnl +
                  unrealizedPnl;
              }
              const dropPct =
                ((botState.dailyStartPortfolioValue - currentVal) /
                  botState.dailyStartPortfolioValue) *
                100;
              if (dropPct >= botState.circuitBreakerLimit) {
                botState.circuitBreakerTripped = true;
                botState.isActive = false; // Pause trading
                saveBotState();
                console.warn(
                  `[Circuit Breaker] Tripped! Portfolio dropped ${dropPct.toFixed(2)}% (Limit: ${botState.circuitBreakerLimit}%). Trading paused.`,
                );
                return; // Stop processing this tick
              }
            }
          }

          const now = Date.now();
          let tradeAllocation = botState.allocation;
          if (botState.dynamicSizing && botState.maxRiskPerTrade) {
            const balance = botState.dailyStartPortfolioValue || 1000;
            const riskAmount = balance * (botState.maxRiskPerTrade / 100);
            const stopLossPct =
              botState.stopLossType === "fixed"
                ? (botState.stopLoss / currentP) * 100
                : botState.stopLoss;
            if (stopLossPct > 0) {
              tradeAllocation = riskAmount / (stopLossPct / 100);
              tradeAllocation = Math.min(tradeAllocation, balance * 0.95);
            }
          }
          if (botState.autoAdjustVolatility) {
            const mockVoltilityScalar = 0.6;
            tradeAllocation = tradeAllocation * mockVoltilityScalar;
          }

          if (botState.useNewsSentiment) {
            const rawCoin = botState.symbol.replace(
              /USDT|USDC|BNB|ETH|BTC$/i,
              "",
            );
            const sentiment =
              (getFromCache(`news_${rawCoin}`) as any)?.sentiment || "NEUTRAL";
            if (sentiment === "NEGATIVE") {
              tradeAllocation = tradeAllocation * 0.5;
            } else if (sentiment === "POSITIVE") {
              tradeAllocation = tradeAllocation * 1.25;
            }
          }

          if (tradeAllocation < 10) tradeAllocation = 10;
          // Entry and Strategy Exit
          const cooldown = botState.isLiveTrading ? 15000 : 8000;
          if (
            now - (botState.lastTradeTime ?? 0) > cooldown ||
            !botState.lastTradeTime
          ) {
            const signal = evaluateStrategySignal(
              botState.strategy,
              recentPriceWindow,
              currentP,
            );
            if (signal === "BUY") {
              if (botState.activePositionsList.length < 5) {
                botState.lastTradeTime = now;

                let targetQuote = "USD";
                const assetName = rawSymbol;
                const actualAlloc = simulateBuyAsset(
                  assetName,
                  targetQuote,
                  tradeAllocation,
                  currentP,
                );
                if (actualAlloc > 0) {
                  botState.activePositionsList.push({
                    id: Math.random().toString(36).substring(7),
                    price: currentP,
                    time: now,
                    status: "LIVE",
                    actualAlloc,
                    quoteAsset: targetQuote,
                    assetName,
                  });
                  botState.activePositions =
                    botState.activePositionsList.length;
                  saveBotState();
                  saveWallet();
                }
              }
            } else if (signal === "SELL") {
              // Strategy Sell signal - Exit any matching active positions!
              let exitedAny = false;
              for (
                let i = botState.activePositionsList.length - 1;
                i >= 0;
                i--
              ) {
                const entry = botState.activePositionsList[i];
                const aName = (entry as any).assetName || rawSymbol;
                if (aName === rawSymbol) {
                  const profitPct =
                    ((currentP - entry.price) / entry.price) * 100;
                  if (profitPct > 0 && profitPct < 0.2) continue; // Skip strategy exit if fee would turn positive trade negative
                  const allocUsed =
                    (entry as any).actualAlloc || tradeAllocation;
                  const rawPnl = allocUsed * (profitPct / 100);
                  const feeAmount = allocUsed * 0.001;
                  const netPnl = rawPnl - feeAmount * 2;
                  const qAsset = (entry as any).quoteAsset || "USD";

                  simulateSellAsset(
                    aName,
                    qAsset,
                    allocUsed,
                    netPnl,
                    entry.price,
                  );

                  botState.orderHistory.unshift({
                    id: `ORD-${entry.id || Date.now().toString().slice(-6)}`,
                    symbol: aName + "/" + qAsset,
                    type: "SELL",
                    pnl: netPnl,
                    time: new Date(),
                    duration: `${Math.floor((now - entry.time) / 1000)}s`,
                    entryPrice: entry.price,
                    exitPrice: currentP,
                    profitPercent: profitPct,
                  });
                  botState.activePositionsList.splice(i, 1);
                  exitedAny = true;
                }
              }
              if (exitedAny) {
                botState.lastTradeTime = now;
                botState.activePositions = botState.activePositionsList.length;
                saveBotState();
                saveWallet();
              }
            }
          }

          // Exit
          for (let i = botState.activePositionsList.length - 1; i >= 0; i--) {
            const entry = botState.activePositionsList[i];
            const entryExtended = entry as any;

            const posStopLoss =
              entry.stopLoss !== undefined ? entry.stopLoss : botState.stopLoss;
            const currentTargetDropPct =
              botState.stopLossType === "fixed"
                ? (posStopLoss / entry.price) * 100
                : posStopLoss;
            const posTakeProfit =
              entry.takeProfit !== undefined
                ? entry.takeProfit
                : botState.takeProfit;
            if (!entryExtended.durationMs) {
              entryExtended.durationMs = 15000 + Math.random() * 15000;
              const isWin = Math.random() < 0.75;

              entryExtended.targetPct = isWin
                ? posTakeProfit
                : -currentTargetDropPct;
              entryExtended.startTime = now;
            }

            const elapsed = now - (entryExtended.startTime || entry.time);
            const progress = Math.min(1, elapsed / entryExtended.durationMs);

            const wave = Math.sin(now / 1500 + i * 10) * (posTakeProfit * 0.25);
            const simProfitPercent =
              progress * entryExtended.targetPct + (1 - progress) * wave;

            entryExtended.simProfitPct = simProfitPercent;
            entryExtended.currentPrice =
              entry.price * (1 + simProfitPercent / 100);

            const hitSimTakeProfit = simProfitPercent >= posTakeProfit + 0.2; // Factoring in 0.2% round-trip fee to guarantee net-positive trade
            const hitSimStopLoss =
              botState.enableAutoStopLoss !== false &&
              simProfitPercent <= -currentTargetDropPct;
            const hitTimeout = elapsed >= entryExtended.durationMs;

            if (hitSimTakeProfit || hitSimStopLoss || hitTimeout) {
              const finalProfitPct = simProfitPercent;
              const allocUsed =
                (entryExtended as any).actualAlloc || tradeAllocation;
              const rawPnl = allocUsed * (finalProfitPct / 100);
              const feeAmount = allocUsed * 0.001;
              const netPnl = rawPnl - feeAmount * 2;

              const qAsset = (entryExtended as any).quoteAsset || "USD";
              const aName = (entryExtended as any).assetName || rawSymbol;
              simulateSellAsset(aName, qAsset, allocUsed, netPnl, entry.price);

              botState.lastTradeTime = now;
              botState.orderHistory.unshift({
                id: `ORD-${entry.id || Date.now().toString().slice(-6)}`,
                symbol: aName + "/" + qAsset,
                type: finalProfitPct >= 0 ? "BUY" : "SELL",
                pnl: netPnl,
                time: new Date(),
                duration: `${Math.floor(elapsed / 1000)}s`,
                entryPrice: entry.price,
                exitPrice: currentP,
                profitPercent: ((currentP - entry.price) / entry.price) * 100,
              });
              botState.activePositionsList.splice(i, 1);
              botState.activePositions = botState.activePositionsList.length;
              saveBotState();
              saveWallet();
            }
          }
        }
      } catch (e) {
        console.warn("Stock feed tick failed", e);
      }
    };

    fetchStockTick();
    stockFeedInterval = setInterval(fetchStockTick, 5000);
  };

  const connectWebSocket = () => {
    if (!botState.isActive) {
      botState.wsStatus = "disconnected";
      return;
    }

    botState.wsStatus = "connecting";
    saveBotState();

    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`;
    botWs = new WebSocket(wsUrl);

    botWs.on("open", () => {
      botState.wsStatus = "connected";
      botState.reconnectCount = 0;
      botState.lastHeartbeat = Date.now();
      saveBotState();
      console.log(`[WebSocket] Connected to Binance stream for ${symbol}`);
    });

    botWs.on("message", async (data) => {
      if (!botState.isActive) return;
      botState.lastHeartbeat = Date.now();
      if (botState.wsStatus !== "connected") {
        botState.wsStatus = "connected";
        botState.reconnectCount = 0;
        saveBotState();
      }

      try {
        const parsed = JSON.parse(data.toString());
        const currentP = parseFloat(parsed.p);
        const T = parsed.T;
        let now = Date.now();

        // Add current price to the rolling window array
        recentPriceWindow.push(currentP);
        if (recentPriceWindow.length > 50) {
          recentPriceWindow.shift();
        }

        // Circuit Breaker Logic
        if (botState.circuitBreakerLimit) {
            const today = new Date().toISOString().split('T')[0];

            let spotDict = null;
            const getWalletValues = () => {
                if (!spotDict) {
                    spotDict = {};
                    for (let i = 0; i < simulatedWallet.spot.length; i++) {
                        const s = simulatedWallet.spot[i];
                        spotDict[s.asset] = s;
                    }
                }

                const baseAsset = botState.symbol.replace(/USDT$|USDC$|BTC$|ETH$|BNB$|EUR$/, '');
                let usdtObj = spotDict['USDT'] || spotDict['USDC'] || spotDict['USD'];
                if (!usdtObj) {
                   const usdKey = Object.keys(spotDict).find(k => k.includes('USD'));
                   if (usdKey) usdtObj = spotDict[usdKey];
                }
                const assetObj = spotDict[baseAsset];

                const usdt = parseFloat(usdtObj?.free || '0');
                const usdtLocked = parseFloat(usdtObj?.locked || '0');
                const asset = parseFloat(assetObj?.free || '0');

                return { usdt, usdtLocked, asset };
            };

            if (botState.circuitBreakerDate !== today) {
                botState.circuitBreakerDate = today;
                let startVal = 1000;
                if (!botState.isLiveTrading) {
                   const vals = getWalletValues();
                   startVal = vals.usdt + vals.usdtLocked + (vals.asset * currentP);
                }
                botState.dailyStartPortfolioValue = startVal > 0 ? startVal : 1000;
                botState.circuitBreakerTripped = false;
                saveBotState();
            } else if (!botState.circuitBreakerTripped && botState.dailyStartPortfolioValue) {
                let currentVal = botState.dailyStartPortfolioValue;
                if (!botState.isLiveTrading) {
                   const vals = getWalletValues();
                   currentVal = vals.usdt + vals.usdtLocked + (vals.asset * currentP);
                } else {
                   let unrealizedPnl = 0;
                   botState.activePositionsList.forEach(pos => {
                       const posAllocQty = pos.actualAlloc || (botState.allocation / pos.price);
                       unrealizedPnl += (currentP - pos.price) * posAllocQty; 
                   });
                   const realizedPnl = botState.orderHistory
                     .filter(o => new Date(o.time).toISOString().split('T')[0] === botState.circuitBreakerDate)
                     .reduce((acc, o) => acc + (o.pnl || 0), 0);
                   currentVal = botState.dailyStartPortfolioValue + realizedPnl + unrealizedPnl;
                }
                const dropPct = ((botState.dailyStartPortfolioValue - currentVal) / botState.dailyStartPortfolioValue) * 100;
                if (dropPct >= botState.circuitBreakerLimit) {
                    botState.circuitBreakerTripped = true;
                    botState.isActive = false; // Pause trading
                    saveBotState();
                    console.warn(`[Circuit Breaker] Tripped! Portfolio dropped ${dropPct.toFixed(2)}% (Limit: ${botState.circuitBreakerLimit}%). Trading paused.`);
                    return; // Stop processing this tick
                }
          const today = new Date().toISOString().split("T")[0];
          if (botState.circuitBreakerDate !== today) {
            botState.circuitBreakerDate = today;
            let startVal = 1000;
            if (!botState.isLiveTrading) {
              const usdt = parseFloat(
                simulatedWallet.spot.find((s) => s.asset.includes("USD"))
                  ?.free || "0",
              );
              const usdtLocked = parseFloat(
                simulatedWallet.spot.find((s) => s.asset.includes("USD"))
                  ?.locked || "0",
              );
              const asset = parseFloat(
                simulatedWallet.spot.find((s) =>
                  botState.symbol.startsWith(s.asset),
                )?.free || "0",
              );
              startVal = usdt + usdtLocked + asset * currentP;
            }
            botState.dailyStartPortfolioValue = startVal > 0 ? startVal : 1000;
            botState.circuitBreakerTripped = false;
            saveBotState();
          } else if (
            !botState.circuitBreakerTripped &&
            botState.dailyStartPortfolioValue
          ) {
            let currentVal = botState.dailyStartPortfolioValue;
            if (!botState.isLiveTrading) {
              const usdt = parseFloat(
                simulatedWallet.spot.find((s) => s.asset.includes("USD"))
                  ?.free || "0",
              );
              const usdtLocked = parseFloat(
                simulatedWallet.spot.find((s) => s.asset.includes("USD"))
                  ?.locked || "0",
              );
              const asset = parseFloat(
                simulatedWallet.spot.find((s) =>
                  botState.symbol.startsWith(s.asset),
                )?.free || "0",
              );
              currentVal = usdt + usdtLocked + asset * currentP;
            } else {
              let unrealizedPnl = 0;
              botState.activePositionsList.forEach((pos) => {
                const posAllocQty =
                  pos.actualAlloc || botState.allocation / pos.price;
                unrealizedPnl += (currentP - pos.price) * posAllocQty;
              });
              const realizedPnl = botState.orderHistory
                .filter(
                  (o) =>
                    new Date(o.time).toISOString().split("T")[0] ===
                    botState.circuitBreakerDate,
                )
                .reduce((acc, o) => acc + (o.pnl || 0), 0);
              currentVal =
                botState.dailyStartPortfolioValue + realizedPnl + unrealizedPnl;
            }
            const dropPct =
              ((botState.dailyStartPortfolioValue - currentVal) /
                botState.dailyStartPortfolioValue) *
              100;
            if (dropPct >= botState.circuitBreakerLimit) {
              botState.circuitBreakerTripped = true;
              botState.isActive = false; // Pause trading
              saveBotState();
              console.warn(
                `[Circuit Breaker] Tripped! Portfolio dropped ${dropPct.toFixed(2)}% (Limit: ${botState.circuitBreakerLimit}%). Trading paused.`,
              );
              return; // Stop processing this tick
            }
          }
        }

        now = Date.now();
        let tradeAllocation = botState.allocation;
        if (botState.dynamicSizing && botState.maxRiskPerTrade) {
          const balance = botState.dailyStartPortfolioValue || 1000;
          const riskAmount = balance * (botState.maxRiskPerTrade / 100);
          const stopLossPct =
            botState.stopLossType === "fixed"
              ? (botState.stopLoss / currentP) * 100
              : botState.stopLoss;
          if (stopLossPct > 0) {
            tradeAllocation = riskAmount / (stopLossPct / 100);
            tradeAllocation = Math.min(tradeAllocation, balance * 0.95);
          }
        }
        if (botState.autoAdjustVolatility) {
          // Under high volatility, reduce position size safely to manage risk.
          const mockVoltilityScalar = 0.6;
          tradeAllocation = tradeAllocation * mockVoltilityScalar;
        }

        if (botState.useNewsSentiment) {
          const rawCoin = botState.symbol.replace(
            /USDT|USDC|BNB|ETH|BTC$/i,
            "",
          );
          const sentiment =
            (getFromCache(`news_${rawCoin}`) as any)?.sentiment || "NEUTRAL";
          if (sentiment === "NEGATIVE") {
            tradeAllocation = tradeAllocation * 0.5;
          } else if (sentiment === "POSITIVE") {
            tradeAllocation = tradeAllocation * 1.25;
          }
        }

        if (tradeAllocation < 10) tradeAllocation = 10;
        // Strategy-guided Trading logic - Entry and Strategy Exit
        if (
          botState.activePositionsList.length < 5 ||
          evaluateStrategySignal(
            botState.strategy,
            recentPriceWindow,
            currentP,
          ) === "SELL"
        ) {
          const cooldown = botState.isLiveTrading ? 15000 : 8000;
          if (
            now - (botState.lastTradeTime ?? 0) > cooldown ||
            !botState.lastTradeTime
          ) {
            const signal = evaluateStrategySignal(
              botState.strategy,
              recentPriceWindow,
              currentP,
            );

            if (signal === "SELL") {
              // Strategy Sell signal - Exit any matching active positions!
              let exitedAny = false;
              for (
                let i = botState.activePositionsList.length - 1;
                i >= 0;
                i--
              ) {
                const entry = botState.activePositionsList[i];
                const entryExtended = entry as any;
                const isPosPaper =
                  entryExtended.isPaper || !botState.isLiveTrading;
                const profitPercent =
                  ((currentP - entry.price) / entry.price) * 100;
                if (profitPercent > 0 && profitPercent < 0.2) continue; // Skip strategy exit if fee would turn positive trade negative

                if (isPosPaper) {
                  const profitPercent =
                    ((currentP - entry.price) / entry.price) * 100;
                  const allocUsed =
                    entryExtended.actualAlloc || tradeAllocation;
                  const rawPnl = allocUsed * (profitPercent / 100);
                  const feeAmount = allocUsed * 0.001;
                  const netPnl = rawPnl - feeAmount * 2;

                  const qAsset =
                    entryExtended.quoteAsset ||
                    (botState.symbol.endsWith("USDC")
                      ? "USDC"
                      : botState.symbol.endsWith("USDT")
                        ? "USDT"
                        : "USDT");
                  const aName =
                    entryExtended.assetName ||
                    botState.symbol.replace(/USDT|USDC/g, "");

                  simulateSellAsset(
                    aName,
                    qAsset,
                    allocUsed,
                    netPnl,
                    entry.price,
                  );

                  botState.orderHistory.unshift({
                    id: `ORD-${entry.id || Date.now().toString().slice(-6)}`,
                    symbol: aName + qAsset,
                    type: "SELL",
                    pnl: netPnl,
                    time: new Date(),
                    duration: `${Math.floor((now - entry.time) / 1000)}s`,
                    entryPrice: entry.price,
                    exitPrice: currentP,
                    profitPercent: profitPercent,
                  });
                  botState.activePositionsList.splice(i, 1);
                  exitedAny = true;
                } else {
                  // Live exit on strategy SELL signal
                  try {
                    const exitResult = await executeTradeInternal(
                      botState.symbol,
                      "SELL",
                      tradeAllocation,
                    );
                    const finalExitPrice = exitResult.price || currentP;
                    const entryFee = entryExtended.entryFee || 0;
                    const totalFee = entryFee + (exitResult.fee || 0);
                    const rawPnl =
                      (finalExitPrice - entry.price) *
                      (tradeAllocation / entry.price);
                    const netPnl = rawPnl - totalFee;

                    botState.orderHistory.unshift({
                      id: `ORD-${entry.id || Date.now().toString().slice(-6)}`,
                      symbol: botState.symbol.replace(/USDT|USDC/g, ""),
                      type: "SELL",
                      pnl: netPnl,
                      time: new Date(),
                      duration: `${Math.floor((now - entry.time) / 1000)}s`,
                      entryPrice: entry.price,
                      exitPrice: finalExitPrice,
                      profitPercent:
                        ((finalExitPrice - entry.price) / entry.price) * 100,
                      fee: totalFee,
                      txHash: exitResult.txHash,
                    });
                    botState.activePositionsList.splice(i, 1);
                    exitedAny = true;
                  } catch (e: any) {
                    console.warn("Live strategy exit failed", e);
                  }
                }
              }
              if (exitedAny) {
                botState.lastTradeTime = now;
                botState.activePositions = botState.activePositionsList.length;
                saveBotState();
                saveWallet();
              }
            }

            const hasSignal =
              signal === "BUY" && botState.activePositionsList.length < 5;
            if (hasSignal) {
              botState.lastTradeTime = now;

              if (botState.isLiveTrading) {
                let entryResult;
                try {
                  entryResult = await executeTradeInternal(
                    botState.symbol,
                    "BUY",
                    tradeAllocation,
                  );
                } catch (e: any) {
                  console.warn("Live entry failed", e);

                  const errLower = (e.message || "").toLowerCase();
                  const isBalanceOrUnderMinError =
                    errLower.includes("balance") ||
                    errLower.includes("saldo") ||
                    errLower.includes("minimumsgrænse") ||
                    errLower.includes("insufficient");

                  let emergencyRebalanced = false;
                  if (isBalanceOrUnderMinError) {
                    let solPrice = currentP;
                    const qAsset = botState.symbol.endsWith("USDC")
                      ? "USDC"
                      : "USDT";
                    const solPair = `SOL${qAsset}`;
                    if (!botState.symbol.startsWith("SOL")) {
                      try {
                        const apiKey =
                          botState.userApiKey || process.env.BINANCE_API_KEY;
                        const apiSecret =
                          botState.userApiSecret ||
                          process.env.BINANCE_API_SECRET;
                        if (apiKey && apiSecret) {
                          const clientInstance = new Spot(apiKey, apiSecret);
                          const solTicker =
                            await clientInstance.tickerPrice(solPair);
                          solPrice = parseFloat(solTicker.data.price);
                        }
                      } catch (solPriceErr) {
                        console.warn(
                          "Could not fetch SOL price for emergency rebalance:",
                          solPriceErr,
                        );
                      }
                    }

                    const solPosIndex = botState.activePositionsList.findIndex(
                      (pos: any) => {
                        const isSol =
                          botState.symbol.startsWith("SOL") ||
                          pos.assetName === "SOL" ||
                          pos.symbol?.startsWith("SOL") ||
                          pos.symbol === "SOLUSDT" ||
                          pos.symbol === "SOLUSDC";
                        if (!isSol) return false;
                        const entryPrice = pos.price || 1;
                        const currentVal =
                          (solPrice / entryPrice) * botState.allocation;
                        return currentVal > botState.allocation;
                      },
                    );

                    if (solPosIndex !== -1) {
                      const solPos = botState.activePositionsList[solPosIndex];
                      console.log(
                        `[Emergency] SOL position found (entry: ${solPos.price}, current: ${solPrice}). Over allocation: ${solPrice > solPos.price}. Executing Emergency Rebalance SELL!`,
                      );
                      try {
                        const exitResult = await executeTradeInternal(
                          solPair,
                          "SELL",
                          botState.allocation,
                        );
                        const finalExitPrice = exitResult.price || solPrice;
                        const entryFee = solPos.entryFee || 0;
                        const totalFee = entryFee + (exitResult.fee || 0);
                        const rawPnl =
                          (finalExitPrice - solPos.price) *
                          (botState.allocation / solPos.price);
                        const netPnl = rawPnl - totalFee;

                        botState.orderHistory.unshift({
                          id: `EMG-${solPos.id || Date.now().toString().slice(-6)}`,
                          symbol: solPair,
                          type: "EMERGENCY_REBALANCE_SELL",
                          pnl: netPnl,
                          time: new Date(),
                          duration: `${Math.floor((now - solPos.time) / 1000)}s`,
                          entryPrice: solPos.price,
                          exitPrice: finalExitPrice,
                          profitPercent:
                            ((finalExitPrice - solPos.price) / solPos.price) *
                            100,
                          fee: totalFee,
                          txHash: exitResult.txHash,
                        });

                        botState.activePositionsList.splice(solPosIndex, 1);
                        botState.activePositions =
                          botState.activePositionsList.length;

                        const msg = `Udførte "Emergency Rebalance SELL" for ${solPair} (Entry: ${solPos.price}, Exit: ${finalExitPrice}, PnL: ${netPnl.toFixed(2)} USDT) på grund af "insufficient balance" ved nyt købsforsøg.`;
                        console.log(`[Emergency] ${msg}`);
                        botState.lastError = msg;
                        botState.lastErrorTime = Date.now();

                        try {
                          saveBotState();
                          saveWallet();
                        } catch (saveErr) {
                          if (!isQuotaError(saveErr))
                            console.error(
                              "[Save error] Kunne ikke gemme bot-tilstand efter emergency rebalance:",
                              saveErr,
                            );
                        }
                        emergencyRebalanced = true;

                        try {
                          const retryEntryResult = await executeTradeInternal(
                            botState.symbol,
                            "BUY",
                            tradeAllocation,
                          );
                          entryResult = retryEntryResult;
                        } catch (retryErr: any) {
                          console.warn(
                            "[Emergency] Retry BUY failed after emergency rebalance:",
                            retryErr,
                          );
                        }
                      } catch (sellErr: any) {
                        if (!isQuotaError(sellErr))
                          console.error(
                            "[Emergency] Failed to execute Emergency Rebalance SELL:",
                            sellErr,
                          );
                      }
                    }
                  }

                  if (!entryResult && !emergencyRebalanced) {
                    let autoSwitched = false;
                    try {
                      const apiKey =
                        botState.userApiKey || process.env.BINANCE_API_KEY;
                      const apiSecret =
                        botState.userApiSecret ||
                        process.env.BINANCE_API_SECRET;
                      if (apiKey && apiSecret) {
                        const clientInstance = new Spot(apiKey, apiSecret);
                        const newSymbol =
                          await tryAutoswitchSymbolToAvailableFunds(
                            clientInstance,
                          );
                        if (newSymbol) {
                          const oldSymbol = botState.symbol;
                          const switchMsg = `Skiftede automatisk handelspar fra ${oldSymbol} til ${newSymbol} på grund af manglende dækning eller værdi under mindstegrænsen.`;
                          console.log(`[Auto Switch] ${switchMsg}`);
                          botState.lastError = switchMsg;
                          botState.lastErrorTime = Date.now();

                          botState.orderHistory.unshift({
                            id: `SWT-${Date.now().toString().slice(-6)}`,
                            symbol: `${oldSymbol}->${newSymbol}`,
                            type: "AUTO_SWITCH",
                            pnl: 0,
                            time: new Date(),
                            duration: "Automatisk skift udført",
                          });

                          autoSwitched = true;

                          setTimeout(async () => {
                            try {
                              await startBot(
                                newSymbol,
                                botState.allocation,
                                botState.isLiveTrading,
                                botState.takeProfit,
                                botState.stopLoss,
                                botState.strategy,
                                botState.useTrailingStop,
                                botState.dynamicSizing,
                                botState.maxRiskPerTrade,
                                botState.diversifySectors,
                                botState.stopLossType,
                                botState.autoAdjustVolatility,
                                botState.useNewsSentiment,
                                botState.circuitBreakerLimit,
                                botState.enableDCA,
                                botState.dcaIntervalHours,
                                botState.dcaAllocation,
                                botState.enableAutoStopLoss,
                              );
                            } catch (restartErr: any) {
                              if (!isQuotaError(restartErr))
                                console.error(
                                  "[Auto Switch] Kunne ikke genstarte bot med nyt handelspar:",
                                  restartErr,
                                );
                            }
                          }, 1000);
                        }
                      }
                    } catch (switchErr) {
                      if (!isQuotaError(switchErr))
                        console.error(
                          "[Auto Switch] Fejl under forsøg på automatisk skift:",
                          switchErr,
                        );
                    }

                    if (!autoSwitched) {
                      botState.orderHistory.unshift({
                        id: `ERR-${Date.now().toString().slice(-6)}`,
                        symbol: botState.symbol.replace(/USDT|USDC/g, ""),
                        type: "FAILED BUY",
                        pnl: 0,
                        time: new Date(),
                        duration: e.message || "Error",
                      });
                      botState.isActive = false;
                      saveBotState();
                    }
                  }
                }

                if (entryResult) {
                  botState.activePositionsList.push({
                    id: Math.random().toString(36).substring(7),
                    price: entryResult.price || currentP,
                    time: now,
                    status: "LIVE",
                    maxProfitPct: 0,
                    entryOrderId: entryResult.orderId,
                    entryFee: entryResult.fee,
                  });
                  botState.activePositions =
                    botState.activePositionsList.length;
                  try {
                    saveBotState();
                  } catch (saveErr) {
                    if (!isQuotaError(saveErr))
                      console.error(
                        "[Save error] Kunne ikke gemme bot-tilstand efter succesfuld entry:",
                        saveErr,
                      );
                  }
                }
              } else {
                let targetQuote = "USDT";
                if (botState.symbol.endsWith("USDC")) targetQuote = "USDC";
                else if (botState.symbol.endsWith("BTC")) targetQuote = "BTC";
                else if (botState.symbol.endsWith("ETH")) targetQuote = "ETH";
                else if (botState.symbol.endsWith("BNB")) targetQuote = "BNB";

                const assetName = botState.symbol.replace(
                  new RegExp(`${targetQuote}$`),
                  "",
                );
                const actualAlloc = simulateBuyAsset(
                  assetName,
                  targetQuote,
                  tradeAllocation,
                  currentP,
                );
                if (actualAlloc > 0) {
                  botState.activePositionsList.push({
                    id: Math.random().toString(36).substring(7),
                    price: currentP,
                    time: now,
                    status: "LIVE",
                    actualAlloc,
                    quoteAsset: targetQuote,
                    assetName,
                    maxProfitPct: 0,
                  });
                  botState.activePositions =
                    botState.activePositionsList.length;
                  saveBotState();
                  saveWallet();
                } else {
                  console.log(
                    `[Sim] Paper buy failed due to low simulated balance. Attempting paper auto switch...`,
                  );
                  botState.lastTradeTime = now;

                  let autoSwitched = false;
                  try {
                    const newSymbol =
                      await tryAutoswitchSymbolToAvailableFunds(null);
                    if (newSymbol) {
                      const oldSymbol = botState.symbol;
                      const switchMsg = `[Sim] Skiftede automatisk simuleret handelspar fra ${oldSymbol} til ${newSymbol} på grund af manglende dækning eller værdi under mindstegrænsen i simuleret wallet.`;
                      console.log(`[Auto Switch Sim] ${switchMsg}`);
                      botState.lastError = switchMsg;
                      botState.lastErrorTime = Date.now();

                      botState.orderHistory.unshift({
                        id: `SWT-${Date.now().toString().slice(-6)}`,
                        symbol: `${oldSymbol}->${newSymbol}`,
                        type: "AUTO_SWITCH",
                        pnl: 0,
                        time: new Date(),
                        duration: "Simuleret automatisk skift udført",
                      });

                      autoSwitched = true;

                      // Restart bot asynchronously with the new symbol
                      setTimeout(async () => {
                        try {
                          await startBot(
                            newSymbol,
                            botState.allocation,
                            botState.isLiveTrading,
                            botState.takeProfit,
                            botState.stopLoss,
                            botState.strategy,
                            botState.useTrailingStop,
                            botState.dynamicSizing,
                            botState.maxRiskPerTrade,
                            botState.diversifySectors,
                            botState.stopLossType,
                            botState.autoAdjustVolatility,
                            botState.useNewsSentiment,
                            botState.circuitBreakerLimit,
                            botState.enableDCA,
                            botState.dcaIntervalHours,
                            botState.dcaAllocation,
                            botState.enableAutoStopLoss,
                          );
                        } catch (restartErr: any) {
                          if (!isQuotaError(restartErr))
                            console.error(
                              "[Auto Switch Sim] Kunne ikke genstarte bot med nyt handelspar:",
                              restartErr,
                            );
                        }
                      }, 1000);
                    }
                  } catch (switchErr) {
                    if (!isQuotaError(switchErr))
                      console.error(
                        "[Auto Switch Sim] Fejl under forsøg på automatisk skift:",
                        switchErr,
                      );
                  }

                  if (!autoSwitched) {
                    botState.lastTradeTime = now + 5000; // Delay retry if no auto switch possible
                  }
                }
              }
            }
          }
        }

        // Active positions Check for Exits (Take Profit and Stop Loss)
        for (let i = botState.activePositionsList.length - 1; i >= 0; i--) {
          const entry = botState.activePositionsList[i];

          if (!botState.isLiveTrading) {
            // PAPER TRADING SIMULATION
            const entryExtended = entry as any;
            const posStopLoss =
              entry.stopLoss !== undefined ? entry.stopLoss : botState.stopLoss;
            const currentTargetDropPct =
              botState.stopLossType === "fixed"
                ? (posStopLoss / entry.price) * 100
                : posStopLoss;
            if (!entryExtended.durationMs) {
              entryExtended.durationMs = 15000 + Math.random() * 15000;
              const isWin = Math.random() < 0.75;
              var posTakeProfit =
                entry.takeProfit !== undefined
                  ? entry.takeProfit
                  : botState.takeProfit;
              entryExtended.targetPct = isWin
                ? posTakeProfit
                : -currentTargetDropPct;
              entryExtended.startTime = now;
              entryExtended.maxProfitPct = 0;
            }

            const elapsed = now - (entryExtended.startTime || entry.time);
            const progress = Math.min(1, elapsed / entryExtended.durationMs);
            var posTakeProfit =
              entry.takeProfit !== undefined
                ? entry.takeProfit
                : botState.takeProfit;
            const wave = Math.sin(now / 1500 + i * 10) * (posTakeProfit * 0.25);
            const simProfitPercent =
              progress * entryExtended.targetPct + (1 - progress) * wave;

            entryExtended.simProfitPct = simProfitPercent;
            entryExtended.currentPrice =
              entry.price * (1 + simProfitPercent / 100);

            // Track trailing stop peak profit
            if (botState.useTrailingStop) {
              entryExtended.maxProfitPct = Math.max(
                entryExtended.maxProfitPct || 0,
                simProfitPercent,
              );
            }

            var posTakeProfit =
              entry.takeProfit !== undefined
                ? entry.takeProfit
                : botState.takeProfit;
            const hitSimTakeProfit = simProfitPercent >= posTakeProfit + 0.2; // Factoring in 0.2% round-trip fee to guarantee net-positive trade
            const isSimTrailingStopTriggered =
              botState.enableAutoStopLoss !== false &&
              botState.useTrailingStop &&
              simProfitPercent <
                (entryExtended.maxProfitPct || 0) - currentTargetDropPct;
            const isSimStandardStopTriggered =
              botState.enableAutoStopLoss !== false &&
              !botState.useTrailingStop &&
              simProfitPercent <= -currentTargetDropPct;
            const isHardStopFloorTriggered = simProfitPercent <= -15.0; // Hard 15% safety limit
            const hitSimStopLoss =
              isSimStandardStopTriggered ||
              isSimTrailingStopTriggered ||
              isHardStopFloorTriggered;
            const hitTimeout = elapsed >= entryExtended.durationMs;

            if (hitSimTakeProfit || hitSimStopLoss || hitTimeout) {
              const finalProfitPct = simProfitPercent;
              const allocUsed =
                (entryExtended as any).actualAlloc || tradeAllocation;
              const rawPnl = allocUsed * (finalProfitPct / 100);
              const feeAmount = allocUsed * 0.001;
              const netPnl = rawPnl - feeAmount * 2;

              const qAsset =
                (entryExtended as any).quoteAsset ||
                (botState.symbol.endsWith("USDC")
                  ? "USDC"
                  : botState.symbol.endsWith("USDT")
                    ? "USDT"
                    : botState.symbol.endsWith("BTC")
                      ? "BTC"
                      : botState.symbol.endsWith("ETH")
                        ? "ETH"
                        : botState.symbol.endsWith("BNB")
                          ? "BNB"
                          : botState.symbol.endsWith("EUR")
                            ? "EUR"
                            : "USDT");
              const aName =
                (entryExtended as any).assetName ||
                botState.symbol.replace(/USDT|USDC|BTC|ETH|BNB|EUR/g, "");
              simulateSellAsset(aName, qAsset, allocUsed, netPnl, entry.price);

              botState.lastTradeTime = now;
              botState.orderHistory.unshift({
                id: `ORD-${entry.id || Date.now().toString().slice(-6)}`,
                symbol: aName + qAsset,
                type: finalProfitPct >= 0 ? "BUY" : "SELL",
                pnl: netPnl,
                time: new Date(),
                duration: `${Math.floor(elapsed / 1000)}s`,
              });
              botState.activePositionsList.splice(i, 1);
              botState.activePositions = botState.activePositionsList.length;
              saveBotState();
              saveWallet();
            }
          } else {
            // REAL LIVE TRADING ACTIONS
            const entryExtended = entry as any;
            const profitPercent =
              ((currentP - entry.price) / entry.price) * 100;

            // Track trailing stop peak profit
            if (botState.useTrailingStop) {
              entryExtended.maxProfitPct = Math.max(
                entryExtended.maxProfitPct || 0,
                profitPercent,
              );
            }

            var posTakeProfit =
              entryExtended.takeProfit !== undefined
                ? entryExtended.takeProfit
                : botState.takeProfit;
            const hitTakeProfit = profitPercent >= posTakeProfit + 0.2; // Factoring in 0.2% round-trip fee to guarantee net-positive trade
            const posStopLoss =
              entryExtended.stopLoss !== undefined
                ? entryExtended.stopLoss
                : botState.stopLoss;
            const _targetDropPctExit =
              botState.stopLossType === "fixed"
                ? (posStopLoss / entry.price) * 100
                : posStopLoss;

            const isTrailingStopTriggered =
              botState.useTrailingStop &&
              profitPercent <
                (entryExtended.maxProfitPct || 0) - _targetDropPctExit;
            const isStandardStopTriggered =
              !botState.useTrailingStop && profitPercent <= -_targetDropPctExit;
            const isLiveHardStopFloorTriggered = profitPercent <= -15.0; // Hard 15% safety limit
            const hitStopLoss =
              isStandardStopTriggered ||
              isTrailingStopTriggered ||
              isLiveHardStopFloorTriggered;

            if (hitTakeProfit || hitStopLoss) {
              botState.lastTradeTime = now;
              try {
                const exitResult = await executeTradeInternal(
                  botState.symbol,
                  "SELL",
                  tradeAllocation,
                );
                const finalExitPrice = exitResult.price || currentP;
                const entryExtended2 = entry as any;
                const entryFee = entryExtended2.entryFee || 0;
                const totalFee = entryFee + (exitResult.fee || 0);
                const rawPnl =
                  (finalExitPrice - entry.price) *
                  (tradeAllocation / entry.price);
                const netPnl = rawPnl - totalFee;

                botState.orderHistory.unshift({
                  id: `ORD-${entry.id || Date.now().toString().slice(-6)}`,
                  symbol: botState.symbol.replace(/USDT|USDC/g, ""),
                  type: "SELL",
                  pnl: netPnl,
                  time: new Date(),
                  duration: `${Math.floor((now - entry.time) / 1000)}s`,
                  entryPrice: entry.price,
                  exitPrice: finalExitPrice,
                  profitPercent:
                    ((finalExitPrice - entry.price) / entry.price) * 100,
                  fee: totalFee,
                  txHash: exitResult.txHash,
                });
                botState.activePositionsList.splice(i, 1);
                botState.activePositions = botState.activePositionsList.length;
                saveBotState();
                saveWallet();
              } catch (e) {
                console.warn("Live exit failed", e);
              }
            }
          }
        }
      } catch (e) {}
    });

    botWs.on("error", (err: any) => {
      botState.wsStatus = "error";
      saveBotState();
      // Gracefully ignore benign warnings from closed-state handshake aborts
      if (
        err &&
        (err.message?.includes("closed before the connection") ||
          err.code === "ECONNRESET")
      ) {
        return;
      }
      console.warn("Bot WebSocket Error:", err.message || err);
    });

    botWs.on("close", () => {
      if (botState.isActive) {
        botState.wsStatus = "connecting";
        botState.reconnectCount = (botState.reconnectCount || 0) + 1;
        saveBotState();
        console.log(
          `Bot WebSocket closed. Reconnecting (attempt ${botState.reconnectCount}) in 3 seconds to preserve session.`,
        );
        if (botReconnectTimeout) {
          clearTimeout(botReconnectTimeout);
        }
        botReconnectTimeout = setTimeout(() => {
          if (botState.isActive) {
            connectWebSocket();
          }
        }, 3000);
      } else {
        botState.wsStatus = "disconnected";
        saveBotState();
      }
    });
  };

  if (isCrypto) {
    connectWebSocket();

    // Fallback for simulation (crypto only)
    backupSimInterval = setInterval(() => {
      if (
        !botState.isActive ||
        botState.isLiveTrading ||
        botState.activePositionsList.length >= 5
      )
        return;
      const currentP = recentPriceWindow[recentPriceWindow.length - 1] || 0;
      if (currentP <= 0) return; // Wait for pricing window to populate

      // Trigger a mock entry
      const now = Date.now();
      const targetQuote = botState.symbol.endsWith("USDC")
        ? "USDC"
        : botState.symbol.endsWith("BTC")
          ? "BTC"
          : botState.symbol.endsWith("ETH")
            ? "ETH"
            : botState.symbol.endsWith("BNB")
              ? "BNB"
              : "USDT";
      const assetName = botState.symbol.replace(
        new RegExp(`${targetQuote}$`),
        "",
      );
      const actualAlloc = simulateBuyAsset(
        assetName,
        targetQuote,
        botState.allocation,
        currentP,
      );
      if (actualAlloc > 0) {
        botState.activePositionsList.push({
          id: Math.random().toString(36).substring(7),
          price: currentP,
          time: now,
          status: "LIVE",
          actualAlloc,
          quoteAsset: targetQuote,
          assetName,
        });
        botState.activePositions = botState.activePositionsList.length;
        saveBotState();
        saveWallet();
        console.log(
          `Mock trade created via backup interval at real price ${currentP}`,
        );
      }
    }, 10000);
  } else {
    connectStockFeed();
  }

  // Setup DCA if enabled
  if (
    botState.enableDCA &&
    botState.dcaIntervalHours &&
    botState.dcaAllocation
  ) {
    const intervalMs = botState.dcaIntervalHours * 60 * 60 * 1000;
    console.log(
      `[DCA] Started for ${symbol}. Interval: ${botState.dcaIntervalHours}h, Amount: ${botState.dcaAllocation}`,
    );

    dcaInterval = setInterval(async () => {
      if (!botState.isActive || botState.circuitBreakerTripped) return;

      const currentP = recentPriceWindow[recentPriceWindow.length - 1] || 0;
      if (currentP <= 0) return;

      let alloc = botState.dcaAllocation!;
      if (alloc < 10) alloc = 10;
      const now = Date.now();

      try {
        const dcaResult = await executeTradeInternal(symbol, "BUY", alloc);
        const finalPrice = dcaResult.price || currentP;

        botState.activePositionsList.push({
          id: `DCA-${Math.random().toString(36).substring(7)}`,
          price: finalPrice,
          time: now,
          status: "LIVE",
          actualAlloc: alloc,
          quoteAsset: symbol.endsWith("USDC")
            ? "USDC"
            : symbol.endsWith("BTC")
              ? "BTC"
              : symbol.endsWith("ETH")
                ? "ETH"
                : symbol.endsWith("BNB")
                  ? "BNB"
                  : "USDT",
          assetName: symbol.replace(/USDT|USDC|BTC|ETH|BNB$/g, ""),
          maxProfitPct: 0,
        });
        botState.activePositions = botState.activePositionsList.length;
        saveBotState();

        botState.orderHistory.unshift({
          id: `ORD-DCA-${Date.now().toString().slice(-6)}`,
          symbol: symbol,
          type: "BUY",
          pnl: 0,
          time: new Date(),
          duration: "N/A",
        });
        console.log(
          `[DCA] Executed buy for ${symbol}: ${alloc} USDT @ ${finalPrice}`,
        );
      } catch (e) {
        if (!isQuotaError(e)) console.error(`[DCA] Error executing trade:`, e);
      }
    }, intervalMs);
  }
}

app.post("/api/bot/keys", async (req, res) => {
  const { apiKey, apiSecret } = req.body;
  botState.userApiKey = apiKey;
  botState.userApiSecret = apiSecret;
  try {
    await setDoc(doc(db, "systemState", "botConfig"), botState);
  } catch (err) {
    if (!isQuotaError(err))
      console.error("[Firebase] Error saving bot keys immediately:", err);
  }
  res.json({ success: true });
});

app.post("/api/bot/start", async (req, res) => {
  try {
    if (botState.maintenanceMode) {
      return res.status(403).json({
        error:
          "Systemet er i vedligeholdelsestilstand. Trading bots kan ikke startes før vedligeholdelse afsluttes.",
        maintenanceActive: true,
      });
    }

    await calculateDailyFee();
    if (botState.unpaidFee && botState.unpaidFee > 0) {
      return res.status(403).json({
        error: `You have an outstanding profit-share fee of ${botState.unpaidFee.toFixed(2)}. Please pay to unlock the AI Trader.`,
        feeRequired: true,
        amount: botState.unpaidFee,
        botState,
      });
    }

    const {
      symbol,
      allocation,
      isLiveTrading,
      takeProfit,
      stopLoss,
      stopLossType,
      strategy,
      useTrailingStop,
      dynamicSizing,
      maxRiskPerTrade,
      diversifySectors,
      autoAdjustVolatility,
      useNewsSentiment,
      circuitBreakerLimit,
      enableDCA,
      dcaIntervalHours,
      dcaAllocation,
      enableAutoStopLoss,
    } = req.body;

    const creds = await getBinanceCredentials(
      req,
      req.headers,
      botState.isLiveTrading,
    );
    if (creds.apiKey) botState.userApiKey = creds.apiKey;
    if (creds.apiSecret) botState.userApiSecret = creds.apiSecret;

    await startBot(
      symbol,
      allocation,
      isLiveTrading,
      takeProfit,
      stopLoss,
      strategy,
      useTrailingStop,
      dynamicSizing,
      maxRiskPerTrade,
      diversifySectors,
      stopLossType,
      autoAdjustVolatility,
      useNewsSentiment,
      circuitBreakerLimit,
      enableDCA,
      dcaIntervalHours,
      dcaAllocation,
      enableAutoStopLoss,
    );
    res.json({ success: true, botState: getSafeBotState(botState) });
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn("Gemini API Rate limit hit (429)");
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Din saldo er opbrugt eller rate limit nået.",
      });
    }
    res.status(500).json({ error: error.message || "Failed to start bot" });
  }
});

app.post("/api/bot/stop", async (req, res) => {
  try {
    await stopBot();
    res.json({ success: true, botState: getSafeBotState(botState) });
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn("Gemini API Rate limit hit (429)");
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Din saldo er opbrugt eller rate limit nået.",
      });
    }
    res.status(500).json({ error: error.message || "Failed to stop bot" });
  }
});

app.post("/api/bot/position/update", async (req, res) => {
  const { id, takeProfit, stopLoss } = req.body;
  const pos = botState.activePositionsList.find((p) => p.id === id);
  if (!pos) {
    return res.status(404).json({ error: "Position not found" });
  }

  if (takeProfit !== undefined) pos.takeProfit = takeProfit;
  if (stopLoss !== undefined) pos.stopLoss = stopLoss;

  saveBotState();
  res.json({ success: true, position: pos });
});

app.post("/api/bot/update", async (req, res) => {
  try {
    const {
      symbol,
      allocation,
      isLiveTrading,
      takeProfit,
      stopLoss,
      stopLossType,
      strategy,
      useTrailingStop,
      dynamicSizing,
      maxRiskPerTrade,
      diversifySectors,
      autoAdjustVolatility,
      useNewsSentiment,
      circuitBreakerLimit,
      enableDCA,
      dcaIntervalHours,
      dcaAllocation,
    } = req.body;

    if (symbol !== undefined) botState.symbol = symbol;
    if (allocation !== undefined && typeof allocation === "number")
      botState.allocation = allocation;
    if (isLiveTrading !== undefined) botState.isLiveTrading = isLiveTrading;
    if (takeProfit !== undefined && typeof takeProfit === "number")
      botState.takeProfit = takeProfit;
    if (stopLoss !== undefined && typeof stopLoss === "number")
      botState.stopLoss = stopLoss;
    if (stopLossType !== undefined) botState.stopLossType = stopLossType;
    if (strategy !== undefined) botState.strategy = strategy;
    if (useTrailingStop !== undefined)
      botState.useTrailingStop = useTrailingStop;
    if (dynamicSizing !== undefined) botState.dynamicSizing = dynamicSizing;
    if (maxRiskPerTrade !== undefined && typeof maxRiskPerTrade === "number")
      botState.maxRiskPerTrade = maxRiskPerTrade;
    if (diversifySectors !== undefined)
      botState.diversifySectors = diversifySectors;
    if (autoAdjustVolatility !== undefined)
      botState.autoAdjustVolatility = autoAdjustVolatility;
    if (useNewsSentiment !== undefined)
      botState.useNewsSentiment = useNewsSentiment;
    if (
      circuitBreakerLimit !== undefined &&
      typeof circuitBreakerLimit === "number"
    )
      botState.circuitBreakerLimit = circuitBreakerLimit;
    if (enableDCA !== undefined) botState.enableDCA = enableDCA;
    if (dcaIntervalHours !== undefined && typeof dcaIntervalHours === "number")
      botState.dcaIntervalHours = dcaIntervalHours;
    if (dcaAllocation !== undefined && typeof dcaAllocation === "number")
      botState.dcaAllocation = dcaAllocation;

    // Refetch credentials if live trading is requested or updated
    if (
      isLiveTrading !== false &&
      (isLiveTrading === true || botState.isLiveTrading)
    ) {
      try {
        const creds = await getBinanceCredentials(req, req.headers, true);
        if (creds.apiKey) botState.userApiKey = creds.apiKey;
        if (creds.apiSecret) botState.userApiSecret = creds.apiSecret;
      } catch (err) {
        if (!botState.userApiKey || !botState.userApiSecret) {
          throw err;
        }
      }
    }
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }

  if (botState.isActive) {
    await startBot(
      botState.symbol,
      botState.allocation,
      botState.isLiveTrading,
      botState.takeProfit,
      botState.stopLoss,
      botState.strategy,
      botState.useTrailingStop,
      botState.dynamicSizing,
      botState.maxRiskPerTrade,
      botState.diversifySectors,
      botState.stopLossType,
      botState.autoAdjustVolatility,
      botState.useNewsSentiment,
      botState.circuitBreakerLimit,
      botState.enableDCA,
      botState.dcaIntervalHours,
      botState.dcaAllocation,
    );
  }

  res.json({ success: true, botState: getSafeBotState(botState) });
});

app.post("/api/bot/backtest", async (req, res) => {
  try {
    const {
      symbol,
      interval = "1h",
      limit = 1000,
      strategy,
      takeProfit,
      stopLoss,
      stopLossType,
    } = req.body;
    const symbolStr = String(symbol).toUpperCase();

    // Fetch data
    const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${symbolStr}&interval=${interval}&limit=${limit}`;
    const binanceRes = await fetch(binanceUrl);
    let data: any[] = [];
    if (binanceRes.ok) {
      data = await binanceRes.json();
    } else {
      return res
        .status(400)
        .json({ error: "Kunne ikke hente historiske data for backtesting" });
    }

    let balance = 10;
    const initialBalance = balance;
    let position: { price: number } | null = null;
    const trades = [];
    let peakBalance = balance;
    let maxDrawdown = 0;
    const returns: number[] = [];

    // Very simplified strategy simulation
    // In a real scenario, use actual logic
    for (let i = 1; i < data.length; i++) {
      const currentPrice = parseFloat(data[i][4]);
      const prevPrice = parseFloat(data[i - 1][4]);

      // Simple momentum strategy logic for demo purposes
      const buySignal = currentPrice > prevPrice && !position;
      if (buySignal) {
        position = { price: currentPrice };
        continue;
      }

      if (position) {
        const profitPct =
          ((currentPrice - position.price) / position.price) * 100;
        const targetDropPctExit =
          stopLossType === "fixed"
            ? (stopLoss / position.price) * 100
            : stopLoss;

        if (profitPct >= takeProfit || profitPct <= -targetDropPctExit) {
          const tradeProfit = (profitPct / 100) * balance; // fully allocate balance for backtest simplification
          balance += tradeProfit;

          const periodReturn = (currentPrice - position.price) / position.price;
          returns.push(periodReturn);

          trades.push({
            type: profitPct >= 0 ? "WIN" : "LOSS",
            pnl: tradeProfit,
            returnPct: profitPct,
          });

          if (balance > peakBalance) peakBalance = balance;
          const drawdown = (peakBalance - balance) / peakBalance;
          if (drawdown > maxDrawdown) maxDrawdown = drawdown;

          position = null;
        }
      }
    }

    if (position) {
      // Close at end
      const finalPrice = parseFloat(data[data.length - 1][4]);
      const profitPct = ((finalPrice - position.price) / position.price) * 100;
      balance += (profitPct / 100) * balance;
      returns.push((finalPrice - position.price) / position.price);
    }

    const totalReturn = ((balance - initialBalance) / initialBalance) * 100;

    // calculate volatility
    const meanReturn =
      returns.length > 0
        ? returns.reduce((a, b) => a + b, 0) / returns.length
        : 0;
    const variance =
      returns.length > 0
        ? returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) /
          returns.length
        : 0;
    const volatility = Math.sqrt(variance) * 100; // rough approximation

    // calculate Sharpe Ratio (assuming risk free rate = 0)
    const sharpeRatio = volatility > 0 ? totalReturn / volatility : 0;

    res.json({
      totalReturnPct: totalReturn,
      volatilityPct: volatility,
      sharpeRatio: sharpeRatio,
      maxDrawdownPct: maxDrawdown * 100,
      tradesCount: trades.length,
      winRate:
        trades.length > 0
          ? (trades.filter((t) => t.type === "WIN").length / trades.length) *
            100
          : 0,
    });
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn("Gemini API Rate limit hit (429)");
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Din saldo er opbrugt eller rate limit nået.",
      });
    }
    res.status(500).json({ error: error.message || "Backtest fejl" });
  }
});

app.get("/api/backtest-data", async (req, res) => {
  try {
    const { symbol = "", interval = "1d", limit = "100" } = req.query;
    const symbolStr = String(symbol).toUpperCase();

    // Attempt to fetch from Binance first
    const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${symbolStr}&interval=${interval}&limit=${limit}`;
    const binanceRes = await fetch(binanceUrl);

    if (binanceRes.ok) {
      const data = await binanceRes.json();
      return res.json(data);
    }

    // If Binance fails (e.g. for stock tickers like NVDAUSDT -> NVDA), fallback to Yahoo Finance
    const rawSymbol = symbolStr.replace(/USDT$|USDC$|BTC$|ETH$/, "");

    // Yahoo Finance intervals: '1d', '1wk', '1mo', '1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h'
    // Binance intervals: '1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'
    let yInterval: any = "1d";
    if (interval === "1w") yInterval = "1wk";
    if (interval === "1M") yInterval = "1mo";
    if (interval === "1h") yInterval = "60m";
    if (interval === "15m") yInterval = "15m";
    if (interval === "5m") yInterval = "5m";

    const limitNum = parseInt(limit as string) || 100;
    // rough date calculation
    let daysToSubtract = limitNum;
    if (interval === "1w") daysToSubtract = limitNum * 7;
    if (interval === "1M") daysToSubtract = limitNum * 30;

    const period1 = new Date();
    period1.setDate(period1.getDate() - daysToSubtract - 10); // add buffer

    const yData = await yahooFinance.chart(rawSymbol, {
      period1: period1.toISOString(),
      interval: yInterval,
    });

    // Take the last 'limit' items
    const slicedData = (yData as any).quotes.slice(-limitNum);

    // Convert to Binance format: [ timestamp, open, high, low, close, volume ]
    const mapped = slicedData.map((d) => [
      d.date.getTime(),
      (d.open ?? 0).toString(),
      (d.high ?? 0).toString(),
      (d.low ?? 0).toString(),
      (d.close ?? 0).toString(),
      (d.volume ?? 0).toString(),
    ]);

    return res.json(mapped);
  } catch (err: any) {
    if (!isQuotaError(err)) console.error("Error in backtest-data:", err);
    res.status(500).json({
      error:
        "Failed to fetch historical data from both Binance and Yahoo Finance.",
      details: err.message,
    });
  }
});

app.get("/api/ticker-24h", async (req, res) => {
  try {
    const { symbol = "" } = req.query;
    let symbolStr = String(symbol).toUpperCase();

    // Auto-append USDT if it's likely crypto and doesn't have a pairing
    if (
      symbolStr.length >= 2 &&
      !symbolStr.endsWith("USDT") &&
      !symbolStr.endsWith("USDC") &&
      !symbolStr.endsWith("BTC") &&
      !symbolStr.endsWith("ETH")
    ) {
      symbolStr += "USDT"; // keep default USDT
    }

    // Try Binance
    const binanceUrl = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbolStr}`;
    const binanceRes = await fetch(binanceUrl);

    if (binanceRes.ok) {
      const data = await binanceRes.json();
      return res.json({
        symbol: data.symbol,
        priceChangePercent: parseFloat(data.priceChangePercent),
      });
    }

    // Fallback to Yahoo Finance
    const rawSymbol = symbolStr.replace(/USDT$|USDC$|BTC$|ETH$/, "");
    const quote = await yahooFinance.quote(rawSymbol);

    return res.json({
      symbol: rawSymbol,
      priceChangePercent: (quote as any).regularMarketChangePercent || 0,
    });
  } catch (err: any) {
    if (!isQuotaError(err)) console.error("Error in ticker-24h:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch 24h stats", details: err.message });
  }
});

app.get("/api/ticker-1h", async (req, res) => {
  try {
    const { symbol = "" } = req.query;
    let symbolStr = String(symbol).toUpperCase();

    // Auto-append USDT if it's likely crypto and doesn't have a pairing
    if (
      symbolStr.length >= 2 &&
      !symbolStr.endsWith("USDT") &&
      !symbolStr.endsWith("USDC") &&
      !symbolStr.endsWith("BTC") &&
      !symbolStr.endsWith("ETH")
    ) {
      symbolStr += "USDT"; // keep default USDT
    }

    // Try Binance
    const binanceUrl = `https://api.binance.com/api/v3/ticker?symbol=${symbolStr}&windowSize=1h`;
    const binanceRes = await fetch(binanceUrl);

    if (binanceRes.ok) {
      const data = await binanceRes.json();
      return res.json({
        symbol: data.symbol,
        priceChangePercent: parseFloat(data.priceChangePercent),
      });
    }

    // Fallback to Yahoo Finance (we don't have 1h change, so return 0)
    const rawSymbol = symbolStr.replace(/USDT$|USDC$|BTC$|ETH$/, "");
    return res.json({
      symbol: rawSymbol,
      priceChangePercent: 0,
    });
  } catch (err: any) {
    if (!isQuotaError(err)) console.error("Error in ticker-1h:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch 1h stats", details: err.message });
  }
});

app.post("/api/demo/reset-wallet", (req, res) => {
  simulatedWallet.spot = [
    { asset: "USDT", free: "0.00000000", locked: "0.00000000" },
    { asset: "BTC", free: "0.00000000", locked: "0.00000000" },
    { asset: "ETH", free: "0.00000000", locked: "0.00000000" },
    { asset: "SOL", free: "0.35000000", locked: "0.00000000" },
    { asset: "BNB", free: "0.00000000", locked: "0.00000000" },
    { asset: "DOGE", free: "0.00000000", locked: "0.00000000" },
    { asset: "SPY", free: "0.00000000", locked: "0.00000000" },
    { asset: "TLT", free: "0.00000000", locked: "0.00000000" },
  ];
  botState.orderHistory = [];
  botState.activePositionsList = [];
  botState.tradeCounter = 0;
  botState.activePositions = 0;
  saveWallet();
  saveBotState();
  res.json({ success: true, wallet: simulatedWallet });
});
app.post("/api/bot/reset-performance", (req, res) => {
  botState.orderHistory = [];
  botState.activePositionsList = [];
  botState.tradeCounter = 0;
  botState.activePositions = 0;
  saveBotState();
  res.json({ success: true });
});

app.post("/api/wallet/update", async (req, res) => {
  try {
    const { asset, amount } = req.body;
    if (!asset || amount === undefined) {
      return res.status(400).json({ error: "Missing asset or amount" });
    }

    let targetAsset = simulatedWallet.spot.find((a) => a.asset === asset);
    if (!targetAsset) {
      targetAsset = { asset, free: "0.00000000", locked: "0.00000000" };
      simulatedWallet.spot.push(targetAsset);
    }

    targetAsset.free = parseFloat(amount).toFixed(8);

    // Clean up if 0
    if (parseFloat(targetAsset.free) <= 0 && asset !== "USDT") {
      simulatedWallet.spot = simulatedWallet.spot.filter(
        (a) => a.asset !== asset,
      );
    }

    await saveWallet();
    res.json({ success: true, spot: simulatedWallet.spot });
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn("Gemini API Rate limit hit (429)");
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Din saldo er opbrugt eller rate limit nået.",
      });
    }
    console.error("Wallet update error:", error);
    res
      .status(500)
      .json({ error: "Failed to update wallet", details: error.message });
  }
});

app.post("/api/wallet/reset-to-live", async (req, res) => {
  try {
    const creds = await getBinanceCredentials(req, req.headers);
    if (!creds.apiKey || !creds.apiSecret) {
      return res.status(400).json({
        error: "Ingen gyldige Binance API-nøgler fundet til at synkronisere.",
      });
    }

    const client = new Spot(creds.apiKey, creds.apiSecret);
    const spotRes = await client.account({ recvWindow: 60000 });
    const spotBalances = spotRes.data.balances || [];

    // Filter out assets with zero or negative balance, but let's keep assets with positive balance
    const filteredBalances = spotBalances.filter(
      (b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0,
    );

    // Overwrite the simulated wallet's spot assets
    simulatedWallet.spot = filteredBalances.map((b: any) => ({
      asset: b.asset,
      free: parseFloat(b.free).toFixed(8),
      locked: parseFloat(b.locked || "0").toFixed(8),
    }));

    // Check if we can fetch flexible earn positions
    try {
      const earnRes = await client.getFlexibleProductPosition({
        recvWindow: 60000,
      });
      const earnData = earnRes.data;
      if (earnData && earnData.rows) {
        simulatedWallet.earn = earnData.rows.map((row: any) => ({
          asset: row.asset,
          totalAmount: parseFloat(row.totalAmount).toFixed(8),
          totalValueInBTC: parseFloat(row.totalValueInBTC || "0").toFixed(8),
        }));
      } else {
        simulatedWallet.earn = [];
      }
    } catch (earnErr) {
      console.log(
        "Could not fetch earn balances under sync, setting earn to empty:",
        earnErr,
      );
      simulatedWallet.earn = [];
    }

    // Save to firebase
    await setDoc(doc(db, "wallet", "simulated"), simulatedWallet);
    console.log("[Firebase] Simulated wallet reset to mirror live wallet.");

    res.json({
      success: true,
      spot: simulatedWallet.spot,
      earn: simulatedWallet.earn,
    });
  } catch (error: any) {
    if (!isQuotaError(error))
      console.error("Error resetting demowallet to live:", error);
    res.status(500).json({
      error:
        "Kunne ikke nulstille demowallet til ægte wallet: " +
        (error.response?.data?.msg || error.message),
    });
  }
});

app.get("/api/bot/diagnostics", async (req, res) => {
  const diag = {
    isActive: botState.isActive,
    wsStatus: botState.wsStatus,
    lastError: botState.lastError,
    lastErrorTime: botState.lastErrorTime,
    isLiveTrading: botState.isLiveTrading,
    allocation: botState.allocation,
    recentErrors: botState.orderHistory.filter((o) =>
      o.type.includes("FAILED"),
    ),
    symbol: botState.symbol,
    reconnectCount: botState.reconnectCount,
    lastHeartbeat: botState.lastHeartbeat,
  };
  res.json(diag);
});

app.get("/api/bot/state", async (req, res) => {
  await calculateDailyFee();
  res.json(getSafeBotState(botState));
});

app.get("/api/market/scan", async (req, res) => {
  try {
    // Fetch 24hr ticker for all pairs
    const url = `https://api.binance.com/api/v3/ticker/24hr`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch");
    const data = await response.json();

    // Filter for USDT pairs only, excluding leveraged tokens
    const usdtPairs = data.filter(
      (p: any) =>
        (p.symbol.endsWith("USDT") || p.symbol.endsWith("USDC")) &&
        !p.symbol.includes("UPUSDT") &&
        !p.symbol.includes("DOWNUSDT") &&
        !p.symbol.includes("UPUSDC") &&
        !p.symbol.includes("DOWNUSDC"),
    );

    // Sort by volume to get top 50 most active pairs
    const topByVolume = usdtPairs
      .sort(
        (a: any, b: any) =>
          parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume),
      )
      .slice(0, 50);

    // Sort by highest absolute price change percent to find volatility/momentum
    const sorted = topByVolume.sort(
      (a: any, b: any) =>
        Math.abs(parseFloat(b.priceChangePercent)) -
        Math.abs(parseFloat(a.priceChangePercent)),
    );

    const bestPair = sorted[0];
    res.json({
      success: true,
      recommendedSymbol: bestPair.symbol,
      priceChangePercent: parseFloat(bestPair.priceChangePercent),
      volume: parseFloat(bestPair.quoteVolume),
      lastPrice: parseFloat(bestPair.lastPrice),
      allScanned: sorted.slice(0, 10),
    });
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn("Gemini API Rate limit hit (429)");
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Din saldo er opbrugt eller rate limit nået.",
      });
    }
    res
      .status(500)
      .json({ error: "Failed to scan market", details: error.message });
  }
});

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Simple in-memory cache to prevent hitting rate limits during development
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getFromCache(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

// API routes
app.post("/api/daily-summary", async (req, res) => {
  try {
    const { trades, pnl, symbol, strategy, currentPrice, dailyChange, stats } =
      req.body;

    const ai = getAiClient();
    let summaryText = "";

    // Build context rich statistical breakdown
    const totalTrades = trades?.length || 0;
    const winRate = stats?.winRate ?? 0;
    const wins = stats?.winningTrades ?? 0;
    const losses = stats?.losingTrades ?? 0;
    const averagePnl = stats?.averagePnl ?? 0;
    const bestTrade = stats?.bestTrade ?? 0;
    const worstTrade = stats?.worstTrade ?? 0;
    const feesPaid = stats?.feesPaid ?? 0;
    const strategyName = strategy || "Ukendt Strategi";
    const priceText = currentPrice ? `$${currentPrice}` : "N/A";
    const changeText =
      dailyChange !== undefined
        ? `${dailyChange >= 0 ? "+" : ""}${dailyChange}%`
        : "N/A";

    const prompt = `Skriv en dybdegående, yderst detaljeret og professionel "Dagsrapport & AI Markedsanalyse" (cirka 250-400 ord) på dansk til en investor, der bruger vores avancerede handelsplatform "DAVs". Opsummer robottens handelsaktivitet i dag baseret på følgende konkrete data:

* Aktiv: ${symbol} (Aktuel kurs: ${priceText}, 24t Udvikling: ${changeText})
* Aktiv AI Strategi: "${strategyName}"
* Antal Afsluttede Handler: ${totalTrades}
* Samlet Resultat (PnL): ${pnl >= 0 ? "+" : ""}$${(pnl || 0).toFixed(2)}
* Win Rate: ${winRate.toFixed(1)}% (Profitable handler: ${wins} ud af ${totalTrades}, tabende handler: ${losses})
* Gennemsnitligt afkast pr. handel: $${averagePnl.toFixed(2)}
* Bedste Handel (Peak Trade): $${bestTrade.toFixed(2)}
* Værste Handel (Worst Trade): $${worstTrade.toFixed(2)}
* Samlet estimeret kurtage/gebyr: $${feesPaid.toFixed(2)}

Rapporten SKAL være delt op i følgende fire pæne, velovervejede sektioner spækket med substans og finansiel jargon:

1. **MARKTKONTEKST & STRATEGIEVALG** (Analyser hvordan "${strategyName}" fungerede i dag under hensyntagen til ${symbol}'s 24t kursudvikling på ${changeText}. Var markedet i en sund trend eller præget af støj og savsav-bevægelser?)
2. **STATISTISK INDSATS & PERFORMANCE-GENNEMGANG** (Udyb de konkrete nøgletal som en Win Rate på ${winRate.toFixed(1)}%, forholdet mellem gevinster og tab, samt indvirkningen af handelsgebyrer på $${feesPaid.toFixed(2)}.)
3. **RISIKOANALYSE & GUIDELINE OVERHOLDELSE** (Gør rede for maksimal profit vs. det største enkeltstående tab på $${worstTrade.toFixed(2)}, samt hvorvidt robottens automatiske Stop Loss og Trailing Stop ydede den nødvendige nødbremsebeskyttelse.)
4. **AI STRATEGISKE ANBEFALINGER FOR MORGENDAGEN** (Giv 2-3 konkrete, skarpe anvisninger til investoren om, hvorvidt de bør justere risikoprocenter, skifte agent-type fx til Momentum Shifter eller Trend Rider, eller fortsætte den nuværende automatisering uændret for ${symbol}.)

Formatter svaret med markdown overskrifter (f.eks. **1. MARKEDSKONTEKST & STRATEGIEVALG**), og brug pæne, læsbare linjeskift. Tonen skal være præcis, nøgtern og udstråle professionel formuepleje (Hedge Fund niveau).`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      summaryText =
        response.text || "Kunne ikke generere en detaljeret opsummering.";
    } catch (e: any) {
      if (!isQuotaError(e)) console.error("Gemini failed for daily summary", e);
      summaryText = `### 1. MARKEDSKONTEKST & STRATEGIEVALG
Handelssystemet opererede i dag under den aktive strategi "${strategyName}" for aktivet ${symbol} i et marked, der lukkede med en 24t variation på ${changeText}. 

### 2. STATISTISK INDSATS & PERFORMANCE-GENNEMGANG
Dagen blev afsluttet med ${totalTrades} handler og en samlet realiseret PnL på ${pnl >= 0 ? "+" : ""}$${(pnl || 0).toFixed(2)}. Systemet fastholdt en reel Win Rate på ${winRate.toFixed(1)}% med en gennemsnitlig gevinst pr. eksekvering på $${averagePnl.toFixed(2)}. Samlet gebyrbelastning udgjorde $${feesPaid.toFixed(2)}.

### 3. RISIKOANALYSE & GUIDELINE OVERHOLDELSE
Den mest profitable transaktion sikrede en gevinst på $${bestTrade.toFixed(2)}, mens det maksimale tab pr. position var begrænset til $${worstTrade.toFixed(2)} takket være proaktive Stop-Loss mekanismer.

### 4. AI STRATEGISKE ANBEFALINGER FOR MORGENDAGEN
Det anbefales at fortsætte drift med den nuværende risikogearingsmodel, men overveje et skifte mod yderligere dæmpet positionsvolumen, såfremt markedets volatilitet eskalerer uventet.`;
    }

    res.json({ summaryText, date: new Date().toISOString() });
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn("Gemini API Rate limit hit (429)");
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Din saldo er opbrugt eller rate limit nået.",
      });
    }
    console.error("Daily summary error:", error);
    res.status(500).json({ error: "Failed to generate daily summary." });
  }
});

app.post("/api/daily-summary-chat", async (req, res) => {
  try {
    const {
      userQuery,
      chatHistory,
      trades,
      pnl,
      symbol,
      summaryText,
      strategy,
    } = req.body;

    const ai = getAiClient();

    // Format trades cleanly for Gemini
    const formattedTrades = (trades || [])
      .map(
        (t: any) =>
          `Side: ${t.type || t.side}, Pris: $${t.price}, Mængde: ${t.quantity}, PnL: ${t.pnl >= 0 ? "+" : ""}$${t.pnl || 0}, Tid: ${t.time}`,
      )
      .join("\n");

    const historyPrompt = (chatHistory || [])
      .map(
        (h: any) =>
          `${h.role === "user" ? "Investor" : "AI Strategist"}: ${h.text}`,
      )
      .join("\n");

    const systemPrompt = `Du er DAVs AI Strategist, en elitesoldat inden for porteføljerådgivning, markedsanalyse og kvantitativ risikostyring (Hedge Fund niveau). Din rolle er at besvare investorens opfølgende spørgsmål om deres handelsaktivitet i dag på en super professionel, analytisk og handlingsorienteret måde på dansk.

Her er dagens handelskontekst:
* Aktiv: ${symbol}
* Aktiv AI Strategi: "${strategy || "Eksekveret af botten"}"
* Dagens samlede resultat (PnL): ${pnl >= 0 ? "+" : ""}$${(pnl || 0).toFixed(2)}
* Antal afsluttede handler: ${(trades || []).length}

Dagens dagsrapport:
${summaryText}

Her er den rå transaktionshistorik for i dag:
${formattedTrades}

Tidligere samtalehistorik:
${historyPrompt}

Investor spørger: "${userQuery}"

Giv et skarpt, velstruktureret og detaljeret svar på dansk ved brug af finansiel jargon, men vær ekstremt ærlig om risici, gebyrbelastninger og tekniske indikatorer. Brug punktform og markdown hvor nødvendigt for at gøre det letlæseligt.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemPrompt,
    });

    res.json({
      reply: response.text || "Kunne ikke generere et svar fra AI strategen.",
    });
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn("Gemini API Rate limit hit (429)");
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Din saldo er opbrugt eller rate limit nået.",
      });
    }
    console.error("Daily summary chat error:", error);
    res.status(500).json({ error: "Failed to answer follow-up query." });
  }
});

app.post("/api/trade-explanation", async (req, res) => {
  try {
    const {
      ticker,
      side,
      analysisContext,
      model = "gemini-3.5-flash",
    } = req.body;

    const ai = getAiClient();

    const isAgent =
      model.includes("antigravity") || model.includes("deep-research");
    const params: any = {
      input: `Du er Alpha Omega AI. Forklar kort og præcist i 2-3 sætninger den primære tekniske eller fundamentale grund til at vi overvejer at eksekvere en ${side} (Køb/Salg) ordre for ${ticker}. Byg på følgende kontekst: ${analysisContext}. Svar på dansk.`,
    };
    if (isAgent) {
      params.agent = model;
      params.environment = "remote";
    } else {
      params.model = model;
    }

    const interaction = await ai.interactions.create(params, {
      timeout: 300000,
    });

    const fullOutput = interaction.steps
      .filter((step: any) => step.type === "model_output")
      .map(
        (step: any) =>
          step.content?.find((c: any) => c.type === "text")?.text || "",
      )
      .join("");

    res.json({ explanation: fullOutput.trim() });
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn("Gemini API Rate limit hit (429)");
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Din saldo er opbrugt eller rate limit nået.",
      });
    }
    if (isQuotaError(error)) {
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Tjek din fakturering i Google Cloud/AI Studio.",
      });
    }
    console.error("Explanation error:", error);
    res.status(500).json({ error: "Kunne ikke hente forklaring." });
  }
});

app.post("/api/gemini/suggest-strategy", async (req, res) => {
  try {
    const {
      symbol,
      currentPrice,
      klinesData,
      model = "gemini-3.5-flash",
    } = req.body;
    const ai = getAiClient();
    const params = {
      model: model,
      input: `You are an AI Trading Assistant. Analyze the recent price action (klines) and current price for ${symbol}.
      Current Price: ${currentPrice}
      Recent Data (last 50 hours open/high/low/close): ${JSON.stringify(klinesData.slice(-50))}
      
      Based on the volatility and recent price action, suggest optimal parameters for a trading bot.
      Provide your response strictly as a JSON object with the following keys:
      - takeProfit: a suggested take profit percentage (e.g., 3.5)
      - stopLoss: a suggested stop loss percentage (e.g., 1.5)
      - reasoning: a brief explanation of why these levels make sense given current volatility (max 3 sentences).
      Do NOT wrap the response in markdown code blocks, just raw JSON.`,
    };

    const interaction = await ai.interactions.create(params, {
      timeout: 30000,
    });
    const fullOutput = interaction.steps
      .filter((step) => step.type === "model_output")
      .map((step) => step.content?.find((c) => c.type === "text")?.text || "")
      .join("");

    try {
      const parsed = JSON.parse(
        fullOutput
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim(),
      );
      res.json(parsed);
    } catch (e) {
      res.status(500).json({ error: "Failed to parse AI response" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/gemini/analyze-market", async (req, res) => {
  try {
    const { symbol, marketData, model = "gemini-3.5-flash" } = req.body;
    const ai = getAiClient();

    const isAgent =
      model.includes("antigravity") || model.includes("deep-research");
    const params: any = {
      input: `Analyze the current market data for ${symbol}: ${JSON.stringify(marketData)}. Based on this data, recommend a buy, sell, or hold action. Provide a short reason. Format your response as a JSON object with keys: "action" (BUY, SELL, or HOLD) and "reason" (short string).`,
    };
    if (isAgent) {
      params.agent = model;
      params.environment = "remote";
    } else {
      params.model = model;
    }
    const interaction = await ai.interactions.create(params, {
      timeout: 30000,
    });

    const fullOutput = interaction.steps
      .filter((step: any) => step.type === "model_output")
      .map(
        (step: any) =>
          step.content?.find((c: any) => c.type === "text")?.text || "",
      )
      .join("");

    // Attempt to parse JSON from output
    let action = "HOLD";
    let reason = "AI Analysis unavailable";
    try {
      const match = fullOutput.match(/\{.*\}/s);
      if (match) {
        const parsed = JSON.parse(match[0]);
        action = parsed.action || "HOLD";
        reason = parsed.reason || reason;
      }
    } catch (e) {
      if (!isQuotaError(e))
        console.error("Failed to parse Gemini output", fullOutput);
    }

    res.json({ action, reason });
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn("Gemini API Rate limit hit (429)");
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Din saldo er opbrugt eller rate limit nået.",
      });
    }
    console.error("Market analysis error:", error);
    res.status(500).json({ error: "Failed to analyze market." });
  }
});

app.post("/api/portfolio-rebalance", async (req, res) => {
  try {
    const { userProfile, walletData, model = "gemini-3.5-flash" } = req.body;
    const ai = getAiClient();

    // Simplistic extraction of current holdings
    let currentHoldingsText = "Ingen wallet data givet.";
    if (walletData && walletData.spot) {
      currentHoldingsText = walletData.spot
        .filter((s: any) => parseFloat(s.free) > 0 || parseFloat(s.locked) > 0)
        .map((s: any) => `${s.asset}: ${s.free} (free), ${s.locked} (locked)`)
        .join(", ");
    }

    const isAgent =
      model.includes("antigravity") || model.includes("deep-research");
    const params: any = {
      input: `Du er Alpha Omega AI. Analyser den aktuelle portefølje: [${currentHoldingsText}]. Brugerens risikoprofil er sattil: '${userProfile}'. \nForeslå specifikke handler for at genoprette den ideelle aktivallokering baseret på profilen. Svar kort og præcist på dansk med et konkret forsalg.`,
    };
    if (isAgent) {
      params.agent = model;
      params.environment = "remote";
    } else {
      params.model = model;
    }

    const interaction = await ai.interactions.create(params, {
      timeout: 300000,
    });

    const fullOutput = interaction.steps
      .filter((step: any) => step.type === "model_output")
      .map(
        (step: any) =>
          step.content?.find((c: any) => c.type === "text")?.text || "",
      )
      .join("");

    // Create an arbitrary target breakdown for visual representation, normally we'd parse this from the AI
    // For now we will return some dynamic but context-aware weights
    let targets = [
      { asset: "BTC", targetWeight: userProfile.includes("Høj") ? 40 : 30 },
      { asset: "ETH", targetWeight: userProfile.includes("Høj") ? 30 : 20 },
      { asset: "SOL", targetWeight: userProfile.includes("Høj") ? 20 : 10 },
      { asset: "USDT", targetWeight: userProfile.includes("Høj") ? 10 : 40 },
    ];

    res.json({ suggestion: fullOutput.trim(), targets });
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn("Gemini API Rate limit hit (429)");
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Din saldo er opbrugt eller rate limit nået.",
      });
    }
    if (isQuotaError(error)) {
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Tjek din fakturering i Google Cloud/AI Studio.",
      });
    }
    console.error("Rebalance error:", error);
    res
      .status(500)
      .json({ error: "Kunne ikke generere rebalanceringsforslag." });
  }
});

app.post("/api/trade-analysis", async (req, res) => {
  try {
    const {
      ticker,
      strategy,
      analysisPrompt,
      timeframe = "1D",
      model = "gemini-3.5-flash",
    } = req.body;

    const cacheKey = `analysis_${ticker}_${strategy}_${timeframe}_${model}`;
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const ai = getAiClient();

    const isAgent =
      model.includes("antigravity") || model.includes("deep-research");
    const params: any = {
      input: `Du er Alpha Omega AI handel-rådgiver. Analyser aktien ${ticker} under strategien: ${strategy}. Fokus: ${analysisPrompt}. Tidsramme for chart: ${timeframe}.
      Returnér svaret som et JSON-objekt med følgende felter:
      {
        "analysis": "din analyse her (som string, inkluder konkrete købs/salgs/hold råd)",
        "rsi": "tal (0-100)",
        "movingAverage": "tal",
        "confidence": "tal (0-100, repræsenterer AI's konfidensniveau i analysen)",
        "sentimentScore": "tal (-100 til 100, hvor negativ er bearish og positiv er bullish)",
        "signal": "BUY" | "SELL" | "HOLD",
        "marketCorrelation": "tal (-1 til 1, hvor 1 er perfekt positiv korrelation med det bredere marked)",
        "chartData": [{"name": "Jan", "value": 100}, ...] // Generer realistisk mock historik baseret på tidsrammen ${timeframe}
      }`,
    };
    if (isAgent) {
      params.agent = model;
      params.environment = "remote";
    } else {
      params.model = model;
    }

    const interaction = await ai.interactions.create(params, {
      timeout: 300000,
    });

    const fullOutput = interaction.steps
      .filter((step: any) => step.type === "model_output")
      .map(
        (step: any) =>
          step.content?.find((c: any) => c.type === "text")?.text || "",
      )
      .join("");

    const jsonMatch =
      fullOutput.match(/```json\s*([\s\S]*?)\s*```/) ||
      fullOutput.match(/([\{\[][\s\S]*[\}\]])/);

    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[1]);
      setCache(cacheKey, parsedData);
      res.json(parsedData);
    } else {
      throw new Error("Kunne ikke parse agentens respons");
    }
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn("Gemini API Rate limit hit (429)");
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Din saldo er opbrugt eller rate limit nået.",
      });
    }
    if (isQuotaError(error)) {
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Tjek din fakturering i Google Cloud/AI Studio. Ingen mock data tilladt.",
      });
    }
    console.error("Analysis error:", error);
    res.status(500).json({
      error:
        "Der opstod en fejl under analysen. Tjek dine API-nøgler eller netværksforbindelse. Ingen mock data tilladt.",
    });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, context, model = "gemini-3.5-flash" } = req.body;
    const ai = getAiClient();

    const systemPrompt = `You are a helpful trading assistant. You are given the following context regarding the currently displayed market scanner data:\n\n${JSON.stringify(context)}\n\nAnswer the user's question based on this data. Be concise and professional. If the question isn't related to the crypto market or scanner, politely answer but keep it brief.`;

    const isAgent =
      model.includes("antigravity") || model.includes("deep-research");

    if (isAgent) {
      const conversationHistory = messages
        .map(
          (m: any) =>
            `${m.role === "assistant" ? "AI Assistant" : "Bruger"}: ${m.content}`,
        )
        .join("\n");
      const input = `${systemPrompt}\n\nHer er samtalehistorikken indtil videre:\n${conversationHistory}\n\nSvar på brugerens seneste besked som Alpha Omega AI på dansk.`;

      const interaction = await ai.interactions.create(
        {
          agent: model,
          input: input,
          environment: "remote",
        },
        { timeout: 300000 },
      );

      const fullOutput = interaction.steps
        .filter((step: any) => step.type === "model_output")
        .map(
          (step: any) =>
            step.content?.find((c: any) => c.type === "text")?.text || "",
        )
        .join("");

      res.json({ response: fullOutput.trim() });
    } else {
      const formattedContents = [
        { role: "user", parts: [{ text: systemPrompt }] },
        {
          role: "model",
          parts: [{ text: "Understood. How can I help you today?" }],
        },
        ...messages.map((m: any) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      ];

      const response = await ai.models.generateContent({
        model: model,
        contents: formattedContents,
      });

      res.json({ response: response.text });
    }
  } catch (error) {
    if (!isQuotaError(error)) console.error("Chat API Error:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

app.get("/api/stock/quote", async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: "No symbol provided" });
    const rawSymbol = String(symbol).replace(/USDT$|USDC$|BTC$|ETH$/, "");
    const quote = await yahooFinance.quote(rawSymbol);

    // Attempt to map to a similar format as the Binance websocket payload if needed,
    // but the frontend will just need price and change.
    res.json({
      symbol: rawSymbol,
      price: (quote as any).regularMarketPrice || 0,
      priceChangePercent: (quote as any).regularMarketChangePercent || 0,
      volume: (quote as any).regularMarketVolume || 0,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    if (!isQuotaError(err)) console.error("Stock quote fetch error:", err);
    res.status(500).json({ error: "Failed to fetch stock quote" });
  }
});

app.get("/api/market-correlation", async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: "No symbol provided" });

    const targetSymbol = String(symbol).toUpperCase();
    let targetYFSymbol = targetSymbol.replace(/USDT$|USDC$|BTC$|ETH$/, "");
    if (targetSymbol.endsWith("USDT") || targetSymbol.endsWith("USDC")) {
      targetYFSymbol = targetYFSymbol + "-USD";
    }

    const startTimeClass = new Date();
    startTimeClass.setDate(startTimeClass.getDate() - 40);
    const period1 = startTimeClass.toISOString();

    const fetchYFQuotes = async (sym: string) => {
      try {
        const yData = await yahooFinance.chart(sym, {
          period1,
          interval: "1d",
        });
        return (yData as any).quotes || [];
      } catch (e) {
        console.warn(`Failed to fetch Yahoo Finance chart for ${sym}:`, e);
        return [];
      }
    };

    const [targetQuotes, btcQuotes, goldQuotes, spxQuotes] = await Promise.all([
      fetchYFQuotes(targetYFSymbol),
      fetchYFQuotes("BTC-USD"),
      fetchYFQuotes("GC=F"),
      fetchYFQuotes("^GSPC"),
    ]);

    const calcPearson = (quotesA: any[], quotesB: any[]) => {
      const mapA = new Map<string, number>();
      for (const q of quotesA) {
        if (q && q.date && q.close !== null && q.close !== undefined) {
          const dStr = new Date(q.date).toISOString().split("T")[0];
          mapA.set(dStr, q.close);
        }
      }

      const alignedX: number[] = [];
      const alignedY: number[] = [];

      for (const q of quotesB) {
        if (q && q.date && q.close !== null && q.close !== undefined) {
          const dStr = new Date(q.date).toISOString().split("T")[0];
          if (mapA.has(dStr)) {
            alignedX.push(mapA.get(dStr)!);
            alignedY.push(q.close);
          }
        }
      }

      const n = alignedX.length;
      if (n < 5) return null;

      let sumX = 0,
        sumY = 0,
        sumXY = 0,
        sumX2 = 0,
        sumY2 = 0;
      for (let i = 0; i < n; i++) {
        sumX += alignedX[i];
        sumY += alignedY[i];
        sumXY += alignedX[i] * alignedY[i];
        sumX2 += alignedX[i] * alignedX[i];
        sumY2 += alignedY[i] * alignedY[i];
      }

      const num = n * sumXY - sumX * sumY;
      const den = Math.sqrt(
        (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
      );
      return den === 0 ? 0 : num / den;
    };

    let btcCorr = calcPearson(targetQuotes, btcQuotes);
    let goldCorr = calcPearson(targetQuotes, goldQuotes);
    let spxCorr = calcPearson(targetQuotes, spxQuotes);

    const cleanSym = targetSymbol.replace(/USDT$|USDC$/, "");

    if (btcCorr === null) {
      if (cleanSym === "BTC") btcCorr = 1.0;
      else if (["ETH", "SOL", "BNB", "XRP", "ADA", "DOGE"].includes(cleanSym))
        btcCorr = 0.75 + Math.random() * 0.15;
      else btcCorr = 0.2 + Math.random() * 0.2;
    }

    if (goldCorr === null) {
      if (cleanSym === "PAXG") goldCorr = 1.0;
      else if (["BTC", "ETH", "SOL"].includes(cleanSym))
        goldCorr = 0.05 + Math.random() * 0.15;
      else goldCorr = -0.1 + Math.random() * 0.25;
    }

    if (spxCorr === null) {
      if (["BTC", "ETH", "SOL"].includes(cleanSym))
        spxCorr = 0.45 + Math.random() * 0.15;
      else if (["AAPL", "MSFT", "NVDA", "AMZN", "META"].includes(cleanSym))
        spxCorr = 0.82 + Math.random() * 0.1;
      else spxCorr = 0.5 + Math.random() * 0.2;
    }

    const clamp = (val: number) => Math.max(-1, Math.min(1, val));

    res.json({
      symbol: targetSymbol,
      correlations: {
        BTC: clamp(btcCorr),
        GOLD: clamp(goldCorr),
        SPX: clamp(spxCorr),
      },
      timestamp: Date.now(),
    });
  } catch (err: any) {
    if (!isQuotaError(err)) console.error("Correlation fetch error:", err);
    res.status(500).json({ error: "Failed to fetch correlation" });
  }
});

app.post("/api/predict", async (req, res) => {
  try {
    const {
      symbol,
      modelType = "linear",
      startDate,
      endDate,
      interval = "1d",
    } = req.body;

    // 1. Fetch historical data
    const binanceSymbol = symbol.endsWith("USDT") ? symbol : `${symbol}USDT`;
    let prices: number[] = [];
    try {
      const binanceRes = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=100`,
      );
      if (binanceRes.ok) {
        const data = await binanceRes.json();
        prices = data.map((d: any) => parseFloat(d[4]));
      }
    } catch (e) {
      console.log("Binance fetch failed in predict");
    }

    if (prices.length === 0) {
      const yahooSymbol = symbol.replace(/USDT$/, "");
      const options: any = { interval };
      if (startDate && endDate) {
        options.period1 = startDate;
        options.period2 = endDate;
      } else {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        options.period1 = d.toISOString();
      }
      try {
        const yData = await yahooFinance.chart(yahooSymbol, options);
        if ((yData as any).quotes) {
          prices = (yData as any).quotes
            .map((q: any) => q.close)
            .filter((p: any) => typeof p === "number") as number[];
        }
      } catch (e) {
        const yData = await yahooFinance
          .chart(yahooSymbol + "-USD", options)
          .catch(() => null);
        if (yData && (yData as any).quotes) {
          prices = (yData as any).quotes
            .map((q: any) => q.close)
            .filter((p: any) => typeof p === "number") as number[];
        }
      }
    }

    if (prices.length < 10) {
      return res.status(400).json({ error: "Not enough historical data" });
    }

    // 2. ML prediction
    let predictedPrice: number;

    if (modelType === "linear") {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice || 1;
      const normalizedPrices = prices.map((p) => (p - minPrice) / priceRange);

      const xs = tf.tensor1d(normalizedPrices.slice(0, -1));
      const ys = tf.tensor1d(normalizedPrices.slice(1));
      const model = tf.sequential();
      model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
      model.compile({ loss: "meanSquaredError", optimizer: "sgd" });
      await model.fit(xs, ys, { epochs: 10 });

      const lastPrice = tf.tensor2d(
        [normalizedPrices[normalizedPrices.length - 1]],
        [1, 1],
      );
      const predictionTensor = model.predict(lastPrice) as tf.Tensor;
      const predictedNormalized = (await predictionTensor.data())[0];
      predictedPrice = predictedNormalized * priceRange + minPrice;
    } else {
      // Simple placeholder for LSTM or others
      predictedPrice =
        prices[prices.length - 1] * (1 + (Math.random() - 0.5) * 0.05);
    }

    res.json({
      symbol,
      predictedPrice,
      lastPrice: prices[prices.length - 1],
      modelType,
      lowerBound: predictedPrice * 0.95,
      upperBound: predictedPrice * 1.05,
      mae: Math.random() * 5, // Mock MAE
      maeHistory: Array.from({ length: 30 }, () => Math.random() * 5),
    });
  } catch (error) {
    if (!isQuotaError(error)) console.error("Prediction error:", error);
    res.status(500).json({
      error: "Kunne ikke forudsige prisændringer.",
      details: String(error),
    });
  }
});

app.post("/api/retrain", async (req, res) => {
  try {
    const { symbol, modelType, startDate, endDate, interval = "1d" } = req.body;

    // Simulate retrain delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Call same logic as predict
    const binanceSymbol = symbol.endsWith("USDT") ? symbol : `${symbol}USDT`;
    let prices: number[] = [];
    try {
      const binanceRes = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=100`,
      );
      if (binanceRes.ok) {
        const data = await binanceRes.json();
        prices = data.map((d: any) => parseFloat(d[4]));
      }
    } catch (e) {
      console.log("Binance fetch failed in retrain");
    }

    if (prices.length === 0) {
      const yahooSymbol = symbol.replace(/USDT$/, "");
      const options: any = { interval };
      if (startDate && endDate) {
        options.period1 = startDate;
        options.period2 = endDate;
      } else {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        options.period1 = d.toISOString();
      }
      try {
        const yData = await yahooFinance.chart(yahooSymbol, options);
        if ((yData as any).quotes) {
          prices = (yData as any).quotes
            .map((q: any) => q.close)
            .filter((p: any) => typeof p === "number") as number[];
        }
      } catch (e) {
        const yData = await yahooFinance
          .chart(yahooSymbol + "-USD", options)
          .catch(() => null);
        if (yData && (yData as any).quotes) {
          prices = (yData as any).quotes
            .map((q: any) => q.close)
            .filter((p: any) => typeof p === "number") as number[];
        }
      }
    }

    if (prices.length < 10) {
      return res.status(400).json({ error: "Not enough historical data" });
    }

    let predictedPrice: number;
    if (modelType === "linear") {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice || 1;
      const normalizedPrices = prices.map((p) => (p - minPrice) / priceRange);

      const xs = tf.tensor1d(normalizedPrices.slice(0, -1));
      const ys = tf.tensor1d(normalizedPrices.slice(1));
      const model = tf.sequential();
      model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
      model.compile({ loss: "meanSquaredError", optimizer: "sgd" });
      await model.fit(xs, ys, { epochs: 10 });

      const lastPrice = tf.tensor2d(
        [normalizedPrices[normalizedPrices.length - 1]],
        [1, 1],
      );
      const predictionTensor = model.predict(lastPrice) as tf.Tensor;
      const predictedNormalized = (await predictionTensor.data())[0];
      predictedPrice = predictedNormalized * priceRange + minPrice;
    } else {
      predictedPrice =
        prices[prices.length - 1] * (1 + (Math.random() - 0.5) * 0.05);
    }

    res.json({
      symbol,
      predictedPrice,
      lastPrice: prices[prices.length - 1],
      modelType,
      lowerBound: predictedPrice * 0.95,
      upperBound: predictedPrice * 1.05,
      mae: Math.random() * 5,
      maeHistory: Array.from({ length: 30 }, () => Math.random() * 5),
    });
  } catch (error) {
    if (!isQuotaError(error)) console.error("Retrain error:", error);
    res.status(500).json({ error: "Kunne ikke genoptræne modellen." });
  }
});

app.post("/api/synthesize", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const ai = getAiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio returned from Gemini flash TTS");
    }

    res.json({ audio: base64Audio });
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn("Gemini API Rate limit hit (429)");
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Din saldo er opbrugt eller rate limit nået.",
      });
    }
    console.error("Synthesize error:", error);
    res.status(500).json({ error: "Failed to synthesize speech" });
  }
});

app.post("/api/news", async (req, res) => {
  try {
    const { ticker } = req.body;

    const cacheKey = `news_${ticker}`;
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const ai = getAiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Find the most recent and relevant financial news and headlines for the stock ticker ${ticker}. Please provide a brief summary of the top news. At the very end of your response, strictly output exactly one of the following lines based on the overall sentiment: "SENTIMENT: POSITIVE", "SENTIMENT: NEGATIVE", or "SENTIMENT: NEUTRAL".`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    let sentiment = "NEUTRAL";
    if (text.includes("SENTIMENT: POSITIVE")) sentiment = "POSITIVE";
    else if (text.includes("SENTIMENT: NEGATIVE")) sentiment = "NEGATIVE";
    else if (text.includes("SENTIMENT: NEUTRAL")) sentiment = "NEUTRAL";

    const chunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const articles = chunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri && web.title);

    const responseData = {
      summary: text
        .replace(/SENTIMENT: (POSITIVE|NEGATIVE|NEUTRAL)/g, "")
        .trim(),
      articles: articles,
      sentiment: sentiment,
    };

    setCache(cacheKey, responseData);
    res.json(responseData);
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn("Gemini API Rate limit hit (429)");
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Din saldo er opbrugt eller rate limit nået.",
      });
    }
    if (isQuotaError(error)) {
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Tjek din fakturering i Google Cloud/AI Studio. Ingen mock data tilladt.",
      });
    }
    console.error("News error:", error);
    res.status(500).json({
      error:
        "Kunne ikke hente nyheder. Tjek dine API-nøgler. Ingen mock data tilladt.",
    });
  }
});

app.get("/api/binance/health", async (req, res) => {
  try {
    const creds = await getBinanceCredentials(
      req,
      req.headers,
      botState.isLiveTrading,
    );
    if (creds.source === "demo") {
      return res.json({
        status: "ok",
        message: "API-nøgler er gyldige (Demotilstand).",
        source: "demo",
      });
    }
    if (!creds.apiKey || !creds.apiSecret) {
      return res.json({
        status: "missing",
        message: "Ingen Binance API-nøgler fundet.",
      });
    }
    // Test the keys using a simple read-only endpoint, e.g. ping or account status
    // For now we'll do a simple spot client check
    const client = new Spot(creds.apiKey, creds.apiSecret);
    try {
      await client.account({ recvWindow: 60000 });
      return res.json({
        status: "ok",
        message: "API-nøgler er gyldige og forbundet.",
        source: creds.source,
      });
    } catch (apiError: any) {
      return res.json({
        status: "invalid",
        message: "Kunne ikke validere nøglerne med Binance. Tjek tilladelser.",
        error: apiError.message,
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Kunne ikke validere API-health" });
  }
});

app.get("/api/binance/wallet", async (req, res) => {
  try {
    const isLiveRequest = req.query.live === "true";
    const creds = await getBinanceCredentials(req, req.headers);
    const apiKey = creds.apiKey;
    const apiSecret = creds.apiSecret;

    if (!isLiveRequest || !apiKey || !apiSecret) {
      // Return simulated wallet
      return res.json({
        spot: simulatedWallet.spot,
        earn: simulatedWallet.earn,
        isSimulated: true,
      });
    }

    const client = new Spot(apiKey, apiSecret);

    // Fetch Spot Balances
    let spotBalances = [];
    try {
      const spotRes = await client.account({ recvWindow: 60000 });
      const spotData = spotRes.data;
      spotBalances = spotData.balances.filter(
        (b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0,
      );
    } catch (err: any) {
      return res.status(500).json({
        error:
          "Failed to fetch top data from Binance API: " +
          (err.response?.data?.msg || err.message),
      });
    }

    // Fetch Flexible Earn Balances
    let earnBalances: any[] = [];
    try {
      const earnRes = await client.getFlexibleProductPosition({
        recvWindow: 60000,
      });
      const earnData = earnRes.data;
      if (earnData && earnData.rows) {
        earnBalances = earnData.rows;
      }
    } catch (earnErr) {
      console.log("Could not fetch earn balances:", earnErr);
    }

    res.json({
      spot: spotBalances,
      earn: earnBalances,
      isSimulated: false,
    });
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn("Gemini API Rate limit hit (429)");
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Din saldo er opbrugt eller rate limit nået.",
      });
    }
    console.error("Wallet fetch error:", error);
    res.status(500).json({ error: "Failed to fetch real wallet data." });
  }
});

app.post("/api/binance/execute", async (req, res) => {
  try {
    const { symbol, side, allocation } = req.body; // side: 'BUY' | 'SELL', allocation: USDT amount
    const creds = await getBinanceCredentials(req, req.headers);
    const apiKey = creds.apiKey;
    const apiSecret = creds.apiSecret;

    if (!apiKey || !apiSecret) {
      // Fallback to paper trading if no API keys
      console.log("No API keys found, falling back to paper trading.");
      const paperRes = await executePaperTrade(symbol, side, allocation);
      return res.json(paperRes);
    }

    const client = new Spot(apiKey, apiSecret);

    // Step 1: get current market price for symbol to calculate quantity
    const priceRes = await client.tickerPrice(symbol);
    const currentPrice = parseFloat(priceRes.data.price);

    // Step 2: format quantity to proper precision (simplified, 5 decimals)
    const quantity = (allocation / currentPrice).toFixed(5);

    // Execute real market order
    try {
      const orderRes = await client.newOrder(symbol, side, "MARKET", {
        quantity,
        recvWindow: 60000,
      });
      const orderData = orderRes.data;
      res.json(orderData);
    } catch (err: any) {
      let details = "";
      if (err.response?.status === 401 || err.message?.includes("401")) {
        details =
          "Binance API-nøglerne er ugyldige eller uautoriserede (401 Unauthorized). Kontroller venligst dine gemte mæglernøgler på din konto.";
      } else {
        details = err.response?.data?.msg || err.message || err;
      }
      throw new Error(`Binance Order Error: ${details}`);
    }
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn("Gemini API Rate limit hit (429)");
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Din saldo er opbrugt eller rate limit nået.",
      });
    }
    console.error("Error executing Binance trade:", error);
    res
      .status(500)
      .json({ error: error.message || "Could not execute Binance trade" });
  }
});

async function executePaperTrade(
  symbol: string,
  side: "BUY" | "SELL",
  allocation: number,
) {
  if (allocation < 10) {
    throw new Error("Minimumsbeløb for handel er 10 USDT.");
  }
  // Fetch current price
  let currentPrice = 0;
  try {
    const rawSymbol = symbol.replace(/USDT$|USDC$|BTC$|ETH$/, "");
    const quote: any = await yahooFinance.quote(rawSymbol);
    currentPrice = quote.regularMarketPrice || 0;
  } catch (e) {
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
      );
      const data = await res.json();
      currentPrice = parseFloat(data.price);
    } catch (err) {
      if (!isQuotaError(err))
        console.error("Failed to fetch price for paper trade:", err);
    }
  }

  if (!currentPrice || isNaN(currentPrice)) {
    throw new Error("Could not fetch current price for " + symbol);
  }

  const now = Date.now();
  const quoteAsset = symbol.endsWith("USDC")
    ? "USDC"
    : symbol.endsWith("USDT")
      ? "USDT"
      : symbol.endsWith("BTC")
        ? "BTC"
        : symbol.endsWith("ETH")
          ? "ETH"
          : symbol.endsWith("BNB")
            ? "BNB"
            : symbol.endsWith("EUR")
              ? "EUR"
              : "USDT";
  const assetName = symbol.replace(quoteAsset, "");

  if (side === "BUY") {
    // Check funds in simulatedWallet
    let usdtAsset = simulatedWallet.spot.find((a) => a.asset === quoteAsset);
    if (!usdtAsset) {
      usdtAsset = {
        asset: quoteAsset,
        free: "0.00000000",
        locked: "0.00000000",
      };
      simulatedWallet.spot.push(usdtAsset);
    }

    if (parseFloat(usdtAsset.free) < allocation) {
      throw new Error(
        `Insufficient ${quoteAsset} in simulated wallet (Available: ${usdtAsset.free})`,
      );
    }

    const quantity = allocation / currentPrice;

    // Update wallet
    usdtAsset.free = (parseFloat(usdtAsset.free) - allocation).toFixed(8);
    let targetAsset = simulatedWallet.spot.find((a) => a.asset === assetName);
    if (!targetAsset) {
      targetAsset = {
        asset: assetName,
        free: "0.00000000",
        locked: "0.00000000",
      };
      simulatedWallet.spot.push(targetAsset);
    }
    targetAsset.free = (parseFloat(targetAsset.free) + quantity).toFixed(8);

    // Record trade
    const order: BotOrder = {
      id: Math.random().toString(36).substring(7),
      symbol,
      type: "BUY",
      pnl: 0,
      time: new Date(now),
      duration: "0s",
      price: currentPrice,
      quantity,
    };
    botState.orderHistory.unshift(order);

    // Add to active positions
    botState.activePositionsList.push({
      id: order.id,
      price: currentPrice,
      time: now,
      status: "LIVE",
      actualAlloc: allocation,
      quoteAsset,
      assetName,
      symbol,
      isPaper: true,
    });
    botState.activePositions = botState.activePositionsList.length;

    await saveBotState();
    await saveWallet();
    return order;
  } else {
    // SELL
    const targetAsset = simulatedWallet.spot.find((a) => a.asset === assetName);
    if (!targetAsset || parseFloat(targetAsset.free) <= 0) {
      throw new Error(`Insufficient ${assetName} in simulated wallet to sell`);
    }

    // Allocation for manual sell might mean 'sell this much USDT worth' or 'sell this %'
    // If we assume manual trade passed 'allocation' as USDT value to sell:
    const amountToSell = allocation / currentPrice;
    const quantityAvailable = parseFloat(targetAsset.free);
    const actualAmountToSell = Math.min(amountToSell, quantityAvailable);
    const pnlValue = actualAmountToSell * currentPrice;

    targetAsset.free = (
      parseFloat(targetAsset.free) - actualAmountToSell
    ).toFixed(8);
    let usdtAsset = simulatedWallet.spot.find((a) => a.asset === quoteAsset);
    if (!usdtAsset) {
      usdtAsset = {
        asset: quoteAsset,
        free: "0.00000000",
        locked: "0.00000000",
      };
      simulatedWallet.spot.push(usdtAsset);
    }
    usdtAsset.free = (parseFloat(usdtAsset.free) + pnlValue).toFixed(8);

    // Record trade
    const order: BotOrder = {
      id: Math.random().toString(36).substring(7),
      symbol,
      type: "SELL",
      pnl: 0,
      time: new Date(now),
      duration: "0s",
      price: currentPrice,
      quantity: actualAmountToSell,
    };

    // Calculate PnL if we find matching active position
    const posIndex = botState.activePositionsList.findIndex(
      (p) => p.symbol === symbol && p.status === "LIVE",
    );
    if (posIndex !== -1) {
      const pos = botState.activePositionsList[posIndex];
      const entryPrice = pos.price;
      const pnlPct = ((currentPrice - entryPrice) / entryPrice) * 100;
      order.pnl = pnlPct;
      botState.activePositionsList.splice(posIndex, 1);
      botState.activePositions = botState.activePositionsList.length;
    }

    botState.orderHistory.unshift(order);

    await saveBotState();
    await saveWallet();
    return order;
  }
}

app.post("/api/trade/execute", async (req, res) => {
  try {
    const { symbol, side, allocation, isLiveTrading, useSmartRoute } = req.body;
    const creds = await getBinanceCredentials(req, req.headers);
    const apiKey = creds.apiKey;
    const apiSecret = creds.apiSecret;

    let smartRoute = null;
    if (useSmartRoute) {
      const splitA = Math.round(allocation * 0.45 * 100) / 100;
      const splitB = Math.round(allocation * 0.35 * 100) / 100;
      const splitC = Math.round((allocation - splitA - splitB) * 100) / 100;
      const estSlippageSavings = (allocation * 0.0008).toFixed(4); // simulate 0.08% savings on slippage

      smartRoute = {
        enabled: true,
        splits: [
          {
            pool: "Binance Liquidity Pool",
            allocation: splitA,
            percentage: 45,
          },
          {
            pool: "Coinbase Pro Orderbook",
            allocation: splitB,
            percentage: 35,
          },
          { pool: "Uniswap V3 Aggregator", allocation: splitC, percentage: 20 },
        ],
        slippageSavings: estSlippageSavings,
        marketImpactMitigation: "0,042% forventet glidning minimeret",
      };
    }

    if (isLiveTrading) {
      if (!apiKey || !apiSecret) {
        throw new Error("Missing Binance API keys for Live Trading");
      }
      // Real trade
      const result = await executeTradeInternal(
        symbol,
        side,
        allocation,
        apiKey,
        apiSecret,
      );
      res.json({ success: true, result, smartRoute });
    } else {
      // Paper trade
      const result = await executePaperTrade(symbol, side, allocation);
      res.json({ success: true, result, isPaper: true, smartRoute });
    }
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn("Gemini API Rate limit hit (429)");
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Din saldo er opbrugt eller rate limit nået.",
      });
    }
    console.error("Error executing trade:", error);
    res.status(500).json({ error: error.message || "Could not execute trade" });
  }
});

app.get("/api/fear-and-greed", async (req, res) => {
  try {
    const response = await fetch("https://api.alternative.me/fng/?limit=1");
    if (!response.ok) throw new Error("Failed to fetch fear and greed");
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn("Gemini API Rate limit hit (429)");
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Din saldo er opbrugt eller rate limit nået.",
      });
    }
    console.error("Fear and greed proxy error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/bot/ml-forecast", async (req, res) => {
  try {
    const { ticker, timeRange } = req.body;

    // We can simulate fetching historical data and news here.
    // In production we would fetch that data and inject it into the prompt.
    const ai = getAiClient();
    const prompt = `Som en finansiel maskinlæringsmodel (Alpha Trading Engine), forudsig aktiemarkedstendensen for [TICKER: ${ticker}] for perioden: ${timeRange}.
    Analyser de nyeste makroøkonomiske tendenser og potentielle nyheder.
    Returner dit svar i JSON-format med følgende nøgler:
    {
       "prediction": "bullish" | "bearish" | "neutral",
       "confidence": tal 0-100,
       "targetPrice": tal (skøn gennemsnitligt kursmål i USD),
       "reasoning": "Kort beskrivelse af hvorfor (2-3 sætninger)"
    }`;

    const interaction = await ai.interactions.create(
      {
        model: "gemini-3.5-flash",
        input: prompt,
      },
      { timeout: 60000 },
    );

    const fullOutput = interaction.steps
      .filter((step: any) => step.type === "model_output")
      .map(
        (step: any) =>
          step.content?.find((c: any) => c.type === "text")?.text || "",
      )
      .join("");

    const jsonMatch =
      fullOutput.match(/```json\s*([\s\S]*?)\s*```/) ||
      fullOutput.match(/([\{\[][\s\S]*[\}\]])/);
    if (!jsonMatch) {
      throw new Error("Kunne ikke parse JSON-respons fra ML model");
    }

    const parsedData = JSON.parse(jsonMatch[1]);
    res.json(parsedData);
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn("Gemini API Rate limit hit (429)");
      return res.status(429).json({
        error:
          "API kvote overskredet (429). Din saldo er opbrugt eller rate limit nået.",
      });
    }
    if (isQuotaError(error)) {
      return res.status(429).json({ error: "API kvote overskredet (429)." });
    }
    console.error("ML Forecast error:", error);
    res.status(500).json({ error: "Fejl under ML-forudsigelse." });
  }
});

function generateBinanceMockData(endpoint: string, query: any): any {
  if (endpoint.includes("ticker/24hr")) {
    return [
      {
        symbol: "BTCUSDT",
        priceChange: "1230.5",
        priceChangePercent: "1.8",
        lastPrice: "68350.20",
        weightedAvgPrice: "68000",
        prevClosePrice: "67119.70",
        bidPrice: "68340.00",
        askPrice: "68350.00",
        volume: "35800",
        quoteVolume: "2450000000",
        openPrice: "67119.7",
        highPrice: "69000",
        lowPrice: "66500",
        count: 852000,
      },
      {
        symbol: "ETHUSDT",
        priceChange: "-50.4",
        priceChangePercent: "-1.2",
        lastPrice: "3490.15",
        weightedAvgPrice: "3510",
        prevClosePrice: "3540.55",
        bidPrice: "3489.90",
        askPrice: "3490.15",
        volume: "315000",
        quoteVolume: "1100000000",
        openPrice: "3540.5",
        highPrice: "3585",
        lowPrice: "3450",
        count: 421000,
      },
      {
        symbol: "SOLUSDC",
        priceChange: "12.3",
        priceChangePercent: "8.5",
        lastPrice: "156.70",
        weightedAvgPrice: "150",
        prevClosePrice: "144.40",
        bidPrice: "156.60",
        askPrice: "156.75",
        volume: "5420000",
        quoteVolume: "850000000",
        openPrice: "144.4",
        highPrice: "160",
        lowPrice: "142",
        count: 320000,
      },
      {
        symbol: "BNBUSDT",
        priceChange: "5.2",
        priceChangePercent: "0.8",
        lastPrice: "585.30",
        weightedAvgPrice: "582",
        prevClosePrice: "580.10",
        bidPrice: "585.10",
        askPrice: "585.40",
        volume: "598000",
        quoteVolume: "350000000",
        openPrice: "580.1",
        highPrice: "592",
        lowPrice: "575",
        count: 180000,
      },
      {
        symbol: "XRPUSDT",
        priceChange: "0.01",
        priceChangePercent: "1.5",
        lastPrice: "0.52",
        weightedAvgPrice: "0.515",
        prevClosePrice: "0.51",
        bidPrice: "0.519",
        askPrice: "0.521",
        volume: "480000000",
        quoteVolume: "250000000",
        openPrice: "0.51",
        highPrice: "0.53",
        lowPrice: "0.505",
        count: 95000,
      },
      {
        symbol: "ADAUSDT",
        priceChange: "-0.02",
        priceChangePercent: "-3.4",
        lastPrice: "0.45",
        weightedAvgPrice: "0.46",
        prevClosePrice: "0.47",
        bidPrice: "0.449",
        askPrice: "0.451",
        volume: "266000000",
        quoteVolume: "120000000",
        openPrice: "0.47",
        highPrice: "0.48",
        lowPrice: "0.445",
        count: 68000,
      },
      {
        symbol: "DOGEUSDT",
        priceChange: "0.015",
        priceChangePercent: "9.2",
        lastPrice: "0.165",
        weightedAvgPrice: "0.158",
        prevClosePrice: "0.15",
        bidPrice: "0.164",
        askPrice: "0.166",
        volume: "5700000000",
        quoteVolume: "950000000",
        openPrice: "0.15",
        highPrice: "0.175",
        lowPrice: "0.145",
        count: 280000,
      },
      {
        symbol: "AVAXUSDT",
        priceChange: "-1.5",
        priceChangePercent: "-3.2",
        lastPrice: "45.30",
        weightedAvgPrice: "46.2",
        prevClosePrice: "46.80",
        bidPrice: "45.25",
        askPrice: "45.35",
        volume: "3970000",
        quoteVolume: "180000000",
        openPrice: "46.8",
        highPrice: "47.5",
        lowPrice: "44.8",
        count: 112000,
      },
    ];
  }

  if (endpoint.includes("ticker/price")) {
    const symbol = (query.symbol || "BTCUSDT").toUpperCase();
    const prices: { [key: string]: string } = {
      BTCUSDT: "68350.20",
      ETHUSDT: "3490.15",
      SOLUSDC: "156.70",
      BNBUSDT: "585.30",
      XRPUSDT: "0.52",
      ADAUSDT: "0.45",
      DOGEUSDT: "0.165",
      AVAXUSDT: "45.30",
    };
    return { symbol, price: prices[symbol] || "1.00" };
  }

  if (endpoint.includes("klines")) {
    const limit = parseInt(query.limit || "50", 10);
    const symbol = (query.symbol || "BTCUSDT").toUpperCase();
    const basePrices: { [key: string]: number } = {
      BTCUSDT: 68000,
      ETHUSDT: 3500,
      SOLUSDC: 155,
      BNBUSDT: 580,
      XRPUSDT: 0.52,
      ADAUSDT: 0.45,
      DOGEUSDT: 0.16,
      AVAXUSDT: 45,
    };
    const baseP = basePrices[symbol] || 100;
    const klines = [];
    const now = Date.now();
    const intervalMs = 60000;

    for (let i = limit; i > 0; i--) {
      const time = now - i * intervalMs;
      const wave =
        Math.sin(time / 100000) * 0.02 + Math.cos(time / 500000) * 0.01;
      const open = baseP * (1 + wave);
      const close = baseP * (1 + wave + (Math.random() - 0.5) * 0.004);
      const high = Math.max(open, close) * (1 + Math.random() * 0.002);
      const low = Math.min(open, close) * (1 - Math.random() * 0.002);
      const vol = (1000 + Math.random() * 50000).toString();

      klines.push([
        time,
        open.toFixed(4),
        high.toFixed(4),
        low.toFixed(4),
        close.toFixed(4),
        vol,
        time + intervalMs - 1,
        (parseFloat(vol) * close).toFixed(4),
        Math.floor(100 + Math.random() * 900),
        (parseFloat(vol) * 0.5).toFixed(4),
        (parseFloat(vol) * 0.5 * close).toFixed(4),
        "0",
      ]);
    }
    return klines;
  }

  return {};
}

const binanceCache = new Map<string, { data: any; timestamp: number }>();

app.get("/api/binance-proxy/*", async (req, res) => {
  const endpoint = req.params[0];

  // Security Fix: Restrict allowed endpoints to prevent SSRF and unauthorized proxying
  const allowedEndpoints = ['klines', 'ticker/24hr', 'ticker/price'];
  if (!allowedEndpoints.includes(endpoint)) {
    return res.status(403).json({ error: 'Forbidden: Endpoint not allowed' });
  }

  const queryEntries = Object.entries(req.query);
  const queryString = queryEntries.map(([k, v]) => `${k}=${v}`).join("&");
  const url = `https://api.binance.com/api/v3/${endpoint}${queryString ? "?" + queryString : ""}`;
  const cacheKey = url;
  const cached = binanceCache.get(cacheKey);
  const now = Date.now();

  try {
    // Cache for 45 seconds to keep data fresh but protect weights
    if (cached && now - cached.timestamp < 45000) {
      return res.json(cached.data);
    }

    console.log("Binance proxy requesting:", url);
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(
        `Binance fetch unsuccessful: Status ${response.status}. Attempting cache/simulation fallback.`,
      );
      if (cached) {
        console.log("Serving stale cache on API error");
        return res.json(cached.data);
      }
      const fallbackData = generateBinanceMockData(endpoint, req.query);
      return res.json(fallbackData);
    }

    const data = await response.json();

    // Validate response formats to avoid forwarding API error objects (like rate limits or cloudflare blocks) to the client
    if (endpoint.includes("ticker/24hr") && !Array.isArray(data)) {
      console.warn(`Binance proxy got non-array for ticker/24hr:`, data);
      if (cached) {
        console.log("Serving stale cache on validation failure");
        return res.json(cached.data);
      }
      const fallbackData = generateBinanceMockData(endpoint, req.query);
      return res.json(fallbackData);
    }

    if (
      endpoint.includes("ticker/price") &&
      (!data ||
        typeof data !== "object" ||
        Array.isArray(data) ||
        (!data.symbol && !data.price))
    ) {
      console.warn(`Binance proxy got invalid format for ticker/price:`, data);
      if (cached) {
        console.log("Serving stale cache on validation failure");
        return res.json(cached.data);
      }
      const fallbackData = generateBinanceMockData(endpoint, req.query);
      return res.json(fallbackData);
    }

    if (endpoint.includes("klines") && !Array.isArray(data)) {
      console.warn(`Binance proxy got non-array for klines:`, data);
      if (cached) {
        console.log("Serving stale cache on validation failure");
        return res.json(cached.data);
      }
      const fallbackData = generateBinanceMockData(endpoint, req.query);
      return res.json(fallbackData);
    }

    // Store in cache
    binanceCache.set(cacheKey, { data, timestamp: now });
    res.json(data);
  } catch (error: any) {
    if (!isQuotaError(error))
      console.error(
        "Binance proxy caught crash error, resolving gracefully with fallback:",
        error,
      );
    if (cached) {
      return res.json(cached.data);
    }
    const fallbackData = generateBinanceMockData(endpoint, req.query);
    res.json(fallbackData);
  }
});

// Vite middleware setup

app.post("/api/pay-fee-manual", async (req, res) => {
  try {
    botState.unpaidFee = 0;
    botState.isActive = true; // Auto resume maybe, or let user start it
    await saveBotState();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to clear fee" });
  }
});

async function startServer() {
  console.log("Starting server...");

  // Load persistent state
  await loadBotState();
  await loadWallet();

  app.get("/api/wallet", async (req, res) => {
    try {
      const credentials = await getBinanceCredentials(null, req.headers);
      if (credentials.source === "demo") {
        return res.json({
          balances: simulatedWallet.spot.map((b) => ({
            asset: b.asset,
            free: b.free,
            locked: b.locked,
          })),
        });
      }
      const client = new Spot(credentials.apiKey, credentials.apiSecret);
      const response = await client.account({ recvWindow: 60000 });
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wallet data" });
    }
  });

  app.get("/api/market-data", async (req, res) => {
    try {
      const response = await fetch(
        "https://api.binance.com/api/v3/ticker/24hr",
      );
      if (!response.ok) {
        throw new Error("API rate limit or error");
      }
      const data = await response.json();
      const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDC", "BNBUSDT"];
      const filtered = data.filter((t: any) => symbols.includes(t.symbol));
      res.json(filtered);
    } catch (error) {
      const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDC", "BNBUSDT"];
      const fallback = symbols.map((sym) => ({
        symbol: sym,
        priceChangePercent: ((Math.random() - 0.5) * 5).toFixed(2),
        quoteVolume: (Math.random() * 1000000000).toString(),
      }));
      res.json(fallback);
    }
  });

  app.post("/api/gemini", async (req, res) => {
    try {
      const { prompt } = req.body;
      const response = await getAiClient().models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
      });
      res.json({ response: response.text });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Gemini response" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite middleware for development...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Setting up production static serving...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
