import { useState, useEffect } from "react";
import { getChores, addChore, toggleChore, deleteChore } from "../api";
import { FaRegTrashAlt } from "react-icons/fa";

const Chores = ({ members, groupCode }) => {
  const [chores, setChores] = useState([]);
  const [adding, setAdding] = useState(null); // user_id of member being added to
  const [newChoreText, setNewChoreText] = useState("");

  const fetchChores = async () => {
    const data = await getChores(groupCode);
    setChores(data);
  };

  useEffect(() => {
    fetchChores();
  }, [groupCode]);

  const handleAdd = async (userId) => {
    if (!newChoreText.trim()) return;
    try {
      await addChore(groupCode, { user_id: userId, title: newChoreText.trim(), completed: false });
      setNewChoreText("");
      setAdding(null);
      fetchChores();
    } catch (e) {
      console.error("Failed to add chore", e);
    }
  };

  const handleToggle = async (chore) => {
    try {
      // Optimistic update
      setChores(prev =>
        prev.map(c => c.chore_id === chore.chore_id ? { ...c, completed: !c.completed } : c)
      );
      await toggleChore(groupCode, chore.chore_id, !chore.completed);
    } catch (e) {
      console.error("Failed to toggle chore", e);
      fetchChores(); // revert on error
    }
  };

  const handleDelete = async (choreId) => {
    try {
      setChores(prev => prev.filter(c => c.chore_id !== choreId));
      await deleteChore(groupCode, choreId);
    } catch (e) {
      console.error("Failed to delete chore", e);
      fetchChores();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto no-scrollbar px-4 py-4 gap-5">
      {members.map((member) => {
        const memberChores = chores.filter(c => c.user_id === member.user_id);
        const done = memberChores.filter(c => c.completed).length;
        const isAdding = adding === member.user_id;

        return (
          <div key={member.user_id} className="flex flex-col gap-2">
            {/* Member header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: member.color }}
                >
                  {member.name[0].toUpperCase()}
                </div>
                <span className="font-semibold text-sm text-gray-700">{member.name}</span>
                {memberChores.length > 0 && (
                  <span className="text-xs text-gray-400">{done}/{memberChores.length}</span>
                )}
              </div>
              <button
                onClick={() => { setAdding(isAdding ? null : member.user_id); setNewChoreText(""); }}
                className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                {isAdding ? "✕" : "+"}
              </button>
            </div>

            {/* Add chore input */}
            {isAdding && (
              <div className="flex gap-2 pl-9">
                <input
                  autoFocus
                  type="text"
                  placeholder="New chore..."
                  value={newChoreText}
                  onChange={e => setNewChoreText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAdd(member.user_id)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <button
                  onClick={() => handleAdd(member.user_id)}
                  disabled={!newChoreText.trim()}
                  className="px-3 py-2 rounded-lg bg-[var(--green)] text-sm font-semibold disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            )}

            {/* Chore list */}
            {memberChores.length === 0 && !isAdding ? (
              <p className="text-xs text-gray-300 pl-9">No chores yet</p>
            ) : (
              <div className="flex flex-col gap-1 pl-9">
                {memberChores.map((chore) => (
                  <div
                    key={chore.chore_id}
                    className="flex items-center gap-3 py-2 px-3 rounded-xl bg-gray-50 group"
                  >
                    <button
                      onClick={() => handleToggle(chore)}
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{
                        borderColor: chore.completed ? member.color : "#d1d5db",
                        backgroundColor: chore.completed ? member.color : "transparent",
                      }}
                    >
                      {chore.completed && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <span className={`flex-1 text-sm ${chore.completed ? "line-through text-gray-300" : "text-gray-700"}`}>
                      {chore.title}
                    </span>
                    <button
                      onClick={() => handleDelete(chore.chore_id)}
                      className="text-gray-300 hover:text-red-400 active:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      style={{ minHeight: 28, minWidth: 28 }}
                    >
                      <FaRegTrashAlt size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-b border-gray-100 mt-1" />
          </div>
        );
      })}
    </div>
  );
};

export default Chores;