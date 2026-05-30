export default function LogoSVG({ size = 40 }: { size?: number }) {
  const h = size * 1.25
  return (
    <svg width={size} height={h} viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Дорога — темний бордер */}
      <path
        d="M10 48 C10 34 32 30 32 20 C32 10 24 4 20 4"
        stroke="#1A1A2E" strokeWidth="15" strokeLinecap="round"
      />
      {/* Дорога — синя поверхня */}
      <path
        d="M10 48 C10 34 32 30 32 20 C32 10 24 4 20 4"
        stroke="#5B8FD9" strokeWidth="10" strokeLinecap="round"
      />
      {/* Центральна пунктирна лінія */}
      <path
        d="M10 48 C10 34 32 30 32 20 C32 10 24 4 20 4"
        stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="5 5"
      />

      {/* Червоний маркер зверху */}
      <path d="M20 15 C20 15 13 9 13 5.5 C13 2 16.1 0 20 0 C23.9 0 27 2 27 5.5 C27 9 20 15 20 15Z" fill="#E53935"/>
      <circle cx="20" cy="5.5" r="2.5" fill="white"/>

      {/* Синій маркер знизу-справа */}
      <path d="M31 43 C31 43 25.5 37.5 25.5 34.5 C25.5 31.5 28 30 31 30 C34 30 36.5 31.5 36.5 34.5 C36.5 37.5 31 43 31 43Z" fill="#378ADD"/>
      <circle cx="31" cy="34.5" r="2" fill="white"/>
    </svg>
  )
}
