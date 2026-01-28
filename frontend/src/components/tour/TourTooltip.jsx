import { TOUR_STEPS } from './tourSteps';

export default function TourTooltip({
  step,
  stepIndex,
  onNext,
  onPrev,
  onSkip,
}) {
  const total = TOUR_STEPS.length;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === total - 1;

  return (
    <div className="w-80 rounded-xl border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl">
      {/* Step counter */}
      <p className="mb-1 text-xs font-medium text-slate-400">
        Passo {stepIndex + 1} de {total}
      </p>

      {/* Title */}
      <h3 className="mb-2 text-base font-semibold text-white">{step.title}</h3>

      {/* Description */}
      <p className="mb-4 text-sm leading-relaxed text-slate-300">{step.description}</p>

      {/* Dots */}
      <div className="mb-4 flex gap-1.5">
        {TOUR_STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              i === stepIndex ? 'bg-[var(--color-accent)]' : 'bg-slate-600'
            }`}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onSkip}
          className="text-xs text-slate-500 transition-colors hover:text-slate-300"
        >
          Pular tour
        </button>
        <div className="flex gap-2">
          {!isFirst && (
            <button
              onClick={onPrev}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition-colors hover:text-white"
            >
              Anterior
            </button>
          )}
          <button
            onClick={onNext}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            {isLast ? 'Concluir' : 'Proximo'}
          </button>
        </div>
      </div>
    </div>
  );
}
