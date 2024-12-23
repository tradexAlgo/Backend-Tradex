import getStockPriceByOther from "./getStockPriceByOther.js";

const checkPriceStockName = async (symbol,optionType,identifier) => {
  const data = await getStockPriceByOther(symbol,optionType,identifier);
  console.log("Response in checkPriceStockName",data)
  return data;
};

export default checkPriceStockName;
