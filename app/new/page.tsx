"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NewAnnouncement() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    telegramUsername: "",
    role: "driver",
    from: "",
    to: "",
    aiText: "",
    isRoundTrip: false,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create")
      }
      router.push("/")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-blue-50">
      <header className="bg-blue-600 text-white p-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Нове оголошення</h1>
        <p className="text-blue-100">Розкажи про свою поїздку</p>
      </header>
      <div className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6">
          <label className="block mb-4">
            <span className="block text-sm font-medium text-gray-700 mb-1">Telegram username</span>
            <input
              type="text"
              required
              placeholder="@your_username"
              value={form.telegramUsername}
              onChange={(e) => setForm({ ...form, telegramUsername: e.target.value })}
              className="w-full border rounded-lg p-3 text-gray-700"
            />
          </label>

          <label className="block mb-4">
            <span className="block text-sm font-medium text-gray-700 mb-1">Хто ти?</span>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border rounded-lg p-3 text-gray-700"
            >
              <option value="driver">Водій</option>
              <option value="passenger">Пасажир</option>
            </select>
          </label>

          <label className="block mb-4">
            <span className="block text-sm font-medium text-gray-700 mb-1">Звідки</span>
            <input
              type="text"
              required
              placeholder="Київ"
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
              className="w-full border rounded-lg p-3 text-gray-700"
            />
          </label>

          <label className="block mb-4">
            <span className="block text-sm font-medium text-gray-700 mb-1">Куди</span>
            <input
              type="text"
              required
              placeholder="Львів"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
              className="w-full border rounded-lg p-3 text-gray-700"
            />
          </label>

          <label className="block mb-4">
            <span className="block text-sm font-medium text-gray-700 mb-1">Текст оголошення</span>
            <textarea
              required
              rows={5}
              placeholder="Коли їдеш, скільки місць..."
              value={form.aiText}
              onChange={(e) => setForm({ ...form, aiText: e.target.value })}
              className="w-full border rounded-lg p-3 text-gray-700"
            />
          </label>

          <label className="flex items-center mb-5">
            <input
              type="checkbox"
              checked={form.isRoundTrip}
              onChange={(e) => setForm({ ...form, isRoundTrip: e.target.checked })}
              className="mr-2"
            />
            <span className="text-gray-700">Поїздка туди-назад</span>
          </label>

          {error && <p className="text-red-600 mb-3 text-sm">Помилка: {error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Публікую..." : "Опублікувати"}
          </button>

          <a href="/" className="block text-center mt-4 text-blue-600 hover:underline">
            На головну
          </a>
        </form>
      </div>
    </main>
  )
}
