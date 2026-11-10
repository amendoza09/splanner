import { useState, useMemo } from 'react';
import { format, addMonths, subMonths, isSameMonth } from 'date-fns';
import { generateMonthDays } from '../utils/calendar';

const MonthlyView = ({ members, onDayPress }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
  const currentDate = format(new Date(), 'yyyy-MM-dd');

  // Build a map of date -> array of { memberColor, memberName, title }
  const eventsByDate = useMemo(() => {
    const map = {};
    members.forEach(member => {
      member.events.forEach(event => {
        const key = format(new Date(event.start_time), 'yyyy-MM-dd');
        if (!map[key]) map[key] = [];
        map[key].push({
          memberColor: member.color,
          memberName: member.name,
          title: event.title,
        });
      });
    });
    return map;
  }, [members]);

  const monthDays = generateMonthDays(currentMonth);

  return (
    <div className="flex flex-col h-full bg-white">

      {/* Month navigation */}
      <div className="relative flex items-center justify-between px-4 py-2 border-b border-gray-100">
        {!isSameMonth(currentMonth, new Date()) && (
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="absolute right-14 top-1/2 -translate-y-1/2 text-[11px] font-medium text-gray-600 px-2 py-0.5 rounded-full border border-gray-300 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            style={{ minHeight: 'unset', minWidth: 'unset' }}
          >
            Today
          </button>
        )}
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-500 text-lg leading-none"
        >
          ‹
        </button>
        <h2 className="text-sm font-semibold text-gray-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-500 text-lg leading-none"
        >
          ›
        </button>
      </div>

      {/* Day-letter header row */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_LETTERS.map((letter, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-gray-400 py-1">
            {letter}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        className="grid grid-cols-7 flex-1 min-h-0"
        style={{ gridTemplateRows: `repeat(${monthDays.length / 7}, minmax(0, 1fr))` }}
      >
        {monthDays.map((item, i) => {
          if (!item) {
            return (
              <div
                key={`empty-${i}`}
                className="border-b border-r border-gray-100 bg-gray-50/50"
              />
            );
          }

          const dateKey = format(item, 'yyyy-MM-dd');
          const isToday = dateKey === currentDate;
          const events = eventsByDate[dateKey] || [];
          const MAX_BARS = 2;
          const overflow = events.length - MAX_BARS;

          return (
            <div
              key={dateKey}
              onClick={() => onDayPress(item)}
              className="border-b border-r border-gray-100 cursor-pointer active:bg-gray-50 flex flex-col p-1 min-h-0 overflow-hidden"
            >
              {/* Date number */}
              <div className="flex justify-end mb-1">
                <span
                  className={`
                    text-[11px] w-5 h-5 flex items-center justify-center rounded-full leading-none
                    ${isToday ? 'bg-[var(--red)] text-white font-semibold' : 'text-gray-700'}
                  `}
                >
                  {format(item, 'd')}
                </span>
              </div>

              {/* Mobile: compact color bars, one per event, up to MAX_BARS — no
                  room (or hover) for titles at this size */}
              <div className="flex flex-col gap-[2px] md:hidden">
                {events.slice(0, MAX_BARS).map((event, j) => (
                  <div
                    key={j}
                    className="h-[4px] rounded-full w-full"
                    style={{ backgroundColor: event.memberColor }}
                    title={`${event.memberName}: ${event.title}`}
                  />
                ))}
                {overflow > 0 && (
                  <div className="text-[9px] leading-tight font-medium text-center rounded bg-gray-200 text-gray-600">
                    +{overflow}
                  </div>
                )}
              </div>

              {/* Tablet/desktop: room for truncated title chips, up to MAX_BARS */}
              <div className="hidden md:flex md:flex-col gap-[2px]">
                {events.slice(0, MAX_BARS).map((event, j) => (
                  <div
                    key={j}
                    className="text-[9px] leading-tight font-medium rounded px-1 truncate opacity-80 shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
                    style={{ backgroundColor: event.memberColor }}
                    title={`${event.memberName}: ${event.title}`}
                  >
                    {event.title}
                  </div>
                ))}
                {overflow > 0 && (
                  <div className="text-[9px] leading-tight font-medium text-center rounded bg-gray-200 text-gray-600">
                    +{overflow}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Member color legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100 flex-wrap">
        {members.map((member) => (
          <div key={member.user_id} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: member.color }}
            />
            <span className="text-[11px] text-gray-500">{member.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthlyView;