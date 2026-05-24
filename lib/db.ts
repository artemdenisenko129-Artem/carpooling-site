import { setServers } from "dns"
setServers(["8.8.8.8", "8.8.4.4"])

import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI || ""
const options = {}

let clientPromise: Promise<MongoClient>

try {
  const client = new MongoClient(uri, options)
  if (process.env.NODE_ENV === "development") {
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }
    if (!globalWithMongo._mongoClientPromise) {
      globalWithMongo._mongoClientPromise = client.connect()
    }
    clientPromise = globalWithMongo._mongoClientPromise
  } else {
    clientPromise = client.connect()
  }
} catch (e) {
  clientPromise = Promise.reject(e)
}

export default clientPromise
