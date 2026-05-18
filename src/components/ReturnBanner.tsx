interface ReturnBannerProps {
  visible: boolean
}

export default function ReturnBanner({ visible }: ReturnBannerProps) {
  if (!visible) return null

  return (
    <div
      role="status"
      className="fade-in bg-[#FBF0EE] border border-[#E8C8C0] rounded-card px-4 py-3 mb-4"
    >
      <p className="text-sm text-[#8B3020] leading-snug">
        Schön dass du da bist. Lass uns klein anfangen.
      </p>
    </div>
  )
}
