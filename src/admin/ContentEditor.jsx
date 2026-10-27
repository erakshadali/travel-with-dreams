import { useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, Plus, Save, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { adminApi } from '../api/client';
import Field from '../components/Field';
import { ErrorState } from '../components/States';
import { focusFirstInvalid } from '../utils/focus';
import { keyOf } from './format';
import { useAdminData } from './useAdminData';

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const fieldId = (key) => `f-${key.replace(/\./g, '-')}`;

const getPath = (record, key) => key.split('.').reduce((value, part) => (value && typeof value === 'object' ? value[part] : undefined), record);

function setPath(record, key, value) {
  const parts = key.split('.');
  let target = record;
  for (const part of parts.slice(0, -1)) target = target[part] ??= {};
  target[parts.at(-1)] = value;
}

const allFields = (schema) => schema.groups.flatMap((group) => group.fields);

// Record -> what the form controls hold (text boxes hold strings, one-per-line lists hold a block of text).
function toForm(schema, record) {
  const form = {};
  for (const field of allFields(schema)) {
    const raw = getPath(record, field.key);
    if (field.type === 'bool') form[field.key] = raw ?? field.default ?? false;
    else if (field.type === 'lines' || field.type === 'urls') form[field.key] = (raw ?? []).join('\n');
    else if (field.type === 'multi') form[field.key] = raw ?? [];
    else if (field.type === 'list') form[field.key] = (raw ?? []).map((entry) => ({ ...entry }));
    else form[field.key] = raw === undefined || raw === null ? '' : String(raw);
  }
  return form;
}

// Form -> the JSON the server expects (dotted keys become nested objects).
function toPayload(schema, form) {
  const body = {};
  for (const field of allFields(schema)) {
    const value = form[field.key];
    if (field.type === 'lines' || field.type === 'urls') setPath(body, field.key, value.split('\n'));
    else setPath(body, field.key, value);
  }
  return body;
}

function ListEditor({ field, value, error, onChange }) {
  const move = (index, step) => {
    const next = [...value];
    [next[index], next[index + step]] = [next[index + step], next[index]];
    onChange(next);
  };
  const update = (index, key, text) => onChange(value.map((entry, position) => (position === index ? { ...entry, [key]: text } : entry)));

  return (
    <fieldset className={`list-editor${error ? ' field--error' : ''}`}>
      <legend>{field.label}</legend>
      {value.map((entry, index) => (
        <div className="list-editor__item" key={index}>
          <div className="list-editor__head">
            <strong>{field.numbered === 'day' ? `Day ${index + 1}` : `Entry ${index + 1}`}</strong>
            <span className="list-editor__tools">
              <button type="button" className="icon-btn icon-btn--sm" aria-label={`Move day ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp aria-hidden="true" /></button>
              <button type="button" className="icon-btn icon-btn--sm" aria-label={`Move day ${index + 1} down`} disabled={index === value.length - 1} onClick={() => move(index, 1)}><ArrowDown aria-hidden="true" /></button>
              <button type="button" className="icon-btn icon-btn--sm" aria-label={`Remove day ${index + 1}`} onClick={() => onChange(value.filter((_, position) => position !== index))}><Trash2 aria-hidden="true" /></button>
            </span>
          </div>
          {field.item.map((sub) => (
            <Field
              key={sub.key}
              id={`${fieldId(field.key)}-${index}-${sub.key}`}
              label={sub.label}
              as={sub.type === 'textarea' ? 'textarea' : 'input'}
              rows={sub.rows}
              maxLength={sub.max}
              value={entry[sub.key] ?? ''}
              onChange={(event) => update(index, sub.key, event.target.value)}
            />
          ))}
        </div>
      ))}
      {error && <p className="field__error" role="alert">{error}</p>}
      <button type="button" className="btn btn--outline btn--sm" onClick={() => onChange([...value, Object.fromEntries(field.item.map((sub) => [sub.key, '']))])}>
        <Plus aria-hidden="true" />
        Add {field.numbered === 'day' ? 'a day' : 'an entry'}
      </button>
    </fieldset>
  );
}

function FormField({ field, form, errors, editing, set }) {
  const id = fieldId(field.key);
  const error = errors[field.key];
  const value = form[field.key];

  if (field.type === 'bool') {
    return (
      <div className="field field--check">
        <label className="check">
          <input id={id} type="checkbox" checked={value} onChange={(event) => set(field.key, event.target.checked)} />
          <span>{field.label}</span>
        </label>
        {field.hint && <p className="field__hint">{field.hint}</p>}
      </div>
    );
  }

  if (field.type === 'multi') {
    return (
      <fieldset className="field multi">
        <legend>{field.label}</legend>
        {field.options.map((option) => (
          <label className="check" key={option.value}>
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              onChange={(event) => set(field.key, event.target.checked ? [...value, option.value] : value.filter((entry) => entry !== option.value))}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
    );
  }

  if (field.type === 'list') return <ListEditor field={field} value={value} error={error} onChange={(next) => set(field.key, next)} />;

  if (field.type === 'select') {
    return (
      <Field id={id} label={field.label} as="select" required={field.required} error={error} hint={field.hint} value={value} onChange={(event) => set(field.key, event.target.value)}>
        <option value="">Choose…</option>
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </Field>
    );
  }

  const multiline = field.type === 'textarea' || field.type === 'lines' || field.type === 'urls';
  return (
    <>
      <Field
        id={id}
        label={field.label}
        as={multiline ? 'textarea' : 'input'}
        rows={multiline ? field.rows ?? (field.type === 'textarea' ? 3 : 5) : undefined}
        type={field.type === 'number' ? 'number' : undefined}
        inputMode={field.type === 'number' ? 'decimal' : undefined}
        step={field.type === 'number' ? (field.int ? 1 : 'any') : undefined}
        required={field.required}
        maxLength={field.max && !multiline ? field.max : undefined}
        disabled={field.type === 'slug' && editing}
        error={error}
        hint={field.hint}
        value={value}
        onChange={(event) => set(field.key, event.target.value)}
      />
      {field.type === 'image' && value && <img className="editor-preview" src={value} alt="" loading="lazy" referrerPolicy="no-referrer" />}
    </>
  );
}

function EditorForm({ collection, schema, record, creating }) {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [form, setForm] = useState(() => toForm(schema, record));
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ busy: false, message: '', error: '' });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!creating || Boolean(form.slug));
  const titleKey = schema.titleField;

  const set = (key, value) => {
    setState((previous) => ({ ...previous, message: '' }));
    if (key === 'slug') setSlugTouched(true);
    setForm((previous) => {
      const next = { ...previous, [key]: value };
      if (key === titleKey && creating && !slugTouched && 'slug' in previous) next.slug = slugify(value);
      return next;
    });
  };

  async function save(event) {
    event.preventDefault();
    setState({ busy: true, message: '', error: '' });
    setErrors({});
    try {
      const body = toPayload(schema, form);
      if (creating) {
        const created = await adminApi.contentCreate(collection, body);
        navigate(`/admin/content/${collection}/${encodeURIComponent(keyOf(collection, created))}`, { replace: true });
        return;
      }
      await adminApi.contentUpdate(collection, keyOf(collection, record), body);
      setState({ busy: false, message: 'Saved. The website shows this within a few seconds.', error: '' });
    } catch (failure) {
      setErrors(failure.fields ?? {});
      setState({ busy: false, message: '', error: failure.message });
      focusFirstInvalid(formRef.current);
    }
  }

  async function remove() {
    setState({ busy: true, message: '', error: '' });
    try {
      await adminApi.contentDelete(collection, keyOf(collection, record));
      navigate(`/admin/content?c=${collection}`, { replace: true });
    } catch (failure) {
      setState({ busy: false, message: '', error: failure.message });
    }
  }

  const heading = creating ? `New ${schema.one}` : form[titleKey] || schema.one;
  const link = collection === 'trips' && !creating && form.published ? `/trips/${record.slug}` : null;

  return (
    <>
      <header className="admin-head">
        <div>
          <Link className="back-link" to={`/admin/content?c=${collection}`}>
            <ArrowLeft aria-hidden="true" />
            All {schema.label.toLowerCase()}
          </Link>
          <h1>{heading}</h1>
        </div>
        {link && (
          <a className="btn btn--outline btn--sm" href={link} target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden="true" />
            View on website
          </a>
        )}
      </header>

      <form ref={formRef} onSubmit={save} noValidate>
        {schema.groups.map((group) => (
          <section className="admin-card editor-group" key={group.title} aria-label={group.title}>
            <h2 className="admin-h2">{group.title}</h2>
            <div className="editor-grid">
              {group.fields.map((field) => (
                <div key={field.key} className={`editor-cell${['textarea', 'lines', 'urls', 'list', 'multi', 'image'].includes(field.type) ? ' editor-cell--wide' : ''}`}>
                  <FormField field={field} form={form} errors={errors} editing={!creating} set={set} />
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="editor-bar">
          <div className="editor-bar__status" role="status">
            {state.error && <span className="field__error">{state.error}</span>}
            {state.message && <span className="admin-saved">{state.message}</span>}
          </div>
          {!creating && (
            confirmDelete ? (
              <span className="editor-bar__confirm">
                Delete this {schema.one}?
                <button type="button" className="btn btn--outline btn--sm" onClick={remove} disabled={state.busy}>Yes, delete</button>
                <button type="button" className="btn btn--outline btn--sm" onClick={() => setConfirmDelete(false)}>Keep it</button>
              </span>
            ) : (
              <button type="button" className="btn btn--outline btn--sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 aria-hidden="true" />
                Delete
              </button>
            )
          )}
          <button type="submit" className="btn btn--cta" disabled={state.busy}>
            <Save aria-hidden="true" />
            {state.busy ? 'Saving…' : creating ? `Create ${schema.one}` : 'Save changes'}
          </button>
        </div>
      </form>
    </>
  );
}

// A blank record for the "new" form, or a copy of an existing one (hidden until the owner turns it on).
function startingRecord(collection, schema, source) {
  if (!source) return {};
  const copy = structuredClone(source);
  if (collection !== 'testimonials') {
    delete copy.slug;
    copy[schema.titleField] = `${source[schema.titleField]} (copy)`;
    copy.slug = `${source.slug}-copy`;
  }
  copy.published = false;
  copy.featured = false;
  return copy;
}

export default function ContentEditor() {
  const { collection, key } = useParams();
  const [params] = useSearchParams();
  const creating = key === 'new';
  const { data, error, loading, reload } = useAdminData(
    async () => {
      const [schema, list] = await Promise.all([adminApi.contentSchema(), adminApi.contentList(collection)]);
      return { schema: schema[collection], items: list.items };
    },
    `editor-${collection}-${key}`,
  );

  if (loading && !data) return <p className="admin-muted" role="status">Loading…</p>;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data.schema) return <ErrorState message="That kind of content does not exist." />;

  const find = (wanted) => data.items.find((item) => keyOf(collection, item) === wanted);
  const record = creating ? startingRecord(collection, data.schema, params.get('from') ? find(params.get('from')) : null) : find(key);
  if (!record) return <ErrorState message="We could not find that item. It may have been deleted." />;

  return <EditorForm key={`${collection}-${key}-${params.get('from') ?? ''}`} collection={collection} schema={data.schema} record={record} creating={creating} />;
}
