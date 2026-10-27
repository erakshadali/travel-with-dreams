import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// Side panel shell: focus moves in on open, Escape closes, and focus returns to what opened it.
export default function Drawer({ eyebrow, title, onClose, children }) {
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    const onKey = (event) => event.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, []);

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <header className="drawer__head">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="drawer-title">{title}</h2>
          </div>
          <button ref={closeRef} type="button" className="icon-btn" aria-label="Close details" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="drawer__body">{children}</div>
      </aside>
    </>
  );
}
