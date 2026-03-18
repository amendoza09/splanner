import { useState, useEffect } from "react";
import { FaRegEdit } from "react-icons/fa";
import { updateUser, deleteUser } from "../api";

const Member = ({ isOpen, onClose, groupCode, member, onUpdate, onUserDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(member.name);
  const [color, setColor] = useState(member.color);

  useEffect(() => {
    setName(member.name); setColor(member.color); setIsEditing(false);
  }, [member, isOpen]);

  if (!isOpen) return null;

  const saveChanges = async () => {
    try { await updateUser(groupCode, member.user_id, { name, color }); onUpdate(); setIsEditing(false); }
    catch (e) { alert("Could not update user"); }
  };

  const deleteAUser = async () => {
    try { await deleteUser(member.user_id); onUserDelete(); }
    catch (e) { alert("Could not delete user"); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex flex-col justify-end z-50">
      <div className="bg-white rounded-t-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">{member.name}</h2>
          <button onClick={onClose} className="text-gray-400 w-10 h-10 flex items-center justify-center text-xl">✕</button>
        </div>

        {!isEditing ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: member.color }} />
            <span className="text-sm text-gray-600">{member.name}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input className="border rounded-lg px-3 py-2" value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-500">Color</label>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-10 w-16 rounded border border-gray-200 cursor-pointer" />
              <div className="w-8 h-8 rounded-full" style={{ backgroundColor: color }} />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-sm font-medium">
              <FaRegEdit /> Edit
            </button>
          ) : (
            <>
              <button onClick={saveChanges}
                className="flex-1 py-3 rounded-xl bg-[var(--green)] font-semibold text-sm">Save</button>
              <button onClick={() => { setName(member.name); setColor(member.color); setIsEditing(false); }}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-sm">Cancel</button>
            </>
          )}
          <button onClick={deleteAUser}
            className="flex-1 py-3 rounded-xl bg-red-50 text-red-500 text-sm font-medium">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default Member;