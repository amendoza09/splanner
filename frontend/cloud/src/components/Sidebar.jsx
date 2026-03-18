import { useState } from "react";
import { addUserToGroup } from '../api';
import { IoSettingsOutline } from "react-icons/io5";
import AddMember from "./AddMember";
import Member from './Member';
import Settings from "./Settings";

// Slim 64px rail — shows colored initial circles, no text
const Sidebar = ({ members, groupCode, onNewMember, onLogout, onUpdate, onUserDelete }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const handleAddMember = async (member) => {
    try {
      await addUserToGroup(groupCode, member);
      await onNewMember();
      setIsAddOpen(false);
    } catch (e) {
      alert("Failed to add member");
    }
  };

  return (
    <div
      className="h-screen flex flex-col items-center py-4 gap-3 border-r border-gray-200 bg-white"
      style={{ width: 64, minWidth: 64 }}
    >
      {/* Member circles */}
      <div className="flex flex-col items-center gap-3 flex-1 w-full overflow-y-auto no-scrollbar">
        {members.map((member) => (
          <button
            key={member.user_id}
            title={member.name}
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm active:scale-95 transition-transform"
            style={{ backgroundColor: member.color, minHeight: 40, minWidth: 40 }}
            onClick={() => { setMemberOpen(true); setSelectedMember(member); }}
          >
            {member.name[0].toUpperCase()}
          </button>
        ))}

        {/* Add member button */}
        <button
          className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 text-xl flex items-center justify-center active:bg-gray-200 transition-colors"
          style={{ minHeight: 40, minWidth: 40 }}
          onClick={() => setIsAddOpen(true)}
        >
          +
        </button>
      </div>

      {/* Settings at bottom */}
      <button
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
        style={{ minHeight: 40, minWidth: 40 }}
        onClick={() => setSettingsOpen(true)}
      >
        <IoSettingsOutline size={22} color="#9ca3af" />
      </button>

      <AddMember
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAddMember}
      />
      {selectedMember && (
        <Member
          isOpen={memberOpen}
          onClose={() => setMemberOpen(false)}
          groupCode={groupCode}
          member={selectedMember}
          onUpdate={onUpdate}
          onUserDelete={onUserDelete}
        />
      )}
      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        groupCode={groupCode}
        onLogout={onLogout}
      />
    </div>
  );
};

export default Sidebar;