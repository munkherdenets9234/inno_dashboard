export default function StatCounter({
  value,
  suffix = "",
  decimal = false,
  label,
}: {
  value: number;
  suffix?: string;
  decimal?: boolean;
  label: string;
}) {
  const display = decimal ? (value / 10).toFixed(1) : String(value);
  return (
    <div>
      <div className="font-heading text-[46px] leading-none">
        <span data-count={value} data-suffix={suffix} data-decimal={decimal ? "true" : undefined}>
          {display}
          {suffix}
        </span>
      </div>
      <div className="label text-paper/55 mt-2">{label}</div>
    </div>
  );
}
