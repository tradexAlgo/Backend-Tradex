import WebSocket from 'ws';
// import { updateLivePriceInDB } from '../helpers/priceUpdater.js'; // assume this function updates DB
import dotenv from 'dotenv';
dotenv.config();

let ws;
let reconnectTimeout;

export const startWebSocket = () => {
  const token =   `OQPJKMQBRZ-100:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiZDoxIiwiZDoyIiwieDowIiwieDoxIiwieDoyIl0sImF0X2hhc2giOiJnQUFBQUFCb2swOVpta1lxRzN1MlpPLWpxTVZyb1RlbEgzb2dNV1MtdDYxNm80OVpxRktHTVp3ZjhMQldGd195WW1DSDlCdGJady1RdE9nc0lIbTFNLWZIRzdxNUsxYXlTSGU3YnRlRDRXYUlUY0V5V0xZQmZXWT0iLCJkaXNwbGF5X25hbWUiOiIiLCJvbXMiOiJLMSIsImhzbV9rZXkiOiI5YjMwYWZhNDg0MWE3NWNkZjI1ZDlhMWNhNjVlMWE0NTEzNWY1YWY5OTdkOTVjYjU0NGYwZGExZCIsImlzRGRwaUVuYWJsZWQiOiJOIiwiaXNNdGZFbmFibGVkIjoiTiIsImZ5X2lkIjoiWU8wMDY0NSIsImFwcFR5cGUiOjEwMCwiZXhwIjoxNzU0NTI2NjAwLCJpYXQiOjE3NTQ0ODQ1NjksImlzcyI6ImFwaS5meWVycy5pbiIsIm5iZiI6MTc1NDQ4NDU2OSwic3ViIjoiYWNjZXNzX3Rva2VuIn0.UUyTEfM-wKdjA4hptYiw_LsZc1Zg13SpaCiw_WL8G78`; // Format: APP_ID:ACCESS_TOKEN
  const socketUrl = `wss://api.fyers.in/socket/v3/data?access_token=${token}`;

  function connect() {
    ws = new WebSocket(socketUrl);

    ws.on('open', () => {
      console.log('✅ Fyers WebSocket connected');

      const subscribeMessage = {
        symbol: ['MCX:CRUDEOIL24AUGFUT', 'MCX:GOLD24AUGFUT'], // Add more as needed
        type: 'symbolData',
      };

      ws.send(JSON.stringify(subscribeMessage));
    });

    ws.on('message', async (data) => {
      try {
        const parsed = JSON.parse(data);
        const d = parsed.d;

        if (parsed.type === 'symbolData' && Array.isArray(d)) {
          for (const tick of d) {
            // await updateLivePriceInDB(tick); // you must implement this function
          }
        }
      } catch (err) {
        console.error('❌ Error parsing message:', err);
      }
    });

    ws.on('error', (err) => {
      console.error('❌ WebSocket error:', err);
      reconnect();
    });

    ws.on('close', () => {
      console.warn('⚠️ WebSocket closed. Reconnecting...');
      reconnect();
    });
  }

  function reconnect() {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(() => {
      console.log('🔁 Reconnecting WebSocket...');
      connect();
    }, 5000);
  }

  connect();
};
