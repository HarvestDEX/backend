import "dotenv/config"

const API_KEY  = process.env.COMMODITIES_API_KEY!
const BASE_URL = "https://commodities-api.com/api"
const SYMBOLS  = "RICE,COFFEE,CORN,CPO"

export interface CommodityPrices {
  RICE:   number   // USD per cwt
  COFFEE: number   // USD per lb
  CORN:   number   // USD per bushel
  CPO:    number   // USD per metric ton
  updatedAt: string
}

// In-memory cache
let cache: { data: CommodityPrices; timestamp: number } | null = null
const CACHE_TTL = parseInt(process.env.PRICE_CACHE_TTL || "600000")

export async function getCommodityPrices(): Promise<CommodityPrices> {
  // Return cache if still fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data
  }

  const url = `${BASE_URL}/latest?access_key=${API_KEY}&symbols=${SYMBOLS}&base=USD`
  const res  = await fetch(url)

  if (!res.ok) {
    throw new Error(`Commodities API error: ${res.status} ${res.statusText}`)
  }

  const json: any = await res.json()

  if (!json.success) {
    throw new Error(`Commodities API returned error: ${JSON.stringify(json)}`)
  }

  const rates = json.rates

  // Convert: price = 1 / rate
  const prices: CommodityPrices = {
    RICE:      parseFloat((1 / rates.RICE).toFixed(4)),
    COFFEE:    parseFloat((1 / rates.COFFEE).toFixed(4)),
    CORN:      parseFloat((1 / rates.CORN).toFixed(4)),
    CPO:       parseFloat((1 / rates.CPO).toFixed(4)),
    updatedAt: new Date().toISOString()
  }

  cache = { data: prices, timestamp: Date.now() }
  console.log("💹 Prices fetched:", JSON.stringify(prices))
  return prices
}

/// Convert USD price to on-chain format (8 decimals)
/// Example: $17.55 → 1755000000
export function toOnChainPrice(usdPrice: number): bigint {
  return BigInt(Math.round(usdPrice * 1e8))
}
