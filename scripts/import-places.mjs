/**
 * Одноразовий скрипт імпорту населених пунктів у MongoDB
 * Запуск: node scripts/import-places.mjs
 */
import { MongoClient } from "mongodb"
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { config } from "dotenv"

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, "../.env.local") })

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error("MONGODB_URI не знайдено в .env.local")
  process.exit(1)
}

const places = JSON.parse(readFileSync(resolve(__dirname, "places.json"), "utf-8"))
console.log(`Завантажено ${places.length} населених пунктів`)

const client = new MongoClient(MONGODB_URI)
try {
  await client.connect()
  const col = client.db("carpooling").collection("places")

  const existing = await col.countDocuments()
  if (existing > 0) {
    console.log(`Видаляємо ${existing} старих записів...`)
    await col.deleteMany({})
  }

  const BATCH = 1000
  let inserted = 0
  for (let i = 0; i < places.length; i += BATCH) {
    await col.insertMany(places.slice(i, i + BATCH))
    inserted += BATCH
    process.stdout.write(`\rВставлено: ${Math.min(inserted, places.length)}/${places.length}`)
  }
  console.log("\n")

  await col.createIndex({ nameLower: 1 })
  await col.createIndex({ pop: -1 })
  console.log("Готово! Індекси створено.")
} finally {
  await client.close()
}
