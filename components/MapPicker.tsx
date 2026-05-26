"use client"
import "leaflet/dist/leaflet.css"
import { useEffect, useRef, useState, useCallback } from "react"

interface Props {
  fromLat:  number | null
  fromLng:  number | null
  toLat:    number | null
  toLng:    number | null
  fromName: string
  toName:   string
  onFromChange: (name: string, lat: number, lng: number) => void
  onToChange:   (name: string, lat: number, lng: number) => void
  /** Зовнішній тригер активації режиму (від кнопок 📍 у формі) */
  mapTrigger?: { mode: "from" | "to"; t: number } | null
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=uk`,
      { headers: { "User-Agent": "PoputtkyUA/1.0" } }
    )
    const d = await res.json()
    const a = d.address || {}
    return (
      a.suburb || a.neighbourhood || a.quarter || a.city_district ||
      a.town || a.village || a.city ||
      a.county || a.state ||
      d.display_name?.split(",")[0] ||
      `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    )
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}

export default function MapPicker({
  fromLat, fromLng, toLat, toLng,
  fromName, toName,
  onFromChange, onToChange,
  mapTrigger,
}: Props) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const mapRef         = useRef<any>(null)
  const fromMarkerRef  = useRef<any>(null)
  const toMarkerRef    = useRef<any>(null)
  const lineRef        = useRef<any>(null)
  const modeRef        = useRef<"from" | "to">("from")
  const onFromRef      = useRef(onFromChange)
  const onToRef        = useRef(onToChange)

  const [mode, setModeState]  = useState<"from" | "to">("from")
  const [geocoding, setGeocoding] = useState(false)
  const [lastSet, setLastSet] = useState<string | null>(null)

  // Завжди актуальні refs — без stale closure
  useEffect(() => { onFromRef.current = onFromChange }, [onFromChange])
  useEffect(() => { onToRef.current  = onToChange   }, [onToChange])

  // Зовнішній тригер від кнопок 📍 у формі
  useEffect(() => {
    if (mapTrigger) setMode(mapTrigger.mode)
  }, [mapTrigger])

  const setMode = useCallback((m: "from" | "to") => {
    modeRef.current = m
    setModeState(m)
  }, [])

  // Ініціалізація карти
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || mapRef.current) return

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return
      delete (L.Icon.Default.prototype as any)._getIconUrl

      const map = L.map(containerRef.current, {
        center: [50.0, 31.0],
        zoom: 6,
        zoomControl: true,
        // Scroll zoom ВИМКНЕНО — карта в середині форми,
        // прокрутка сторінки не повинна зумувати карту
        scrollWheelZoom: false,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map)

      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng
        setGeocoding(true)
        const name = await reverseGeocode(lat, lng)
        setGeocoding(false)
        setLastSet(name)
        setTimeout(() => setLastSet(null), 2500)
        if (modeRef.current === "from") {
          onFromRef.current(name, lat, lng)
          // Автоматично перемикаємо на "Куди" якщо ще не вибрано
          if (toMarkerRef.current === null) setMode("to")
        } else {
          onToRef.current(name, lat, lng)
        }
      })

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [setMode])

  // Оновлення маркерів
  useEffect(() => {
    if (!mapRef.current) return
    import("leaflet").then((L) => {
      const map = mapRef.current
      if (!map) return

      const fromIcon = L.divIcon({
        className: "",
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#5B8FD9;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8],
      })
      const toIcon = L.divIcon({
        className: "",
        html: `<div style="width:20px;height:26px;position:relative">
          <div style="position:absolute;top:0;left:2px;width:16px;height:16px;background:#E53935;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>
        </div>`,
        iconSize: [20, 26], iconAnchor: [10, 26],
      })

      if (fromLat != null && fromLng != null) {
        if (fromMarkerRef.current) map.removeLayer(fromMarkerRef.current)
        fromMarkerRef.current = L.marker([fromLat, fromLng], { icon: fromIcon }).addTo(map)
      } else if (fromMarkerRef.current) {
        map.removeLayer(fromMarkerRef.current)
        fromMarkerRef.current = null
      }

      if (toLat != null && toLng != null) {
        if (toMarkerRef.current) map.removeLayer(toMarkerRef.current)
        toMarkerRef.current = L.marker([toLat, toLng], { icon: toIcon }).addTo(map)
      } else if (toMarkerRef.current) {
        map.removeLayer(toMarkerRef.current)
        toMarkerRef.current = null
      }

      if (lineRef.current) { map.removeLayer(lineRef.current); lineRef.current = null }
      if (fromLat != null && fromLng != null && toLat != null && toLng != null) {
        lineRef.current = L.polyline(
          [[fromLat, fromLng], [toLat, toLng]],
          { color: "#5B8FD9", weight: 2.5, dashArray: "7 6", opacity: 0.7 }
        ).addTo(map)
        map.fitBounds([[fromLat, fromLng], [toLat, toLng]], { padding: [50, 50], maxZoom: 14 })
      } else if (fromLat != null && fromLng != null) {
        map.setView([fromLat, fromLng], 13, { animate: true })
      } else if (toLat != null && toLng != null) {
        map.setView([toLat, toLng], 13, { animate: true })
      }
    })
  }, [fromLat, fromLng, toLat, toLng])

  const fromSet = fromLat != null
  const toSet   = toLat   != null

  return (
    <div className="flex flex-col gap-2">

      {/* Перемикач з поточними значеннями */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("from")}
          className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold border-2 flex items-center gap-2 transition-all min-w-0"
          style={mode === "from"
            ? { background: "#EBF2FC", borderColor: "#5B8FD9", color: "#3A6BBF" }
            : { background: "white",   borderColor: "#E5E7EB", color: "#6B7280" }}
        >
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: fromSet ? "#5B8FD9" : "#D1D5DB", flexShrink: 0, display: "inline-block" }} />
          <span className="truncate">{fromSet && fromName ? fromName : "Звідки"}</span>
          {fromSet && <span style={{ color: "#10B981", flexShrink: 0 }}>✓</span>}
        </button>
        <button
          type="button"
          onClick={() => setMode("to")}
          className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold border-2 flex items-center gap-2 transition-all min-w-0"
          style={mode === "to"
            ? { background: "#FDECEA", borderColor: "#E53935", color: "#B91C1C" }
            : { background: "white",   borderColor: "#E5E7EB", color: "#6B7280" }}
        >
          <span style={{ width: 10, height: 10, background: toSet ? "#E53935" : "#D1D5DB", flexShrink: 0, display: "inline-block", transform: "rotate(45deg)" }} />
          <span className="truncate">{toSet && toName ? toName : "Куди"}</span>
          {toSet && <span style={{ color: "#10B981", flexShrink: 0 }}>✓</span>}
        </button>
      </div>

      {/* Карта */}
      <div style={{ position: "relative" }}>

        {/* Toast — що щойно встановлено */}
        {lastSet && (
          <div style={{
            position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
            zIndex: 1000, background: "#111827", borderRadius: 20, padding: "5px 14px",
            fontSize: 12, color: "white", boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            whiteSpace: "nowrap",
          }}>
            {mode === "from" ? "🔵" : "🔴"} {lastSet}
          </div>
        )}

        {/* Геокодинг */}
        {geocoding && (
          <div style={{
            position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
            zIndex: 1000, background: "white", borderRadius: 20, padding: "5px 14px",
            fontSize: 12, color: "#374151", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}>
            ⏳ Визначаю місце...
          </div>
        )}

        {/* Підказка знизу */}
        <div style={{
          position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
          zIndex: 1000, background: "rgba(17,24,39,0.7)", borderRadius: 20,
          padding: "4px 12px", fontSize: 11, color: "white",
          pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          {mode === "from"
            ? "🔵 Клікни — точка відправлення"
            : "🔴 Клікни — пункт призначення"}
        </div>

        {/* Підказка про зум */}
        <div style={{
          position: "absolute", top: 8, right: 8, zIndex: 1000,
          background: "rgba(255,255,255,0.9)", borderRadius: 8, padding: "3px 8px",
          fontSize: 10, color: "#6B7280", pointerEvents: "none",
        }}>
          ± кнопками
        </div>

        <div
          ref={containerRef}
          style={{ height: 280, width: "100%", borderRadius: 12, border: "1.5px solid #E5E7EB" }}
        />
      </div>
    </div>
  )
}
