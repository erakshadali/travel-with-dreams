const img = (id) => `https://images.unsplash.com/photo-${id}`;

// `slug` matches the `destination` field on each trip.
export const destinations = [
  { slug: 'himalayas', name: 'Himalayas', tagline: 'Ladakh, Spiti & Himachal', image: img('1544735716-392fe2489ffa'), popular: true },
  { slug: 'kashmir', name: 'Kashmir', tagline: 'Paradise on earth', image: img('1595815771614-ade9d652a65d'), popular: true },
  { slug: 'northeast', name: 'North-East India', tagline: 'Sikkim & Meghalaya', image: img('1470071459604-3b5ec3a7fe05'), popular: true },
  { slug: 'goa', name: 'Goa', tagline: 'Sun, sand & susegad', image: img('1587922546307-776227941871'), popular: true },
  { slug: 'kerala', name: 'Kerala', tagline: 'Backwaters & tea hills', image: img('1602216056096-3b40cc0c9944'), popular: true },
  { slug: 'rajasthan', name: 'Rajasthan', tagline: 'Forts, palaces & deserts', image: img('1477586957327-847a0f3f4fe3'), popular: true },
  { slug: 'andaman', name: 'Andaman', tagline: 'Island paradise', image: img('1559128010-7c1ad6e1b6a5'), popular: true },
  { slug: 'bali', name: 'Bali', tagline: 'Island of the Gods', image: img('1555400038-63f5ba517a47'), popular: true },
  { slug: 'thailand', name: 'Thailand', tagline: 'Land of Smiles', image: img('1552465011-b4e21bf6e79a'), popular: false },
];
