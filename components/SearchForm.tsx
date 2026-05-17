"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function SearchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [from, setFrom] = useState(searchParams.get("from") || "")
  const [to, setTo] = useState(searchParams.get("to") || "")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (from.trim()) params.set("from", from.trim())
    if (to.trim()) params.set("to", to.trim())
    const qs = params.toString()
    router.push(qs ? "/?" + qs : "/")
  }

  function handleReset() {
    setFrom("")
    setTo("")
    router.push("/")
  }

  const hasFilter = Boolean(searchParams.get("from") || searchParams.get("to"))

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Пошук маршруту</h2>
      <input type="text" placeholder="Звідки?" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full border rounded-lg p-3 mb-3 text-gray-700" />
      <input type="text" placeholder="Куди?" value={to} onChange={(e) => setTo(e.target.value)} className="w-full border rounded-lg p-3 mb-4 text-gray-700" />
      <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Знайти</button>
      {hasFilter ? (<button type="button" onClick={handleReset} className="w-full mt-3 text-gray-600 underline text-sm">Скинути фільтр</button>) : null}
    </form>
  )
}
