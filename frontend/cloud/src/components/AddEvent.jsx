import { useState } from 'react'
import { addEventToUser } from '../api';

const AddEvent = ({ isOpen, onClose, members, onNewEvent}) => {
    const [title, setTitle] = useState("");
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [selectedMember, setSelectedMember] = useState(null);
    const [notes, setNotes] = useState("");
    const [isTask, setIsTask] = useState(false);
    const [taskStartDate, setTaskStartDate] = useState("");
    const [taskEndDate, setTaskEndDate] = useState("");

    if(!isOpen) return null;

    const handleSubmit = async () => {
      if (!title || !selectedMember) {
        alert("Please fill out all fields");
        return;
      }
      if (isTask && new Date(taskEndDate) < new Date(taskStartDate)) {
        alert("Task end date cannot be before start date");
        return;
      }
      if (!isTask && new Date(endTime) < new Date(startTime)) {
        alert("End time cannot be before start time");
        return;
      }
      if (isTask && !taskStartDate) {
        alert("Please select a date for the task");
        return;
      }
      if (!isTask && (!startTime || !endTime)) {
        alert("Please provide start and end times");
        return;
      }
      try {
        await addEventToUser(selectedMember.user_id, {
          title,
          is_task: isTask,
          start_time: isTask ? `${taskStartDate}T00:00:00` : `${startTime}:00`,
          end_time: isTask ? `${taskEndDate}T23:59:59` : `${endTime}:00`,
          notes,
        });
        resetForm();
        onNewEvent?.();
        onClose();
      } catch (e){
        console.error("Error making new event", e);
      }
    };

    const resetForm = () => {
      setSelectedMember(null);
        setTitle("");
        setIsTask(false);
        setStartTime(new Date());
        setEndTime(new Date());
        setTaskEndDate("");
        setTaskStartDate("");
        setNotes("");
    }

    return(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-[380px] md:w-[500px] relative justify-center flex flex-col">
          <div>
            <h2 className="text-lg font-bold mb-4">Create an event</h2>
            {members.map((member) => (
              <button 
                    key={member.user_id}
                    className={`px-3 py-2 w-[5rem] mx-5 mb-5 rounded-full ${
                      selectedMember?.user_id === member.user_id
                        ? "ring-1 ring-gray-500 shadow-md"
                        : "bg-gray-300 text-gray-600"
                    }`}
                        style={{ backgroundColor: selectedMember?.user_id === member.user_id ? member.color : '#D1D5DB' }}
                        onClick={() => setSelectedMember(member)}
              >
                {member.name}
              </button>
            ))}
            <input
                type="text"
                placeholder="Title"
                className="border border-gray-300 rounded px-3 py-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex gap-2 mb-4 items-center">
              <input
                type="checkbox"
                checked={isTask}
                onChange={(e) => setIsTask(e.target.checked)}
                className="h-4 w-4 accent-black"
              />
              <label className="select-none">Task</label>
            </div>

            {/* TASK DATE */}
            {isTask && (
              <>
              <input
                type="date"
                className="border rounded px-3 py-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={taskStartDate}
                onChange={(e) => (setTaskStartDate(e.target.value), setTaskEndDate(e.target.value))}
              />
              </>
            )}

            {/* EVENT TIMES */}
            {!isTask && (
              <>
                <input
                  type="datetime-local"
                  className="border rounded px-3 py-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
                <input
                  type="datetime-local"
                  className="border rounded px-3 py-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </>
            )}
            <input
                type="text"
                placeholder="Notes"
                className="border border-gray-300 rounded px-3 py-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setNotes(e.target.value)}
            />
            
          </div>
          <div className="flex justify-end gap-2">
            <button  className="px-4 py-2 text-red-600" onClick={() => {resetForm(); onClose()}}>
              Close
            </button>
            <button  
              className="px-4 py-2 rounded-full bg-[#b7ffa1]" 
              onClick={handleSubmit}
               disabled={!title || !selectedMember || (isTask && (!taskStartDate || !taskEndDate)) || (!isTask && (!startTime || !endTime))}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    );
};

export default AddEvent;