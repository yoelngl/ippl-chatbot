export function Spinner({ size = 20 }: { size?: number }) {
  return <span className="spinner" style={{ width: size, height: size }} role="status" aria-label="Memuat" />
}

export function FullPageSpinner() {
  return (
    <div className="full-page-center">
      <Spinner size={28} />
    </div>
  )
}
