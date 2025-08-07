


import pkg from "fyers-api-v3";
const { fyersDataSocket } = pkg;

// Replace with your actual token
const TOKEN = "OQPJKMQBRZ-100:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiZDoxIiwiZDoyIiwieDowIiwieDoxIiwieDoyIl0sImF0X2hhc2giOiJnQUFBQUFCb2xOaEJWTXNuZ3VmSEVGZ1BhS2pyZ1FCWC1tcjdZRkNzMHFZeXdBdE9IQ3BVelJ2cG1BdEJVXzZPYlRwM0Q3YlI3YWpLQUM1eFg2dk9jNFh1QWx0ZEhUMllWRGVQbjRJTENiQ1M1b055YktReGlpQT0iLCJkaXNwbGF5X25hbWUiOiIiLCJvbXMiOiJLMSIsImhzbV9rZXkiOiI5YjMwYWZhNDg0MWE3NWNkZjI1ZDlhMWNhNjVlMWE0NTEzNWY1YWY5OTdkOTVjYjU0NGYwZGExZCIsImlzRGRwaUVuYWJsZWQiOiJOIiwiaXNNdGZFbmFibGVkIjoiTiIsImZ5X2lkIjoiWU8wMDY0NSIsImFwcFR5cGUiOjEwMCwiZXhwIjoxNzU0NjEzMDAwLCJpYXQiOjE3NTQ1ODUxNTMsImlzcyI6ImFwaS5meWVycy5pbiIsIm5iZiI6MTc1NDU4NTE1Mywic3ViIjoiYWNjZXNzX3Rva2VuIn0.Z9d5a6-dRWJr22udDNXXsRa153ZCvKnZXltcFCx9bYw";

export function startFyersSocket() {
  try {
    const fyersSocket = new fyersDataSocket(TOKEN, "", false); // no log file

    fyersSocket.autoreconnect(6); // up to 6 retries

    fyersSocket.on("connect", () => {
      console.log("✅ Fyers WebSocket connected");
      fyersSocket.subscribe(["MCX:NATURALGAS25AUGFUT"]);
    });

    fyersSocket.on("error", (err) => {
      console.log("❌ WebSocket error:", err.message || err);
    });

    fyersSocket.on("close", () => {
      console.log("🔌 Fyers WebSocket closed");
    });

    fyersSocket.on("message", (data) => {
      console.log("📩 Live Data:", data);
      // TODO: store to MongoDB or cache
    });

    fyersSocket.connect();
  } catch (error) {
    console.error("🛑 Failed to initialize Fyers WebSocket:", error.message || error);
  }
}