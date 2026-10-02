export function SearchInput({
  value,
  onChange,
}: { value?: string; onChange?: (value: string) => void } = {}) {
  return (
    <input
      type="search"
      aria-label="Поиск чатов"
      placeholder="Поиск"
      value={value}
      onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      className="h-9 w-full rounded-control bg-surface-secondary px-3 text-detail text-primary placeholder:text-muted outline-none"
    />
  );
}
