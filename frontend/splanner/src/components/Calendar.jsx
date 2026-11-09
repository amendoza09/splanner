import { useState, useEffect, useCallback, useRef } from "react";
import { TbCalendarMonthFilled } from "react-icons/tb";
import { MdCalendarViewWeek } from "react-icons/md";
import { IoAddCircle } from "react-icons/io5";
import { RiMenu3Line } from "react-icons/ri";

import { getWeather, getChores } from "../api";

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

const Calendar = ({ members, groupCode, onNewEvent, onDeleteEvent, onUpdate, onOpenMenu }) => {
  const [view, setView] = useState("week");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [temp, setTemp] = useState("");
  const [weatherIcon, setWeatherIcon] = useState("");
  const [chores, setChores] = useState([]);
  const latestChoresFetch = useRef(0);
  const pendingChores = chores.filter((c) => !c.completed).length;

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

  // Only the newest request may update the list. A failed fetch returns null,
  // which keeps the chores already on screen.
  const fetchChores = useCallback(async () => {
    const fetchId = ++latestChoresFetch.current;
    const data = await getChores(groupCode);
    if (data && fetchId === latestChoresFetch.current) setChores(data);
  }, [groupCode]);

  // Drops any fetch already in flight, since it may predate a change just made here.
  const discardPendingChoreFetch = useCallback(() => { latestChoresFetch.current++; }, []);

  // `members` gets a new value on every server "refresh" broadcast, including
  // chore changes, so the shared list stays current without refetching on
  // each visit to the chores tab.
  useEffect(() => {
    fetchChores();
  }, [fetchChores, members]);

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden">
      {/* Compact toolbar — single row */}
      <div className="flex items-center justify-between px-3 md:px-5 py-1 border-b border-gray-200 bg-white shadow-sm relative z-10" style={{ height: 48 }}>
        {/* View toggles */}
        <div className="flex gap-1">
          <button
            onClick={onOpenMenu}
            aria-label="Open menu"
            className="md:hidden p-2 rounded-lg flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150"
            style={{ minHeight: 36, minWidth: 36 }}
          >
            <RiMenu3Line size={22} color="#374151" />
          </button>
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
            className={`relative p-1 rounded-lg text-lg transition-colors duration-150 ${view === "chores" ? "bg-gray-200" : "hover:bg-gray-100"}`}
            style={{ minHeight: 36, minWidth: 36 }}
            title="Chores"
          >
            ✓
            {pendingChores > 0 && (
              <span
                className="absolute -top-0.5 -right-1 min-w-[15px] h-4 px-0 rounded-full flex items-center justify-center text-[9px] font-semibold leading-none text-white"
                style={{ backgroundColor: "var(--red)" }}
              >
                {pendingChores}
              </span>
            )}
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
            onWeekChange={setSelectedDate}
          />
        )}
        {view === "month" && (
          <MonthlyView
            members={members}
            onDayPress={(day) => { setView("week"); setSelectedDate(day); }}
          />
        )}
        {view === "chores" && (
          <Chores
            members={members}
            groupCode={groupCode}
            chores={chores}
            setChores={setChores}
            fetchChores={fetchChores}
            discardPendingChoreFetch={discardPendingChoreFetch}
          />
        )}
      </div>

      {/* Floating add button — hidden on chores tab */}
      {view !== "chores" && (
        <button
          onClick={() => setAddEventOpen(true)}
          className="absolute bottom-12 md:bottom-8 right-8 opacity-90 active:scale-95 transition-transform"
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