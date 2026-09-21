import { useEffect } from 'react';

// Any element with a `data-tilt` attribute leans towards the pointer in 3D and catches a soft highlight.
// The pointer position is written as unitless CSS variables (--tx, --ty in -1..1, --gx, --gy in %),
// and the CSS in index.css turns them into rotation, image parallax and the glare.
// Skipped on touch screens and for people who asked for reduced motion.
export function useTilt() {
  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reduceMotion) return undefined;

    let active = null;
    let frame = 0;

    const release = (element) => {
      element.classList.remove('is-tilting');
      ['--tx', '--ty', '--gx', '--gy'].forEach((name) => element.style.removeProperty(name));
    };

    const onMove = (event) => {
      const element = event.target instanceof Element ? event.target.closest('[data-tilt]') : null;
      if (active && active !== element) {
        cancelAnimationFrame(frame);
        release(active);
        active = null;
      }
      if (!element) return;

      active = element;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = element.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width;
        const y = (event.clientY - box.top) / box.height;
        element.classList.add('is-tilting');
        element.style.setProperty('--tx', (x * 2 - 1).toFixed(3));
        element.style.setProperty('--ty', (y * 2 - 1).toFixed(3));
        element.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
        element.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
      });
    };

    const onLeaveWindow = () => {
      cancelAnimationFrame(frame);
      if (active) release(active);
      active = null;
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeaveWindow);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeaveWindow);
      if (active) release(active);
    };
  }, []);
}
