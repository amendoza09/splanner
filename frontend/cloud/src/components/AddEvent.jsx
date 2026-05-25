import { useState } from 'react';
import { addEventToUser } from '../api';

const AddEvent = ({ isOpen, onClose, members, onNewEvent }) => {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [notes, setNotes] = useState("");
  const [isTask, setIsTask] = useState(false);
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskEndDate, setTaskEndDate] = useState("");

  if (!isOpen) return null;

  const resetForm = () => {
    setSelectedMember(null); setTitle(""); setIsTask(false);
    setStartTime(""); setEndTime(""); setTaskStartDate(""); setTaskEndDate(""); setNotes("");
  };

  const handleSubmit = async () => {
    if (!title || !selectedMember) { alert("Please fill out all fields"); return; }
    if (isTask && !taskStartDate) { alert("Please select a date"); return; }
    if (!isTask && (!startTime || !endTime)) { alert("Please provide times"); return; }
    if (isTask && new Date(taskEndDate) < new Date(taskStartDate)) { alert("End date before start"); return; }
    if (!isTask && new Date(endTime) < new Date(startTime)) { alert("End time before start"); return; }
    try {
      await addEventToUser(selectedMember.user_id, {
        title,
        is_task: isTask,
        start_time: isTask ? `${taskStartDate}T00:00:00` : `${startTime}:00`,
        end_time: isTask ? `${taskEndDate}T23:59:59` : `${endTime}:00`,
        notes,
      });
      resetForm(); onNewEvent?.(); onClose();
    } catch (e) { console.error("Error making new event", e); }
  };

  const canSubmit = title && selectedMember &&
    (isTask ? (taskStartDate && taskEndDate) : (startTime && endTime));

  return (
    <div className="fixed inset-0 bg-black/60 flex flex-col justify-end z-50">
      <div className="bg-white rounded-t-2xl p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">New Event</h2>
          <button onClick={() => { resetForm(); onClose(); }} className="text-gray-400 text-xl w-10 h-10 flex items-center justify-center">✕</button>
        </div>

        {/* Member selector */}
        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <button
              key={member.user_id}
              className={`px-3 h-9 rounded-full text-sm font-medium transition-all
                ${selectedMember?.user_id === member.user_id ? 'ring-2 ring-offset-1 ring-gray-500 shadow' : ''}`}
              style={{ backgroundColor: selectedMember?.user_id === member.user_id ? member.color : '#e5e7eb', color: '#111' }}
              onClick={() => setSelectedMember(member)}
            >
              {member.name}
            </button>
          ))}
        </div>

        <input
          type="text" placeholder="Title"
          className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={isTask} onChange={(e) => setIsTask(e.target.checked)}
            className="w-5 h-5 accent-black" />
          Task (all-day)
        </label>

        {isTask ? (
          <input type="date"
            className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={taskStartDate}
            onChange={(e) => { setTaskStartDate(e.target.value); setTaskEndDate(e.target.value); }}
          />
        ) : (
          <>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Start</label>
              <input type="datetime-local"
                className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={startTime} 
                onChange={(e) => {
                const val = e.target.value;
                setStartTime(val);
                // Auto-set end time to 1 hour after start
                if (val) {
                  const start = new Date(val);
                  start.setHours(start.getHours() + 1);
                  const padded = start.toISOString().slice(0, 16); // "yyyy-MM-ddTHH:mm"
                  setEndTime(padded);
                }
              }}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">End</label>
              <input type="datetime-local"
                className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                min={startTime}
                value={endTime} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (startTime && new Date(val) <= new Date(startTime)) return; // block invalid
                  setEndTime(val);
                }}
              />
            </div>
          </>
        )}

        <input
          type="text" placeholder="Notes (optional)"
          className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          onChange={(e) => setNotes(e.target.value)}
        />

        <button
          onClick={handleSubmit} disabled={!canSubmit}
          className="w-full py-3 rounded-xl bg-[var(--green)] font-semibold disabled:opacity-40 active:scale-98 transition-all"
        >
          Create
        </button>
      </div>
    </div>
  );
};

export default AddEvent;