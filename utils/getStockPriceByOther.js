import axios from "axios";
import fetch from "node-fetch";

const getStockPriceByOther = (symbol, optionType, identifier) => {
  return new Promise(async (resolve, reject) => {
    try {
  const indexes = ['NIFTY', 'FINNIFTY', 'BANKNIFTY', 'MIDCPNIFTY'];

      const isIndexSelected = indexes.includes(symbol);
    //  http://192.168.1.14:5000/market/chain?index=NIFTY
    // https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY
      const url = `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`;
      // const url = `https://option-chain-data.onrender.com/chain?${isIndexSelected?'index':'symbol'}=${symbol}`;
      console.log("url --kya hia",url)

      // const response = await fetch(url);
      try {
        const response = await axios.get(url, {
          timeout: 45000, // Set timeout as needed
        });
         const data = await response.json();

         // Filter the data based on optionType and identifier
         const optionData = data?.records?.data?.find((item) => {
           console.log(
             "item: ",
             item[optionType]?.identifier,
             item[optionType]?.identifier === identifier
           );
           return item[optionType]?.identifier === identifier;
         });

         if (optionData) {
           // Resolve the lastPrice of the filtered option
           resolve(optionData[optionType].lastPrice);
         } else {
           // If no matching data found, resolve with an appropriate message
           resolve(
             `No data found for symbol: ${symbol}, optionType: ${optionType}, identifier: ${identifier}`
           );
         }
        return response.data;
      } catch (error) {
        console.error("Error fetching data:", error.message);
        throw error;
      }

     
    } catch (error) {
      reject(error);
    }
  });
};

export default getStockPriceByOther