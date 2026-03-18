import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, getDay } from 'date-fns';

const MonthlyView = ({ members, onDayPress }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
  const currentDate = format(new Date(), 'yyyy-MM-dd');

  const generateMonthDays = (date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days = eachDayOfInterval({ start, end });
    const emptyCells = Array(getDay(start)).fill(null);
    const full = [...emptyCells, ...days];
    const rem = full.length % 7;
    return rem !== 0 ? [...full, ...Array(7 - rem).fill(null)] : full;
  };

  // Build a map of date -> array of { memberColor, memberName, title, is_task }
  const eventsByDate = useMemo(() => {
    const map = {};
    members.forEach(member => {
      (member.events || []).forEach(event => {
        const start = new Date(event.start_time);
        const end = new Date(event.end_time);
        let current = new Date(start);
        while (current <= end) {
          const key = format(current, 'yyyy-MM-dd');
          if (!map[key]) map[key] = [];
          map[key].push({
            memberColor: member.color,
            memberName: member.name,
            title: event.title,
            is_task: event.is_task,
          });
          current.setDate(current.getDate() + 1);
        }
      });
    });
    return map;
  }, [members]);

  const handleDayPress = (day) => {
    setSelectedDate(format(day, 'yyyy-MM-dd'));
    onDayPress(day);
  };

  return (
    <div className="flex flex-col h-full bg-white">

      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
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
      <div className="grid grid-cols-7 flex-1">
        {generateMonthDays(currentMonth).map((item, i) => {
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
          const isSelected = dateKey === selectedDate;
          const events = eventsByDate[dateKey] || [];
          const MAX_BARS = 3;
          const overflow = events.length - MAX_BARS;

          return (
            <div
              key={dateKey}
              onClick={() => handleDayPress(item)}
              className="border-b border-r border-gray-100 cursor-pointer active:bg-gray-50 flex flex-col p-1"
            >
              {/* Date number */}
              <div className="flex justify-end mb-1">
                <span
                  className={`
                    text-[11px] w-5 h-5 flex items-center justify-center rounded-full leading-none
                    ${isToday ? 'bg-[var(--red)] text-white font-semibold' : 'text-gray-700'}
                    ${isSelected && !isToday ? 'ring-1 ring-gray-400 font-semibold' : ''}
                  `}
                >
                  {format(item, 'd')}
                </span>
              </div>

              {/* Color bars — one per event, up to 3 */}
              <div className="flex flex-col gap-[2px]">
                {events.slice(0, MAX_BARS).map((event, j) => (
                  <div
                    key={j}
                    className="h-[4px] rounded-full w-full"
                    style={{ backgroundColor: event.memberColor }}
                    title={`${event.memberName}: ${event.title}`}
                  />
                ))}
                {overflow > 0 && (
                  <span className="text-[9px] text-gray-400 leading-none mt-0.5">
                    +{overflow}
                  </span>
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