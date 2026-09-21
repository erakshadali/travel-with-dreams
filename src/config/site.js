// ===========================================================================
//  LAZY TRAVELLERS — brand, contact details and colours in one place.
//
//  Run `npm run dev` and edit anything below: the page updates on save.
//  Nothing here needs a push, a build or a redeploy.
//
//  Other things the customer can ask you to change:
//    - Trips, prices, itineraries ........ server/data/trips.js
//    - Destinations (cards on the home) .. server/data/destinations.js
//    - Unexplored / "hidden gem" spots ... server/data/gems.js
//    - Reviews ........................... server/data/testimonials.js
//    - Photos (own instead of stock) ..... put files in /public and use '/name.jpg'
// ===========================================================================
export const SITE = {
  // ---------- Brand ----------
  name: 'Lazy Travellers',
  tagline: 'Trips that become stories', // browser tab title + share previews
  description:
    'Lazy Travellers — small-group trips across India and abroad. Ladakh, Spiti, Kashmir, Kerala, Goa, Bali and more, with expert trip captains and transparent pricing.',
  // Optional own logo: drop a file in /public (e.g. '/logo.png') and set it here.
  // Leave empty to use the built-in sunset mark.
  logo: '',

  // ---------- Customer contact details (footer + contact page) ----------
  phone: '+91 98765 43210',
  phoneHref: 'tel:+919876543210',
  email: 'hello@lazytravellers.example',
  address: '12 Sample Street, Connaught Place, New Delhi 110001',
  hours: 'Mon – Sat, 10:00 am – 7:00 pm IST',

  // ---------- Colours (any hex value; tints and hover shades are derived automatically) ----------
  theme: {
    ink: '#14231f', // deep text + footer
    primary: '#1f4a42', // evergreen: main buttons, links, dark sections
    accent: '#c9963c', // brass: highlights, call-to-action buttons
  },

  // ---------- Home page hero ----------
  hero: {
    eyebrow: 'Small-group trips across India & beyond',
    headline: ['Travel with dreams.', 'Return with stories.'], // two lines; the second is highlighted
    lead: 'Hand-crafted journeys to the Himalayas, beaches, palaces and backwaters — with expert trip captains, real stays and pricing you can see line by line.',
    // The dark background photo behind EVERY page (and the hero). Use a wide, dark-ish landscape;
    // your own file works too: put it in /public and use '/background.jpg'.
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
  },

  // Short blurb under the logo in the footer.
  footerBlurb: 'Small-group trips across India and beyond, led by trip captains who love the places they take you.',
};
