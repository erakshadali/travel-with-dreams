// Label + control + inline error/hint, wired up with the right aria attributes.
// Use `as="select"` / `as="textarea"` for other controls; children pass through (e.g. <option>s).
export default function Field({ id, label, error, hint, required = false, as: Control = 'input', ...controlProps }) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label htmlFor={id}>
        {label}
        {required && <span className="field__required" aria-hidden="true"> *</span>}
      </label>
      <Control id={id} name={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} aria-required={required || undefined} {...controlProps} />
      {error ? (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      ) : (
        hint && (
          <p className="field__hint" id={hintId}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}
