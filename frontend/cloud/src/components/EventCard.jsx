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
    const [task,setTask] = useState(false);

    useEffect(() => {
      if (event) {
        setTitle(event.title);
        setStartTime(new Date(event.start_time));
        setEndTime(new Date(event.end_time));
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
        onDelete?.();   
        onClose(); 
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
      setStartTime(event.start_time);
      setEndTime(event.end_time);
      setSelectedMember(event.member);
      setNotes(event.notes || "");
      setTask(event.is_task);
      setIsEditing(false);
    };


    const formatTime = (time) => {
      const format = (date) => {
        let hours = date.getHours();
        const minutes = date.getMinutes();

        hours = hours % 12 || 12;

        return minutes === 0
          ? `${hours}`
          : `${hours}:${minutes.toString().padStart(2, "0")}`;
      };

      const start = new Date(time);
      const startFormatted = format(start);
      const startPeriod = start.getHours() >= 12 ? "PM" : "AM";

      return  `${startFormatted} ${startPeriod}`;
    };

    const toInputDateTime = (dateString) => {
      if (!dateString) return "";

      return new Date(dateString).toISOString().slice(0, 16);
    };

    return(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-[380px] md:w-[500px] h-auto relative flex flex-col">
          <div>
            <div className="gap-3">
              {!isEditing ? (
                <>
                  <h3 className="font-bold py-2">{title}</h3>
                  <p>{selectedMember}</p>
                  {!task && <p>{formatTime(startTime)}-{formatTime(endTime)}</p>}
                  <p>{notes}</p>
                </>
              ) : (
                <>
                  {members.map((member) => (
                    <button
                      key={member.user_id}
                      className={`px-3 py-2 w-[5rem] mx-5 mb-5 rounded-full ${
                        (selectedMember === member.name || selectedMember.user_id === member.user_id)
                          ? "ring-1 ring-gray-500 shadow-md"
                          : "bg-gray-300 text-gray-600"  
                      }`}
                      style={{
                        backgroundColor: (selectedMember === member.name || selectedMember.user_id === member.user_id)
                        ? member.color 
                        : '#D1D5DB',
                      }}
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
                  {!task ? (
                    <>
                      <input
                        className="border p-2 w-full mt-2"
                        type="datetime-local"  // For non-task events, allow date and time selection
                        value={toInputDateTime(startTime)}
                        onChange={e => setStartTime(e.target.value)}
                      />
                      <input
                        type="datetime-local"
                        className="border p-2 w-full mt-2"
                        value={toInputDateTime(endTime)}
                        onChange={e => setEndTime(e.target.value)}
                      />
                    </>
                  ) : (
                    <>
                      <input
                        className="border p-2 w-full mt-2"
                        type="date"  // For tasks, only allow date selection
                        value={startTime}
                        onChange={e => {
                          setStartTime(e.target.value);
                          setEndTime(e.target.value)
                        }}
                      />
                    </>
                  )}
                  <input
                    className="border p-2 w-full mt-2"
                    value={notes}
                    placeholder="Notes"
                    onChange={e => setNotes(e.target.value)}
                  />
                  <div className="flex flex-row items-center mt-2 gap-2">
                    <input
                      type={'checkbox'}
                      className="border"
                      checked={task}
                      onChange={e => setTask(e.target.checked)}
                    />
                    <p className="">Task</p>
                  </div>
                  
                  

                  <button
                    onClick={handleEvent}
                    className="mt-3 bg-green-600 text-white px-4 py-2 mr-2 rounded"
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