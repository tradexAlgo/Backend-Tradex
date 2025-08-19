


// import pkg from "fyers-api-v3"; lld
// const { fyersDataSocket } = pkg;

// Replace with your actual token

// export function startFyersSocket() {
//   try {
//     const fyersSocket = new fyersDataSocket(TOKEN, "", false); // no log file

//     fyersSocket.autoreconnect(6); // up to 6 retries

//     fyersSocket.on("connect", () => {
//       console.log("✅ Fyers WebSocket connected");
//       fyersSocket.subscribe(["MCX:NATURALGAS25AUGFUT"]);
//     });

//     fyersSocket.on("error", (err) => {
//       console.log("❌ WebSocket error:", err.message || err);
//     });

//     fyersSocket.on("close", () => {
//       console.log("🔌 Fyers WebSocket closed");
//     });

//     fyersSocket.on("message", (data) => {
//       console.log("📩 Live Data:", data);
//       // TODO: store to MongoDB or cache
//     });

//     fyersSocket.connect();
//   } catch (error) {
//     console.error("🛑 Failed to initialize Fyers WebSocket:", error.message || error);
//   }
// }



// import pkg from "fyers-api-v3";
// import fetch from "node-fetch";
// import stockLiveModels from "../models/stockLive.models.js";

// const { fyersDataSocket } = pkg;

// const TOKEN = "OQPJKMQBRZ-100:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiZDoxIiwiZDoyIiwieDowIiwieDoxIiwieDoyIl0sImF0X2hhc2giOiJnQUFBQUFCb3BDcXE4MGVjTVA4UTJHV3lPTTdvSXNhREthNXl6cE0yQ05qeURhTldPX1hSSTNiWm1ldmkwRnlhZU5uV0xtRThlaHM3YU5MX3pEejRjMW5TcUhBX2lmZGwweUZHZzhEWXV2Q0JHN01QLVZkcF9FND0iLCJkaXNwbGF5X25hbWUiOiIiLCJvbXMiOiJLMSIsImhzbV9rZXkiOiI5YjMwYWZhNDg0MWE3NWNkZjI1ZDlhMWNhNjVlMWE0NTEzNWY1YWY5OTdkOTVjYjU0NGYwZGExZCIsImlzRGRwaUVuYWJsZWQiOiJOIiwiaXNNdGZFbmFibGVkIjoiTiIsImZ5X2lkIjoiWU8wMDY0NSIsImFwcFR5cGUiOjEwMCwiZXhwIjoxNzU1NjQ5ODAwLCJpYXQiOjE3NTU1ODkyOTAsImlzcyI6ImFwaS5meWVycy5pbiIsIm5iZiI6MTc1NTU4OTI5MCwic3ViIjoiYWNjZXNzX3Rva2VuIn0.xynKydyDuA_o-dY2VteV1fDT9Cifd_fZPAnpPpgnNXQ";

// const requiredSymbols = [
//   'SILVERM', 'SILVERMIC', 'SILVER',
//   'CRUDEOILM', 'ZINC', 'LEAD',
//   'NATURALGAS', 'GOLDM'
// ];




// export async function startFyersSocket() {
//   try {
//     // STEP 1: Fetch MCX symbol list
//     const res = await fetch("https://public.fyers.in/sym_details/MCX_COM_sym_master.json");
//     const buffer = await res.arrayBuffer();
//     const decompressedText = new TextDecoder("utf-8").decode(buffer);
//     const json = JSON.parse(decompressedText);

//     // STEP 2: Filter latest expiry for required instruments
//     const latestExpiryMap = new Map();
//     Object.entries(json).forEach(([_, value]) => {
//       if (value.exInstType === 30 && value.tradeStatus === 1) {
//         const key = value.underSym;
//         const existing = latestExpiryMap.get(key);
//         if (!existing || Number(value.expiryDate) < Number(existing.expiryDate)) {
//           latestExpiryMap.set(key, value);
//         }
//       }
//     });

//     const filtered = Array.from(latestExpiryMap.values()).filter(item =>
//       requiredSymbols.some(symbol =>
//         item.exSymName.startsWith(symbol) &&
//         (item.exSymName.length === symbol.length || item.exSymName[symbol.length]?.match(/[0-9]/))
//       )
//     );

//     const symbolMetaMap = new Map();
//     const tickers = filtered.map(item => {
//       const fullSymbol = `${item.symTicker}`;
//       symbolMetaMap.set(fullSymbol, {
//         exSymName: item.exSymName,
//         symbolDesc: item.symbolDesc,
//       });
//       return fullSymbol;
//     });

//     console.log("🔗 Subscribing to symbols:", tickers);

//     // STEP 3: Connect WebSocket
//     const fyersSocket = new fyersDataSocket(TOKEN, "", false);
//     fyersSocket.autoreconnect(6);

//     fyersSocket.on("connect", () => {
//       console.log("✅ Fyers WebSocket connected");
//       console.log("tickers:", tickers);
//       fyersSocket.subscribe(tickers);
//     });

//     fyersSocket.on("message", async (quote) => {

//         console.log("📩 Live Data:", quote);
//       const symbol = quote.symbol;
//       const data = quote;
//       const meta = symbolMetaMap.get(symbol) || {};

//       try {
//         await stockLiveModels.findOneAndUpdate(
//           { symbol },
//           {
//             symbol,
//             data,
//             exSymName: meta.exSymName || "",
//             symbolDesc: meta.symbolDesc || "",
//             lastUpdated: new Date(),
//           },
//           { upsert: true, new: true }
//         );
//         console.log("📦 Updated in DB:", symbol);
//       } catch (err) {
//         console.error("❌ DB update error:", symbol, err.message);
//       }
//     });

//     fyersSocket.on("error", (err) => {
//       console.log("❌ WebSocket error:", err.message || err);
//     });

//     fyersSocket.on("close", () => {
//       console.log("🔌 Fyers WebSocket closed");
//     });

//     fyersSocket.connect();
//   } catch (err) {
//     console.error("🛑 Error in startFyersSocket:", err.message || err);
//   }
// }


import pkg from "fyers-api-v3";
import fetch from "node-fetch";
import stockLiveModels from "../models/stockLive.models.js";

const { fyersDataSocket } = pkg;

const TOKEN = "OQPJKMQBRZ-100:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiZDoxIiwiZDoyIiwieDowIiwieDoxIiwieDoyIl0sImF0X2hhc2giOiJnQUFBQUFCb3BESy0xbjAwenpJRjl1a1d2T3pCZGNQX2p4UFFXQ25JRjA3MmZCVjRILUM0V29uVkd1T004aU5UTi1ZTjBwVmhKZWlpcGJ3MDhJYkJZMDVsSFU5bGpZcFc0ZUlYdzBtWTlhczE5ZTBsX25kelNIOD0iLCJkaXNwbGF5X25hbWUiOiIiLCJvbXMiOiJLMSIsImhzbV9rZXkiOiI5YjMwYWZhNDg0MWE3NWNkZjI1ZDlhMWNhNjVlMWE0NTEzNWY1YWY5OTdkOTVjYjU0NGYwZGExZCIsImlzRGRwaUVuYWJsZWQiOiJOIiwiaXNNdGZFbmFibGVkIjoiTiIsImZ5X2lkIjoiWU8wMDY0NSIsImFwcFR5cGUiOjEwMCwiZXhwIjoxNzU1NjQ5ODAwLCJpYXQiOjE3NTU1OTEzNTgsImlzcyI6ImFwaS5meWVycy5pbiIsIm5iZiI6MTc1NTU5MTM1OCwic3ViIjoiYWNjZXNzX3Rva2VuIn0.g8wGZCpntz0kLj0MzBzJWzjq71D8f2M5IrQXw58E6D0";


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

  { symbol: "TATAMOTORS.NS", name: "Tata Motors Limited" },
  { symbol: "TATASTEEL.NS", name: "Tata Steel Limited" },
  { symbol: "RELIANCE.NS", name: "Reliance Industries Limited" },
  { symbol: "ITC.NS", name: "ITC Limited" },
  { symbol: "INFY.NS", name: "Infosys Limited" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services Limited" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank Limited" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Limited" },
  { symbol: "SBIN.NS", name: "State Bank of India" },
  { symbol: "BANKBARODA.NS", name: "Bank of Baroda" },
  { symbol: "ADANIPORTS.NS", name: "Adani Ports and Special Economic Zone Limited" },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises Limited" },
  { symbol: "AMBUJACEM.NS", name: "Ambuja Cements Limited" },
  { symbol: "AXISBANK.NS", name: "Axis Bank Limited" },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance Limited" },
  { symbol: "BPCL.NS", name: "Bharat Petroleum Corporation Limited" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel Limited" },
  { symbol: "INDUSINDBK.NS", name: "IndusInd Bank Limited" },
  { symbol: "LICI.NS", name: "Life Insurance Corporation of India" },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical Industries Limited" }
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

const nseFutures = nseFuturesBase.map(item => ({
  ...item,
  fyersSymbol: convertToFyersFutureSymbol(item.symbol, upcomingExpiry),
  expiry: upcomingExpiry
}));

// ---------------- Main Function ----------------
export async function startFyersSocket() {
  try {
    // STEP 1: Fetch MCX symbol list
    const res = await fetch("https://public.fyers.in/sym_details/MCX_COM_sym_master.json");
    const buffer = await res.arrayBuffer();
    const decompressedText = new TextDecoder("utf-8").decode(buffer);
    const json = JSON.parse(decompressedText);

    // STEP 2: Filter latest expiry for required instruments
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

    // Combine both
    const tickers = [...mcxTickers, ...nseTickers];

    console.log("🔗 Subscribing to symbols:", tickers);

    // STEP 3: Connect WebSocket
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
        console.error("❌ DB update error:", symbol, err.message);
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
