import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { imageUrl } from '../utils/format';

const SRC_SET_WIDTHS = [400, 800, 1200, 1600];

// Responsive <img> that swaps to a neutral placeholder if the photo fails to load
// (offline, blocked, or the remote image was removed) instead of showing a broken icon.
export default function Img({ src, alt, width = 800, sizes = '100vw', eager = false, className = '', ...rest }) {
  const [failedSrc, setFailedSrc] = useState(null);

  if (!src || failedSrc === src) {
    return (
      <div className={`img-fallback ${className}`} role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>
        <ImageOff aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      className={className}
      src={imageUrl(src, width)}
      srcSet={SRC_SET_WIDTHS.map((w) => `${imageUrl(src, w)} ${w}w`).join(', ')}
      sizes={sizes}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      onError={() => setFailedSrc(src)}
      {...rest}
    />
  );
}
