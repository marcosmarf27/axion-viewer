export default function Badge({ children, colorClass }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
      {children}
    </span>
  );
}
