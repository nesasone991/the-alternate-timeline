import { useEffect } from 'react';

const PRODUCT_NAME = 'The Alternate Timeline';

export function documentTitle(pageTitle?: string): string {
  return pageTitle ? `${pageTitle} — ${PRODUCT_NAME}` : PRODUCT_NAME;
}

export function useDocumentTitle(pageTitle?: string): void {
  useEffect(() => {
    document.title = documentTitle(pageTitle);
  }, [pageTitle]);
}
