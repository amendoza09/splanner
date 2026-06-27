import { useState, useEffect } from 'react';
import { deleteEvent, updateEvent } from "../api";
import { FaRegTrashAlt, FaRegEdit } from "react-icons/fa";

const EventCard = ({ isOpen, onClose, event, onDelete, onUpdate, members, groupCode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [notes, setNotes] = useState("");
  const [task, setTask] = useState(false);

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

  if (!isOpen) return null;

  const deleteAnEvent = async () => {
    try { await deleteEvent(groupCode, event.user_id, event.id); onDelete?.(); onClose(); }
    catch (err) { console.error("Failed to delete event", err); }
  };

  const handleSave = async () => {
    const toISOLocal = (val) => {
      const d = new Date(val);
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    };

    await updateEvent(groupCode, event.user_id, event.id, {
      title,
      start_time: toISOLocal(startTime),
      end_time: toISOLocal(endTime),
      user_id: selectedMember?.user_id ?? event.user_id,
      notes,
      is_task: task,
    });
    onUpdate?.();
    onClose();
  };

  const cancelEdit = () => {
    setTitle(event.title); setStartTime(event.start_time); setEndTime(event.end_time);
    setSelectedMember(event.member); setNotes(event.notes || ""); setTask(event.is_task);
    setIsEditing(false);
  };

  const formatTime = (t) => {
    const d = new Date(t);
    let h = d.getHours(); const m = d.getMinutes();
    const p = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return m === 0 ? `${h} ${p}` : `${h}:${m.toString().padStart(2, '0')} ${p}`;
  };

  const toInputDT = (d) => d ? new Date(d).toISOString().slice(0, 16) : "";

  return (
    <div className="sheet-backdrop fixed inset-0 bg-black/60 flex flex-col justify-end z-50">
      <div className="sheet-panel bg-white rounded-t-2xl p-5 flex flex-col gap-3 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {!isEditing ? (
              <>
                <h3 className="font-bold text-base">{title}</h3>
                <p className="text-sm text-gray-500">{typeof selectedMember === 'string' ? selectedMember : selectedMember?.name}</p>
                {!task && <p className="text-sm text-gray-500">{formatTime(startTime)} – {formatTime(endTime)}</p>}
                {notes ? <p className="text-sm mt-1">{notes}</p> : null}
              </>
            ) : (
              <div className="flex flex-col gap-3 w-full">
                {/* Member selector */}
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => (
                    <button key={m.user_id}
                      className={`px-3 h-9 rounded-full text-sm font-medium
                        ${(selectedMember === m.name || selectedMember?.user_id === m.user_id) ? 'ring-2 ring-gray-400' : ''}`}
                      style={{ backgroundColor: (selectedMember === m.name || selectedMember?.user_id === m.user_id) ? m.color : '#e5e7eb' }}
                      onClick={() => setSelectedMember(m)}
                    >{m.name}</button>
                  ))}
                </div>
                <input className="border rounded-lg px-3 py-2" value={title} onChange={e => setTitle(e.target.value)} />
                {!task ? (
                  <>
                    <input type="datetime-local" className="border rounded-lg px-3 py-2"
                      value={toInputDT(startTime)} onChange={e => setStartTime(e.target.value)} />
                    <input type="datetime-local" className="border rounded-lg px-3 py-2"
                      value={toInputDT(endTime)} onChange={e => setEndTime(e.target.value)} />
                  </>
                ) : (
                  <input type="date" className="border rounded-lg px-3 py-2"
                    value={typeof startTime === 'string' ? startTime.slice(0, 10) : toInputDT(startTime).slice(0, 10)}
                    onChange={e => { setStartTime(e.target.value); setEndTime(e.target.value); }} />
                )}
                <input className="border rounded-lg px-3 py-2" placeholder="Notes"
                  value={notes} onChange={e => setNotes(e.target.value)} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="w-5 h-5" checked={task} onChange={e => setTask(e.target.checked)} />
                  Task
                </label>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 w-10 h-10 flex items-center justify-center text-xl ml-2">✕</button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {!isEditing ? (
            <>
              <button onClick={() => setIsEditing(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-sm font-medium">
                <FaRegEdit /> Edit
              </button>
              <button onClick={deleteAnEvent}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-500 text-sm font-medium">
                <FaRegTrashAlt /> Delete
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSave}
                className="flex-1 py-3 rounded-xl bg-[var(--green)] font-semibold text-sm shadow-md">
                Save
              </button>
              <button onClick={cancelEdit}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-sm font-medium">
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;