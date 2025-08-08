


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



import pkg from "fyers-api-v3";
import fetch from "node-fetch";
import stockLiveModels from "../models/stockLive.models.js";

const { fyersDataSocket } = pkg;

const TOKEN = "OQPJKMQBRZ-100:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiZDoxIiwiZDoyIiwieDowIiwieDoxIiwieDoyIl0sImF0X2hhc2giOiJnQUFBQUFCb2xZeDVBSHdSQ3RVR2s2QXNxMXM1VzA0YTY4LTVReVBRZjNxbUtPU3RieXJTWVhlX3JPWFZtQmwxenpHMG41ZE5xWVZ0eUNFN2xSMDBZVnQ5QnZISUU5b1BWU0hSeHhlWWZZbHpUTkJueXQ4RXN6Zz0iLCJkaXNwbGF5X25hbWUiOiIiLCJvbXMiOiJLMSIsImhzbV9rZXkiOiI5YjMwYWZhNDg0MWE3NWNkZjI1ZDlhMWNhNjVlMWE0NTEzNWY1YWY5OTdkOTVjYjU0NGYwZGExZCIsImlzRGRwaUVuYWJsZWQiOiJOIiwiaXNNdGZFbmFibGVkIjoiTiIsImZ5X2lkIjoiWU8wMDY0NSIsImFwcFR5cGUiOjEwMCwiZXhwIjoxNzU0Njk5NDAwLCJpYXQiOjE3NTQ2MzEyODksImlzcyI6ImFwaS5meWVycy5pbiIsIm5iZiI6MTc1NDYzMTI4OSwic3ViIjoiYWNjZXNzX3Rva2VuIn0.xUj89qWHDtSWAIyaAh2aofpTKBAwFQnW6GoqrsTURX0";

const requiredSymbols = [
  'SILVERM', 'SILVERMIC', 'SILVER',
  'CRUDEOILM', 'ZINC', 'LEAD',
  'NATURALGAS', 'GOLDM'
];




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
    const tickers = filtered.map(item => {
      const fullSymbol = `${item.symTicker}`;
      symbolMetaMap.set(fullSymbol, {
        exSymName: item.exSymName,
        symbolDesc: item.symbolDesc,
      });
      return fullSymbol;
    });

    console.log("🔗 Subscribing to symbols:", tickers);

    // STEP 3: Connect WebSocket
    const fyersSocket = new fyersDataSocket(TOKEN, "", false);
    fyersSocket.autoreconnect(6);

    fyersSocket.on("connect", () => {
      console.log("✅ Fyers WebSocket connected");
      console.log("tickers:", tickers);
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
