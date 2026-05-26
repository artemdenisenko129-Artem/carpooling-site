"use client"
import "leaflet/dist/leaflet.css"
import { useEffect, useRef, useState } from "react"

interface Props {
  fromLat: number | null
  fromLng: number | null
  toLat:   number | null
  toLng:   number | null
  onFromChange: (name: string, lat: number, lng: number) => void
  onToChange:   (name: string, lat: number, lng: number) => void
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=uk`,
      { headers: { "User-Agent": "PoputtkyUA/1.0" } }
    )
    const data = await res.json()
    const a = data.address || {}
    // Пріоритет: квартал/район → місто/населений пункт → область
    return (
      a.suburb || a.neighbourhood || a.quarter ||
      a.city_district ||
      a.town || a.village || a.city ||
      a.county || a.state ||
      data.display_name?.split(",")[0] ||
      `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    )
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}

export default function MapPicker({ fromLat, fromLng, toLat, toLng, onFromChange, onToChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const fromMarkerRef = useRef<any>(null)
  const toMarkerRef   = useRef<any>(null)
  const lineRef       = useRef<any>(null)

  const [mode, setMode] = useState<"from" | "to">("from")
  const [geocoding, setGeocoding] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || mapRef.current) return

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return

      delete (L.Icon.Default.prototype as any)._getIconUrl

      const map = L.map(containerRef.current, {
        center: [50.0, 31.0],
        zoom: 6,
        zoomControl: true,
        wheelDebounceTime: 150,
        wheelPxPerZoomLevel: 120,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map)

      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng
        setGeocoding(true)
        const name = await reverseGeocode(lat, lng)
        setGeocoding(false)

        if (mode === "from") {
          onFromChange(name, lat, lng)
        } else {
          onToChange(name, lat, lng)
        }
      })

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [])

  // Оновлення маркерів і лінії при зміні координат
  useEffect(() => {
    if (!mapRef.current) return
    import("leaflet").then((L) => {
      const map = mapRef.current

      function makeFromIcon() {
        return L.divIcon({
          className: "",
          html: `<div style="width:16px;height:16px;border-radius:50%;background:#5B8FD9;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
          iconSize: [16, 16], iconAnchor: [8, 8],
        })
      }
      function makeToIcon() {
        return L.divIcon({
          className: "",
          html: `<div style="position:relative;width:20px;height:28px">
            <div style="position:absolute;top:0;left:2px;width:16px;height:16px;background:#E53935;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>
          </div>`,
          iconSize: [20, 28], iconAnchor: [10, 28],
        })
      }

      // From marker
      if (fromLat != null && fromLng != null) {
        if (fromMarkerRef.current) map.removeLayer(fromMarkerRef.current)
        fromMarkerRef.current = L.marker([fromLat, fromLng], { icon: makeFromIcon() }).addTo(map)
      } else if (fromMarkerRef.current) {
        map.removeLayer(fromMarkerRef.current)
        fromMarkerRef.current = null
      }

      // To marker
      if (toLat != null && toLng != null) {
        if (toMarkerRef.current) map.removeLayer(toMarkerRef.current)
        toMarkerRef.current = L.marker([toLat, toLng], { icon: makeToIcon() }).addTo(map)
      } else if (toMarkerRef.current) {
        map.removeLayer(toMarkerRef.current)
        toMarkerRef.current = null
      }

      // Route line
      if (lineRef.current) map.removeLayer(lineRef.current)
      if (fromLat != null && fromLng != null && toLat != null && toLng != null) {
        lineRef.current = L.polyline(
          [[fromLat, fromLng], [toLat, toLng]],
          { color: "#5B8FD9", weight: 2.5, dashArray: "7 6", opacity: 0.7 }
        ).addTo(map)
        map.fitBounds([[fromLat, fromLng], [toLat, toLng]], { padding: [40, 40], maxZoom: 13 })
      } else if (fromLat != null && fromLng != null) {
        map.setView([fromLat, fromLng], 12, { animate: true })
      } else if (toLat != null && toLng != null) {
        map.setView([toLat, toLng], 12, { animate: true })
      }
    })
  }, [fromLat, fromLng, toLat, toLng])

  // Оновлення обробника кліку при зміні mode
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current
    map.off("click")
    map.on("click", async (e: any) => {
      const { lat, lng } = e.latlng
      setGeocoding(true)
      const name = await reverseGeocode(lat, lng)
      setGeocoding(false)
      if (mode === "from") {
        onFromChange(name, lat, lng)
      } else {
        onToChange(name, lat, lng)
      }
    })
  }, [mode, onFromChange, onToChange])

  return (
    <div className="flex flex-col gap-2">
      {/* Перемикач режиму */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("from")}
          className="flex-1 py-2 rounded-xl text-xs font-semibold border-2 flex items-center justify-center gap-1.5 transition-all"
          style={mode === "from"
            ? { background: "#EBF2FC", borderColor: "#5B8FD9", color: "#3A6BBF" }
            : { background: "white", borderColor: "#E5E7EB", color: "#6B7280" }}
        >
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: mode === "from" ? "#5B8FD9" : "#9CA3AF", display: "inline-block" }} />
          Звідки
        </button>
        <button
          type="button"
          onClick={() => setMode("to")}
          className="flex-1 py-2 rounded-xl text-xs font-semibold border-2 flex items-center justify-center gap-1.5 transition-all"
          style={mode === "to"
            ? { background: "#FDECEA", borderColor: "#E53935", color: "#B91C1C" }
            : { background: "white", borderColor: "#E5E7EB", color: "#6B7280" }}
        >
          <span style={{ width: 10, height: 10, background: mode === "to" ? "#E53935" : "#9CA3AF", display: "inline-block", transform: "rotate(45deg)" }} />
          Куди
        </button>
      </div>

      {/* Карта */}
      <div style={{ position: "relative" }}>
        {geocoding && (
          <div style={{
            position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
            zIndex: 1000, background: "white", borderRadius: 20, padding: "4px 12px",
            fontSize: 12, color: "#374151", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}>
            📍 Визначаю місце...
          </div>
        )}
        <div style={{
          position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
          zIndex: 1000, background: "rgba(0,0,0,0.6)", borderRadius: 20, padding: "4px 12px",
          fontSize: 11, color: "white", pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          {mode === "from" ? "🔵 Клікни щоб поставити точку відправлення" : "🔴 Клікни щоб поставити пункт призначення"}
        </div>
        <div
          ref={containerRef}
          style={{ height: 260, width: "100%", borderRadius: 12, overflow: "hidden", border: "1.5px solid #E5E7EB" }}
        />
      </div>
    </div>
  )
}
