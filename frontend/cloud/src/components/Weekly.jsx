import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, getDay, eachDayOfInterval } from 'date-fns';

const HOUR_HEIGHT = 50;
const TOTAL_HOURS = 24;
const HEADER_ROW_HEIGHT = 50;

const WeeklyView = ({ members, selectedDate, onEventOpen, onSelectedEvent, onDeleteEvent }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [dayPosition, setDayPosition] = useState(null);
    const [dayPositions, setDayPositions] = useState({});
    const [now, setNow] = useState(new Date());

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayAbrevs = ["Sun", "Mon", "Tue", "Wed", "Thurs", "Fri", "Sat"];
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    const nowTop = (minutesSinceMidnight / 60) * HOUR_HEIGHT;
    const todaykey = format(new Date(), "yyyy-MM-dd");

    const timeToMinutes = (time) => {
        const [raw, period] = time.split(" ");
        let [hours, minutes] = raw.split(":").map(Number);

        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours ===12) hours = 0;

        return hours * 60 + minutes;
    }

    const allEvents = members.flatMap(member =>
        (member.events || []).map(event => {
            const start = new Date(event.start_time);
            const end = new Date(event.end_time);

            return {
                id: event.event_id,
                title: event.title,
                date: format(start, "yyyy-MM-dd"),
                start_time: start,  
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
            const dateKey = format(new Date(task.start_time), "yyyy-MM-dd");
            acc[dateKey] = acc[dateKey] || [];
            acc[dateKey].push(task);
            return acc;
        }, {});

    const agendaEvents = allEvents
        .filter(e => !e.is_task)
        .reduce((acc, task) => {
            const dateKey = format(new Date(task.start_time), "yyyy-MM-dd");
            acc[dateKey] = acc[dateKey] || [];
            acc[dateKey].push(task);
            return acc;
        }, {});
    
    const generateWeekDays = (date) => {
        const startOfSelectedWeek = startOfWeek(date, { weekStartsOn: 0 });
        const endOfSelectedWeek = endOfWeek(date, { weekStartsOn: 0 });
        return eachDayOfInterval({ start: startOfSelectedWeek, end: endOfSelectedWeek });
    };

    const formatHour = (hour) => {
        if (hour === 0) return "12 AM";
        if (hour < 12) return `${hour} AM`;
        if (hour === 12) return "12 PM";
        return `${hour - 12} PM`;
    };

    const handleDayPress = (day) => {
        {/*
        const formatDate = format(day, 'yyyy-MM-dd');

        if(selectedDate === formatDate && !isExpanded) {
            handleReset();
            return; 
        };

        const yPosition = dayPositions[formatDate] || 0;

        setDayPosition(yPosition);
        setSelectedDate(formatDate);
        setIsExpanded(false);
        */}
    };

    const handleReset = () => {
      // setSelectedDate(null);
    }

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 60000);
        return () => clearInterval(interval)
    }, []);

    return (
        <div className="h-[92vh] flex flex-col overflow-hidden">
            {/* Days of the week */}
            <div className="sticky top-0 z-20 ">
                <div className="grid grid-cols-[60px_repeat(7,1fr)] text-center px-2 border-b border-black-500">
                    <div />
                    {dayAbrevs.map((day, index) => (
                        <div key={index} className="h-[50px] flex items-center justify-center font-medium">
                            <p>{day}</p>
                        </div>
                    ))}
                </div>
                {/* week days */}
                <div className="grid grid-cols-[60px_repeat(7,1fr)] shadow-md text-center px-2 border-b border-black-500">
                    <div />
                    {generateWeekDays(selectedDate ? new Date(selectedDate) : new Date()).map(
                        (item, i) => {
                        if (!item) return <div key={i} className="h-[50px]" />;

                        const formatDate = format(item, "yyyy-MM-dd");
                        const isSelected = selectedDate === formatDate;
                        const isToday = formatDate === currentDate;
                        const dayTasks = tasksByDate[formatDate] || [];

                        return (
                            <div
                                key={formatDate}
                                className={`flex flex-col items-center w-full left-1 right-1 ${
                                isSelected ? "border-2 border-[var(--red)]" : ""
                                }`}
                            >
                            {/* Day button */}
                            <button
                                onClick={() => handleDayPress(item)}
                                className="h-[50px] w-full flex items-center justify-center"
                            >
                                <span
                                className={`w-8 h-8 items-center flex justify-center ${
                                    isToday
                                    ? "font-semibold bg-[var(--red)] rounded-full"
                                    : ""
                                }`}
                                >
                                {format(item, "d")}
                                </span>
                            </button>

                            {/* Tasks */}
                            {dayTasks.map((task) => (
                                <div
                                    onClick={() => {
                                        onEventOpen(true);
                                        onSelectedEvent(task);
                                    }}
                                    key={task.event_id}
                                    className="text-xs w-[97%] mb-2 px-2 py-1 left-1 right-1 rounded text-left flex truncate"
                                    style={{ background: task.color}}
                                >
                                    {task.title}
                                </div>
                            ))}
                            </div>
                        );
                        }
                    )}
                    </div>
            </div>
            
            {/* Time grid */}
            <div className="flex-1 overflow-y-auto relative md:px-2 no-scrollbar">

                {/* Shared height wrapper */}
                <div
                    className="relative"
                    style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
                >

                    {/* ---------- Time grid ---------- */}
                    {Array.from({ length: TOTAL_HOURS }).map((_, hour) => (
                    <div
                        key={hour}
                        className="grid grid-cols-[60px_repeat(7,1fr)] items-center"
                        style={{ height: HOUR_HEIGHT }}
                    >
                        <div className="text-gray-500 md:text-xs text-[12px] text-center ">
                        {formatHour(hour)}
                        </div>
                        {dayAbrevs.map((day) => (
                        <div key={`${day}-${hour}`} className="border-b" />
                        ))}
                    </div>
                    ))}

                    {/* ---------- Events layer ---------- */}
                    <div
                        className="absolute top-0 left-0 right-0 grid grid-cols-[60px_repeat(7,1fr)]"
                        style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
                    >
                        {generateWeekDays(new Date(selectedDate)).map((day, index) => {
                            const dateKey = format(day, "yyyy-MM-dd");
                            const dayEvents = agendaEvents[dateKey] || [];

                            return (
                            <div
                                key={dateKey}
                                className="relative"
                                style={{ gridColumnStart: index + 2 }}
                            >
                                {dayEvents.map((event, i) => {
                                const top =
                                    (event.startMinutes / 60) * HOUR_HEIGHT + 25;
                                const height =
                                    ((event.endMinutes - event.startMinutes) / 60) * HOUR_HEIGHT;

                                return (
                                    <div
                                    key={event.event_id}
                                    onClick={() => {
                                        onEventOpen(true);
                                        onSelectedEvent(event);
                                    }}
                                    className="absolute left-1 right-1 rounded-md text-xs md:text-s text-black text-center pt-3 opacity-80"
                                    style={{
                                        top,
                                        height,
                                        backgroundColor: event.color,
                                    }}
                                    >
                                        <div className="font-semibold text-center">
                                            {event.title}
                                        </div>
                                        <span className="hidden md:block">
                                            {event.member[0]}
                                        </span>
                                        <span className="hidden sm:block">
                                            {event.member}
                                        </span>
                                        
                                    </div>
                                );
                                })}
                            </div>
                            );
                        })}
                    </div>

                    {/* ---------- Current time line ---------- */}
                    <div
                    className="absolute top-0 left-0 right-0 grid grid-cols-[60px_repeat(7,1fr)] pointer-events-none"
                    style={{ height: (TOTAL_HOURS * HOUR_HEIGHT) }}
                    >
                    {generateWeekDays(selectedDate ? new Date(selectedDate) : new Date()).map(
                        (item, index) => {
                        if (!item) return null;

                        const formatDate = format(item, "yyyy-MM-dd");
                        const isToday = formatDate === currentDate;

                        if (!isToday) return null;

                        return (
                            <div
                            key="now-line"
                            className="relative"
                            style={{ gridColumnStart: index + 2 }}
                            >
                            {/* Red dot */}
                            <div
                                className="absolute -left-2 h-2 w-2  bg-red-500 rounded-full"
                                style={{ top: nowTop + 25}}
                            />

                            {/* Red line */}
                            <div
                                className="absolute left-0 right-0 h-[2px] mt-[3px] bg-red-500"
                                style={{ top: nowTop + 25 }}
                            />
                            </div>
                        );
                        }
                    )}
                    </div>

                </div>
            </div> 
        </div>
    )
}

export default WeeklyView;