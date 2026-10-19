/**
 * Minimal placeholder home page.
 *
 * FEAT-001 only establishes the scaffold, theme shell, and config. The real
 * home page — composed from the DAL/seed sections — arrives in FEAT-004. This
 * placeholder keeps the zero-env build + render gate green in the meantime.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="font-mono text-small uppercase tracking-widest text-depth">
        Datadive
      </span>
      <h1 className="font-display text-display-2 font-bold text-text">
        Diving Into Data, Driving Decisions
      </h1>
      <p className="max-w-xl text-body text-muted">
        The marketing site scaffold is live. Content sections land in a later
        build step.
      </p>
    </div>
  );
}
