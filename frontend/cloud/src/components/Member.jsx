import { useState, useEffect } from "react";
import { FaRegEdit } from "react-icons/fa";
import { updateUser, deleteUser } from "../api";

const Member = ({ isOpen, onClose, groupCode, member, onUpdate, onUserDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(member.name);
  const [color, setColor] = useState(member.color);

  useEffect(() => {
    setName(member.name)
    setColor(member.color)
    setIsEditing(false)
  }, [member, isOpen])

  const openEdit = () => setIsEditing(true)
  const cancelEdit = () => {
    setName(member.name)
    setColor(member.color)
    setIsEditing(false)
  }
  
  const saveChanges = async() => {
    try {
      await updateUser(groupCode, member.user_id, { name, color })
      onUpdate()
      setIsEditing(false)
    } catch (e) {
      alert("Could not update user")
    }
  }
  const deleteAUser = async() => {
    try {
      const data = await deleteUser(member.user_id);
      onUserDelete();
      setIsEditing(false);
    } catch (e) {
      alert("Could not delete user")
    }
  }

  if(!isOpen) return null;

    return(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex w-screen px-[2rem] items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-[380px] md:w-[500px] h-[300px] relative justify-center flex flex-col">
          {!isEditing && (
            <div>
                <h2 className="text-lg font-bold mb-4 pr-4">{member.name}</h2>
                <div style={{ background: member.color }} className="rounded-full h-6 w-6" />
            </div>
          )}
          {isEditing && (
            <div className="flex flex-col gap-4">
              <input
                className="border px-3 py-5 rounded"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
              />

              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20"
              />
            </div>
          )}   
          <div className="flex py-5 gap-2 w-full items-center justify-between">
            {!isEditing ? (
              <FaRegEdit size={24} className="opacity-60" onClick={() => openEdit()}/>
            ): (
              <>
                <button className="px-4 py-2 text-red-600 rounded" onClick={deleteAUser}>
                  remove
                </button>
                <button className="px-4 py-2 rounded bg-gray-200" onClick={cancelEdit}>
                  cancel
                </button>
                <button className="px-4 py-2 rounded bg-gray-200" onClick={saveChanges}>
                  Save
                </button>
              </>
            )}
                <button  className="px-4 py-2 text-red-600 rounded" onClick={onClose}>
                  Close
                </button>
              </div>  
            
          
        </div>
      </div>
    );
};

export default Member;