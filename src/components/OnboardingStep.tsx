interface OnboardingStepProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export default function OnboardingStep({ children, title, subtitle }: OnboardingStepProps) {
  return (
    <div className="fade-in flex flex-col min-h-screen bg-background px-6 pt-16 pb-10 max-w-content mx-auto w-full">
      {title && (
        <h1 className="text-2xl font-semibold text-text mb-2 leading-snug">{title}</h1>
      )}
      {subtitle && (
        <p className="text-muted text-base mb-8">{subtitle}</p>
      )}
      {children}
    </div>
  )
}
