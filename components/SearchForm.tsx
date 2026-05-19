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
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
      <h3 className="text-cyan-400 text-sm tracking-widest uppercase mb-4">Пошук маршруту</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <input type="text" placeholder="Звідки?" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none" />
        <input type="text" placeholder="Куди?" value={to} onChange={(e) => setTo(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none" />
      </div>
      <button type="submit" className="w-full gradient-btn py-3 rounded-xl font-bold transition">Знайти попутника</button>
      {hasFilter ? (<button type="button" onClick={handleReset} className="w-full mt-3 text-zinc-400 hover:text-cyan-400 text-sm underline">Скинути фільтр</button>) : null}
    </form>
  )
}
