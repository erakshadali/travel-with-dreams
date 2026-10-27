import { Router } from 'express';
import { destinations } from '../data/destinations.js';
import { listPublished } from '../lib/contentStore.js';
import { findTrip, listTrips, tripDetail } from '../lib/tripService.js';

const router = Router();

router.get('/trips', async (req, res) => {
  const limit = Number.parseInt(req.query.limit, 10);
  res.json(
    await listTrips({
      featured: req.query.featured === 'true',
      destination: typeof req.query.destination === 'string' ? req.query.destination : undefined,
      limit: Number.isInteger(limit) && limit > 0 ? limit : undefined,
    }),
  );
});

router.get('/trips/:slug', async (req, res) => {
  const trip = await findTrip(req.params.slug);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  return res.json(tripDetail(trip));
});

router.get('/destinations', async (req, res) => {
  const counts = (await listTrips()).reduce((acc, trip) => {
    acc[trip.destination] = (acc[trip.destination] ?? 0) + 1;
    return acc;
  }, {});
  res.json(destinations.map((destination) => ({ ...destination, tripCount: counts[destination.slug] ?? 0 })));
});

// Optional filters: ?featured=true, ?theme=wildlife, ?destination=himalayas, ?trip=<trip slug>
router.get('/gems', async (req, res) => {
  const { featured, theme, destination, trip } = req.query;
  res.json(
    (await listPublished('gems'))
      .filter((gem) => featured !== 'true' || gem.featured)
      .filter((gem) => typeof theme !== 'string' || gem.theme === theme)
      .filter((gem) => typeof destination !== 'string' || gem.destination === destination)
      .filter((gem) => typeof trip !== 'string' || gem.tripSlugs.includes(trip)),
  );
});

router.get('/testimonials', async (req, res) => {
  res.json(await listPublished('testimonials'));
});

export default router;
