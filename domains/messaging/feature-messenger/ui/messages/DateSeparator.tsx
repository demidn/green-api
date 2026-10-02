export function DateSeparator({ label }: { label: string }) {
  return (
    <div className="my-2 flex justify-center">
      <h3 className="rounded-capsule bg-date px-1.5 py-px text-label font-normal text-primary backdrop-blur-xl">
        {label}
      </h3>
    </div>
  );
}
