import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { TOUR_STEPS, TOUR_VERSION, TOUR_STORAGE_KEY } from '@/components/tour/tourSteps';

export const TourContext = createContext(null);

function loadState() {
  try {
    const raw = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.tourVersion !== TOUR_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveState(state) {
  localStorage.setItem(
    TOUR_STORAGE_KEY,
    JSON.stringify({ ...state, tourVersion: TOUR_VERSION })
  );
}

export function TourProvider({ children }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(() => {
    const saved = loadState();
    return saved?.completedSteps || [];
  });
  const [dismissed, setDismissed] = useState(() => {
    const saved = loadState();
    return saved?.dismissed || false;
  });

  useEffect(() => {
    saveState({ dismissed, completedSteps });
  }, [dismissed, completedSteps]);

  const startTour = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStepIndex(prev => {
      if (prev < TOUR_STEPS.length - 1) return prev + 1;
      setIsActive(false);
      return prev;
    });
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStepIndex(prev => (prev > 0 ? prev - 1 : prev));
  }, []);

  const skipTour = useCallback(() => {
    setIsActive(false);
    setDismissed(true);
  }, []);

  const resetTour = useCallback(() => {
    setCompletedSteps([]);
    setDismissed(false);
    setIsActive(false);
    setCurrentStepIndex(0);
  }, []);

  const isStepCompleted = useCallback(
    id => completedSteps.includes(id),
    [completedSteps]
  );

  const toggleManualStep = useCallback(id => {
    setCompletedSteps(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }, []);

  const updateProgressFromStats = useCallback(stats => {
    if (!stats) return;
    setCompletedSteps(prev => {
      const next = [...prev];
      let changed = false;
      for (const step of TOUR_STEPS) {
        if (step.statKey && stats[step.statKey] > 0 && !next.includes(step.id)) {
          next.push(step.id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const shouldAutoStart = useMemo(
    () => !dismissed && completedSteps.length === 0,
    [dismissed, completedSteps]
  );

  const value = useMemo(
    () => ({
      isActive,
      currentStepIndex,
      currentStep: TOUR_STEPS[currentStepIndex],
      steps: TOUR_STEPS,
      completedSteps,
      dismissed,
      shouldAutoStart,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      resetTour,
      isStepCompleted,
      toggleManualStep,
      updateProgressFromStats,
    }),
    [
      isActive,
      currentStepIndex,
      completedSteps,
      dismissed,
      shouldAutoStart,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      resetTour,
      isStepCompleted,
      toggleManualStep,
      updateProgressFromStats,
    ]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}
