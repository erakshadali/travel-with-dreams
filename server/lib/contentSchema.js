// What each editable collection looks like. One description drives both the server-side checks and the
// admin form (the form is built from GET /api/admin/content/schema), so they can never disagree.
//
// Records are rebuilt from these fields only: anything the form did not send is dropped, and anything that
// is sent is trimmed and bounds-checked, so a bad edit cannot break the public pages.
import { destinations } from '../data/destinations.js';
import { BREAKDOWN_SHARES } from '../data/trips.js';

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const titleCase = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const options = (values) => values.map((value) => ({ value, label: titleCase(String(value)) }));

const published = { key: 'published', label: 'Show on the website', type: 'bool', default: true, hint: 'Turn off to hide it from visitors without deleting it.' };

export const SCHEMAS = {
  trips: {
    label: 'Trips',
    one: 'trip',
    keyField: 'slug',
    titleField: 'title',
    groups: [
      {
        title: 'Basics',
        fields: [
          { key: 'title', label: 'Trip name', type: 'text', required: true, max: 90 },
          { key: 'slug', label: 'Web address', type: 'slug', required: true, max: 80, hint: 'Used in the trip link. Cannot be changed after the trip is created.' },
          { key: 'tagline', label: 'Short tagline', type: 'textarea', required: true, max: 200 },
          { key: 'destination', label: 'Destination', type: 'select', required: true, options: destinations.map((d) => ({ value: d.slug, label: d.name })) },
          { key: 'location', label: 'Location', type: 'text', required: true, max: 80 },
          { key: 'category', label: 'Category', type: 'select', required: true, options: options(Object.keys(BREAKDOWN_SHARES)) },
          { key: 'badge', label: 'Badge (optional)', type: 'text', max: 30, hint: 'A small label on the trip card, like Trending or New.' },
        ],
      },
      {
        title: 'Price (₹ per person)',
        fields: [
          { key: 'price', label: 'Price', type: 'number', required: true, int: true, min: 500, max: 1000000 },
          { key: 'originalPrice', label: 'Original price (optional)', type: 'number', int: true, min: 500, max: 1000000, hint: 'Shown crossed out. Must be higher than the price.' },
        ],
      },
      {
        title: 'Trip facts',
        fields: [
          { key: 'days', label: 'Days', type: 'number', required: true, int: true, min: 1, max: 60 },
          { key: 'nights', label: 'Nights', type: 'number', required: true, int: true, min: 0, max: 60 },
          { key: 'difficulty', label: 'Difficulty', type: 'select', required: true, options: ['Easy', 'Moderate', 'Challenging'].map((value) => ({ value, label: value })) },
          { key: 'groupSize', label: 'Group size', type: 'text', required: true, max: 20 },
          { key: 'bestTime', label: 'Best time', type: 'text', required: true, max: 40 },
          { key: 'startPoint', label: 'Start point', type: 'text', required: true, max: 60 },
          { key: 'departureWeekday', label: 'Departures leave on', type: 'select', required: true, number: true, options: WEEKDAYS.map((label, value) => ({ value, label })), hint: 'Departure dates repeat every 2 weeks on this day.' },
        ],
      },
      {
        title: 'Rating and visibility',
        fields: [
          { key: 'rating', label: 'Rating (0–5)', type: 'number', required: true, min: 0, max: 5 },
          { key: 'reviewCount', label: 'Number of reviews', type: 'number', required: true, int: true, min: 0, max: 100000 },
          { key: 'featured', label: 'Feature on the home page', type: 'bool', default: false },
          published,
        ],
      },
      {
        title: 'Photos',
        fields: [
          { key: 'image', label: 'Main photo link', type: 'image', required: true },
          { key: 'gallery', label: 'More photo links (one per line)', type: 'urls', max: 12 },
        ],
      },
      {
        title: 'Details shown on the trip page',
        fields: [
          { key: 'overview', label: 'Overview', type: 'textarea', required: true, max: 2000, rows: 6 },
          { key: 'highlights', label: 'Highlights (one per line)', type: 'lines', max: 12, itemMax: 160 },
          {
            key: 'itinerary',
            label: 'Day-by-day itinerary',
            type: 'list',
            max: 60,
            numbered: 'day',
            item: [
              { key: 'title', label: 'Title', type: 'text', required: true, max: 120 },
              { key: 'description', label: 'What happens', type: 'textarea', required: true, max: 800, rows: 3 },
            ],
          },
          { key: 'inclusions', label: 'Included (one per line)', type: 'lines', max: 25, itemMax: 200 },
          { key: 'exclusions', label: 'Not included (one per line)', type: 'lines', max: 25, itemMax: 200 },
        ],
      },
    ],
    // Fields the form does not show but the public pages need.
    check: (value, errors) => {
      if (value.originalPrice !== undefined && value.originalPrice <= value.price) errors.originalPrice = 'The original price must be higher than the price.';
    },
  },

  gems: {
    label: 'Unexplored spots',
    one: 'spot',
    keyField: 'slug',
    titleField: 'name',
    groups: [
      {
        title: 'Basics',
        fields: [
          { key: 'name', label: 'Spot name', type: 'text', required: true, max: 80 },
          { key: 'slug', label: 'Web address', type: 'slug', required: true, max: 80, hint: 'Cannot be changed after the spot is created.' },
          { key: 'region', label: 'Region', type: 'text', required: true, max: 80 },
          { key: 'destination', label: 'Destination', type: 'select', required: true, options: destinations.map((d) => ({ value: d.slug, label: d.name })) },
          { key: 'theme', label: 'Theme', type: 'select', required: true, options: options(['sky', 'valley', 'forest', 'wildlife', 'coast', 'culture']) },
          { key: 'tripSlugs', label: 'Trips it is near', type: 'multi', optionsFrom: 'trips' },
          { key: 'featured', label: 'Feature on the home page', type: 'bool', default: false },
          published,
        ],
      },
      {
        title: 'Story',
        fields: [
          { key: 'image', label: 'Photo link', type: 'image', required: true },
          { key: 'tagline', label: 'Tagline', type: 'text', required: true, max: 140 },
          { key: 'description', label: 'Description', type: 'textarea', required: true, max: 1200, rows: 5 },
          { key: 'bestSeason', label: 'Best season', type: 'text', required: true, max: 40 },
          { key: 'bestView', label: 'Best view', type: 'text', required: true, max: 200 },
          { key: 'natureNotes', label: 'Nature notes', type: 'textarea', required: true, max: 500 },
          { key: 'expert.role', label: 'Expert role', type: 'text', required: true, max: 60 },
          { key: 'expert.tip', label: 'Expert tip', type: 'textarea', required: true, max: 500 },
          { key: 'respect', label: 'How to respect the place', type: 'textarea', required: true, max: 300 },
        ],
      },
    ],
  },

  testimonials: {
    label: 'Reviews',
    one: 'review',
    keyField: 'id',
    titleField: 'name',
    groups: [
      {
        title: 'Review',
        fields: [
          { key: 'name', label: 'Customer name', type: 'text', required: true, max: 60 },
          { key: 'from', label: 'From (city)', type: 'text', required: true, max: 60 },
          { key: 'trip', label: 'Trip they took', type: 'text', required: true, max: 90 },
          { key: 'rating', label: 'Rating (1–5)', type: 'number', required: true, int: true, min: 1, max: 5 },
          { key: 'quote', label: 'Review text', type: 'textarea', required: true, min: 10, max: 600, rows: 5, hint: 'Only publish reviews you have the customer’s permission to use.' },
          published,
        ],
      },
    ],
  },
};

const allFields = (schema) => schema.groups.flatMap((group) => group.fields);

// Dotted keys ("expert.tip") live inside a nested object on the record.
export function getPath(record, key) {
  return key.split('.').reduce((value, part) => (value && typeof value === 'object' ? value[part] : undefined), record);
}

function setPath(record, key, value) {
  const parts = key.split('.');
  let target = record;
  for (const part of parts.slice(0, -1)) target = target[part] ??= {};
  target[parts.at(-1)] = value;
}

const isUrl = (value) => /^https:\/\/[^\s]+$/.test(value) || /^\/[^\s/][^\s]*$/.test(value);

// Reads one field from `raw`. Returns { value } (value may be undefined for an empty optional field)
// or { error }.
function readField(field, raw, context) {
  const label = field.label.replace(/ \(.*\)$/, '');
  const empty = raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '');

  switch (field.type) {
    case 'bool':
      return { value: raw === undefined ? field.default ?? false : raw === true };

    case 'text':
    case 'textarea':
    case 'slug':
    case 'image': {
      if (empty) return field.required ? { error: `${label} is required.` } : { value: undefined };
      if (typeof raw !== 'string') return { error: `${label} must be text.` };
      const value = raw.trim();
      if (field.min && value.length < field.min) return { error: `${label} needs at least ${field.min} characters.` };
      if (value.length > (field.max ?? 500)) return { error: `${label} can be at most ${field.max ?? 500} characters.` };
      if (field.type === 'slug' && !SLUG_RE.test(value)) return { error: 'Use only lowercase letters, numbers and hyphens, like goa-beach-escape.' };
      if (field.type === 'image' && !isUrl(value)) return { error: 'Use a full https:// link to the photo.' };
      return { value };
    }

    case 'number': {
      if (empty) return field.required ? { error: `${label} is required.` } : { value: undefined };
      const value = Number(raw);
      if (!Number.isFinite(value)) return { error: `${label} must be a number.` };
      if (field.int && !Number.isInteger(value)) return { error: `${label} must be a whole number.` };
      if (field.min !== undefined && value < field.min) return { error: `${label} must be at least ${field.min}.` };
      if (field.max !== undefined && value > field.max) return { error: `${label} can be at most ${field.max}.` };
      return { value };
    }

    case 'select': {
      if (empty) return { error: `Choose a ${label.toLowerCase()}.` };
      const choice = field.options.find((option) => String(option.value) === String(raw));
      return choice ? { value: choice.value } : { error: `Choose a valid ${label.toLowerCase()}.` };
    }

    case 'lines':
    case 'urls': {
      const list = raw === undefined ? [] : raw;
      if (!Array.isArray(list)) return { error: `${label} must be a list.` };
      const items = list.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
      if (items.length > (field.max ?? 30)) return { error: `${label} can have at most ${field.max ?? 30} lines.` };
      if (field.type === 'urls' && items.some((item) => !isUrl(item))) return { error: 'Every photo link must start with https://.' };
      if (field.type === 'lines' && items.some((item) => item.length > (field.itemMax ?? 300))) return { error: `Each line can be at most ${field.itemMax ?? 300} characters.` };
      return { value: items };
    }

    case 'multi': {
      const list = raw === undefined ? [] : raw;
      if (!Array.isArray(list)) return { error: `${label} must be a list.` };
      const allowed = new Set((context.optionValues[field.optionsFrom] ?? []).map((option) => option.value));
      return { value: [...new Set(list.filter((item) => allowed.has(item)))] };
    }

    case 'list': {
      const list = raw === undefined ? [] : raw;
      if (!Array.isArray(list)) return { error: `${label} must be a list.` };
      if (list.length > (field.max ?? 30)) return { error: `${label} can have at most ${field.max ?? 30} entries.` };
      const items = [];
      for (const [index, entry] of list.entries()) {
        const item = field.numbered ? { [field.numbered]: index + 1 } : {};
        for (const sub of field.item) {
          const result = readField(sub, entry?.[sub.key], context);
          if (result.error) return { error: `${label}, entry ${index + 1}: ${result.error}` };
          if (result.value !== undefined) item[sub.key] = result.value;
        }
        items.push(item);
      }
      return { value: items };
    }

    default:
      return { error: `Unsupported field ${field.key}.` };
  }
}

// `optionValues` carries lists that depend on live data, as { trips: [{ value, label }] }.
// Returns { value, errors }. `keyValue` is the fixed key when editing; when creating it comes from the input.
export function validateRecord(collection, input, { keyValue, optionValues = {} } = {}) {
  const schema = SCHEMAS[collection];
  const body = input && typeof input === 'object' ? input : {};
  const value = {};
  const errors = {};

  for (const field of allFields(schema)) {
    if (field.key === schema.keyField) continue;
    const result = readField(field, getPath(body, field.key), { optionValues });
    if (result.error) errors[field.key] = result.error;
    else if (result.value !== undefined) setPath(value, field.key, result.value);
  }

  if (collection === 'testimonials') {
    value.id = keyValue === undefined ? `t${Date.now()}` : /^\d+$/.test(keyValue) ? Number(keyValue) : keyValue;
  } else {
    const slugField = allFields(schema).find((field) => field.key === schema.keyField);
    const result = keyValue === undefined ? readField(slugField, body[schema.keyField], { optionValues }) : { value: keyValue };
    if (result.error) errors[schema.keyField] = result.error;
    else value[schema.keyField] = result.value;
  }

  if (Object.keys(errors).length === 0) schema.check?.(value, errors);
  return { value, errors };
}

// What the admin form needs, with live option lists filled in.
export function schemaForClient(optionValues) {
  const fill = (field) => (field.optionsFrom ? { ...field, options: optionValues[field.optionsFrom] ?? [] } : field);
  return Object.fromEntries(
    Object.entries(SCHEMAS).map(([name, schema]) => [
      name,
      { ...schema, check: undefined, groups: schema.groups.map((group) => ({ ...group, fields: group.fields.map(fill) })) },
    ]),
  );
}
