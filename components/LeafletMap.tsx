"use client"
import { useEffect, useRef } from "react"

interface Announcement {
  _id: string
  role: "driver" | "passenger"
  from: string
  to: string
  telegramUsername: string
  fromLat?: number
  fromLng?: number
  toLat?: number
  toLng?: number
  isRoundTrip?: boolean
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
    if (mapRef.current) return // already initialized

    // Dynamic import to avoid SSR issues
    Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css" as any),
    ]).then(([L]) => {
      if (!containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current, {
        center: [49.5, 31.5], // центр України
        zoom: 6,
        zoomControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
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
    import("leaflet").then((L) => {
      renderMarkers(L, mapRef.current)
    })
  }, [announcements])

  function renderMarkers(L: any, map: any) {
    // Clear old layers
    layersRef.current.forEach((l) => map.removeLayer(l))
    layersRef.current = []

    const withCoords = announcements.filter(
      (a) => a.fromLat != null && a.fromLng != null && a.toLat != null && a.toLng != null
    )

    withCoords.forEach((a) => {
      const isDriver = a.role === "driver"
      const fromColor = "#9CA3AF" // grey inactive
      const toColor = "#9CA3AF"
      const activeFromColor = "#5B8FD9" // blue
      const activeToColor = "#E53935"   // red

      // SVG circle marker for "from"
      const fromIcon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${fromColor};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })

      // SVG drop marker for "to"
      const toIcon = L.divIcon({
        className: "",
        html: `<div style="position:relative;width:16px;height:20px">
          <div style="position:absolute;top:0;left:0;right:0;bottom:6px;background:${toColor};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>
        </div>`,
        iconSize: [16, 20],
        iconAnchor: [8, 20],
      })

      const fromMarker = L.marker([a.fromLat, a.fromLng], { icon: fromIcon })
      const toMarker   = L.marker([a.toLat,   a.toLng],   { icon: toIcon })

      // Dashed route line (hidden by default)
      const routeLine = L.polyline(
        [[a.fromLat, a.fromLng], [a.toLat, a.toLng]],
        { color: "#5B8FD9", weight: 2, opacity: 0, dashArray: "6 6" }
      )

      // Popup content
      const popupHtml = `
        <div style="font-family:Inter,sans-serif;min-width:160px">
          <div style="font-size:11px;font-weight:700;color:${isDriver ? "#3A6BBF" : "#E53935"};text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">
            ${isDriver ? "Водій" : "Пасажир"}${a.isRoundTrip ? " &bull; ↩" : ""}
          </div>
          <div style="font-size:13px;font-weight:700;color:#111827">${a.from} &rarr; ${a.to}</div>
          <div style="font-size:11px;color:#6B7280;margin-top:2px">@${a.telegramUsername}</div>
        </div>
      `

      function activate() {
        const activeFrom = L.divIcon({
          className: "",
          html: `<div style="width:14px;height:14px;border-radius:50%;background:${activeFromColor};border:2px solid white;box-shadow:0 1px 6px rgba(91,143,217,0.5)"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        })
        const activeTo = L.divIcon({
          className: "",
          html: `<div style="position:relative;width:16px;height:20px">
            <div style="position:absolute;top:0;left:0;right:0;bottom:6px;background:${activeToColor};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 6px rgba(229,57,53,0.5)"></div>
          </div>`,
          iconSize: [16, 20],
          iconAnchor: [8, 20],
        })
        fromMarker.setIcon(activeFrom)
        toMarker.setIcon(activeTo)
        routeLine.setStyle({ opacity: 0.7 })
      }

      function deactivate() {
        fromMarker.setIcon(fromIcon)
        toMarker.setIcon(toIcon)
        routeLine.setStyle({ opacity: 0 })
      }

      fromMarker.bindPopup(popupHtml)
      toMarker.bindPopup(popupHtml)
      fromMarker.on("mouseover popupopen", activate)
      toMarker.on("mouseover popupopen", activate)
      fromMarker.on("mouseout popupclose", deactivate)
      toMarker.on("mouseout popupclose", deactivate)

      fromMarker.addTo(map)
      toMarker.addTo(map)
      routeLine.addTo(map)

      layersRef.current.push(fromMarker, toMarker, routeLine)
    })

    // Auto-fit bounds if there are markers
    if (withCoords.length > 0) {
      const bounds = withCoords.flatMap((a) => [
        [a.fromLat!, a.fromLng!] as [number, number],
        [a.toLat!,   a.toLng!]   as [number, number],
      ])
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 })
    }
  }

  return (
    <div
      ref={containerRef}
      style={{ height: 400, width: "100%", borderRadius: 16, overflow: "hidden" }}
    />
  )
}
