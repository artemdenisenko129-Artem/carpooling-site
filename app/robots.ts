import { MetadataRoute } from "next"
import { SITE } from "../lib/seo-config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE.domain}/sitemap.xml`,
  }
}
