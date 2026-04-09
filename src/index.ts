import "dotenv/config"
import { startPriceCron } from "./cron/priceUpdater"
import { app } from "./api"

const PORT = process.env.PORT || 3000

startPriceCron()

app.listen(PORT, () => {
  console.log("🌾 HarvestDEX Backend")
  console.log(`📡 API: http://localhost:${PORT}`)
  console.log("🔗 Chain: HashKey Chain Testnet (ID: 133)")
  console.log("💹 Price source: commodities-api.com")
})
