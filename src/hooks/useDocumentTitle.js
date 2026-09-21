import { useEffect } from 'react';
import { SITE } from '../config/site';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;
  }, [title]);
}
