import { format } from 'date-fns';
import { generateMonthDays, layoutEvents, toISOLocal } from './calendar';

// `npm test` runs in America/New_York on purpose. A UTC machine can't catch
// dates that shift a day when they're read as UTC.

describe('toISOLocal', () => {
  test('keeps a date-only value on the same calendar day', () => {
    expect(toISOLocal('2026-03-15')).toBe('2026-03-15T00:00:00');
  });

  test('formats a Date in local time', () => {
    expect(toISOLocal(new Date(2026, 0, 5, 9, 7))).toBe('2026-01-05T09:07:00');
  });

  test('keeps the local time from a datetime-local input', () => {
    expect(toISOLocal('2026-07-04T18:30')).toBe('2026-07-04T18:30:00');
  });

  test('marks an unparseable value with NaN, which EventCard rejects', () => {
    expect(toISOLocal('')).toContain('NaN');
  });
});

describe('generateMonthDays', () => {
  const realDays = (cells) => cells.filter(Boolean).map((d) => format(d, 'yyyy-MM-dd'));

  test('adds no padding when the month fills whole weeks', () => {
    const cells = generateMonthDays(new Date(2026, 1, 10));
    expect(cells).toHaveLength(28);
    expect(cells.every(Boolean)).toBe(true);
  });

  test('starts the first day under the correct weekday', () => {
    const cells = generateMonthDays(new Date(2026, 7, 20));
    expect(cells.slice(0, 6)).toEqual(Array(6).fill(null));
    expect(format(cells[6], 'yyyy-MM-dd')).toBe('2026-08-01');
    expect(cells[6].getDay()).toBe(6);
  });

  test('always produces whole weeks', () => {
    for (let month = 0; month < 12; month++) {
      expect(generateMonthDays(new Date(2026, month, 1)).length % 7).toBe(0);
    }
  });

  test('includes each day of a daylight-saving month exactly once', () => {
    const days = realDays(generateMonthDays(new Date(2026, 10, 15)));
    expect(days).toHaveLength(30);
    expect(new Set(days).size).toBe(30);
    expect(days[0]).toBe('2026-11-01');
    expect(days[29]).toBe('2026-11-30');
  });

  test('handles a leap-year February', () => {
    expect(realDays(generateMonthDays(new Date(2028, 1, 1)))).toHaveLength(29);
  });
});

describe('layoutEvents', () => {
  const ev = (id, startMinutes, endMinutes) => ({ id, startMinutes, endMinutes });
  const byId = (laidOut) => Object.fromEntries(laidOut.map((e) => [e.id, e]));

  test('returns nothing for an empty day', () => {
    expect(layoutEvents([])).toEqual([]);
  });

  test('gives separate events the full width', () => {
    const { a, b } = byId(layoutEvents([ev('a', 60, 120), ev('b', 180, 240)]));
    expect(a).toMatchObject({ width: 1, left: 0 });
    expect(b).toMatchObject({ width: 1, left: 0 });
  });

  test('does not treat back-to-back events as overlapping', () => {
    const { a, b } = byId(layoutEvents([ev('a', 60, 120), ev('b', 120, 180)]));
    expect(a.width).toBe(1);
    expect(b.width).toBe(1);
  });

  test('splits overlapping events into equal columns', () => {
    const { a, b } = byId(layoutEvents([ev('a', 60, 120), ev('b', 90, 150)]));
    expect(a).toMatchObject({ width: 0.5, left: 0 });
    expect(b).toMatchObject({ width: 0.5, left: 0.5 });
  });

  test('applies the final column count to every event in a cluster', () => {
    const { a, b, c } = byId(layoutEvents([ev('a', 0, 120), ev('b', 30, 120), ev('c', 60, 120)]));
    expect([a.width, b.width, c.width]).toEqual([1 / 3, 1 / 3, 1 / 3]);
    expect(new Set([a.left, b.left, c.left]).size).toBe(3);
  });

  test('reuses a free column in a chain of overlaps', () => {
    const { a, b, c } = byId(layoutEvents([ev('a', 0, 60), ev('b', 30, 90), ev('c', 70, 120)]));
    expect([a.totalCols, b.totalCols, c.totalCols]).toEqual([2, 2, 2]);
    expect(c.col).toBe(a.col);
  });

  test('sizes separate clusters independently', () => {
    const { a, b, c } = byId(layoutEvents([ev('a', 0, 60), ev('b', 30, 90), ev('c', 300, 360)]));
    expect(a.width).toBe(0.5);
    expect(b.width).toBe(0.5);
    expect(c.width).toBe(1);
  });

  test('gives the same layout whatever order events arrive in', () => {
    const events = [ev('a', 0, 60), ev('b', 30, 90), ev('c', 70, 120)];
    const summary = (list) => Object.values(byId(list)).map((e) => [e.id, e.col, e.totalCols]).sort();
    expect(summary(layoutEvents([...events].reverse()))).toEqual(summary(layoutEvents(events)));
  });

  test('keeps the event data the view needs and leaves the input alone', () => {
    const input = [{ ...ev('a', 60, 120), title: 'Dentist', color: '#fff' }];
    const [laidOut] = layoutEvents(input);
    expect(laidOut).toMatchObject({ title: 'Dentist', color: '#fff' });
    expect(input[0]).not.toHaveProperty('width');
  });
});
