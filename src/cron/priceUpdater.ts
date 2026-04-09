import { ethers } from "ethers"
import { getCommodityPrices, toOnChainPrice } from "../services/commoditiesApi"
import PriceOracleABI from "../abi/PriceOracle.json"

if (!process.env.RPC_URL || !process.env.PRIVATE_KEY || !process.env.PRICE_ORACLE_ADDRESS) {
  throw new Error("Missing required env vars: RPC_URL, PRIVATE_KEY, PRICE_ORACLE_ADDRESS")
}

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
const signer   = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
const oracle   = new ethers.Contract(process.env.PRICE_ORACLE_ADDRESS, PriceOracleABI, signer)

const SYMBOLS = ["RICE", "COFFEE", "CORN", "CPO"]

export async function runPriceUpdate(): Promise<void> {
  console.log(`\n🕐 [${new Date().toISOString()}] Running price update...`)

  try {
    const prices = await getCommodityPrices()

    const symbols: string[] = []
    const values:  bigint[] = []

    for (const symbol of SYMBOLS) {
      const price = prices[symbol as keyof typeof prices]
      if (typeof price === "number") {
        symbols.push(symbol)
        values.push(toOnChainPrice(price))
        console.log(`  ${symbol}: $${price} → ${toOnChainPrice(price).toString()}`)
      }
    }

    // Batch update in ONE transaction
    const tx = await oracle.updatePrices(symbols, values)
    console.log(`📤 Tx submitted: ${tx.hash}`)
    await tx.wait()
    console.log(`✅ Prices updated on-chain | tx=${tx.hash}`)

  } catch (err) {
    console.error("❌ Price update failed:", err)
    // Do not throw — cron should continue running
  }
}

export function startPriceCron(): void {
  const interval = parseInt(process.env.CRON_INTERVAL || "600000")

  console.log(`🌾 HarvestDEX Price Cron started — updating every ${interval / 60000} min`)

  // Run immediately on startup
  runPriceUpdate()

  // Then every CRON_INTERVAL
  setInterval(runPriceUpdate, interval)
}
