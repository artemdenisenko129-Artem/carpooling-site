"use client"
import { Component, ReactNode } from "react"

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-sm text-[#6B7280]">Карту не вдалось завантажити</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: "#5B8FD9" }}
          >
            Спробувати ще раз
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
