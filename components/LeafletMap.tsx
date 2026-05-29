"use client"
import { useEffect, useRef, useState } from "react"

declare const window: Window & { L: any }

interface Waypoint { name: string; lat: number; lng: number }

interface Announcement {
  _id: string
  role: "driver" | "passenger"
  from: string
  to: string
  aiText: string
  telegramUsername?: string
  authorName?: string
  authorId?: string
  fromLat?: number; fromLng?: number
  toLat?: number; toLng?: number
  isRoundTrip?: boolean
  returnTime?: string
  departureTime?: string
  waypoints?: Waypoint[]
  seats?: number
}

interface Props {
  announcements: Announcement[]
  currentUserId?: string
}

// ─── Icon builders ───────────────────────────────────────────────────────────

function markerHtml(role: "driver" | "passenger", active: boolean, isOwn: boolean) {
  const isDriver = role === "driver"
  const bg = active ? (isDriver ? "#1D9E75" : "#378ADD") : "#B4B2A9"
  const radius = isDriver ? "5px" : "50%"
  const label = isOwn ? "Я" : (isDriver ? "В" : "П")
  const size = 22
  const inner = `<div style="width:${size}px;height:${size}px;background:${bg};border-radius:${radius};border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;font-family:sans-serif">${label}</div>`
  if (isOwn) {
    return `<div style="width:${size + 6}px;height:${size + 6}px;border-radius:${isDriver ? "7px" : "50%"};border:3px solid #EF9F27;display:flex;align-items:center;justify-content:center">${inner}</div>`
  }
  return inner
}

function endHtml(active: boolean, role: "driver" | "passenger") {
  const color = active ? (role === "driver" ? "#E24B4A" : "#1565C0") : "#B4B2A9"
  return `<div style="position:relative;width:18px;height:24px"><div style="position:absolute;top:0;left:1px;width:16px;height:16px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.25)"></div></div>`
}

export default function LeafletMap({ announcements, currentUserId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const layersRef = useRef<any[]>([])
  const clusterRef = useRef<any>(null)
  const activeRef = useRef<{ markers: any[]; line: any } | null>(null)
  const userMarkerRef = useRef<any>(null)

  const [sheet, setSheet] = useState<Announcement | null>(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const L = window.L
    if (!L) return

    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    })

    const map = L.map(containerRef.current, { center: [49.5, 31.5], zoom: 6, zoomControl: true, scrollWheelZoom: false })

    let hintTimeout: any = null
    const container = containerRef.current
    const hintEl = document.createElement("div")
    hintEl.style.cssText = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(17,24,39,0.75);color:white;border-radius:12px;padding:8px 18px;font-size:13px;pointer-events:none;opacity:0;transition:opacity 0.2s;z-index:900;white-space:nowrap"
    hintEl.textContent = "Ctrl + прокрутка — зум карти"
    if (container.parentElement) {
      container.parentElement.style.position = "relative"
      container.parentElement.appendChild(hintEl)
    }
    container.addEventListener("wheel", (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); e.deltaY < 0 ? map.zoomIn(1) : map.zoomOut(1) }
      else { hintEl.style.opacity = "1"; if (hintTimeout) clearTimeout(hintTimeout); hintTimeout = setTimeout(() => { hintEl.style.opacity = "0" }, 1500) }
    }, { passive: false })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors", maxZoom: 18 }).addTo(map)
    map.on("click", () => { deactivate(); setSheet(null) })

    mapRef.current = map
    setTimeout(() => map.invalidateSize(), 0)
    renderMarkers(L, map)

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; clusterRef.current = null; activeRef.current = null }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !window.L) return
    renderMarkers(window.L, mapRef.current)
  }, [announcements])

  function deactivate() {
    if (!activeRef.current) return
    const L = window.L
    activeRef.current.markers.forEach(mk => {
      const isOwn = mk._isOwn
      if (mk._isEnd) {
        mk.setIcon(L.divIcon({ className: "", html: endHtml(false, mk._role), iconSize: [18, 24], iconAnchor: [9, 24] }))
      } else {
        const s = mk._isOwn ? 28 : 22
        mk.setIcon(L.divIcon({ className: "", html: markerHtml(mk._role, false, isOwn), iconSize: [s, s], iconAnchor: [s/2, s/2] }))
      }
    })
    activeRef.current.line.setStyle({ opacity: 0 })
    activeRef.current = null
  }

  function activate(L: any, markers: any[], line: any, ann: Announcement) {
    deactivate()
    markers.forEach(mk => {
      const isOwn = mk._isOwn
      if (mk._isEnd) {
        mk.setIcon(L.divIcon({ className: "", html: endHtml(true, ann.role), iconSize: [18, 24], iconAnchor: [9, 24] }))
      } else {
        const s = isOwn ? 28 : 22
        mk.setIcon(L.divIcon({ className: "", html: markerHtml(ann.role, true, isOwn), iconSize: [s, s], iconAnchor: [s/2, s/2] }))
      }
    })
    line.setStyle({ opacity: 0.7 })
    activeRef.current = { markers, line }
    setSheet(ann)
  }

  function renderMarkers(L: any, map: any) {
    layersRef.current.forEach(l => { try { map.removeLayer(l) } catch {} })
    layersRef.current = []
    if (clusterRef.current) { try { map.removeLayer(clusterRef.current) } catch {} }
    deactivate(); setSheet(null)

    const withCoords = announcements.filter(a => a.fromLat != null && a.fromLng != null && a.toLat != null && a.toLng != null)
    if (!withCoords.length) return

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (c: any) => {
        const count = c.getChildCount()
        return L.divIcon({
          className: "",
          html: `<div style="width:34px;height:34px;border-radius:50%;background:#5F5E5A;color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${count}</div>`,
          iconSize: [34, 34], iconAnchor: [17, 17],
        })
      },
    })

    const allPoints: [number, number][] = []

    withCoords.forEach(a => {
      const isOwn = !!(currentUserId && a.authorId && a.authorId === currentUserId)
      const pts = [
        { lat: a.fromLat!, lng: a.fromLng!, isEnd: false },
        ...(a.waypoints ?? []).map(w => ({ lat: w.lat, lng: w.lng, isEnd: false })),
        { lat: a.toLat!, lng: a.toLng!, isEnd: true },
      ]
      const latlngs: [number, number][] = pts.map(p => [p.lat, p.lng])
      const lineColor = a.role === "driver" ? "#1D9E75" : "#378ADD"
      const routeLine = L.polyline(latlngs, { color: lineColor, weight: 2.5, opacity: 0, dashArray: "6 5" }).addTo(map)

      if (a.isRoundTrip) {
        const ret: [number, number][] = [[a.toLat!, a.toLng!], ...[...(a.waypoints ?? [])].reverse().map((w): [number, number] => [w.lat, w.lng]), [a.fromLat!, a.fromLng!]]
        const retLine = L.polyline(ret, { color: lineColor, weight: 2, opacity: 0.3, dashArray: "3 7" }).addTo(map)
        layersRef.current.push(retLine)
      }

      const markers = pts.map(p => {
        let html: string, size: number, anchor: number
        if (p.isEnd) {
          html = endHtml(false, a.role); size = 0; anchor = 0
          const m = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: "", html, iconSize: [18, 24], iconAnchor: [9, 24] }) })
          m._isEnd = true; m._role = a.role; m._isOwn = isOwn
          m.on("click", (e: any) => { e.originalEvent?.stopPropagation(); activate(L, markers, routeLine, a) })
          cluster.addLayer(m); return m
        } else {
          size = isOwn ? 28 : 22
          html = markerHtml(a.role, false, isOwn)
          const m = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: "", html, iconSize: [size, size], iconAnchor: [size/2, size/2] }) })
          m._isEnd = false; m._role = a.role; m._isOwn = isOwn
          m.on("click", (e: any) => { e.originalEvent?.stopPropagation(); activate(L, markers, routeLine, a) })
          cluster.addLayer(m); return m
        }
      })

      layersRef.current.push(routeLine)
      latlngs.forEach(ll => allPoints.push(ll))
    })

    cluster.addTo(map)
    clusterRef.current = cluster
    if (allPoints.length) map.fitBounds(allPoints, { padding: [40, 40], maxZoom: 11 })
  }

  function handleLocate() {
    if (!mapRef.current || !navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(pos => {
      setLocating(false)
      const L = window.L
      const { latitude: lat, longitude: lng } = pos.coords
      mapRef.current.setView([lat, lng], 13, { animate: true })
      if (userMarkerRef.current) { try { mapRef.current.removeLayer(userMarkerRef.current) } catch {} }
      const icon = L.divIcon({ className: "", html: `<div style="width:16px;height:16px;border-radius:50%;background:#10B981;border:3px solid white;box-shadow:0 0 0 4px rgba(16,185,129,0.3)"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] })
      userMarkerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(mapRef.current)
    }, () => setLocating(false), { timeout: 8000 })
  }

  const hasAny = announcements.some(a => a.fromLat != null)

  return (
    <div style={{ position: "relative" }}>
      <button onClick={handleLocate} disabled={locating} title="Моє місцезнаходження"
        style={{ position: "absolute", top: 10, right: 10, zIndex: 1000, width: 40, height: 40, borderRadius: "50%", background: "white", border: "2px solid #E5E7EB", boxShadow: "0 2px 6px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: locating ? "default" : "pointer", fontSize: 18 }}>
        {locating ? "⏳" : "🎯"}
      </button>

      {!hasAny && (
        <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 600, pointerEvents: "none", background: "rgba(17,24,39,0.65)", borderRadius: 20, padding: "5px 14px", fontSize: 11, color: "white", whiteSpace: "nowrap" }}>
          Немає оголошень з координатами
        </div>
      )}

      <div ref={containerRef} style={{ height: 440, width: "100%", borderRadius: 16, overflow: "hidden" }} />

      {/* Legend */}
      <div style={{ marginTop: 8, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", fontSize: 11, color: "#6B7280" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ display: "inline-block", width: 14, height: 14, background: "#1D9E75", borderRadius: 3 }}></span> Водій
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ display: "inline-block", width: 14, height: 14, background: "#378ADD", borderRadius: "50%" }}></span> Пасажир
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", border: "3px solid #EF9F27", boxSizing: "border-box" }}></span> Моє
        </span>
      </div>

      {/* Bottom sheet */}
      {sheet && (
        <div
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1000, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderRadius: "14px 14px 0 0", boxShadow: "0 -2px 16px rgba(0,0,0,0.12)", padding: "8px 14px 16px" }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ width: 32, height: 3, borderRadius: 2, background: "#D1D5DB", margin: "0 auto 10px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8, background: sheet.role === "driver" ? "#D1FAE5" : "#DBEAFE", color: sheet.role === "driver" ? "#065F46" : "#1E40AF", textTransform: "uppercase" }}>
              {sheet.role === "driver" ? "Водій" : "Пасажир"}
            </span>
            {sheet.isRoundTrip && <span style={{ fontSize: 10, color: "#6B7280", background: "#F3F4F6", padding: "2px 6px", borderRadius: 8 }}>↩ туди-назад</span>}
            <button onClick={() => { deactivate(); setSheet(null) }} style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 18, color: "#9CA3AF", cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 6 }}>{sheet.from} → {sheet.to}</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {sheet.departureTime && <span style={{ fontSize: 12, background: "#F3F4F6", color: "#374151", padding: "2px 8px", borderRadius: 8 }}>{sheet.departureTime}</span>}
            {sheet.returnTime && <span style={{ fontSize: 12, background: "#D1FAE5", color: "#065F46", padding: "2px 8px", borderRadius: 8 }}>↩ {sheet.returnTime}</span>}
            {sheet.seats != null && sheet.seats > 0 && <span style={{ fontSize: 12, background: "#F3F4F6", color: "#374151", padding: "2px 8px", borderRadius: 8 }}>{sheet.seats} {sheet.seats === 1 ? "місце" : sheet.seats < 5 ? "місця" : "місць"}</span>}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {sheet.telegramUsername ? (
              <a href={`https://t.me/${sheet.telegramUsername}`} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, display: "block", textAlign: "center", padding: "9px 12px", background: "#229ED9", color: "white", borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                Написати @{sheet.telegramUsername}
              </a>
            ) : (
              <div style={{ flex: 1, textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>Увійдіть, щоб побачити контакт</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
