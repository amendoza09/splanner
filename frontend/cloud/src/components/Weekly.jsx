import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, getDay, eachDayOfInterval } from 'date-fns';

const WeeklyView = ({ members, selectedDate }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [dayPosition, setDayPosition] = useState(null);
    const [dayPositions, setDayPositions] = useState({});

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayAbrevs = ["Sun", "Mon", "Tue", "Wed", "Thurs", "Fri", "Sat"];
    const currentDate = format(new Date(), 'yyyy-MM-dd');

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
            startMinutes: start.getHours() * 60 + start.getMinutes(),
            endMinutes: end.getHours() * 60 + end.getMinutes(),
            member: member.name,
            color: member.color,
            };
        })
    );
    
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

    return (
        <div className="h-[93vh] flex flex-col overflow-hidden">
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
                <div className="grid grid-cols-[60px_repeat(7,1fr)] text-center px-2 border-b border-black-500">
                    <div />
                    {generateWeekDays(selectedDate ? new Date(selectedDate) : new Date()).map((item, i) => {
                        if(!item) {
                            return <div key={i} className="h-[50px]"/>
                        }
                        const formatDate = format(item, 'yyyy-MM-dd');
                        const isSelected = selectedDate === formatDate;
                        const isToday = formatDate === currentDate;

                        return (
                            
                            <button
                                key={formatDate}
                                onClick={() => handleDayPress(item)}
                                className={`h-[50px] w-full
                                    ${isSelected ? "border-2 border-[#b398f5]" : ""}
                                `}
                                style={{
                                    background: isToday
                                    ? "linear-gradient(to top, #b398f5 1%, transparent 30%)"
                                    : undefined,
                                }}
                            >
                                <span>
                                    {format(item, 'd')}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>
            
            {/* Time grid */}
            <div className="flex-1 h-[45vh] py-5 overflow-y-auto w-full relative left-0 no-scrollbar">
                {hours.map((hour) => (
                    <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] h-[50px] items-center">        
                        <div className="text-gray-500 text-xs text-right left-0 px-2">
                            {formatHour(hour)}
                        </div>
                        {dayAbrevs.map((day) => (
                            <div key={`${day}-${hour}`} className="border-b " />
                        ))}
                    </div>
                ))}

                {/* Events */} 
                <div className="absolute inset-0 grid grid-cols-[60px_repeat(7, 1fr)]" style={{ height: 24 * 50 }}>

                       {generateWeekDays(new Date(selectedDate)).map((day, index) => {
                        const dateKey = format(day, "yyyy-MM-dd");
                        const dayEvents = allEvents.filter(e => e.date === dateKey);
                        
                        return (
                            <div key={dateKey} className="justify-center flex relative" style={{ gridColumnStart: index + 2 }}>
                                {dayEvents.map((event,i) => {
                                    const start = event.startMinutes;
                                    const end = event.endMinutes;

                                    const top = ((start / 60) * 50) + 45;
                                    const height = ((end-start)/60) * 50;
                                    return (
                                         
                                        <div
                                            key={i}
                                            className="right-1 left-1 absolute text-center rounded-md text-white text-xs px-1"
                                            style={{ top, height, backgroundColor: event.color }}
                                        >
                                            <div className="font-semibold">{event.title}</div>
                                            <div className="opacity-80">{event.member}</div>
                                        </div>
                                    )
                                })}
                             </div>
                        )
                    })}
                </div>
            </div>  
        </div>
    )
}

export default WeeklyView;