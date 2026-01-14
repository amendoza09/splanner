import { useState, useEffect } from "react";
import { TbCalendarMonthFilled } from "react-icons/tb";
import { MdCalendarViewWeek } from "react-icons/md";
import { IoAddCircle } from "react-icons/io5";
import { IoMdRefresh } from "react-icons/io";

import { getWeather } from "../api";

import WeeklyView from "./Weekly"
import MonthlyView from "./Monthly"
import AddEvent from './AddEvent'
import EventCard from "./EventCard";

import defaultIcon from '../assets/sunny-day.png';
import nightIcon from '../assets/night.png';
import rainIcon from '../assets/rainy.png';
import cloudyIcon from '../assets/icon.png';

const Calendar = ({ members, onNewEvent, onDeleteEvent, onUpdate, onRefresh}) => {
    const [view, setView] = useState("week");
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [addEventOpen, setAddEventOpen] = useState(false);
    const [eventOpen, setEventOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [temp, setTemp] = useState("");
    const [weatherIcon, setWeatherIcon] = useState("");

    const getTemp = async () => {
        const data = await getWeather()
        const currentHour = data.properties.periods[0]

        if (currentHour.probabilityOfPrecipitation?.value >= 60) {
            setWeatherIcon(rainIcon);
        } else if(currentHour.relativeHumidity?.value >= 60){
            setWeatherIcon(cloudyIcon);
        } else if(!currentHour.isDaytime){ 
            setWeatherIcon(nightIcon);
        } else {
            setWeatherIcon(defaultIcon);
        }

        setTemp(`${currentHour.temperature}°${currentHour.temperatureUnit}`)
    }

    useEffect(() => {
        getTemp();
        const interval = setInterval(() => {
            getTemp();
        }, 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return(
        <div className="flex flex-col w-full h-screen">
            <div className="flex flex-1 justify-center w-full">
                <div className="gap-5 md:gap-10 flex px-4 py-2">
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
                
                <div className=" absolute right-0 lg:right-10 p-5 items-center flex">
                    <button type="button" onClick={onRefresh} className="mr-4">
                        <IoMdRefresh />
                    </button>
                    <p className="text-gray-500">{temp}</p>
                    <img className="w-5 h-5 mx-2 opacity-50" src={weatherIcon}/>
                </div>
            </div>
            <div className="flex-1">
                   {view === "week" && 
                        <WeeklyView 
                            members={members} 
                            selectedDate={selectedDate} 
                            onSelectedEvent={setSelectedEvent} 
                            onEventOpen={setEventOpen}
                            onDeleteEvent={onDeleteEvent}
                        />
                    }
                   {view === "month" && 
                        <MonthlyView 
                            members={members} 
                            onDayPress={(day) => { setView("week"); setSelectedDate(day); }}
                        />
                    }
            </div>
            <button
                onClick={() => setAddEventOpen(true)}
                className="absolute bottom-10 right-10  flex items-center justify-center"
            >
                <IoAddCircle size={64} color="var(--green)" />
            </button>
            <div className="flex-1">
                    <AddEvent
                        isOpen={addEventOpen}
                        onClose={() => setAddEventOpen(false)}
                        members={members}
                        onNewEvent={onNewEvent}
                    />
            </div>
            <div>
                    <EventCard 
                        isOpen={eventOpen}
                        onClose={() => setEventOpen(false)}
                        event={selectedEvent}
                        onDelete={onDeleteEvent}
                        onUpdate={onUpdate}
                        members={members}
                    />
            </div>

        </div>
    );
};

export default Calendar;