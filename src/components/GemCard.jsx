import { Link } from 'react-router-dom';
import { BadgeCheck, Bird, CalendarDays, Eye, HeartHandshake, Leaf, MapPin, Moon, Mountain, TreePine, Users, Waves } from 'lucide-react';
import Img from './Img';
import { GEM_THEMES } from '../utils/format';
import '../styles/Unexplored.css';

const THEME_ICONS = { sky: Moon, wildlife: Bird, forest: TreePine, valley: Mountain, coast: Waves, culture: Users };

// One offbeat spot: what it is, when and where to look, what nature to expect, and an expert tip.
// `compact` trims it for the home page and trip pages (no long description / nature notes).
export default function GemCard({ gem, compact = false }) {
  const ThemeIcon = THEME_ICONS[gem.theme];
  const enquiry = `/contact?${new URLSearchParams({ trip: gem.tripSlugs[0] ?? '', spot: gem.name })}`;

  return (
    <article className="gem-card" id={`gem-${gem.slug}`}>
      <div className="gem-card__media">
        <Img src={gem.image} alt="" width={800} sizes="(min-width: 1100px) 380px, (min-width: 700px) 45vw, 100vw" />
        <span className="gem-card__theme">
          <ThemeIcon aria-hidden="true" />
          {GEM_THEMES[gem.theme]}
        </span>
      </div>

      <div className="gem-card__body">
        <p className="gem-card__region">
          <MapPin aria-hidden="true" />
          {gem.region}
        </p>
        <h3>{gem.name}</h3>
        <p className="gem-card__tagline">{gem.tagline}</p>
        {!compact && <p className="gem-card__description">{gem.description}</p>}

        <dl className="gem-card__facts">
          <div>
            <dt>
              <CalendarDays aria-hidden="true" />
              Best season
            </dt>
            <dd>{gem.bestSeason}</dd>
          </div>
          <div>
            <dt>
              <Eye aria-hidden="true" />
              Best view
            </dt>
            <dd>{gem.bestView}</dd>
          </div>
          {!compact && (
            <div>
              <dt>
                <Leaf aria-hidden="true" />
                Nature notes
              </dt>
              <dd>{gem.natureNotes}</dd>
            </div>
          )}
        </dl>

        <div className="gem-card__expert">
          <p className="gem-card__expert-label">
            <BadgeCheck aria-hidden="true" />
            Expert tip · {gem.expert.role}
          </p>
          <p>{gem.expert.tip}</p>
        </div>

        {!compact && (
          <p className="gem-card__respect">
            <HeartHandshake aria-hidden="true" />
            <span>
              <strong>Travel gently:</strong> {gem.respect}
            </span>
          </p>
        )}

        <Link to={enquiry} className="btn btn--outline btn--sm">
          Ask about this spot
        </Link>
      </div>
    </article>
  );
}
