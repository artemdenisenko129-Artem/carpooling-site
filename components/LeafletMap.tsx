"use client"
import { useEffect, useRef, useState } from "react"
import type { Announcement } from "../types/announcement"

declare const window: Window & { L: any }

interface Props {
  announcements: Announcement[]
}

const DRIVER_COLOR   = "#E24B4A"
const PASSENGER_COLOR = "#378ADD"
const INACTIVE_COLOR  = "#B4B2A9"

function squareHtml(color: string, label: string) {
  return `<div style="width:20px;height:20px;background:${color};border-radius:4px;border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:white;font-family:sans-serif;box-shadow:0 1px 4px rgba(0,0,0,0.2)">${label}</div>`
}

function circleHtml(color: string, label: string) {
  return `<div style="width:20px;height:20px;background:${color};border-radius:50%;border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:white;font-family:sans-serif;box-shadow:0 1px 4px rgba(0,0,0,0.2)">${label}</div>`
}

function tearHtml(color: string, label: string) {
  return `<div style="position:relative;width:20px;height:26px">` +
    `<div style="position:absolute;top:0;left:2px;width:16px;height:16px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.2)"></div>` +
    `<div style="position:absolute;top:1px;left:2px;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:white;font-family:sans-serif">${label}</div>` +
    `</div>`
}

const INACTIVE_RING = "#FBBF24"

function makeIcon(L: any, role: "driver"|"passenger", isEnd: boolean, active: boolean) {
  const label = role === "driver" ? "В" : "П"
  if (isEnd) {
    const color = active ? (role === "driver" ? DRIVER_COLOR : PASSENGER_COLOR) : INACTIVE_COLOR
    const border = active ? "white" : INACTIVE_RING
    const size = active ? 28 : 22
    const html = `<div style="width:${size}px;height:${size+6}px;position:relative">` +
      `<div style="position:absolute;top:0;left:${(size-size*0.85)/2}px;width:${size*0.85}px;height:${size*0.85}px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2.5px solid ${border};box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>` +
      `<div style="position:absolute;top:1px;left:0;width:${size}px;height:${size*0.85}px;display:flex;align-items:center;justify-content:center;font-size:${active?11:9}px;font-weight:700;color:white;font-family:sans-serif">${label}</div>` +
      `</div>`
    return L.divIcon({ className: "", html, iconSize: [size, size+6], iconAnchor: [size/2, size+6] })
  }
  // Початкова/проміжна — маленька сіра крапка з жовтим кільцем
  const dotSize = 10
  const html = `<div style="width:${dotSize}px;height:${dotSize}px;background:#B4B2A9;border-radius:50%;border:2px solid ${INACTIVE_RING};box-shadow:0 1px 3px rgba(0,0,0,0.2)"></div>`
  return L.divIcon({ className: "", html, iconSize: [dotSize, dotSize], iconAnchor: [dotSize/2, dotSize/2] })
}

export default function LeafletMap({ announcements }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const layersRef = useRef<any[]>([])
  const activeRef = useRef<{ markers: any[]; line: any } | null>(null)
  const userMarkerRef = useRef<any>(null)
  const [sheet, setSheet] = useState<Announcement | null>(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    // Якщо Leaflet ще не завантажився — чекаємо до 5 секунд
    let attempts = 0
    function tryInit() {
      const L = window.L
      if (!L) {
        if (++attempts < 25) { setTimeout(tryInit, 200); return }
        return // не завантажився за 5 сек — тихо виходимо
      }
      initMap(L)
    }
    tryInit()
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; activeRef.current = null } }
  }, [])

  function initMap(L: any) {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, { center: [49.5, 31.5], zoom: 6, zoomControl: true, scrollWheelZoom: false })

    let hintTimeout: any = null
    const container = containerRef.current
    const hintEl = document.createElement("div")
    hintEl.style.cssText = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(17,24,39,0.75);color:white;border-radius:12px;padding:8px 18px;font-size:13px;pointer-events:none;opacity:0;transition:opacity 0.2s;z-index:900;white-space:nowrap"
    hintEl.textContent = "Ctrl + прокрутка — зум карти"
    if (container.parentElement) { container.parentElement.style.position = "relative"; container.parentElement.appendChild(hintEl) }
    container.addEventListener("wheel", (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); e.deltaY < 0 ? map.zoomIn(1) : map.zoomOut(1) }
      else { hintEl.style.opacity = "1"; if (hintTimeout) clearTimeout(hintTimeout); hintTimeout = setTimeout(() => { hintEl.style.opacity = "0" }, 1500) }
    }, { passive: false })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors", maxZoom: 18 }).addTo(map)
    map.on("click", () => { deactivate(); setSheet(null) })
    mapRef.current = map
    ;(window as any)._leafletMap = map
    setTimeout(() => map.invalidateSize(), 0)
    renderMarkers(L, map)
  }

  useEffect(() => {
    if (!mapRef.current || !window.L) return
    renderMarkers(window.L, mapRef.current)
  }, [announcements])

  function deactivate() {
    if (!activeRef.current) return
    const L = window.L
    activeRef.current.markers.forEach(mk => {
      mk.setIcon(makeIcon(L, mk._role, mk._isEnd, false))
    })
    activeRef.current.line.setStyle({ opacity: 0 })
    activeRef.current = null
  }

  function activate(L: any, markers: any[], line: any, ann: Announcement) {
    deactivate()
    markers.forEach(mk => mk.setIcon(makeIcon(L, mk._role, mk._isEnd, true)))
    line.setStyle({ opacity: 0.75 })
    activeRef.current = { markers, line }
    setSheet(ann)
    // Авто-підгонка карти щоб показати весь маршрут
    const latlngs = markers.map((mk: any) => mk.getLatLng())
    if (latlngs.length > 1 && mapRef.current) {
      mapRef.current.fitBounds(L.latLngBounds(latlngs), { padding: [60, 60], maxZoom: 13, animate: true })
    } else if (latlngs.length === 1 && mapRef.current) {
      mapRef.current.setView(latlngs[0], 12, { animate: true })
    }
  }

  function renderMarkers(L: any, map: any) {
    layersRef.current.forEach(l => { try { map.removeLayer(l) } catch {} })
    layersRef.current = []
    deactivate(); setSheet(null)

    const withCoords = announcements.filter(a => a.fromLat != null && a.fromLng != null && a.toLat != null && a.toLng != null)
    if (!withCoords.length) return

    const allPoints: [number, number][] = []

    withCoords.forEach(a => {
      const pts = [
        { lat: a.fromLat!, lng: a.fromLng!, isEnd: false },
        ...(a.waypoints ?? []).map(w => ({ lat: w.lat, lng: w.lng, isEnd: false })),
        { lat: a.toLat!, lng: a.toLng!, isEnd: true },
      ]
      const latlngs: [number, number][] = pts.map(p => [p.lat, p.lng])
      const lineColor = a.role === "driver" ? DRIVER_COLOR : PASSENGER_COLOR
      const routeLine = L.polyline(latlngs, { color: lineColor, weight: 2.5, opacity: 0, dashArray: "6 5" }).addTo(map)

      if (a.isRoundTrip) {
        const ret: [number, number][] = [[a.toLat!, a.toLng!], ...[...(a.waypoints ?? [])].reverse().map((w): [number,number] => [w.lat, w.lng]), [a.fromLat!, a.fromLng!]]
        const retLine = L.polyline(ret, { color: lineColor, weight: 2, opacity: 0.3, dashArray: "3 7" }).addTo(map)
        layersRef.current.push(retLine)
      }

      const markers = pts.map(p => {
        const m = L.marker([p.lat, p.lng], { icon: makeIcon(L, a.role, p.isEnd, false) })
        m._role = a.role; m._isEnd = p.isEnd
        m.on("click", (e: any) => { e.originalEvent?.stopPropagation(); activate(L, markers, routeLine, a) })
        m.addTo(map)
        layersRef.current.push(m)
        return m
      })
      layersRef.current.push(routeLine)
      latlngs.forEach(ll => allPoints.push(ll))
    })

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
      const icon = L.divIcon({ className: "", html: `<div style="width:16px;height:16px;border-radius:50%;background:#10B981;border:3px solid white;box-shadow:0 0 0 4px rgba(16,185,129,0.3)"></div>`, iconSize: [16,16], iconAnchor: [8,8] })
      userMarkerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(mapRef.current)
    }, () => setLocating(false), { timeout: 8000 })
  }

  const withCoords = announcements.filter(a => a.fromLat != null && a.toLat != null)
  const withoutCoords = announcements.length - withCoords.length

  return (
    <div style={{ position: "relative" }}>
      {withoutCoords > 0 && (
        <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "#6B7280", pointerEvents: "none" }}>
          {withCoords.length} з {announcements.length} на карті
        </div>
      )}
      <button onClick={handleLocate} disabled={locating} title="Моє місцезнаходження"
        style={{ position: "absolute", top: 10, right: 10, zIndex: 1000, width: 38, height: 38, borderRadius: "50%", background: "white", border: "2px solid #E5E7EB", boxShadow: "0 2px 6px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 17 }}>
        {locating ? "⏳" : "🎯"}
      </button>

      <div ref={containerRef} style={{ height: 440, width: "100%", borderRadius: 16, overflow: "hidden" }} />

      {sheet && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1000, background: "rgba(17,24,39,0.72)", borderRadius: "14px 14px 0 0", boxShadow: "0 -2px 16px rgba(0,0,0,0.25)", padding: "8px 14px 14px" }}
          onClick={e => e.stopPropagation()}>
          <div style={{ width: 30, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.3)", margin: "0 auto 8px" }} />

          {/* Рядок 1: роль + закрити */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 7, background: sheet.role === "driver" ? "#E53935" : "#229ED9", color: "white", textTransform: "uppercase" }}>
              {sheet.role === "driver" ? "Водій" : "Пасажир"}
            </span>
            {sheet.isRoundTrip && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 7 }}>↩ туди-назад</span>}
            <button onClick={() => { deactivate(); setSheet(null) }} style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 18, color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
          </div>

          {/* Маршрут */}
          <div style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 5 }}>
            {sheet.from}
            {(sheet.waypoints ?? []).map((w, i) => <span key={i}> → {w.name}</span>)}
            {" → "}{sheet.to}
          </div>

          {/* Чіпи: дата/дні, час, місця, спільнота */}
          <div style={{ display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
            {sheet.tripType === "once" && sheet.departureDate && (
              <span style={{ fontSize: 11, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)", padding: "2px 7px", borderRadius: 7 }}>
                📅 {new Date(sheet.departureDate).toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}
              </span>
            )}
            {sheet.tripType === "regular" && sheet.schedule && sheet.schedule.length > 0 && (
              <span style={{ fontSize: 11, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)", padding: "2px 7px", borderRadius: 7 }}>
                🔄 {(["mon","tue","wed","thu","fri","sat","sun"] as const)
                  .filter(d => sheet.schedule!.includes(d))
                  .map(d => ({ mon:"Пн",tue:"Вт",wed:"Ср",thu:"Чт",fri:"Пт",sat:"Сб",sun:"Нд" }[d]))
                  .join(", ")}
              </span>
            )}
            {sheet.departureTime && <span style={{ fontSize: 11, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)", padding: "2px 7px", borderRadius: 7 }}>🕐 {sheet.departureTime}</span>}
            {sheet.returnTime && <span style={{ fontSize: 11, background: "rgba(255,255,255,0.12)", color: "#86EFAC", padding: "2px 7px", borderRadius: 7 }}>↩ {sheet.returnTime}</span>}
            {(sheet.seats ?? 0) > 0 && <span style={{ fontSize: 11, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)", padding: "2px 7px", borderRadius: 7 }}>👤 {sheet.seats} {sheet.seats === 1 ? "місце" : (sheet.seats ?? 0) < 5 ? "місця" : "місць"}</span>}
            {sheet.community && <span style={{ fontSize: 11, background: "rgba(91,143,217,0.3)", color: "#93C5FD", padding: "2px 7px", borderRadius: 7 }}>🏘 {sheet.community}</span>}
          </div>

          {/* Кнопки */}
          <div style={{ display: "flex", gap: 8 }}>
            {sheet.telegramUsername
              ? <a href={`https://t.me/${sheet.telegramUsername}`} target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, display: "block", textAlign: "center", padding: "9px 12px", background: "#229ED9", color: "white", borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                  ✈️ @{sheet.telegramUsername}
                </a>
              : <div style={{ flex: 1, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.4)", padding: "9px 0" }}>Увійдіть щоб написати</div>
            }
            <a href={`/?search=${encodeURIComponent(sheet.from)}`}
              style={{ padding: "9px 12px", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", borderRadius: 10, fontSize: 12, textDecoration: "none", whiteSpace: "nowrap" }}>
              У списку →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
