export default function PageHeader({ icon, title, description }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        {icon && <span className="text-3xl">{icon}</span>}
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      </div>
      {description && (
        <p className="text-muted-foreground text-sm leading-relaxed ml-0.5">{description}</p>
      )}
    </div>
  );
}