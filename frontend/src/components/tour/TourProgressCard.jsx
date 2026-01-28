import { Link } from 'react-router-dom';
import { useTour } from '@/hooks/useTour';
import { TOUR_STEPS } from './tourSteps';

export default function TourProgressCard() {
  const {
    completedSteps,
    dismissed,
    hidden,
    isStepCompleted,
    toggleManualStep,
    startTour,
    skipTour,
    resetTour,
    hideTour,
  } = useTour();

  const total = TOUR_STEPS.length;
  const completed = completedSteps.length;
  const percent = Math.round((completed / total) * 100);
  const allDone = completed === total;

  if (hidden) return null;

  if (dismissed && allDone) return null;

  if (dismissed) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
        <button
          onClick={resetTour}
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          Reexibir tour de configuracao
        </button>
        <button
          onClick={hideTour}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          Nao mostrar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {allDone ? 'Configuracao Completa!' : 'Configuracao do Sistema'}
          </h2>
          <p className="text-sm text-slate-500">
            {allDone
              ? 'Todos os passos foram concluidos com sucesso.'
              : 'Siga os passos abaixo para configurar o sistema completo.'}
          </p>
        </div>
        {!allDone && (
          <div className="flex items-center gap-2">
            <button
              onClick={hideTour}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Nao mostrar novamente
            </button>
            <button
              onClick={skipTour}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Ocultar
            </button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Progresso</span>
          <span className="text-sm font-medium text-slate-700">{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <ul className="mb-4 space-y-2">
        {TOUR_STEPS.map(step => {
          const done = isStepCompleted(step.id);
          const isManual = step.statKey === null;

          return (
            <li key={step.id} className="flex items-center gap-3">
              {isManual ? (
                <button
                  onClick={() => toggleManualStep(step.id)}
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                    done
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300 hover:border-indigo-400'
                  }`}
                >
                  {done && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ) : (
                <div
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                    done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {done ? (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-[10px] font-bold">{TOUR_STEPS.indexOf(step) + 1}</span>
                  )}
                </div>
              )}
              <Link
                to={step.path}
                className={`text-sm transition-colors ${
                  done
                    ? 'text-slate-400 line-through'
                    : 'text-slate-700 hover:text-indigo-600'
                }`}
              >
                {step.title}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={startTour}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
            />
          </svg>
          {allDone ? 'Rever Tour' : 'Iniciar Tour Guiado'}
        </button>
        {allDone && (
          <button
            onClick={skipTour}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            Ocultar
          </button>
        )}
      </div>
    </div>
  );
}
