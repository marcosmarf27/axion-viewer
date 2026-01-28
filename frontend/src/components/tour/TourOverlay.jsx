import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTour } from '@/hooks/useTour';
import TourTooltip from './TourTooltip';

const PADDING = 6;
const TOOLTIP_GAP = 12;

export default function TourOverlay() {
  const { currentStep, currentStepIndex, nextStep, prevStep, skipTour, isActive } =
    useTour();
  const [rect, setRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);
  const rafRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!currentStep) return;

    const el = document.querySelector(currentStep.targetSelector);
    if (!el) {
      // Mobile: try opening sidebar
      const hamburger = document.querySelector('[data-tour="mobile-menu"]');
      if (hamburger) {
        hamburger.click();
        setTimeout(() => updatePosition(), 350);
      }
      return;
    }

    const r = el.getBoundingClientRect();
    const spotRect = {
      top: r.top - PADDING,
      left: r.left - PADDING,
      width: r.width + PADDING * 2,
      height: r.height + PADDING * 2,
    };
    setRect(spotRect);

    // Position tooltip to the right of the target
    const tooltipEl = tooltipRef.current;
    const tooltipWidth = tooltipEl?.offsetWidth || 320;
    const tooltipHeight = tooltipEl?.offsetHeight || 200;

    let top = spotRect.top;
    let left = spotRect.left + spotRect.width + TOOLTIP_GAP;

    // If tooltip goes off-screen right, place it below
    if (left + tooltipWidth > window.innerWidth - 16) {
      left = spotRect.left;
      top = spotRect.top + spotRect.height + TOOLTIP_GAP;
    }

    // Clamp vertically
    if (top + tooltipHeight > window.innerHeight - 16) {
      top = window.innerHeight - tooltipHeight - 16;
    }
    if (top < 16) top = 16;

    setTooltipPos({ top, left });
  }, [currentStep]);

  useEffect(() => {
    if (!isActive) return;

    updatePosition();

    const handleResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, updatePosition]);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = e => {
      if (e.key === 'Escape') skipTour();
      if (e.key === 'ArrowRight') nextStep();
      if (e.key === 'ArrowLeft') prevStep();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, skipTour, nextStep, prevStep]);

  if (!isActive || !currentStep) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9997]"
        onClick={skipTour}
        aria-hidden="true"
      />

      {/* Spotlight */}
      {rect && (
        <div
          style={{
            position: 'fixed',
            zIndex: 9998,
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: 8,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
            pointerEvents: 'none',
            transition: 'top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          zIndex: 9999,
          top: tooltipPos.top,
          left: tooltipPos.left,
          transition: 'top 0.3s ease, left 0.3s ease',
        }}
        className="tour-tooltip-enter"
      >
        <TourTooltip
          step={currentStep}
          stepIndex={currentStepIndex}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTour}
        />
      </div>
    </>,
    document.body
  );
}
