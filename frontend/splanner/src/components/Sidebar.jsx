import { useState } from "react";
import { addUserToGroup } from '../api';
import { IoSettingsOutline } from "react-icons/io5";
import { RiMenu3Line, RiCloseLine } from "react-icons/ri";
import AddMember from "./AddMember";
import Member from './Member';
import Settings from "./Settings";

const Sidebar = ({ members, groupCode, onNewMember, onLogout, onRegenerateCode, onUpdate, onUserDelete }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleAddMember = async (member) => {
    try {
      await addUserToGroup(groupCode, member);
      await onNewMember();
      setIsAddOpen(false);
    } catch (e) {
      alert("Failed to add member");
    }
  };

  const closeDrawer = () => setDrawerOpen(false);

  // Desktop rail content (circles only)
  const desktopContent = (
    <div className="flex flex-col items-center py-4 gap-3 h-full w-full">
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
        <button
          className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 text-xl flex items-center justify-center active:bg-gray-200 transition-colors"
          style={{ minHeight: 40, minWidth: 40 }}
          onClick={() => setIsAddOpen(true)}
        >
          +
        </button>
      </div>
      <button
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
        style={{ minHeight: 40, minWidth: 40 }}
        onClick={() => setSettingsOpen(true)}
      >
        <IoSettingsOutline size={22} color="#9ca3af" />
      </button>
    </div>
  );

  return (
    <>
      {/* ── Desktop: static rail ── */}
      <div
        className="hidden md:flex h-screen flex-col items-center border-r border-gray-200 bg-white"
        style={{ width: 64, minWidth: 64 }}
      >
        {desktopContent}
      </div>

      {/* ── Mobile: hamburger button ── */}
      <button
        className="md:hidden fixed top-2 left-2 z-40 w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm active:bg-gray-50 transition-colors"
        onClick={() => setDrawerOpen(true)}
        style={{ minHeight: 44, minWidth: 44 }}
      >
        <RiMenu3Line size={22} color="#374151" />
      </button>

      {/* ── Mobile: backdrop ── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={closeDrawer}
        />
      )}

      {/* ── Mobile: slide-in drawer ── */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full z-50 bg-white shadow-xl flex flex-col transition-transform duration-300 ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: 220, transitionTimingFunction: "var(--ease-drawer)" }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <span className="font-semibold text-gray-700 text-sm tracking-wide">Members</span>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            onClick={closeDrawer}
          >
            <RiCloseLine size={20} color="#6b7280" />
          </button>
        </div>

        {/* Member list rows */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
          {members.map((member) => (
            <button
              key={member.user_id}
              className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors text-left"
              onClick={() => {
                setMemberOpen(true);
                setSelectedMember(member);
                closeDrawer();
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm"
                style={{ backgroundColor: member.color }}
              >
                {member.name[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 truncate">{member.name}</span>
            </button>
          ))}

          {/* Add member row */}
          <button
            className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors text-left"
            onClick={() => { setIsAddOpen(true); closeDrawer(); }}
          >
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xl flex-shrink-0">
              +
            </div>
            <span className="text-sm font-medium text-gray-500">Add Member</span>
          </button>
        </div>

        {/* Settings row at bottom */}
        <div className="border-t border-gray-100 py-2">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors text-left"
            onClick={() => { setSettingsOpen(true); closeDrawer(); }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0">
              <IoSettingsOutline size={22} color="#9ca3af" />
            </div>
            <span className="text-sm font-medium text-gray-500">Settings</span>
          </button>
        </div>
      </div>

      {/* ── Modals ── */}
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
        onRegenerateCode={onRegenerateCode}
      />
    </>
  );
};

export default Sidebar;