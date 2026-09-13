/** Makes LIKE wildcards literal. PostgREST also treats `*` as `%`. */
export function escapeLikePattern(value: string) {
  return value.replace(/[\\%_*]/g, '\\$&');
}
