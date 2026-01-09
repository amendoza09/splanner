import { useState } from 'react';

const AddMember = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState("");
    const [color,setColor] = useState("#f783a4");

    if(!isOpen) return null;

    const handleAdd = () => {
      if(!name.trim()) return;
      onAdd({ name, color });
      setName("");
      setColor("#f783a4")
    }

    return(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-[380px] md:w-[500px] h-[300px] relative justify-center flex flex-col">
          <div>
            <h2 className="text-lg font-bold mb-4">Add Member</h2>

            <input 
              type="text"
              placeholder="Name"
              className="border border-gray-300 rounded px-3 py-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setName(e.target.value)}
            />
            <input 
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button  className="px-4 py-2 text-red-600 rounded" onClick={onClose}>
              Cancel
            </button>
            <button  
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" 
              onClick={handleAdd}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    );
};

export default AddMember;