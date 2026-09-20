export const DURATIONS = [
  { value: '', label: 'Any duration', test: () => true },
  { value: 'short', label: 'Up to 5 days', test: (trip) => trip.days <= 5 },
  { value: 'week', label: '6–7 days', test: (trip) => trip.days >= 6 && trip.days <= 7 },
  { value: 'long', label: '8+ days', test: (trip) => trip.days >= 8 },
];

export const SORTS = [
  { value: 'popular', label: 'Most popular', compare: (a, b) => b.reviewCount - a.reviewCount },
  { value: 'price-asc', label: 'Price: low to high', compare: (a, b) => a.price - b.price },
  { value: 'price-desc', label: 'Price: high to low', compare: (a, b) => b.price - a.price },
  { value: 'duration', label: 'Shortest first', compare: (a, b) => a.days - b.days },
];
