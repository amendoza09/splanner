import { startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';

// Formats as local time. A bare "yyyy-MM-dd" from a date input is read as local
// midnight, because new Date() would otherwise treat it as UTC and shift the day.
export const toISOLocal = (val) => {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(val) ? new Date(`${val}T00:00:00`) : new Date(val);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
};

// The month's days, padded with nulls so the list fills whole Sunday-first weeks.
export const generateMonthDays = (date) => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const days = eachDayOfInterval({ start, end });
  const emptyCells = Array(getDay(start)).fill(null);
  const full = [...emptyCells, ...days];
  const rem = full.length % 7;
  return rem !== 0 ? [...full, ...Array(7 - rem).fill(null)] : full;
};

// Places one day's timed events side by side when they overlap. Each result
// gains `width` and `left` as fractions of the day column.
export const layoutEvents = (events) => {
  const sorted = [...events].sort((a, b) => a.startMinutes - b.startMinutes);

  const overlaps = (a, b) => a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;

  // Build clusters via union-find style grouping
  const clusters = [];
  for (const event of sorted) {
    const touching = clusters.filter(c => c.some(e => overlaps(e, event)));
    if (touching.length === 0) {
      clusters.push([event]);
    } else {
      // Merge all touching clusters together
      const merged = touching.flat();
      merged.push(event);
      touching.forEach(c => clusters.splice(clusters.indexOf(c), 1));
      clusters.push(merged);
    }
  }

  // Within each cluster, assign columns greedily
  const result = [];
  for (const cluster of clusters) {
    const cols = [];
    for (const event of cluster) {
      const openCol = cols.find(col => !col.some(e => overlaps(e, event)));
      if (openCol) openCol.push(event);
      else cols.push([event]);
    }
    cols.forEach((colEvents, col) => {
      colEvents.forEach(event => result.push({ ...event, col, totalCols: cols.length }));
    });
  }

  return result.map(e => ({
    ...e,
    width: 1 / e.totalCols,
    left: e.col / e.totalCols,
  }));
};
