import { SITE } from '../config/site';

// Brand mark: a setting sun over calm water. Uses currentColor so it works on light and dark backgrounds.
// If the customer supplies their own logo file, set `logo` in src/config/site.js and it replaces this.
export default function Logo({ className = '' }) {
  if (SITE.logo) {
    return <img className={`logo logo--image ${className}`} src={SITE.logo} alt="" width="40" height="40" />;
  }

  return (
    <svg className={`logo ${className}`} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <circle cx="20" cy="20" r="18.2" />
      <path d="M11.5 23.5a8.5 8.5 0 0 1 17 0" />
      <path d="M20 9.2v2.6M11.2 12.6l1.8 1.8M28.8 12.6 27 14.4" />
      <path d="M9 27.6c2.7-2 4.6-2 7.3 0s4.6 2 7.3 0 4.6-2 7.4 0" />
      <path d="M13 31.6c2-1.4 3.4-1.4 5.4 0s3.4 1.4 5.4 0" />
    </svg>
  );
}
