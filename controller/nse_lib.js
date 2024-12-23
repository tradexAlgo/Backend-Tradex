// const { exec, spawn } = require("child_process");

import axios from "axios";
import fetch from "node-fetch";

// function execute(command, callback) {
//   exec(
//     command,
//     {
//       maxBuffer: 1024 * 1000 * 10,
//     },
//     function (error, stdout, stderr) {
//       callback(stdout);
//     }
//   );
// }

// function isJson(text) {
//   try {
//     return JSON.parse(text);
//   } catch (err) {
//     return false;
//   }
// }

function loadCookies() {
  return new Promise((resolve, reject) => {
    execute(
      `curl 'https://www.nseindia.com/' \
    -H 'authority: www.nseindia.com' \
    -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9' \
    -H 'accept-encoding: gzip, deflate, br' \
    -H 'accept-language: en-IN,en;q=0.9,en-GB;q=0.8,en-US;q=0.7,hi;q=0.6,mr;q=0.5' \
    -H 'cache-control: no-cache' \
    -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36' \
    --compressed --silent --output /dev/null --cookie-jar cookie.txt`,
      function (resp) {
        resolve();
      }
    );
  });
}

export function getOptionChain(instrument, type) {
//   const endPoint = `https://www.nseindia.com/api/option-chain-${
//     type === "index" ? "indices" : "equities"
//   }?symbol=${instrument}`;
//   console.log("endpoint--",endPoint);
//   return new Promise((resolve, reject) => {
//     execute(
//       `curl '${endPoint}' \
//       -H 'authority: www.nseindia.com' \
//       -H 'dnt: 1' \
//       -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9' \
//       -H 'accept-encoding: gzip, deflate, br' \
//       -H 'accept-language: en-IN,en;q=0.9,en-GB;q=0.8,en-US;q=0.7,hi;q=0.6,mr;q=0.5' \
//       -H 'cache-control: no-cache' \
//       -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36' \
//       --compressed --cookie cookie.txt --cookie-jar cookie.txt`,
//       function (resp) {
//         console.log("response: " + resp)
//         let isValidData = isJson(resp);
//         if (isValidData) {
//           resolve(isValidData);
//         } else {
//           resolve();
//         }
//       }
//     );
//   });



console.log("Starting request to NSE endpoint...");

return new Promise((resolve, reject) => {
  execute(
    `curl 'https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY' \
    -H 'authority: www.nseindia.com' \
    -H 'dnt: 1' \
    -H 'accept: */*' \
    -H 'accept-encoding: gzip, deflate, br' \
    -H 'accept-language: en-IN,en;q=0.9' \
    -H 'cache-control: no-cache' \
    -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' \
    --compressed --cookie cookie.txt --cookie-jar cookie.txt`,
    function (resp) {
      console.log("Raw response received");
      if (resp) {
        console.log("response: " + resp);
        let isValidData = isJson(resp);
        if (isValidData) {
          console.log("Valid JSON detected");
          resolve(isValidData);
        } else {
          console.error("Invalid response, not JSON");
          resolve();
        }
      } else {
        console.error("Empty response received");
        reject("No response or connection issue");
      }
    }
  );
});

}

export async function fetchNiftyOptionChain() {
  try {
    const response = await fetch('https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
        'accept': 'application/json, text/plain, */*',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
      },
      // Add more headers if required (like cookies)
    });
    console.log(response);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

function getSymbols() {
  return new Promise((resolve, reject) => {
    execute(
      `curl 'https://www.nseindia.com/api/master-quote' \
      -H 'authority: www.nseindia.com' \
      -H 'dnt: 1' \
      -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9' \
      -H 'accept-encoding: gzip, deflate, br' \
      -H 'accept-language: en-IN,en;q=0.9,en-GB;q=0.8,en-US;q=0.7,hi;q=0.6,mr;q=0.5' \
      -H 'cache-control: no-cache' \
      -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36' \
      --compressed --cookie cookie.txt --cookie-jar cookie.txt`,
      function (resp) {
        let isValidData = isJson(resp);
        if (isValidData) {
          resolve(isValidData);
        } else {
          resolve();
        }
      }
    );
  });
}

// module.exports = { getOptionChain, loadCookies, getSymbols };
// Export an async function to fetch option chain data
import https from "https";

// const agent = new https.Agent({
//   keepAlive: true,
//   rejectUnauthorized: false, // Be cautious with this in production
// });

// export async function fetchOptionChain() {
//   try {
//     const response = await axios.get(
//       "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY",
//       {
//         headers: {
//           "User-Agent":
//             "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
//           Accept: "application/json",
//           Referer: "https://www.nseindia.com/",
//         },
//         httpsAgent: agent,
//       }
//     );

//     console.log(response.data);
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching option chain data:", error.message);
//     throw error;
//   }
// }

// export async function fetchOptionChain(symbol = "NIFTY") {
//   try {
//     const response = await axios.get(
//       `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`,
//       {
//         headers: {
//           "User-Agent":
//             "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
//           Accept: "application/json",
//           Referer: "https://www.nseindia.com/",
//           "Accept-Language": "en-US,en;q=0.9",
//           "Cache-Control": "no-cache",
//           Connection: "keep-alive",
//         },
//       }
//     );

//     console.log("Data fetched successfully:", response.data);
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching option chain data:", error.message);
//     throw error;
//   }
// }


// const agent = new https.Agent({
//   keepAlive: true,
//   timeout: 15000, // Set a higher agent timeout
// });

// export async function fetchOptionChain(symbol = "NIFTY") {
//   try {
//     const response = await axios.get(
//       `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`,
//       {
//         httpsAgent: agent,
//         headers: {
//           "User-Agent":
//             "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
//           Accept: "application/json",
//           Referer: "https://www.nseindia.com/",
//           "Accept-Language": "en-US,en;q=0.9",
//           "Cache-Control": "no-cache",
//           Connection: "keep-alive",
//         },
//         timeout: 15000, // Increase timeout to 15 seconds
//       }
//     );

//     console.log("Data fetched successfully:", response.data);
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching option chain data:", error.message);
//     throw error;
//   }
// }



// const agent = new https.Agent({
//   keepAlive: true,
//   timeout: 45000, // Increase timeout in the agent
// });

// export async function fetchOptionChain(symbol = "NIFTY") {
//   try {
//     const response = await axios.get(
//       `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`,
//       {
//         httpsAgent: agent,
//         headers: {
//           "User-Agent":
//             "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
//           Accept: "application/json",
//           Referer: "https://www.nseindia.com/",
//           "Accept-Language": "en-US,en;q=0.9",
//           "Cache-Control": "no-cache",
//           Connection: "keep-alive",
//         },
//       }
//     );

//     return response.data;
//   } catch (error) {
//     console.error("Error fetching option chain data:", error.message);
//     throw error;
//   }
// }


// export async function fetchOptionChain(symbol = "NIFTY") {
//   try {
//     const response = await axios.get(
//       `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`,
//       {
//         headers: {
//           "User-Agent":
//             "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
//           Accept: "application/json",
//           Referer: "https://www.nseindia.com/",
//           "Accept-Language": "en-US,en;q=0.9",
//           "Cache-Control": "no-cache",
//           Connection: "keep-alive",
//         },
//         timeout: 25000, // Increase timeout to 20 seconds
//       }
//     );

//     return response.data;
//   } catch (error) {
//     console.error("Error fetching option chain data:", error.message);
//     throw error;
//   }
// }

// Helper function for retries
// async function axiosWithRetry(config, retries = 3) {
//   for (let attempt = 1; attempt <= retries; attempt++) {
//     try {
//       return await axios(config);
//     } catch (error) {
//       if (attempt < retries) {
//         console.warn(`Retry attempt ${attempt} failed. Retrying...`);
//       } else {
//         console.error('Max retries reached.');
//         throw error;
//       }
//     }
//   }
// }

// export async function fetchOptionChain(symbol = "NIFTY") {
//   try {
//     const response = await axiosWithRetry(
//       {
//         method: 'get',
//         url: `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`,
//         headers: {
//           "User-Agent":
//             "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
//           Accept: "application/json",
//           Referer: "https://www.nseindia.com/",
//           "Accept-Language": "en-US,en;q=0.9",
//           "Cache-Control": "no-cache",
//           Connection: "keep-alive",
//           "Accept-Encoding": "gzip, deflate, br", // Ensure compressed response
//         },
//         timeout: 40000, // Increase timeout for production environment
//       },
//       3 // Number of retry attempts
//     );

//     // If needed, parse and limit response size before returning
//     const parsedData = response.data;
//     if (parsedData && typeof parsedData === 'object' && Object.keys(parsedData).length > 1000) {
//       console.warn('Large response detected, consider limiting data fields.');
//       // Example: return only a portion of the response
//       // return parsedData.slice(0, 1000); // Adjust as per response structure
//     }

//     return parsedData;
//   } catch (error) {
//     console.error("Error fetching option chain data:", error.message);
//     throw error;
//   }
// }



import { exec } from "child_process";
import { promisify } from "util";
import { stderr } from "process";

const execute = promisify(exec);
export async function fetchOptionChain(instrument, type="index") {
  const encodedInstrument = encodeURIComponent(instrument); // Ensure the symbol is properly encoded
  const endPoint = `https://www.nseindia.com/api/option-chain-${
    type === "index" ? "indices" : "equities"
  }?symbol=${encodedInstrument}`;

  try {
    const { stdout, stderr } = await execute(
      `curl '${endPoint}' \
      -H 'authority: www.nseindia.com' \
      -H 'dnt: 1' \
      -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9' \
      -H 'accept-encoding: gzip, deflate, br' \
      -H 'accept-language: en-IN,en;q=0.9,en-GB;q=0.8,en-US;q=0.7,hi;q=0.6,mr;q=0.5' \
      -H 'cache-control: no-cache' \
      -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36' \
      --compressed --cookie cookie.txt --cookie-jar cookie.txt`
    );

    const isValidData = isJson(stdout);
    if (isValidData) {
      return isValidData;
    } else {
      console.warn("Received data is not valid JSON.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching option chain data:", error.message);
    console.error("stderr:", stderr); // Log stderr for further debugging
    throw error;
  }
}

// Helper function to check if a string is valid JSON
function isJson(str) {
  try {
    return JSON.parse(str);
  } catch {
    return false;
  }
}
