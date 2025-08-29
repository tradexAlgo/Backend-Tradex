import pkg from "fyers-api-v3";
import fetch from "node-fetch";
import stockLiveModels from "../models/stockLive.models.js";

const { fyersDataSocket } = pkg;

// Replace with your actual token - DO NOT hardcode this in a production environment
const TOKEN = "YOUR_DYNAMIC_ACCESS_TOKEN";

const requiredSymbols = [
    'SILVERM', 'SILVERMIC', 'SILVER',
    'CRUDEOILM', 'ZINC', 'LEAD',
    'NATURALGAS', 'GOLDM'
];

// ---------------- NSE Futures Base ----------------
const nseFuturesBase = [
    { symbol: "NIFTY", name: "Nifty 50 Index" },
    { symbol: "BANKNIFTY", name: "Nifty Bank Index" },
    { symbol: "FINNIFTY", name: "Nifty Financial Services Index" },
    { symbol: "MIDCPNIFTY", name: "Nifty Midcap Select Index" },

    { symbol: "TATAMOTORS", name: "Tata Motors Limited" },
    { symbol: "TATASTEEL", name: "Tata Steel Limited" },
    { symbol: "RELIANCE", name: "Reliance Industries Limited" },
    { symbol: "ITC", name: "ITC Limited" },
    { symbol: "INFY", name: "Infosys Limited" },
    { symbol: "TCS", name: "Tata Consultancy Services Limited" },
    { symbol: "ICICIBANK", name: "ICICI Bank Limited" },
    { symbol: "HDFCBANK", name: "HDFC Bank Limited" },
    { symbol: "SBIN", name: "State Bank of India" },
    { symbol: "BANKBARODA", name: "Bank of Baroda" },
    { symbol: "ADANIPORTS", name: "Adani Ports and Special Economic Zone Limited" },
    { symbol: "ADANIENT", name: "Adani Enterprises Limited" },
    { symbol: "AMBUJACEM", name: "Ambuja Cements Limited" },
    { symbol: "AXISBANK", name: "Axis Bank Limited" },
    { symbol: "BAJFINANCE", name: "Bajaj Finance Limited" },
    { symbol: "BPCL", name: "Bharat Petroleum Corporation Limited" },
    { symbol: "BHARTIARTL", name: "Bharti Airtel Limited" },
    { symbol: "INDUSINDBK", name: "IndusInd Bank Limited" },
    { symbol: "LICI", name: "Life Insurance Corporation of India" },
    { symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries Limited" }
];

// ---------------- Expiry Calculations ----------------
function getLastThursday(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const day = lastDay.getDay();
    const lastThursday = new Date(lastDay);
    lastThursday.setDate(lastDay.getDate() - ((day + 3) % 7));
    return lastThursday;
}

function getUpcomingNseExpiry() {
    const today = new Date();
    let expiry = getLastThursday(today);
    if (expiry < today) {
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        expiry = getLastThursday(nextMonth);
    }
    return expiry.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

const upcomingExpiry = getUpcomingNseExpiry();

// Convert to Fyers Futures symbol format
function convertToFyersFutureSymbol(symbol, expiry) {
    const year = new Date().getFullYear().toString().slice(-2); // '25'
    const [day, mon] = expiry.split(" "); // e.g., "28 Aug"
    const monthCode = mon.toUpperCase();

    // Indexes (NIFTY, BANKNIFTY, etc.) don't have .NS
    if (!symbol.endsWith(".NS")) {
        return `NSE:${symbol}${year}${monthCode}FUT`;
    }

    // Stocks — remove ".NS"
    const base = symbol.replace(".NS", "");
    return `NSE:${base}${year}${monthCode}FUT`;
}

// ---------------- NSE Options Function ----------------
async function getNseOptions(livePrices) {
    const options = [];
    const year = new Date().getFullYear().toString().slice(-2);
    const [day, mon] = getUpcomingNseExpiry().split(" ");
    const expiry = `${year}${mon.toUpperCase()}${day}`;

    const optionConfigs = {
        NIFTY: { step: 50, livePrice: livePrices.NIFTY },
        BANKNIFTY: { step: 100, livePrice: livePrices.BANKNIFTY },
        FINNIFTY: { step: 50, livePrice: livePrices.FINNIFTY },
        SENSEX: { step: 100, livePrice: livePrices.SENSEX }
    };

    for (const [underlying, config] of Object.entries(optionConfigs)) {
        const { livePrice, step } = config;

        // Skip if live price is not available
        if (!livePrice) continue;

        const startStrike = Math.floor(livePrice / step) * step - (step * 10);
        const endStrike = Math.floor(livePrice / step) * step + (step * 10);

        for (let strike = startStrike; strike <= endStrike; strike += step) {
            const ceSymbol = `NSE:${underlying}${expiry}${strike}CE`;
            const peSymbol = `NSE:${underlying}${expiry}${strike}PE`;
            options.push(ceSymbol, peSymbol);
        }
    }

    return options;
}

const nseFutures = nseFuturesBase.map(item => ({
    ...item,
    fyersSymbol: convertToFyersFutureSymbol(item.symbol, upcomingExpiry),
    expiry: upcomingExpiry
}));

// ---------------- Main Function ----------------
export async function startFyersSocket() {
    try {
        // STEP 1: Fetch live prices for underlying indexes
        const indexSymbols = ["NSE:NIFTY", "NSE:BANKNIFTY", "NSE:FINNIFTY", "BSE:SENSEX"];
        const indexQuotesResponse = await fetch("https://backend-tradex.onrender.com/market/getQuotesV2", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ symbols: indexSymbols })
        });
        const indexQuotesData = await indexQuotesResponse.json();

        const livePrices = {};
        if (indexQuotesData?.status && indexQuotesData?.data) {
            indexQuotesData.data.forEach(item => {
                const name = item.symbol.split(':')[1] || item.symbol;
                livePrices[name] = item.data.ltp || item.data.lp;
            });
        }
        
        console.log("Live Index Prices:", livePrices);

        // STEP 2: Fetch MCX symbol list
        const res = await fetch("https://public.fyers.in/sym_details/MCX_COM_sym_master.json");
        const buffer = await res.arrayBuffer();
        const decompressedText = new TextDecoder("utf-8").decode(buffer);
        const json = JSON.parse(decompressedText);

        // STEP 3: Filter latest expiry for required instruments
        const latestExpiryMap = new Map();
        Object.entries(json).forEach(([_, value]) => {
            if (value.exInstType === 30 && value.tradeStatus === 1) {
                const key = value.underSym;
                const existing = latestExpiryMap.get(key);
                if (!existing || Number(value.expiryDate) < Number(existing.expiryDate)) {
                    latestExpiryMap.set(key, value);
                }
            }
        });

        const filtered = Array.from(latestExpiryMap.values()).filter(item =>
            requiredSymbols.some(symbol =>
                item.exSymName.startsWith(symbol) &&
                (item.exSymName.length === symbol.length || item.exSymName[symbol.length]?.match(/[0-9]/))
            )
        );

        const symbolMetaMap = new Map();

        // MCX Tickers
        const mcxTickers = filtered.map(item => {
            const fullSymbol = `${item.symTicker}`;
            symbolMetaMap.set(fullSymbol, {
                exSymName: item.exSymName,
                symbolDesc: item.symbolDesc,
            });
            return fullSymbol;
        });

        // NSE Futures Tickers
        const nseTickers = nseFutures.map(item => {
            symbolMetaMap.set(item.fyersSymbol, {
                exSymName: item.symbol,
                symbolDesc: item.name,
            });
            return item.fyersSymbol;
        });
        
        // NSE Options Tickers - now using dynamic live prices
        const nseOptionsTickers = await getNseOptions(livePrices);

        // Combine all
        const tickers = [...mcxTickers, ...nseTickers, ...nseOptionsTickers];

        console.log("🔗 Subscribing to symbols:", tickers);

        // STEP 4: Connect WebSocket
        const fyersSocket = new fyersDataSocket(TOKEN, "", false);
        fyersSocket.autoreconnect(6);

        fyersSocket.on("connect", () => {
            console.log("✅ Fyers WebSocket connected");
            fyersSocket.subscribe(tickers);
        });

        fyersSocket.on("message", async (quote) => {
            console.log("📩 Live Data:", quote);
            const symbol = quote.symbol;
            const data = quote;
            const meta = symbolMetaMap.get(symbol) || {};

            try {
                await stockLiveModels.findOneAndUpdate(
                    { symbol },
                    {
                        symbol,
                        data,
                        exSymName: meta.exSymName || "",
                        symbolDesc: meta.symbolDesc || "",
                        lastUpdated: new Date(),
                    },
                    { upsert: true, new: true }
                );
                console.log("📦 Updated in DB:", symbol);
            } catch (err) {
                console.log("❌ DB update error:", symbol, err.message);
            }
        });

        fyersSocket.on("error", (err) => {
            console.log("❌ WebSocket error:", err.message || err);
        });

        fyersSocket.on("close", () => {
            console.log("🔌 Fyers WebSocket closed");
        });

        fyersSocket.connect();
    } catch (err) {
        console.error("🛑 Error in startFyersSocket:", err.message || err);
    }
}
