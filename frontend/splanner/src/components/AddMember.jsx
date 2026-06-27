import { useState } from 'react';

const AddMember = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#f783a4");

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name, color });
    setName(""); setColor("#f783a4");
  };

  return (
    <div className="sheet-backdrop fixed inset-0 bg-black/60 flex flex-col justify-end z-50">
      <div className="sheet-panel bg-white rounded-t-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">Add Member</h2>
          <button onClick={onClose} className="text-gray-400 w-10 h-10 flex items-center justify-center text-xl">✕</button>
        </div>
        <input
          type="text" placeholder="Name"
          className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={name} onChange={(e) => setName(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500">Color</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
            className="h-10 w-16 rounded cursor-pointer border border-gray-200" />
          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: color }} />
        </div>
        <button
          onClick={handleAdd} disabled={!name.trim()}
          className="w-full py-3 rounded-xl bg-[var(--green)] text-white font-semibold disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default AddMember;