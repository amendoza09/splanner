import { useState, useEffect, useRef } from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';

const HOUR_HEIGHT = 50;
const TOTAL_HOURS = 24;
// Left gutter holds hour labels (and now the prev-week arrow on row 1); right
// gutter is new — it exists purely so the next-week arrow has a column that
// lines up with every other grid row in this view (hour lines, events, now-line).
const GRID_TEMPLATE = '36px repeat(7, 1fr) 36px';

const WeeklyView = ({ members, selectedDate, onEventOpen, onSelectedEvent, onDeleteEvent, onWeekChange }) => {
  const [now, setNow] = useState(new Date());
  const currentMonth = useState(new Date());
  const scrollRef = useRef(null);
  const nowLineRef = useRef(null);

  const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
  const referenceDate = selectedDate ? new Date(selectedDate) : new Date();
  const currentDate = format(new Date(), 'yyyy-MM-dd');
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  const nowTop = (minutesSinceMidnight / 60) * HOUR_HEIGHT;

  const allEvents = members.flatMap(member =>
    (member.events || []).map(event => {
      const start = new Date(event.start_time);
      const end = new Date(event.end_time);
      return {
        id: event.event_id,
        title: event.title,
        date: format(start, "yyyy-MM-dd"),
        start_time: start,
        end_time: end,
        startMinutes: start.getHours() * 60 + start.getMinutes(),
        endMinutes: end.getHours() * 60 + end.getMinutes(),
                member: member.name,
                color: member.color,
                notes: event.notes,
                is_task: event.is_task,
                user_id: member.user_id,
            };
        })
  );

  const tasksByDate = allEvents.filter(e => e.is_task).reduce((acc, task) => {
        const key = format(new Date(task.start_time), "yyyy-MM-dd");
        acc[key] = acc[key] || [];
        acc[key].push(task);
        return acc;
  }, {});

  const agendaEvents = allEvents.filter(e => !e.is_task).reduce((acc, event) => {
            const key = format(new Date(event.start_time), "yyyy-MM-dd");
            acc[key] = acc[key] || [];
            acc[key].push(event);
            return acc;
  }, {});

  const generateWeekDays = (date) => {
      const start = startOfWeek(date, { weekStartsOn: 0 });
      const end = endOfWeek(date, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
  };

  const goToPreviousWeek = () => onWeekChange?.(subWeeks(referenceDate, 1));
  const goToNextWeek = () => onWeekChange?.(addWeeks(referenceDate, 1));

  const formatHour = (hour) => {
        if (hour === 0) return "12a";
        if (hour < 12) return `${hour}a`;
        if (hour === 12) return "12p";
        return `${hour - 12}p`;
  };

  const formatEventTime = (date) => {
        let h = date.getHours();
        const m = date.getMinutes();
        const p = h >= 12 ? 'p' : 'a';
        h = h % 12 || 12;
        return m === 0 ? `${h}${p}` : `${h}:${m.toString().padStart(2,'0')}${p}`;
  };

    // Scroll to current time on mount
  useEffect(() => {
    const scrollToNow = () => {
            if (scrollRef.current) {
                const containerHeight = scrollRef.current.clientHeight;
                const scrollTo = nowTop - containerHeight / 2;
                scrollRef.current.scrollTop = Math.max(0, scrollTo);
            }
    };
    const t = setTimeout(scrollToNow, 100);
    return () => clearTimeout(t);
    // Intentionally mount-only: this should scroll to "now" once on open,
    // not every time `now` (and therefore nowTop) ticks over each minute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
  }, []);

  function layoutEvents(events) {
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
          let placed = false;
          for (let col = 0; col < cols.length; col++) {
            if (!cols[col].some(e => overlaps(e, event))) {
              cols[col].push(event);
              result.push({ ...event, col, totalCols: cols.length }); // totalCols updated below
              placed = true;
              break;
            }
          }
          if (!placed) {
            cols.push([event]);
            result.push({ ...event, col: cols.length - 1, totalCols: cols.length });
          }
        }
        // Now we know the real totalCols for this cluster — patch it
        const clusterIds = new Set(cluster.map(e => e.id));
        const finalCols = cols.length;
        result.forEach(e => {
          if (clusterIds.has(e.id)) e.totalCols = finalCols;
        });
      }

      return result.map(e => ({
        ...e,
        width: 1 / e.totalCols,
        left: e.col / e.totalCols,
      }));
  }

  const weekDays = generateWeekDays(referenceDate);
  const hasAnyTasks = weekDays.some(d => (tasksByDate[format(d, 'yyyy-MM-dd')] || []).length > 0);

  return (
    <div className="h-[93vh] flex flex-col overflow-hidden bg-white mb-[1rem]">

            {/* ── Sticky header ── */}
            <div className="sticky top-0 z-20 bg-white border-b border-gray-200">

                {/* Month label — reflects whichever week is currently shown */}
                <div className="flex items-center justify-center pt-1">
                    <h2 className="text-xs font-semibold text-gray-800">
                        {format(referenceDate, 'MMMM')}
                    </h2>
                </div>

                {/* Row 1: prev/next week arrows + day letter + date number, all on one line */}
                <div className="grid border-b border-gray-100 items-center" style={{ gridTemplateColumns: GRID_TEMPLATE }}>
                    <button
                        onClick={goToPreviousWeek}
                        className="justify-self-center w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-500 text-base leading-none"
                    >
                        ‹
                    </button>
                    {weekDays.map((day, i) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const isToday = dateKey === currentDate;
                        return (
                            <div key={dateKey} className="flex flex-col items-center py-1 gap-0.5">
                                <span className="text-[10px] text-gray-400 font-medium leading-none">
                                    {DAY_LETTERS[i]}
                                </span>
                                <span className={`text-sm w-6 h-6 flex items-center justify-center rounded-full font-medium leading-none
                                    ${isToday ? 'bg-[var(--red)] text-white' : 'text-gray-700'}`}>
                                    {format(day, 'd')}
                                </span>
                            </div>
                        );
                    })}
                    <button
                        onClick={goToNextWeek}
                        className="justify-self-center w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-500 text-base leading-none"
                    >
                        ›
                    </button>
                </div>

                {/* Row 2: all-day tasks (only rendered if tasks exist this week) */}
                {hasAnyTasks && (
                    <div className="grid" style={{ gridTemplateColumns: GRID_TEMPLATE }}>
                        <div className="flex items-center justify-end pr-1">
                            <span className="text-[9px] text-gray-300 leading-none">all‑day</span>
                        </div>
                        {weekDays.map((day) => {
                            const dateKey = format(day, 'yyyy-MM-dd');
                            const tasks = tasksByDate[dateKey] || [];
                            return (
                                <div key={dateKey} className="flex flex-col gap-0.5 px-0.5 py-1 min-h-[35px] min-w-0">
                                    {tasks.map((task) => (
                                        <button
                                            key={task.id}
                                            onClick={() => { onEventOpen(true); onSelectedEvent(task); }}
                                            className="w-full text-[12px] font-medium text-center rounded px-1 leading-5 truncate opacity-80 min-h-[35px] min-w-0 shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
                                            style={{ backgroundColor: task.color }}
                                        >
                                            {task.title}
                                        </button>
                                    ))}
                                </div>
                            );
                        })}
                        <div />
                    </div>
                )}
            </div>

            {/* ── Scrollable time grid ── */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto no-scrollbar touch-pan-y overscroll-contain relative"
            >
                <div className="relative" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>

                    {/* Hour lines */}
                    {Array.from({ length: TOTAL_HOURS }).map((_, hour) => (
                        <div
                            key={hour}
                            className="grid items-start"
                            style={{ gridTemplateColumns: GRID_TEMPLATE, height: HOUR_HEIGHT }}
                        >
                            <div className="text-[10px] text-gray-400 text-right pr-2 -mt-2 select-none">
                                {formatHour(hour)}
                            </div>
                            {Array.from({ length: 7 }).map((_, d) => (
                                <div key={d} className="border-b border-gray-100 h-full" />
                            ))}
                            <div />
                        </div>
                    ))}

                    {/* Events layer */}
                    <div
                        className="absolute top-0 left-0 right-0 pointer-events-none"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: GRID_TEMPLATE,
                            height: TOTAL_HOURS * HOUR_HEIGHT,
                        }}
                    >
                        <div /> {/* gutter spacer */}
                        {weekDays.map((day) => {
                            const dateKey = format(day, 'yyyy-MM-dd');
                            const dayEvents = agendaEvents[dateKey] || [];
                            const laidOut = layoutEvents(dayEvents);
                            return (
                              <div key={dateKey} className="relative pointer-events-auto">
                                {laidOut.map((event) => {
                                  const top = (event.startMinutes / 60) * HOUR_HEIGHT;
                                  const height = Math.max(
                                    ((event.endMinutes - event.startMinutes) / 60) * HOUR_HEIGHT,20);
                                      return (
                                        <button
                                          key={event.id}
                                          onClick={() => { onEventOpen(true); onSelectedEvent(event); }}
                                          className="absolute rounded-md text-left overflow-hidden opacity-80 min-w-0 shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
                                          style={{
                                            top, height,
                                            backgroundColor: event.color,
                                            width: `calc(${event.width * 100}% - 2px)`,
                                            left: `calc(${event.left * 100}%)`,
                                          }}
                                        >
                                          <div className="px-1 pt-0.5 min-w-0 w-full">
                                            <div className="text-[10px] font-semibold leading-tight text-center truncate min-w-0 w-full">
                                              {event.title}
                                            </div>
                                            {height > 28 && (
                                              <div className="text-[9px] leading-tight opacity-75 text-center truncate min-w-0 w-full">
                                                {formatEventTime(event.start_time)}
                                              </div>
                                            )}
                                          </div>
                                        </button>
                                        );
                                    })}
                                </div>
                            );
                        })}
                        <div />
                    </div>

                    {/* Current time line — only on today's column */}
                    <div
                        className="absolute top-0 left-0 right-0 pointer-events-none"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: GRID_TEMPLATE,
                            height: TOTAL_HOURS * HOUR_HEIGHT,
                        }}
                    >
                        <div />
                        {weekDays.map((day, index) => {
                            const dateKey = format(day, 'yyyy-MM-dd');
                            if (dateKey !== currentDate) return <div key={dateKey} />;
                            return (
                                <div key="now" className="relative" ref={nowLineRef}>
                                    {/* dot */}
                                    <div
                                        className="absolute w-2 h-2 rounded-full bg-[var(--red)] -left-1"
                                        style={{ top: nowTop - 3 }}
                                    />
                                    {/* line */}
                                    <div
                                        className="absolute left-0 right-0 h-[1.5px] bg-[var(--red)]"
                                        style={{ top: nowTop }}
                                    />
                                </div>
                            );
                        })}
                        <div />
                    </div>

                </div>
            </div>
        </div>
  );
};

export default WeeklyView;