import { MetadataRoute } from "next"
import { CITIES, SITE } from "../lib/seo-config"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const home: MetadataRoute.Sitemap = [
    {
      url: SITE.domain,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
  ]

  const cityPages: MetadataRoute.Sitemap = CITIES.map((city) => ({
    url: `${SITE.domain}/city/${city.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  return [...home, ...cityPages]
}
