import LineColumnFinder from 'line-column';
import { LocationValue } from '../domain/models/LocationValue';

export function getCodeString(data, start: LocationValue, end: LocationValue): string {
  let from = new LineColumnFinder(data).toIndex(start.line, start.column + 1);
  let to = new LineColumnFinder(data).toIndex(end.line, end.column + 1);
  return data.slice(from, to);
}
