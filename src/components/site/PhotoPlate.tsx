export default function PhotoPlate({
  label,
  imageUrl,
  alt,
  className,
}: {
  label: string;
  imageUrl?: string;
  alt?: string;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden ${className ?? ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary remote URLs from the CMS, no fixed domain list to configure next/image against */}
        <img src={imageUrl} alt={alt ?? label} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`photo-plate flex items-end p-2.5 ${className ?? ""}`}>
      <span className="label text-paper/50">{label}</span>
    </div>
  );
}
