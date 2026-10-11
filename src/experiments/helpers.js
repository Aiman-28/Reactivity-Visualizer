import { mut } from '../composables/useEventLog';
/** Build a graph node whose label equals its id. */
export const N = (id, type) => ({ id, type, label: id });
/** Log + apply a numeric increment. */
export const inc = (id, o, k, d = 1) => mut(id, o, k, o[k] + d);
/** Log + toggle between two string values. */
export const flip = (id, o, k, a, b) => mut(id, o, k, o[k] === a ? b : a);
