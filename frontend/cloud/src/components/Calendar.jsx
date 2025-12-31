import WeeklyView from "./Weekly"
import MonthlyView from "./Monthly"

const Calendar = ({ members }) => {
    return(
        <div className="flex flex-col w-[calc(100vw-8rem)] h-screen">
            <WeeklyView members={members} />
            {/* <MonthlyView members={members}/> */}
        </div>
    );
};

export default Calendar;