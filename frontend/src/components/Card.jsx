export default function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5 shadow-xl">
      <h3 className="mb-3 text-lg font-semibold text-cyan-300">{title}</h3>
      {children}
    </div>
  );
}
