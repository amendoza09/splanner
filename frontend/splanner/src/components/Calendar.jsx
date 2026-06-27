import { useState, useEffect } from "react";
import { TbCalendarMonthFilled } from "react-icons/tb";
import { MdCalendarViewWeek } from "react-icons/md";
import { IoAddCircle } from "react-icons/io5";

import { getWeather } from "../api";

import WeeklyView from "./Weekly";
import MonthlyView from "./Monthly";
import AddEvent from './AddEvent';
import EventCard from "./EventCard";
import Chores from "./Chores";

import defaultIcon from '../assets/sunny-day.png';
import nightIcon from '../assets/night.png';
import rainIcon from '../assets/rainy.png';
import cloudyIcon from '../assets/icon.png';
import icon from '../assets/icon.png';

const Calendar = ({ members, groupCode, onNewEvent, onDeleteEvent, onUpdate, onRefresh }) => {
  const [view, setView] = useState("week");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [temp, setTemp] = useState("");
  const [weatherIcon, setWeatherIcon] = useState("");

  const getTemp = async () => {
    try {
      const data = await getWeather();
      const currentHour = data.properties.periods[0];
      if (currentHour.probabilityOfPrecipitation?.value >= 60) setWeatherIcon(rainIcon);
      else if (currentHour.relativeHumidity?.value >= 60) setWeatherIcon(cloudyIcon);
      else if (!currentHour.isDaytime) setWeatherIcon(nightIcon);
      else setWeatherIcon(defaultIcon);
      setTemp(`${currentHour.temperature}°${currentHour.temperatureUnit}`);
    } catch (e) { /* weather is non-critical */ }
  };

  useEffect(() => {
    getTemp();
    const interval = setInterval(getTemp, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden">
      {/* Compact toolbar — single row */}
      <div className="flex items-center justify-between pl-14 pr-3 md:px-5 py-1 border-b border-gray-200 bg-white" style={{ height: 48 }}>
        {/* View toggles */}
        <div className="flex gap-1">
          <button
            onClick={() => setView("week")}
            className={`p-2 rounded-lg transition-colors duration-150 ${view === "week" ? "bg-gray-200" : "hover:bg-gray-100"}`}
            style={{ minHeight: 36, minWidth: 36 }}
          >
            <MdCalendarViewWeek size={22} />
          </button>
          <button
            onClick={() => setView("month")}
            className={`p-2 rounded-lg transition-colors duration-150 ${view === "month" ? "bg-gray-200" : "hover:bg-gray-100"}`}
            style={{ minHeight: 36, minWidth: 36 }}
          >
            <TbCalendarMonthFilled size={22} />
          </button>
          <button
            onClick={() => setView("chores")}
            className={`p-2 rounded-lg text-lg transition-colors duration-150 ${view === "chores" ? "bg-gray-200" : "hover:bg-gray-100"}`}
            style={{ minHeight: 36, minWidth: 36 }}
            title="Chores"
          >
            ✓
          </button>
        </div>

        <div className="flex flex-row gap-5">
          {/* Weather + refresh */}
          <div className="flex">
            {temp && (
              <div className="flex gap-2">
                <span className="text-sm text-gray-500">{temp}</span>
                {weatherIcon && <img className="w-5 h-5 opacity-60" src={weatherIcon} alt="" />}
              </div>
            )}
          </div>

          {/* icon */}
          <div>
            <img className="h-[20px]" src={icon} alt="" />
          </div>
        </div>
        
      </div>

      {/* Calendar view — fills remaining height */}
      <div className="flex-1 min-h-0">
        {view === "week" && (
          <WeeklyView
            members={members}
            selectedDate={selectedDate}
            onSelectedEvent={setSelectedEvent}
            onEventOpen={setEventOpen}
            onDeleteEvent={onDeleteEvent}
          />
        )}
        {view === "month" && (
          <MonthlyView
            members={members}
            onDayPress={(day) => { setView("week"); setSelectedDate(day); }}
          />
        )}
        {view === "chores" && (
          <Chores members={members} groupCode={groupCode} />
        )}
      </div>

      {/* Floating add button — hidden on chores tab */}
      {view !== "chores" && (
        <button
          onClick={() => setAddEventOpen(true)}
          className="absolute bottom-8 right-8 opacity-90 active:scale-95 transition-transform"
          style={{ minHeight: 'unset', minWidth: 'unset' }}
        >
          <IoAddCircle size={56} color="var(--green)" />
        </button>
      )}

      <AddEvent
        isOpen={addEventOpen}
        onClose={() => setAddEventOpen(false)}
        members={members}
        groupCode={groupCode}
        onNewEvent={onNewEvent}
      />
      <EventCard
        isOpen={eventOpen}
        onClose={() => setEventOpen(false)}
        event={selectedEvent}
        onDelete={onDeleteEvent}
        onUpdate={onUpdate}
        members={members}
        groupCode={groupCode}
      />
    </div>
  );
};

export default Calendar;