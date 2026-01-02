import { useState } from 'react'
import { addEventToUser } from '../api';

const AddEvent = ({ isOpen, onClose, members, onEventAdded}) => {
    const [title, setTitle] = useState("");
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [selectedMember, setSelectedMember] = useState(null);

    if(!isOpen) return null;

    const handleSubmit = async() => {
        if(!title || !startTime || !endTime || !selectedMember) {
            alert("Please fill out all fields");
            return;
        }

        try {
            await addEventToUser(selectedMember.user_id, {
                title,
                start_time: `${startTime}:00`,
                end_time: `${endTime}:00` 
            });
            
            onEventAdded?.();
            onClose();

            setTitle("");
            setStartTime("");
            setEndTime("");
            setSelectedMember(null);
        } catch(e) {
            alert("Failed to create event");
        }
    }

    return(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-[500px] relative justify-center flex flex-col">
          <div>
            <h2 className="text-lg font-bold mb-4">Create an event</h2>
            {members.map((member) => (
                    <button 
                        key={member.user_id}
                         className={`px-3 py-2 w-[5rem] mx-5 mb-5 rounded-full text-white ${
                            selectedMember?.user_id === member.user_id
                            ? "ring-1 ring-gray-500 shadow-md"
                            : ""
                        }`}
                        style={{ backgroundColor: member.color }}
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
            <input
                type="datetime-local"
                placeholder="start time"
                className="border border-gray-300 rounded px-3 py-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setStartTime(e.target.value)}
            />
            <input
                type="datetime-local"
                placeholder="end time"
                className="border border-gray-300 rounded px-3 py-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setEndTime(e.target.value)}
            />
            
          </div>
          <div className="flex justify-end gap-2">
            <button  className="px-4 py-2 text-red-600" onClick={onClose}>
              Close
            </button>
            <button  className="px-4 py-2 rounded-full bg-[#b7ffa1] shadow-md" onClick={handleSubmit}>
              Create
            </button>
          </div>
        </div>
      </div>
    );
};

export default AddEvent;