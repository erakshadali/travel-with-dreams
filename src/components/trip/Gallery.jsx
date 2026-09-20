import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react';
import Img from '../Img';

export default function Gallery({ images, title }) {
  const dialogRef = useRef(null);
  const [index, setIndex] = useState(null);
  const isOpen = index !== null;

  // Native <dialog> gives us focus trapping and Esc-to-close for free.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const step = (delta) => setIndex((i) => (i + delta + images.length) % images.length);

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowRight') step(1);
    if (event.key === 'ArrowLeft') step(-1);
  };

  return (
    <>
      <div className="gallery">
        {images.slice(0, 5).map((src, i) => (
          <button key={src} type="button" className="gallery__item" onClick={() => setIndex(i)} aria-label={`Open photo ${i + 1} of ${images.length}`}>
            <Img
              src={src}
              alt={i === 0 ? `${title} — main photo` : ''}
              width={i === 0 ? 1200 : 600}
              sizes={i === 0 ? '(min-width: 900px) 50vw, 100vw' : '25vw'}
              eager={i === 0}
            />
          </button>
        ))}
        <button type="button" className="gallery__all" onClick={() => setIndex(0)}>
          <Images aria-hidden="true" />
          View all {images.length} photos
        </button>
      </div>

      <dialog ref={dialogRef} className="lightbox" aria-label={`${title} photos`} onClose={() => setIndex(null)} onKeyDown={handleKeyDown} onClick={(e) => e.target === e.currentTarget && setIndex(null)}>
        {isOpen && (
          <div className="lightbox__content">
            <button type="button" className="lightbox__close" onClick={() => setIndex(null)} aria-label="Close photo viewer">
              <X aria-hidden="true" />
            </button>
            <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={() => step(-1)} aria-label="Previous photo">
              <ChevronLeft aria-hidden="true" />
            </button>
            <Img key={images[index]} src={images[index]} alt={`${title} — photo ${index + 1} of ${images.length}`} width={1600} sizes="100vw" eager />
            <button type="button" className="lightbox__nav lightbox__nav--next" onClick={() => step(1)} aria-label="Next photo">
              <ChevronRight aria-hidden="true" />
            </button>
            <p className="lightbox__count" aria-live="polite">
              {index + 1} / {images.length}
            </p>
          </div>
        )}
      </dialog>
    </>
  );
}
