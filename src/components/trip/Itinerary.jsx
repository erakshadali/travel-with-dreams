import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Itinerary({ days }) {
  const [openDays, setOpenDays] = useState(() => new Set([days[0]?.day]));
  const allOpen = openDays.size === days.length;

  const toggle = (day) =>
    setOpenDays((current) => {
      const next = new Set(current);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });

  return (
    <div>
      <button type="button" className="link-button itinerary__toggle-all" onClick={() => setOpenDays(allOpen ? new Set() : new Set(days.map((d) => d.day)))}>
        {allOpen ? 'Collapse all days' : 'Expand all days'}
      </button>

      <ol className="itinerary">
        {days.map(({ day, title, description }) => {
          const open = openDays.has(day);
          return (
            <li key={day} className={`itinerary__item${open ? ' is-open' : ''}`}>
              <h3>
                <button type="button" aria-expanded={open} aria-controls={`day-${day}`} onClick={() => toggle(day)}>
                  <span className="itinerary__day">Day {day}</span>
                  <span className="itinerary__title">{title}</span>
                  <ChevronDown aria-hidden="true" />
                </button>
              </h3>
              <div className="itinerary__panel" id={`day-${day}`} inert={!open}>
                <div>
                  <p>{description}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
