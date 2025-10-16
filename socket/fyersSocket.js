


// import pkg from "fyers-api-v3";
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

// const TOKEN = "OQPJKMQBRZ-100:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiZDoxIiwiZDoyIiwieDowIiwieDoxIiwieDoyIl0sImF0X2hhc2giOiJnQUFBQUFCb21zVnJJSU1FZmZuZERoNkE0cndZUzdmb2tNc0pfT0pITUlyZEJfM290Rk9IQmFDUlAtWHQ0dW5CREJvclNvVjhjMW81MzdzSjBqQml3YVFCZ3NXeTFkaVh2aFktWHczSnFkWDRmRDl0QXY0SmdHYz0iLCJkaXNwbGF5X25hbWUiOiIiLCJvbXMiOiJLMSIsImhzbV9rZXkiOiI5YjMwYWZhNDg0MWE3NWNkZjI1ZDlhMWNhNjVlMWE0NTEzNWY1YWY5OTdkOTVjYjU0NGYwZGExZCIsImlzRGRwaUVuYWJsZWQiOiJOIiwiaXNNdGZFbmFibGVkIjoiTiIsImZ5X2lkIjoiWU8wMDY0NSIsImFwcFR5cGUiOjEwMCwiZXhwIjoxNzU1MDQ1MDAwLCJpYXQiOjE3NTQ5NzM1NDcsImlzcyI6ImFwaS5meWVycy5pbiIsIm5iZiI6MTc1NDk3MzU0Nywic3ViIjoiYWNjZXNzX3Rva2VuIn0.ah7c8I_wuW4MWAeOM54mCBZ_4C0Bg58SgNaBPDQqlHc";

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

const TOKEN = "OQPJKMQBRZ-100:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiZDoxIiwiZDoyIiwieDowIiwieDoxIiwieDoyIl0sImF0X2hhc2giOiJnQUFBQUFCbzhGMi1vVmFqd0x2T1FWOG1sbGczXzlMdTlXbFpWTV9DOS1VckduNDN4cWJvTFVUV3dYWkF3SjlBaHNyU3lMVHZmNmtzS0dybGJDMDZGMzRmX3JZYnpReUhJYTRPcFdTQlNzOVQ4Y2dWQ25MRWxrOD0iLCJkaXNwbGF5X25hbWUiOiIiLCJvbXMiOiJLMSIsImhzbV9rZXkiOiJlZjUzZjhhYjRhNjBkMTAzZjc1MjQwYTNhOGQyMzk1NDc5MWJlMzA3ZGNlMTk2Yjk1MmJkM2M3ZCIsImlzRGRwaUVuYWJsZWQiOiJZIiwiaXNNdGZFbmFibGVkIjoiTiIsImZ5X2lkIjoiWU8wMDY0NSIsImFwcFR5cGUiOjEwMCwiZXhwIjoxNzYwNjYxMDAwLCJpYXQiOjE3NjA1ODMxMDIsImlzcyI6ImFwaS5meWVycy5pbiIsIm5iZiI6MTc2MDU4MzEwMiwic3ViIjoiYWNjZXNzX3Rva2VuIn0.DPg0qaLmOi7WnYffd1nzvnZXOVd1_aOHGjahVFC8tRc";


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

    async function getBankNiftyOptions(atmStrike = 51500, range = 500) {
      try {
        const resFO = await fetch("https://public.fyers.in/sym_details/NSE_FO_sym_master.json");
        const bufferFO = await resFO.arrayBuffer();
        const decompressedFO = new TextDecoder("utf-8").decode(bufferFO);
        const foJson = JSON.parse(decompressedFO);

        const all = Object.values(foJson);
        // console.log("Total FO symbols fetched:", all.length);
        // console.log("Sample record:", all[0]);

        // ✅ FIXED FILTER
        const bankniftyOptions = all.filter(
          o => o.underSym === "BANKNIFTY" && o.exInstType === 14
        );

        // console.log("BANKNIFTY Options fetched:", bankniftyOptions.length);
        // console.log("Sample BANKNIFTY Option:", bankniftyOptions[0]);

        if (!bankniftyOptions.length) return [];

        // Nearest expiry (epoch seconds)
        const now = Math.floor(Date.now() / 1000);
        const nearestExpiry = [...new Set(bankniftyOptions.map(o => Number(o.expiryDate)))]
          .filter(exp => exp >= now)
          .sort((a, b) => a - b)[0];

        // console.log("Nearest expiry:", nearestExpiry);

        const currentExpiry = bankniftyOptions.filter(
          o => Number(o.expiryDate) === nearestExpiry
        );

        const strikes = currentExpiry.filter(
          o => Math.abs(o.strikePrice - atmStrike) <= range
        );

        return strikes.map(o => o.symTicker);
      } catch (err) {
        console.error("❌ Error fetching BANKNIFTY options:", err.message || err);
        return [];
      }
    }


    async function getFNOOptions(underlying = "BANKNIFTY", atmStrike = 51500, range = 500) {
      try {
        const resFO = await fetch("https://public.fyers.in/sym_details/NSE_FO_sym_master.json");
        const bufferFO = await resFO.arrayBuffer();
        const decompressedFO = new TextDecoder("utf-8").decode(bufferFO);
        const foJson = JSON.parse(decompressedFO);

        const allSymbols = Object.values(foJson);

        // Filter for the given underlying and Options (exInstType === 14)
        const options = allSymbols.filter(
          o => o.underSym === underlying && o.exInstType === 14
        );

        if (!options.length) return [];

        // Nearest expiry (epoch seconds)
        const now = Math.floor(Date.now() / 1000);
        const nearestExpiry = [...new Set(options.map(o => Number(o.expiryDate)))]
          .filter(exp => exp >= now)
          .sort((a, b) => a - b)[0];

        const currentExpiry = options.filter(
          o => Number(o.expiryDate) === nearestExpiry
        );

        const strikes = currentExpiry.filter(
          o => Math.abs(o.strikePrice - atmStrike) <= range
        );

        return strikes.map(o => o.symTicker);
      } catch (err) {
        console.error(`❌ Error fetching ${underlying} options:`, err.message || err);
        return [];
      }
    }

    const niftySymbols = await getFNOOptions("NIFTY", 27000, 2000);


    const bankNiftySymbols = await getBankNiftyOptions(51500, 500);

    //  const atmFN = Number(req.query.atmFN || 19500);    // FINNIFTY ATM
    // const rangeFN = Number(req.query.rangeFN || 500);  // FINNIFTY range
    // const atmSX = Number(req.query.atmSX || 61000);    // SENSEX ATM
    // const rangeSX = Number(req.query.rangeSX || 1500); // SENSEX range

    const finniftySymbols = getFNOOptions("FINNIFTY", 19500, 500);
    const sensexSymbols = getFNOOptions("SENSEX", 61000, 1500);

    console.log("BANKNIFTY Options subscribed:", bankNiftySymbols);
    // Combine both
    const tickers = [...mcxTickers, ...nseTickers, ...bankNiftySymbols, ...niftySymbols,...finniftySymbols,...sensexSymbols];

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
