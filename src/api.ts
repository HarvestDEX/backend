import express from "express"
import cors from "cors"
import { getCommodityPrices } from "./services/commoditiesApi"

export const app = express()
app.use(cors())
app.use(express.json())

// GET /v1/prices — current commodity prices
app.get("/v1/prices", async (req, res) => {
  try {
    const prices = await getCommodityPrices()
    res.json(prices)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /v1/prices/:symbol — single commodity price
app.get("/v1/prices/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase()
    const prices = await getCommodityPrices()
    const price  = prices[symbol as keyof typeof prices]
    if (!price) return res.status(404).json({ error: "Unknown symbol" })
    res.json({ symbol, price, updatedAt: prices.updatedAt })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /health
app.get("/health", (_, res) => res.json({
  status:  "ok",
  service: "harvest-backend",
  chain:   "HashKey Chain Testnet (133)",
  symbols: ["RICE", "COFFEE", "CORN", "CPO"]
}))
