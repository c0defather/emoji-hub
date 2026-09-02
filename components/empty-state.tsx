export function EmptyState({
  glyph,
  title,
  hint,
  action,
}: {
  glyph: string
  title: string
  hint?: string
  action?: React.ReactNode
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="glyph text-5xl grayscale-[0.2]">{glyph}</span>
      <p className="text-base font-semibold text-slate-800">{title}</p>
      {hint && <p className="max-w-sm text-sm text-slate-500">{hint}</p>}
      {action}
    </div>
  )
}
