import { useState, useMemo, useRef } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, 
  addMonths, subMonths, getDay } from 'date-fns';

const MonthlyView = ({ members, onDayPress }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isExpanded, setIsExpanded] = useState(true);
  const [dayPosition, setDayPosition] = useState(null);
  const [dayPositions, setDayPositions] = useState({});

  console.log(members.events);

  const dayAbrevs = ["Sun", "Mon", "Tue", "Wed", "Thurs", "Fri", "Sat"];
  const currentDate = format(new Date(), 'yyyy-MM-dd');

  const getEmptyDays = (date) => {
    const firstDay = startOfMonth(date);
    return getDay(firstDay);
  }

  const generateMonthDays = (date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days = eachDayOfInterval({ start, end });
    const emptyDays = getEmptyDays(date);
    const emptyCells = Array(emptyDays).fill(null);
    const fullMonthDays = [...emptyCells, ...days];
    const remainingCells = fullMonthDays.length % 7;

    if (remainingCells !== 0) {
      const paddingCells = Array(7 - remainingCells).fill(null);
      return [...fullMonthDays, ...paddingCells];
    };
    return fullMonthDays;
  };
  
  const openEvent = () => {
    {/* stuff for event card */}
  }

  const handleDayPress = (day) => {
    const formatDate = format(day, 'yyyy-MM-dd');

    if(selectedDate === formatDate && !isExpanded) {
      handleReset();
      return; 
    };

    const yPosition = dayPositions[formatDate] || 0;

    setDayPosition(yPosition);
    setSelectedDate(formatDate);
    setIsExpanded(false);
  };

  const handleReset = () => {
    setSelectedDate(null);
    setIsExpanded(true);
  }

  const eventsByDate = useMemo(() => {
    const map = {};
    members.forEach(member => {
      member.events.forEach(event => {
        const start = new Date(event.start_time);
        const end = new Date(event.end_time);
        let current = new Date(start);

        while (current <= end) {
          const dateKey = format(current, 'yyyy-MM-dd');
          if(!map[dateKey]) map[dateKey] = [];
          map[dateKey].push({
            ...event,
            memberName: member.name,
            memberColor: member.color
          });
          current.setDate(current.getDate()+1);
        }
      });
    });
    return map;
  }, [members]);

  const formatTime = (startTime, endTime) => {
    const format = (date) => {
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? "PM" : "AM";

      hours = hours % 12 || 12;

      return minutes === 0
        ? `${hours}`
        : `${hours}:${minutes.toString().padStart(2, "0")}`;
    };

    const start = new Date(startTime);
    const end = new Date(endTime);

    const startFormatted = format(start);
    const endFormatted = format(end);

    const samePeriod =
      start.getHours() < 12 === end.getHours() < 12;

    const startPeriod = start.getHours() >= 12 ? "PM" : "AM";
    const endPeriod = end.getHours() >= 12 ? "PM" : "AM";

    return samePeriod
      ? `${startFormatted}–${endFormatted} ${endPeriod}`
      : `${startFormatted} ${startPeriod}–${endFormatted} ${endPeriod}`;
  };

  return (
    <div className="flex flex-col w-[calc(100vw-8rem)] h-[90vh]">
      {/* Agenda Header */}
      <div className="flex flex-row justify-between px-10 pb-[30px] pt-[10px] items-center">
        <button className="px-20" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <p>{'<'}</p>
        </button>
        <h2 className="font-bold text-xl">{format(currentMonth, 'MMMM')}</h2>
        <button className="px-20" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <p>{'>'}</p>
        </button>
      </div>

      {/* Days of the week */}
      <div className="grid grid-cols-7 gap-5 text-center px-2 border-b border-black-500">
        {dayAbrevs.map((day, index) => {
          return (
            <div key={index} className="h-full flex items-center justify-center font-medium">
              <p>{day}</p>
            </div>
          )
        })}
      </div>

      {/* number days */}
      <div className="grid grid-cols-7 h-full pr-3">
        {generateMonthDays(currentMonth).map((item, i)=> {
          if(!item) {
            return <div key={i} className="h-full"/>
          }

          const formatDate = format(item, 'yyyy-MM-dd');
          const isSelected = selectedDate === formatDate;
          const isToday = formatDate === currentDate;

          return (
            <div
                key = {formatDate}
                className={`h-full w-full relative cursor-pointer`}
                onClick={() => onDayPress(item)}
              >
                <span className={`h-6 w-6 absolute top-1 right-1 px-2 ${isSelected ? 'font-bold' : ''} ${isToday ? 'font-semibold bg-[var(--red)] rounded-xl' : ''}`}>
                  {format(item, 'd')}
                </span>

                {/* events */}
                  <div className="flex flex-col mt-8 px-1 gap-1">
                    {eventsByDate[formatDate]?.map((event, j) => (
                      <div 
                        key={j} 
                        className="text-xs bg-gray-200 rounded truncate h-8 items-center flex justify-center"
                        style={{ backgroundColor: event.memberColor, color: 'white' }}
                      >
                        <button onClick={() => openEvent(event)}>
                          {event.title} ({formatTime(event.start_time, event.end_time)})
                        </button>
                      </div>
                    ))}
                  </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

export default MonthlyView;