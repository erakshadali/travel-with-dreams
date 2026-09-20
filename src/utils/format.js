const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatPrice = (amount) => inr.format(amount);

// Dates from the API are plain ISO days (YYYY-MM-DD); format in UTC so they never shift a day.
export function formatDate(iso, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { ...options, timeZone: 'UTC' });
}

export const discountPercent = (price, originalPrice) =>
  originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0;

// Unsplash serves resized, compressed variants via query params.
export const imageUrl = (url, width = 800) => (url.includes('?') ? url : `${url}?auto=format&fit=crop&w=${width}&q=75`);

export const GEM_THEMES = {
  sky: 'Stargazing',
  wildlife: 'Wildlife & birds',
  forest: 'Forests & jungles',
  valley: 'Valleys & viewpoints',
  coast: 'Coast & islands',
  culture: 'Village life',
};

export const CATEGORY_LABELS = {
  mountains: 'Mountains',
  beaches: 'Beaches',
  nature: 'Nature',
  culture: 'Culture & Heritage',
  international: 'International',
};
