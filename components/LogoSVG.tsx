export default function LogoSVG({ size = 40 }: { size?: number }) {
  const h = Math.round(size * 1.375)
  return (
    <svg width={size} height={h} viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Біла рамка — найтонша */}
      <rect width="32" height="44" rx="5" fill="white" stroke="#C0C4CC" strokeWidth="0.3"/>
      {/* Синя смуга */}
      <rect x="1.5" y="1.5" width="14" height="41" rx="2" fill="#5B8FD9"/>
      {/* Тонка біла смужка-роздільник */}
      <rect x="16.5" y="1.5" width="1.2" height="41" fill="white"/>
      {/* Сіра смуга */}
      <rect x="18" y="1.5" width="12.5" height="41" rx="2" fill="#7A8290"/>
      {/* Червоний маркер — далі, менший, біля обочини */}
      <path d="M27,12 L23,6 A4,4,0,1,1,31,6 Z" fill="#E53935"/>
      <circle cx="27" cy="4.5" r="1.4" fill="white"/>
      {/* Синій маркер — ближче, більший, біля центру */}
      <path d="M20,42 L15,33 A5.5,5.5,0,1,1,25,33 Z" fill="#5B8FD9"/>
      <circle cx="20" cy="30.5" r="2.2" fill="white"/>
    </svg>
  )
}
