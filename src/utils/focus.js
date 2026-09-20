// After a failed submit, move focus to the first invalid control so keyboard and
// screen-reader users land on the problem instead of hunting for it.
export function focusFirstInvalid(root) {
  requestAnimationFrame(() => root?.querySelector('[aria-invalid="true"]')?.focus());
}
