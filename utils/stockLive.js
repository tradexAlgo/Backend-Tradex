import mongoose from "mongoose";
import cron from "node-cron";
import fetch from "node-fetch";
import axios from "axios";
import stockLiveModels from "../models/stockLive.models.js";

// Config
const CHUNK_SIZE = 50;
const REQUEST_DELAY_MS = 500; // 0.5 second delay between chunks

const updateStockLiveData = async () => {
  try {
    const res = await fetch("https://public.fyers.in/sym_details/MCX_COM_sym_master.json");

    if (!res.ok) throw new Error(`Failed to fetch MCX master: ${res.statusText}`);

    const buffer = await res.arrayBuffer();
    const decompressedText = new TextDecoder("utf-8").decode(buffer);
    const json = JSON.parse(decompressedText);

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

    const result = Array.from(latestExpiryMap.values()).map(item => ({
      exSymName: item.exSymName,
      symTicker: item.symTicker,
      symbolDesc: item.symbolDesc,
    }));

    const symbolMetaMap = new Map();
    result.forEach(item => {
      symbolMetaMap.set(item.symTicker, {
        exSymName: item.exSymName,
        symbolDesc: item.symbolDesc,
      });
    });

    for (let i = 0; i < result.length; i += CHUNK_SIZE) {
      const chunk = result.slice(i, i + CHUNK_SIZE);
      const symbols = chunk.map(item => item.symTicker);

      try {
        console.log("calling getQuotes for symbols:", symbols);
        const { data: response } = await axios.post(
          "https://backend-tradex.onrender.com/market/getQuotes",
          { symbols }
        );

        const quotes = response?.data?.d || [];

        await Promise.all(
          quotes.map(async (quote) => {
            const symbol = quote.n;
            const data = quote.v;
            const meta = symbolMetaMap.get(symbol) || {};

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
          })
        );

        console.log(`[Chunk] Updated ${quotes.length} quotes`);
      } catch (err) {
        console.error("❌ getQuotes Error:", err.message);
      }

      // Delay between chunks
      if (i + CHUNK_SIZE < result.length) {
        await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));
      }
    }

    console.log(`[✅ StockLive] Updated ${result.length} symbols at ${new Date().toLocaleTimeString()}`);
  } catch (error) {
    console.error("[❌ StockLive Cron] Error:", error.message);
  }
};

// Schedule: Every 2 seconds
cron.schedule("*/2 * * * * *", updateStockLiveData);

export default updateStockLiveData;
