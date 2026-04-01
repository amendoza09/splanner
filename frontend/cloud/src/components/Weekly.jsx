import { useState, useEffect, useRef } from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

const HOUR_HEIGHT = 50;
const TOTAL_HOURS = 24;

const WeeklyView = ({ members, selectedDate, onEventOpen, onSelectedEvent, onDeleteEvent }) => {
  const [now, setNow] = useState(new Date());
  const scrollRef = useRef(null);
  const nowLineRef = useRef(null);

  const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
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

    const tasksByDate = allEvents
        .filter(e => e.is_task)
        .reduce((acc, task) => {
            const key = format(new Date(task.start_time), "yyyy-MM-dd");
            acc[key] = acc[key] || [];
            acc[key].push(task);
            return acc;
        }, {});

    const agendaEvents = allEvents
        .filter(e => !e.is_task)
        .reduce((acc, event) => {
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
    }, []);

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const weekDays = generateWeekDays(selectedDate ? new Date(selectedDate) : new Date());
    const hasAnyTasks = weekDays.some(d => (tasksByDate[format(d, 'yyyy-MM-dd')] || []).length > 0);

    return (
        <div className="h-[92vh] flex flex-col overflow-hidden bg-white">

            {/* ── Sticky header ── */}
            <div className="sticky top-0 z-20 bg-white border-b border-gray-200">

                {/* Row 1: day letter + date number */}
                <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: '38px repeat(7, 1fr)' }}>
                    <div />
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
                </div>

                {/* Row 2: all-day tasks (only rendered if tasks exist this week) */}
                {hasAnyTasks && (
                    <div className="grid" style={{ gridTemplateColumns: '38px repeat(7, 1fr)' }}>
                        <div className="flex items-center justify-end pl-2">
                            <span className="text-[9px] text-gray-300 leading-none">all‑day</span>
                        </div>
                        {weekDays.map((day) => {
                            const dateKey = format(day, 'yyyy-MM-dd');
                            const tasks = tasksByDate[dateKey] || [];
                            return (
                                <div key={dateKey} className="flex flex-col gap-0.5 px-0.5 py-1 min-h-[24px]">
                                    {tasks.map((task) => (
                                        <button
                                            key={task.id}
                                            onClick={() => { onEventOpen(true); onSelectedEvent(task); }}
                                            className="w-full text-[10px] font-medium text-center rounded px-1 leading-5 truncate opacity-80"
                                            style={{ backgroundColor: task.color }}
                                        >
                                            {task.title}
                                        </button>
                                    ))}
                                </div>
                            );
                        })}
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
                            style={{ gridTemplateColumns: '38px repeat(7, 1fr)', height: HOUR_HEIGHT }}
                        >
                            <div className="text-[10px] text-gray-400 text-right pr-2 -mt-2 select-none">
                                {formatHour(hour)}
                            </div>
                            {Array.from({ length: 7 }).map((_, d) => (
                                <div key={d} className="border-b border-gray-100 h-full" />
                            ))}
                        </div>
                    ))}

                    {/* Events layer */}
                    <div
                        className="absolute top-0 left-0 right-0 pointer-events-none"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '38px repeat(7, 1fr)',
                            height: TOTAL_HOURS * HOUR_HEIGHT,
                        }}
                    >
                        <div /> {/* gutter spacer */}
                        {weekDays.map((day) => {
                            const dateKey = format(day, 'yyyy-MM-dd');
                            const dayEvents = agendaEvents[dateKey] || [];
                            return (
                                <div key={dateKey} className="relative pointer-events-auto">
                                    {dayEvents.map((event) => {
                                        const top = (event.startMinutes / 60) * HOUR_HEIGHT;
                                        const height = Math.max(
                                            ((event.endMinutes - event.startMinutes) / 60) * HOUR_HEIGHT,
                                            20
                                        );
                                        return (
                                            <button
                                                key={event.id}
                                                onClick={() => { onEventOpen(true); onSelectedEvent(event); }}
                                                className="absolute inset-x-0.5 rounded-md text-left overflow-hidden opacity-80"
                                                style={{ top, height, backgroundColor: event.color }}
                                            >
                                                <div className="px-1 pt-0.5">
                                                    <div className="text-[10px] font-semibold leading-tight text-center truncate">
                                                        {event.title}
                                                    </div>
                                                    {height > 28 && (
                                                        <div className="text-[9px] leading-tight opacity-75 text-center truncate">
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
                    </div>

                    {/* Current time line — only on today's column */}
                    <div
                        className="absolute top-0 left-0 right-0 pointer-events-none"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '38px repeat(7, 1fr)',
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
                    </div>

                </div>
            </div>
        </div>
    );
};

export default WeeklyView;