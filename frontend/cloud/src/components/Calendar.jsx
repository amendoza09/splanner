import { useState } from "react";
import { TbCalendarMonthFilled } from "react-icons/tb";
import { MdCalendarViewWeek } from "react-icons/md";
import { IoAddCircle } from "react-icons/io5";
import WeeklyView from "./Weekly"
import MonthlyView from "./Monthly"
import AddEvent from './AddEvent'

const Calendar = ({ members }) => {
    const [view, setView] = useState("week");
    const [selectedDate, setSelectedDate] = useState(null);
    const [addEventOpen, setAddEventOpen] = useState(false);

    return(
        <div className="flex flex-col w-[calc(100vw-8rem)] h-screen">
            <div className="flex justify-center gap-10 px-4 py-2">
                <button 
                   onClick={() => setView("week")}
                   className={`p-2 rounded ${
                    view === "week" ? "bg-gray-200" : "hover:bg-gray-100"
                   }`} 
                >
                    <MdCalendarViewWeek size={32} />
                </button>
                <button
                    onClick={() => setView("month")}
                   className={`p-2 rounded ${
                    view === "month" ? "bg-gray-200" : "hover:bg-gray-100"
                   }`} 
                >
                    <TbCalendarMonthFilled size={32} />
                </button>
            </div>
            <div className="flex-1">
                   {view === "week" && <WeeklyView members={members} selectedDate={selectedDate}/>}
                   {view === "month" && <MonthlyView members={members} onDayPress={(day) => { setView("week"); setSelectedDate(day); }}/>}
            </div>
            <button
                onClick={() => setAddEventOpen(true)}
                className="absolute bottom-10 right-10  flex items-center justify-center"
            >
                <IoAddCircle size={64} color="#91f573" />
            </button>
            <div className="flex-1">
                    <AddEvent
                        isOpen={addEventOpen}
                        onClose={() => setAddEventOpen(false)}
                        members={members}
                    />
            </div>

        </div>
    );
};

export default Calendar;