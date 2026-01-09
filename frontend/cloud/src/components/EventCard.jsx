import { useState, useEffect } from 'react';
import { deleteEvent, updateEvent } from "../api";

import { FaRegTrashAlt } from "react-icons/fa";
import { FaRegEdit } from "react-icons/fa";

const EventCard = ({ isOpen, onClose, event, onDelete, onUpdate, members}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [selectedMember, setSelectedMember] = useState(null);
    const [notes,setNotes] = useState("");
    const [task,setTask] = useState(null);

    const toDateInputValue = (value) => {
      if (!value) return "";
      const date = new Date(value);
      return isNaN(date) ? "" : date.toISOString().split("T")[0];
    };

    useEffect(() => {
      if (event) {
        setTitle(event.title);

        setStartTime(toDateInputValue(event.start_time));
        setEndTime(toDateInputValue(event.end_time));

        setSelectedMember(event.member);
        setNotes(event.notes || "");
        setTask(event.is_task);
        setIsEditing(false);
      }
    }, [event]);
    
    if(!isOpen) return null;
    

    const deleteAnEvent = async () => {
      try {
        await deleteEvent(event.user_id, event.id);
        onDelete?.();   // refresh parent
        onClose();      // close modal
      } catch (err) {
        console.error("Failed to delete event", err);
      }
    };

    const handleEvent = async () => {
      await updateEvent(event.user_id, event.id, {
        title, 
        start_time: startTime,
        end_time: endTime,
        user_id: selectedMember.user_id,
        notes,
        is_task: task
      }
      );
      onUpdate?.()
      onClose()
    }

    const cancelEdit = () => {
      setTitle(event.title);
      setStartTime(toDateInputValue(event.start_time));
      setEndTime(toDateInputValue(event.end_time));
      setSelectedMember(event.member);
      setNotes(event.notes || "");
      setTask(event.is_task);
      setIsEditing(false);
    };
    return(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-[380px] md:w-[500px] h-auto relative justify-center flex flex-col">
          <div>
            <h2 className="text-lg font-bold mb-4">event info</h2>
            <div className="gap-3">
              {!isEditing ? (
                <>
                  <h3 className="font-bold py-2">{title}</h3>
                  <p>{selectedMember}</p>
                  <p>{startTime.toLocaleString()}</p>
                  <p>{endTime.toLocaleString()}</p>
                  <p>{notes}</p>
                  <p>{task} Task</p>
                </>
              ) : (
                <>
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
                    className="border p-2 w-full mt-2"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                  <input
                    className="border p-2 w-full mt-2"
                    type="date"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                  />
                  <input
                    type="date"
                    className="border p-2 w-full mt-2"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                  />
                  <input
                    className="border p-2 w-full mt-2"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                  <input
                    type={'checkbox'}
                    className="border p-2 w-full mt-2"
                    value={task}
                    onChange={e => setTask(e.target.checked)}
                  />
                  

                  <button
                    onClick={handleEvent}
                    className="mt-3 bg-green-600 text-white px-4 py-2 rounded"
                  >
                    Save
                  </button>
                  <button className="px-4 py-2 rounded bg-gray-200" onClick={cancelEdit}>
                  cancel
                </button>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <button className="px-4 py-2 text-red-600"  
              onClick={() => {
                setIsEditing(true)
              }}
            >
              <FaRegEdit />
            </button>
            <button className="px-4 py-2 text-red-600"  
              onClick={() => {
                deleteAnEvent()
              }}
            >
              <FaRegTrashAlt />
            </button>
            
            <button  className="px-4 py-2 text-red-600 rounded" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
};

export default EventCard;