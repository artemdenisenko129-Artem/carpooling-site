import { MetadataRoute } from "next"
import { CITIES, ROUTES, SITE } from "../lib/seo-config"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE.domain, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE.domain}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE.domain}/rules`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ]

  const cityPages: MetadataRoute.Sitemap = CITIES.map((city) => ({
    url: `${SITE.domain}/city/${city.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  const routePages: MetadataRoute.Sitemap = ROUTES.map((route) => ({
    url: `${SITE.domain}/route/${route.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }))

  return [...staticPages, ...routePages, ...cityPages]
}
