"use client"
import { useEffect, useRef, useState } from "react"

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
  telegramUsername?: string
  authorName?: string
  fromLat?: number
  fromLng?: number
  toLat?: number
  toLng?: number
  isRoundTrip?: boolean
  returnTime?: string
  departureTime?: string
  waypoints?: Waypoint[]
  seats?: number
}

interface Props {
  announcements: Announcement[]
}

export default function LeafletMap({ announcements }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const layersRef = useRef<any[]>([])
  const clusterRef = useRef<any>(null)
  const activeRef = useRef<{ markers: any[]; line: any } | null>(null)
  const userMarkerRef = useRef<any>(null)

  const [sheet, setSheet] = useState<Announcement | null>(null)
  const [locating, setLocating] = useState(false)
  const [debugLog, setDebugLog] = useState<string[]>([])

  useEffect(() => {
    const ts = () => new Date().toISOString().slice(11,23)
    setDebugLog(l => [...l, `[${ts()}] effect fired | container=${!!containerRef.current} map=${!!mapRef.current}`])
    if (typeof window === "undefined" || !containerRef.current) return
    if (mapRef.current) return

    let cancelled = false

    // Leaflet already preloaded by MapPageClient — Promise resolves instantly from cache
    Promise.all([
      import("leaflet"),
      import("leaflet.markercluster"),
    ]).then(([L]) => {
      setDebugLog(l => [...l, `[${ts()}] promise resolved | cancelled=${cancelled} container=${!!containerRef.current} map=${!!mapRef.current}`])
      if (cancelled || !containerRef.current || mapRef.current) return

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const map = L.map(containerRef.current, {
        center: [49.5, 31.5],
        zoom: 6,
        zoomControl: true,
        scrollWheelZoom: false,
        // Scroll zoom disabled — карта всередині сторінки,
        // користуйся кнопками +/- або Ctrl+колесо
      })
      // Scroll без Ctrl → показуємо підказку; Ctrl+scroll → зум
      let hintTimeout: ReturnType<typeof setTimeout> | null = null
      const container = containerRef.current
      const hintEl = document.createElement("div")
      hintEl.style.cssText = [
        "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)",
        "background:rgba(17,24,39,0.75);color:white;border-radius:12px",
        "padding:8px 18px;font-size:13px;pointer-events:none",
        "opacity:0;transition:opacity 0.2s;z-index:900;white-space:nowrap",
      ].join(";")
      hintEl.textContent = "Ctrl + прокрутка — зум карти"
      if (container.parentElement) {
        container.parentElement.style.position = "relative"
        container.parentElement.appendChild(hintEl)
      }

      container.addEventListener("wheel", (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          if (e.deltaY < 0) map.zoomIn(1)
          else map.zoomOut(1)
        } else {
          hintEl.style.opacity = "1"
          if (hintTimeout) clearTimeout(hintTimeout)
          hintTimeout = setTimeout(() => { hintEl.style.opacity = "0" }, 1500)
        }
      }, { passive: false })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map)

      // Клік по карті — знімає вибір
      map.on("click", () => {
        deactivate()
        setSheet(null)
      })

      mapRef.current = map
      setDebugLog(l => [...l, `[${ts()}] MAP INITIALIZED ✓`])
      setTimeout(() => { map.invalidateSize() }, 0)
      renderMarkers(L, map)
    })

    return () => {
      setDebugLog(l => [...l, `[${ts()}] CLEANUP | map=${!!mapRef.current}`])
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        clusterRef.current = null
        activeRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    import("leaflet").then((L) => renderMarkers(L, mapRef.current))
  }, [announcements])

  function deactivate() {
    if (!activeRef.current) return
    activeRef.current.markers.forEach((mk) => {
      const inactive = mk._role === "driver" ? "#93B4E8" : "#FDBA74"
      mk.setIcon(mk._isTo ? dropIcon(mk._L, inactive) : circleIcon(mk._L, inactive, mk._role))
    })
    activeRef.current.line.setStyle({ opacity: 0 })
    activeRef.current = null
  }

  function activate(L: any, markers: any[], line: any, ann: Announcement) {
    deactivate()
    const startColor = ann.role === "driver" ? "#5B8FD9" : "#F97316"
    const endColor   = ann.role === "driver" ? "#E53935" : "#DC2626"
    markers.forEach((mk) => {
      mk.setIcon(mk._isTo ? dropIcon(L, endColor) : circleIcon(L, startColor, ann.role))
    })
    line.setStyle({ opacity: 0.75 })
    activeRef.current = { markers, line }
    setSheet(ann)
  }

  function circleIcon(L: any, color: string, role?: string) {
    const isPassenger = role === "passenger"
    return L.divIcon({
      className: "",
      html: isPassenger
        ? `<div style="width:13px;height:13px;background:${color};border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35);transform:rotate(45deg)"></div>`
        : `<div style="width:13px;height:13px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>`,
      iconSize: [13, 13],
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

  function renderMarkers(L: any, map: any) {
    layersRef.current.forEach((l) => { try { map.removeLayer(l) } catch {} })
    layersRef.current = []
    if (clusterRef.current) { try { map.removeLayer(clusterRef.current) } catch {} }
    deactivate()
    setSheet(null)

    const withCoords = announcements.filter(
      (a) => a.fromLat != null && a.fromLng != null && a.toLat != null && a.toLng != null
    )
    if (withCoords.length === 0) return

    const cluster = (L as any).markerClusterGroup({
      maxClusterRadius: 40,
      showCoverageOnHover: false,
      iconCreateFunction: (c: any) => {
        const count = c.getChildCount()
        return L.divIcon({
          className: "",
          html: `<div style="width:36px;height:36px;border-radius:50%;background:#5B8FD9;color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:3px solid white;box-shadow:0 2px 8px rgba(91,143,217,0.45)">${count}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        })
      },
    })

    const allPoints: [number, number][] = []

    withCoords.forEach((a) => {
      const points: { lat: number; lng: number; isTo?: boolean }[] = [
        { lat: a.fromLat!, lng: a.fromLng! },
        ...(a.waypoints ?? []).map((w) => ({ lat: w.lat, lng: w.lng })),
        { lat: a.toLat!, lng: a.toLng!, isTo: true },
      ]

      const latlngs: [number, number][] = points.map((p) => [p.lat, p.lng])

      const routeLine = L.polyline(latlngs, {
        color: "#5B8FD9",
        weight: 2.5,
        opacity: 0,
        dashArray: "7 6",
      }).addTo(map)

      // Зворотній маршрут (туди-назад) — окрема пунктирна лінія
      if (a.isRoundTrip && a.toLat != null && a.toLng != null) {
        const returnLatlngs: [number, number][] = [
          [a.toLat!, a.toLng!],
          ...[...(a.waypoints ?? [])].reverse().map((w): [number, number] => [w.lat, w.lng]),
          [a.fromLat!, a.fromLng!],
        ]
        const returnLine = L.polyline(returnLatlngs, {
          color: a.role === "driver" ? "#5B8FD9" : "#F97316",
          weight: 2, opacity: 0.35, dashArray: "4 8",
        }).addTo(map)
        layersRef.current.push(returnLine)
      }

      const inactiveColor = a.role === "driver" ? "#93B4E8" : "#FDBA74"
      const markers = points.map((p, idx) => {
        const icon = p.isTo ? dropIcon(L, inactiveColor) : circleIcon(L, inactiveColor, a.role)
        const m = L.marker([p.lat, p.lng], { icon })
        // зберігаємо метадані на маркері
        m._isTo = !!p.isTo
        m._role = a.role
        m._L = L

        m.on("click", (e: any) => {
          e.originalEvent?.stopPropagation()
          activate(L, markers, routeLine, a)
        })

        cluster.addLayer(m)
        return m
      })

      layersRef.current.push(routeLine)
      latlngs.forEach((ll) => allPoints.push(ll))
    })

    cluster.addTo(map)
    clusterRef.current = cluster

    if (allPoints.length > 0) {
      map.fitBounds(allPoints, { padding: [40, 40], maxZoom: 11 })
    }
  }

  function handleLocate() {
    if (!mapRef.current || !navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        import("leaflet").then((L) => {
          const { latitude: lat, longitude: lng } = pos.coords
          mapRef.current.setView([lat, lng], 12, { animate: true })

          // Прибрати старий маркер геолокації
          if (userMarkerRef.current) {
            try { mapRef.current.removeLayer(userMarkerRef.current) } catch {}
          }
          const icon = L.divIcon({
            className: "",
            html: `<div style="width:16px;height:16px;border-radius:50%;background:#10B981;border:3px solid white;box-shadow:0 0 0 4px rgba(16,185,129,0.25)"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })
          const m = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(mapRef.current)
          userMarkerRef.current = m
        })
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }

  const hasAny = announcements.some((a) => a.fromLat != null)

  return (
    <div style={{ position: "relative" }}>
      {/* Кнопка геолокації */}
      <button
        onClick={handleLocate}
        disabled={locating}
        title="Моє місцезнаходження"
        style={{
          position: "absolute", top: 10, right: 10, zIndex: 1000,
          width: 40, height: 40, borderRadius: "50%",
          background: "white", border: "2px solid #E5E7EB",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: locating ? "default" : "pointer",
          fontSize: 18, transition: "all .2s",
        }}
      >
        {locating ? "⏳" : "🎯"}
      </button>

      {!hasAny && (
        <div style={{
          position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
          zIndex: 600, pointerEvents: "none",
          background: "rgba(17,24,39,0.65)", borderRadius: 20,
          padding: "5px 14px", fontSize: 11, color: "white",
          whiteSpace: "nowrap",
        }}>
          🗺 Немає оголошень з координатами — карта для нових
        </div>
      )}

      <div
        ref={containerRef}
        style={{ height: 440, width: "100%", borderRadius: 16, overflow: "hidden" }}
      />

      {/* DEBUG PANEL — видалити після діагностики */}
      <div style={{
        marginTop: 8, background: "#111", color: "#0f0", borderRadius: 8,
        padding: "8px 10px", fontSize: 11, fontFamily: "monospace",
        lineHeight: 1.6, maxHeight: 120, overflowY: "auto"
      }}>
        {debugLog.length === 0 ? "очікую…" : debugLog.map((l, i) => <div key={i}>{l}</div>)}
      </div>

      {/* Bottom sheet */}
      {sheet && (
        <div
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1000,
            background: "white", borderRadius: "16px 16px 0 0",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
            padding: "16px 16px 20px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ручка */}
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E5E7EB", margin: "0 auto 12px" }} />

          {/* Шапка */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 9,
                textTransform: "uppercase", letterSpacing: ".04em",
                background: sheet.role === "driver" ? "#EBF2FC" : "#FDECEA",
                color: sheet.role === "driver" ? "#3A6BBF" : "#E53935",
              }}>
                {sheet.role === "driver" ? "Водій" : "Пасажир"}
              </span>
              {sheet.isRoundTrip && (
                <span style={{ fontSize: 11, color: "#6B7280", background: "#F3F4F6", padding: "2px 7px", borderRadius: 9 }}>↩ туди-назад</span>
              )}
            </div>
            <button
              onClick={() => { deactivate(); setSheet(null) }}
              style={{ background: "none", border: "none", fontSize: 18, color: "#9CA3AF", cursor: "pointer", padding: "0 4px" }}
            >×</button>
          </div>

          {/* Маршрут */}
          <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 6 }}>
            {sheet.from} → {sheet.to}
          </div>

          {/* Час */}
          {(sheet.departureTime || sheet.returnTime) && (
            <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              {sheet.departureTime && (
                <span style={{ fontSize: 12, background: "#F3F4F6", color: "#374151", padding: "3px 9px", borderRadius: 9 }}>
                  🕐 {sheet.departureTime}
                </span>
              )}
              {sheet.returnTime && (
                <span style={{ fontSize: 12, background: "#D1FAE5", color: "#065F46", padding: "3px 9px", borderRadius: 9 }}>
                  ↩ {sheet.returnTime}
                </span>
              )}
              {sheet.seats != null && sheet.seats > 0 && (
                <span style={{ fontSize: 12, background: "#F3F4F6", color: "#374151", padding: "3px 9px", borderRadius: 9 }}>
                  👤 {sheet.seats} {sheet.seats === 1 ? "місце" : sheet.seats < 5 ? "місця" : "місць"}
                </span>
              )}
            </div>
          )}

          {/* Опис */}
          {sheet.aiText && (
            <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.45, margin: "0 0 12px",
              display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
              {sheet.aiText}
            </p>
          )}

          {/* Контакт */}
          {sheet.telegramUsername ? (
            <a
              href={`https://t.me/${sheet.telegramUsername}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: "block", textAlign: "center", padding: "11px 16px",
                background: "#229ED9", color: "white", borderRadius: 12,
                fontWeight: 700, fontSize: 14, textDecoration: "none",
              }}
            >
              Написати @{sheet.telegramUsername}
            </a>
          ) : (
            <div style={{ textAlign: "center", fontSize: 13, color: "#9CA3AF" }}>
              Контакт недоступний — увійдіть, щоб побачити
            </div>
          )}
        </div>
      )}
    </div>
  )
}
