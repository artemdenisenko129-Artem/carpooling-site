export default function LogoSVG({ size = 40 }: { size?: number }) {
  const h = Math.round(size * 1.4)
  return (
    <svg width={size} height={h} viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Чорна рамка */}
      <rect width="40" height="56" rx="5" fill="#1A1A2E"/>
      {/* Синя смуга (ліво) */}
      <rect x="2" y="2" width="17" height="52" rx="2" fill="#5B8FD9"/>
      {/* Біла смуга (право) */}
      <rect x="21" y="2" width="17" height="52" rx="2" fill="white"/>
      {/* Червоний маркер — далі, менший, біля обочини */}
      <path d="M33,24 L28,16 A5,5,0,1,1,38,16 Z" fill="#E53935"/>
      <circle cx="33" cy="13.5" r="1.8" fill="white"/>
      {/* Синій маркер — ближче, більший, біля центру */}
      <path d="M25,54 L18,43 A7,7,0,1,1,32,43 Z" fill="#5B8FD9"/>
      <circle cx="25" cy="40" r="2.8" fill="white"/>
    </svg>
  )
}
