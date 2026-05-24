"use client"
import { useEffect, useRef } from "react"

interface Waypoint {
  name: string
  lat: number
  lng: number
}

interface Announcement {
  _id: string
  role: "driver" | "passenger"
  from: string
  to: string
  aiText: string
  telegramUsername: string
  fromLat?: number
  fromLng?: number
  toLat?: number
  toLng?: number
  isRoundTrip?: boolean
  waypoints?: Waypoint[]
}

interface Props {
  announcements: Announcement[]
}

export default function LeafletMap({ announcements }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const layersRef = useRef<any[]>([])

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return
    if (mapRef.current) return

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return

      // Fix default icon paths broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      // Inject leaflet CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      const map = L.map(containerRef.current, {
        center: [49.5, 31.5],
        zoom: 6,
        zoomControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)

      mapRef.current = map
      renderMarkers(L, map)
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    import("leaflet").then((L) => renderMarkers(L, mapRef.current))
  }, [announcements])

  function circleIcon(L: any, color: string) {
    return L.divIcon({
      className: "",
      html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    })
  }

  function dropIcon(L: any, color: string) {
    return L.divIcon({
      className: "",
      html: `<div style="position:relative;width:18px;height:24px">
        <div style="position:absolute;top:0;left:1px;width:16px;height:16px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2.5px solid white;box-shadow:0 1px 5px rgba(0,0,0,0.35)"></div>
      </div>`,
      iconSize: [18, 24],
      iconAnchor: [9, 24],
    })
  }

  function buildPopup(a: Announcement): string {
    const isDriver = a.role === "driver"
    const roleColor = isDriver ? "#3A6BBF" : "#E53935"
    const roleBg = isDriver ? "#EBF2FC" : "#FDECEA"
    const roleLabel = isDriver ? "Водій" : "Пасажир"
    const roundTrip = a.isRoundTrip
      ? `<span style="font-size:11px;color:#6B7280;background:#F3F4F6;padding:1px 6px;border-radius:9px;margin-left:4px">&#8629; туди-назад</span>`
      : ""
    const preview = a.aiText && a.aiText.length > 0
      ? `<div style="font-size:12px;color:#6B7280;margin-top:6px;line-height:1.4;max-width:240px">${a.aiText.slice(0, 110)}${a.aiText.length > 110 ? "…" : ""}</div>`
      : ""
    const tgLink = `<a href="https://t.me/${a.telegramUsername}" target="_blank" rel="noopener noreferrer"
        style="display:block;margin-top:8px;padding:7px 12px;background:#229ED9;color:white;border-radius:8px;
               text-align:center;font-size:12px;font-weight:700;text-decoration:none">
        &#9992; Написати в Telegram
      </a>`
    return `<div style="font-family:Inter,-apple-system,sans-serif;min-width:200px;max-width:260px;padding:2px 0">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="font-size:10px;font-weight:700;color:${roleColor};background:${roleBg};
                     padding:2px 8px;border-radius:9px;text-transform:uppercase;letter-spacing:.04em">
          ${roleLabel}
        </span>${roundTrip}
      </div>
      <div style="font-size:14px;font-weight:800;color:#111827;line-height:1.3">
        ${a.from} &rarr; ${a.to}
      </div>
      <div style="font-size:11px;color:#9CA3AF;margin-top:2px">@${a.telegramUsername}</div>
      ${preview}
      ${tgLink}
    </div>`
  }

  function renderMarkers(L: any, map: any) {
    layersRef.current.forEach((l) => map.removeLayer(l))
    layersRef.current = []

    const GREY   = "#9CA3AF"
    const BLUE   = "#5B8FD9"
    const RED    = "#E53935"

    const withCoords = announcements.filter(
      (a) => a.fromLat != null && a.fromLng != null && a.toLat != null && a.toLng != null
    )

    const allPoints: [number, number][] = []

    withCoords.forEach((a) => {
      // Build ordered list of all points: from → waypoints → to
      const points: { lat: number; lng: number; isTo?: boolean; isWaypoint?: boolean }[] = [
        { lat: a.fromLat!, lng: a.fromLng! },
        ...(a.waypoints ?? []).map((w) => ({ lat: w.lat, lng: w.lng, isWaypoint: true })),
        { lat: a.toLat!, lng: a.toLng!, isTo: true },
      ]

      const latlngs: [number, number][] = points.map((p) => [p.lat, p.lng])

      // Dashed route polyline (hidden by default)
      const routeLine = L.polyline(latlngs, {
        color: BLUE,
        weight: 2,
        opacity: 0,
        dashArray: "6 6",
      })

      // Create markers
      const markers = points.map((p) => {
        const inactiveIcon = p.isTo ? dropIcon(L, GREY) : circleIcon(L, GREY)
        const activeIcon   = p.isTo ? dropIcon(L, RED)  : circleIcon(L, BLUE)
        const m = L.marker([p.lat, p.lng], { icon: inactiveIcon })

        m.on("mouseover popupopen", () => {
          markers.forEach((mk, i) => mk.setIcon(points[i].isTo ? dropIcon(L, RED) : circleIcon(L, BLUE)))
          routeLine.setStyle({ opacity: 0.7 })
        })
        m.on("mouseout popupclose", () => {
          markers.forEach((mk, i) => mk.setIcon(points[i].isTo ? dropIcon(L, GREY) : circleIcon(L, GREY)))
          routeLine.setStyle({ opacity: 0 })
        })

        m.bindPopup(buildPopup(a), { maxWidth: 280, className: "pop-ua" })
        m.addTo(map)
        return m
      })

      routeLine.addTo(map)
      layersRef.current.push(...markers, routeLine)
      latlngs.forEach((ll) => allPoints.push(ll))
    })

    if (allPoints.length > 0) {
      map.fitBounds(allPoints, { padding: [40, 40], maxZoom: 11 })
    }
  }

  const hasAny = announcements.some((a) => a.fromLat != null)

  return (
    <div style={{ position: "relative" }}>
      {!hasAny && (
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 500,
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 8, pointerEvents: "none",
            background: "rgba(235,242,252,0.85)", borderRadius: 16,
          }}
        >
          <div style={{ fontSize: 32 }}>&#128506;</div>
          <p style={{ fontSize: 13, color: "#6B7280", fontWeight: 600, margin: 0 }}>
            Поки що немає оголошень з координатами
          </p>
          <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0, textAlign: "center", maxWidth: 220 }}>
            Нові оголошення з&apos;являться після публікації через оновлену форму
          </p>
        </div>
      )}
      <div
        ref={containerRef}
        style={{ height: 420, width: "100%", borderRadius: 16, overflow: "hidden" }}
      />
    </div>
  )
}
