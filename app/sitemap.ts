import { MetadataRoute } from "next"
import { CITIES, SITE } from "../lib/seo-config"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE.domain, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE.domain}/rules`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ]

  const cityPages: MetadataRoute.Sitemap = CITIES.map((city) => ({
    url: `${SITE.domain}/city/${city.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  return [...staticPages, ...cityPages]
}
