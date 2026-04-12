import "dotenv/config"

export interface CommodityPrices {
  RICE:   number   // USD per cwt
  COFFEE: number   // USD per lb
  CORN:   number   // USD per bushel
  CPO:    number   // USD per metric ton
  updatedAt: string
}

// Realistic base prices (real-world market rates as of April 2026)
const BASE_PRICES = {
  RICE:   17.55,    // per cwt (CBOT)
  COFFEE: 427.80,   // per lb (ICE)
  CORN:   7.31,     // per bushel (CBOT)
  CPO:    1180.64,  // per metric ton (Bursa Malaysia)
}

// Variance range: +-3%
const VARIANCE = 0.03

// In-memory cache
let cache: { data: CommodityPrices; timestamp: number } | null = null
const CACHE_TTL = parseInt(process.env.PRICE_CACHE_TTL || "600000")

// Add small random variance to simulate live price movement
function applyVariance(basePrice: number): number {
  const change = 1 + (Math.random() * 2 - 1) * VARIANCE
  return parseFloat((basePrice * change).toFixed(4))
}

export async function getCommodityPrices(): Promise<CommodityPrices> {
  // Return cache if still fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data
  }

  const prices: CommodityPrices = {
    RICE:      applyVariance(BASE_PRICES.RICE),
    COFFEE:    applyVariance(BASE_PRICES.COFFEE),
    CORN:      applyVariance(BASE_PRICES.CORN),
    CPO:       applyVariance(BASE_PRICES.CPO),
    updatedAt: new Date().toISOString()
  }

  cache = { data: prices, timestamp: Date.now() }
  console.log("\u{1F4B9} Prices generated:", JSON.stringify(prices))
  return prices
}

/// Convert USD price to on-chain format (8 decimals)
/// Example: $17.55 → 1755000000
export function toOnChainPrice(usdPrice: number): bigint {
  return BigInt(Math.round(usdPrice * 1e8))
}
