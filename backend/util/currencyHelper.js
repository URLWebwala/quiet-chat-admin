const Currency = require("../models/currency.model");

/**
 * Standard country code / country name to currency fallback table.
 * If currency is not found in MongoDB Currency collection, this provides
 * accurate local symbol, currency code and conversion rate (base: INR = 1).
 */
const STANDARD_COUNTRY_CURRENCIES = {
  in: { currencyCode: "INR", symbol: "₹", name: "Indian Rupee", exchangeRate: 1 },
  india: { currencyCode: "INR", symbol: "₹", name: "Indian Rupee", exchangeRate: 1 },
  us: { currencyCode: "USD", symbol: "$", name: "US Dollar", exchangeRate: 0.012 },
  usa: { currencyCode: "USD", symbol: "$", name: "US Dollar", exchangeRate: 0.012 },
  "united states": { currencyCode: "USD", symbol: "$", name: "US Dollar", exchangeRate: 0.012 },
  ae: { currencyCode: "AED", symbol: "AED ", name: "UAE Dirham", exchangeRate: 0.044 },
  uae: { currencyCode: "AED", symbol: "AED ", name: "UAE Dirham", exchangeRate: 0.044 },
  "united arab emirates": { currencyCode: "AED", symbol: "AED ", name: "UAE Dirham", exchangeRate: 0.044 },
  gb: { currencyCode: "GBP", symbol: "£", name: "British Pound", exchangeRate: 0.0095 },
  uk: { currencyCode: "GBP", symbol: "£", name: "British Pound", exchangeRate: 0.0095 },
  "united kingdom": { currencyCode: "GBP", symbol: "£", name: "British Pound", exchangeRate: 0.0095 },
  eu: { currencyCode: "EUR", symbol: "€", name: "Euro", exchangeRate: 0.011 },
  ca: { currencyCode: "CAD", symbol: "CA$", name: "Canadian Dollar", exchangeRate: 0.016 },
  canada: { currencyCode: "CAD", symbol: "CA$", name: "Canadian Dollar", exchangeRate: 0.016 },
  au: { currencyCode: "AUD", symbol: "A$", name: "Australian Dollar", exchangeRate: 0.018 },
  australia: { currencyCode: "AUD", symbol: "A$", name: "Australian Dollar", exchangeRate: 0.018 },
  sa: { currencyCode: "SAR", symbol: "SAR ", name: "Saudi Riyal", exchangeRate: 0.045 },
  "saudi arabia": { currencyCode: "SAR", symbol: "SAR ", name: "Saudi Riyal", exchangeRate: 0.045 },
  pk: { currencyCode: "PKR", symbol: "₨", name: "Pakistani Rupee", exchangeRate: 3.3 },
  pakistan: { currencyCode: "PKR", symbol: "₨", name: "Pakistani Rupee", exchangeRate: 3.3 },
  bd: { currencyCode: "BDT", symbol: "৳", name: "Bangladeshi Taka", exchangeRate: 1.4 },
  bangladesh: { currencyCode: "BDT", symbol: "৳", name: "Bangladeshi Taka", exchangeRate: 1.4 },
  np: { currencyCode: "NPR", symbol: "रू", name: "Nepalese Rupee", exchangeRate: 1.6 },
  nepal: { currencyCode: "NPR", symbol: "रू", name: "Nepalese Rupee", exchangeRate: 1.6 },
  sg: { currencyCode: "SGD", symbol: "S$", name: "Singapore Dollar", exchangeRate: 0.016 },
  singapore: { currencyCode: "SGD", symbol: "S$", name: "Singapore Dollar", exchangeRate: 0.016 },
  my: { currencyCode: "MYR", symbol: "RM", name: "Malaysian Ringgit", exchangeRate: 0.053 },
  malaysia: { currencyCode: "MYR", symbol: "RM", name: "Malaysian Ringgit", exchangeRate: 0.053 },
};

async function resolveCurrencyForCountry(countryInput) {
  const raw = String(countryInput || "").trim().toLowerCase();

  // 1. Check MongoDB Currency collection first
  if (raw) {
    try {
      const dbCurrency = await Currency.findOne({
        $or: [
          { countryCode: { $regex: new RegExp(`^${raw}$`, "i") } },
          { name: { $regex: new RegExp(`^${raw}$`, "i") } },
          { currencyCode: { $regex: new RegExp(`^${raw}$`, "i") } },
        ],
      }).lean();

      if (dbCurrency) {
        return {
          currencyCode: dbCurrency.currencyCode || dbCurrency.name || "USD",
          symbol: dbCurrency.symbol || "$",
          name: dbCurrency.name || "",
          countryCode: dbCurrency.countryCode || raw,
          exchangeRate:
            dbCurrency.exchangeRate !== undefined && Number(dbCurrency.exchangeRate) > 0
              ? Number(dbCurrency.exchangeRate)
              : 1,
        };
      }
    } catch (e) {
      console.warn("Error fetching currency from DB:", e?.message);
    }
  }

  // 2. Standard country table fallback
  if (raw && STANDARD_COUNTRY_CURRENCIES[raw]) {
    const std = STANDARD_COUNTRY_CURRENCIES[raw];
    return {
      currencyCode: std.currencyCode,
      symbol: std.symbol,
      name: std.name,
      countryCode: raw,
      exchangeRate: std.exchangeRate,
    };
  }

  // 3. Fallback to default currency from settings
  const def = global.settingJSON?.currency;
  if (def && def.symbol) {
    return {
      currencyCode: def.currencyCode || def.name || "INR",
      symbol: def.symbol || "₹",
      name: def.name || "Indian Rupee",
      countryCode: def.countryCode || "IN",
      exchangeRate: def.exchangeRate || 1,
    };
  }

  return {
    currencyCode: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    countryCode: "IN",
    exchangeRate: 1,
  };
}

function calculateLocalizedPrice(basePrice, rate) {
  const num = Number(basePrice || 0);
  const r = Number(rate || 1);
  const raw = num * r;
  if (r === 1) return Math.round(raw);
  if (raw < 15) return Number(raw.toFixed(2));
  return Math.round(raw);
}

module.exports = {
  resolveCurrencyForCountry,
  calculateLocalizedPrice,
  STANDARD_COUNTRY_CURRENCIES,
};

