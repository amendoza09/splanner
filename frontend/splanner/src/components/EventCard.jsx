import { useState, useEffect } from 'react';
import { deleteEvent, updateEvent } from "../api";
import { FaRegTrashAlt, FaRegEdit } from "react-icons/fa";
import ConfirmDialog from "./ConfirmDialog";
import { toISOLocal } from "../utils/calendar";

const EventCard = ({ isOpen, onClose, event, onDelete, onUpdate, members, groupCode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [notes, setNotes] = useState("");
  const [task, setTask] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setStartTime(new Date(event.start_time));
      setEndTime(new Date(event.end_time));
      setSelectedMemberId(event.user_id);
      setNotes(event.notes || "");
      setTask(event.is_task);
      setIsEditing(false);
      setConfirmingDelete(false);
    }
  }, [event]);

  if (!isOpen) return null;

  const selectedMemberName = members.find((m) => m.user_id === selectedMemberId)?.name ?? event?.member;

  const deleteAnEvent = async () => {
    try {
      setDeleting(true);
      await deleteEvent(groupCode, event.user_id, event.id);
      onDelete();
      onClose();
    } catch (err) {
      console.error("Failed to delete event", err);
      alert("Could not delete this event");
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    const start = toISOLocal(startTime);
    const end = toISOLocal(endTime);
    const day = start.slice(0, 10);

    if (start.includes("NaN") || (!task && end.includes("NaN"))) { alert("Please provide valid times"); return; }
    if (!task && end <= start) { alert("End time must be after the start time"); return; }

    try {
      setSaving(true);
      await updateEvent(groupCode, event.user_id, event.id, {
        title,
        start_time: task ? `${day}T00:00:00` : start,
        end_time: task ? `${day}T23:59:59` : end,
        user_id: selectedMemberId ?? event.user_id,
        notes,
        is_task: task,
      });
      onUpdate();
      onClose();
    } catch (err) {
      console.error("Failed to update event", err);
      alert("Could not save this event");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setTitle(event.title); setStartTime(event.start_time); setEndTime(event.end_time);
    setSelectedMemberId(event.user_id); setNotes(event.notes || ""); setTask(event.is_task);
    setIsEditing(false);
  };

  const formatTime = (t) => {
    const d = new Date(t);
    let h = d.getHours(); const m = d.getMinutes();
    const p = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return m === 0 ? `${h} ${p}` : `${h}:${m.toString().padStart(2, '0')} ${p}`;
  };

  const toInputDT = (d) => d ? toISOLocal(d).slice(0, 16) : "";

  return (
    <div className="sheet-backdrop fixed inset-0 bg-black/60 flex flex-col justify-end z-50">
      <div className="sheet-panel bg-white rounded-t-2xl p-5 flex flex-col gap-3 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {!isEditing ? (
              <>
                <h3 className="font-bold text-base">{title}</h3>
                <p className="text-sm text-gray-500">{selectedMemberName}</p>
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
                        ${selectedMemberId === m.user_id ? 'ring-2 ring-gray-400' : ''}`}
                      style={{ backgroundColor: selectedMemberId === m.user_id ? m.color : '#e5e7eb' }}
                      onClick={() => setSelectedMemberId(m.user_id)}
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
                    value={toISOLocal(startTime).slice(0, 10)}
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
          <button onClick={onClose} disabled={saving} className="text-gray-400 w-10 h-10 flex items-center justify-center text-xl ml-2 disabled:opacity-40">✕</button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {!isEditing ? (
            <>
              <button onClick={() => setIsEditing(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-sm font-medium">
                <FaRegEdit /> Edit
              </button>
              <button onClick={() => setConfirmingDelete(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-500 text-sm font-medium">
                <FaRegTrashAlt /> Delete
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-[var(--green)] font-semibold text-sm shadow-md disabled:opacity-40 disabled:shadow-none">
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={cancelEdit}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-sm font-medium">
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title={`Delete ${event.title}?`}
          message={`${event.is_task ? "Only this day is deleted. " : ""}This removes it for everyone in the group and can't be undone.`}
          confirmLabel="Yes, delete"
          busyLabel="Deleting…"
          busy={deleting}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={deleteAnEvent}
        />
      )}
    </div>
  );
};

export default EventCard;