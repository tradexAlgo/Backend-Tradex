// import mongoose from "mongoose";
// import cron from "node-cron";
// import fetch from "node-fetch";
// import axios from "axios";
// import stockLiveModels from "../models/stockLive.models.js";

// // Config
// const CHUNK_SIZE = 50;
// const REQUEST_DELAY_MS = 500; // 0.5 second delay between chunks


// const requiredSymbols = [
//     'SILVERM',
//     'SILVERMIC',
//     'SILVER',
//     'CRUDEOILM',
//     'ZINC',
//     'LEAD',
//     'NATURALGAS',
//     'GOLDM'
// ];

// const updateStockLiveData = async () => {
//     try {
//         const res = await fetch("https://public.fyers.in/sym_details/MCX_COM_sym_master.json");

//         if (!res.ok) throw new Error(`Failed to fetch MCX master: ${res.statusText}`);

//         const buffer = await res.arrayBuffer();
//         const decompressedText = new TextDecoder("utf-8").decode(buffer);
//         const json = JSON.parse(decompressedText);

//         const latestExpiryMap = new Map();

//         Object.entries(json).forEach(([_, value]) => {
//             if (value.exInstType === 30 && value.tradeStatus === 1) {
//                 const key = value.underSym;
//                 const existing = latestExpiryMap.get(key);
//                 if (!existing || Number(value.expiryDate) < Number(existing.expiryDate)) {
//                     latestExpiryMap.set(key, value);
//                 }
//             }
//         });

//         const result = Array.from(latestExpiryMap.values()).map(item => ({
//             exSymName: item.exSymName,
//             symTicker: item.symTicker,
//             symbolDesc: item.symbolDesc,
//         }));

//         const symbolMetaMap = new Map();
//         result.forEach(item => {
//             symbolMetaMap.set(item.symTicker, {
//                 exSymName: item.exSymName,
//                 symbolDesc: item.symbolDesc,
//             });
//         });


//         const filteredList = result.filter(item => {
//             return requiredSymbols.some(symbol => {
//                 return (
//                     item.exSymName.startsWith(symbol) &&
//                     (
//                         item.exSymName.length === symbol.length ||          // exact match
//                         item.exSymName[symbol.length].match(/[0-9]/)        // followed by number (like "25")
//                     )
//                 );
//             });
//         });

//         console.log("[✅ StockLive] Fetched symbols:", filteredList);


//         for (let i = 0; i < filteredList.length; i += CHUNK_SIZE) {
//             const chunk = filteredList.slice(i, i + CHUNK_SIZE);
//             const symbols = chunk.map(item => item.symTicker);

//             try {
//                 console.log("calling getQuotes for symbols:", symbols);
//                 const { data: response } = await axios.post(
//                     "https://backend-tradex.onrender.com/market/getQuotes",
//                     { symbols }
//                 );

//                 const quotes = response?.data?.d || [];

//                 await Promise.all(
//                     quotes.map(async (quote) => {
//                         const symbol = quote.n;
//                         const data = quote.v;
//                         const meta = symbolMetaMap.get(symbol) || {};

//                         await stockLiveModels.findOneAndUpdate(
//                             { symbol },
//                             {
//                                 symbol,
//                                 data,
//                                 exSymName: meta.exSymName || "",
//                                 symbolDesc: meta.symbolDesc || "",
//                                 lastUpdated: new Date(),
//                             },
//                             { upsert: true, new: true }
//                         );
//                     })
//                 );

//                 console.log(`[Chunk] Updated ${quotes.length} quotes`);
//             } catch (err) {
//                 console.error("❌ getQuotes Error:", err.message);
//             }

//             // Delay between chunks
//             if (i + CHUNK_SIZE < result.length) {
//                 await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));
//             }
//         }

//         console.log(`[✅ StockLive] Updated ${result.length} symbols at ${new Date().toLocaleTimeString()}`);
//     } catch (error) {
//         console.error("[❌ StockLive Cron] Error:", error.message);
//     }
// };

// // Schedule: Every 2 seconds
// cron.schedule("*/2 * * * * *", updateStockLiveData);

// export default updateStockLiveData;


import mongoose from "mongoose";
import fetch from "node-fetch";
import axios from "axios";
import stockLiveModels from "../models/stockLive.models.js";

// Constants
const CHUNK_SIZE = 8;
const MAX_CALLS_PER_MIN = 25;

const requiredSymbols = [
    'SILVERM',
    'SILVERMIC',
    'SILVER',
    'CRUDEOILM',
    'ZINC',
    'LEAD',
    'NATURALGAS',
    'GOLDM'
];

// Utility: Random wait between 2-3 seconds
const wait = (min = 2000, max = 3000) =>
    new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));

const fetchSymbolList = async () => {
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

    return result.filter(item =>
        requiredSymbols.some(symbol =>
            item.exSymName.startsWith(symbol) &&
            (
                item.exSymName.length === symbol.length ||
                item.exSymName[symbol.length]?.match(/[0-9]/)
            )
        )
    );
};

const updateLiveQuotesLoop = async () => {
    while (true) {
        try {
            const filteredList = await fetchSymbolList();

            const symbolMetaMap = new Map();
            filteredList.forEach(item => {
                symbolMetaMap.set(item.symTicker, {
                    exSymName: item.exSymName,
                    symbolDesc: item.symbolDesc,
                });
            });

            console.log(`[🔁 StockLive] Loop started at ${new Date().toLocaleTimeString()}`);
            for (let i = 0; i < filteredList.length; i += CHUNK_SIZE) {
                const chunk = filteredList.slice(i, i + CHUNK_SIZE);
                const symbols = chunk.map(item => item.symTicker);

                try {
                    const { data: response } = await axios.post(
                        // "http://192.168.59.64:5001/market/getQuotes",
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

                    console.log(`[✅ Updated] ${quotes.length} symbols at ${new Date().toLocaleTimeString()}`);
                } catch (err) {
                    console.error("❌ Error during getQuotes:", err.message);
                }

                // Wait 2–3 seconds before next chunk
                await wait(2000, 3000);
            }

            console.log(`[✅ Round Completed] Waiting 15s before next round...\n`);
            await wait(2000, 3000); // short break before restarting loop
        } catch (error) {
            console.error("[❌ StockLive Loop Error]:", error.message);
            await wait(10000); // wait before retrying in case of error
        }
    }
};

// Start the infinite loop
updateLiveQuotesLoop();

