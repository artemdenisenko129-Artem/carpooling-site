"use client"
import { useState, useEffect, useRef, useCallback } from "react"

interface Place {
  name: string
  region: string
  lat: number
  lng: number
}

interface Props {
  value: string
  onChange: (value: string, place?: Place) => void
  placeholder?: string
  dotColor?: "blue" | "red"
  inputClassName?: string
}

export default function PlaceAutocomplete({
  value,
  onChange,
  placeholder = "Місто...",
  dotColor = "blue",
  inputClassName = "",
}: Props) {
  const [suggestions, setSuggestions] = useState<Place[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/places?q=${encodeURIComponent(q)}`)
      const data: Place[] = await res.json()
      setSuggestions(data)
      setOpen(data.length > 0)
      setActiveIdx(-1)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    onChange(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 220)
  }

  function handleSelect(place: Place) {
    onChange(place.name, place)
    setSuggestions([])
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, -1))
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault()
      handleSelect(suggestions[activeIdx])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  const dotBg = dotColor === "blue" ? "#5B8FD9" : "#E53935"

  const spinnerStyle: React.CSSProperties = {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    width: 14,
    height: 14,
    border: `2px solid ${dotBg}`,
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  }

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 2 && suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={inputClassName}
          style={{ width: "100%" }}
        />
        {loading && <span style={spinnerStyle} />}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: "min(320px, 90vw)",
            width: "max-content",
            maxWidth: "90vw",
            background: "white",
            border: "1.5px solid #E5E7EB",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 1000,
            margin: 0,
            padding: "4px 0",
            listStyle: "none",
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          {suggestions.map((place, idx) => (
            <li
              key={`${place.name}-${place.region}`}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(place) }}
              onMouseEnter={() => setActiveIdx(idx)}
              style={{
                padding: "9px 14px",
                cursor: "pointer",
                background: idx === activeIdx ? "#EBF2FC" : "transparent",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: dotBg,
                  flexShrink: 0,
                }}
              />
              <span>
                <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>
                  {place.name}
                </span>
                {place.region && (
                  <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 6 }}>
                    {place.region}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
