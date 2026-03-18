import { useState, useEffect, useCallback } from "react";
import GroupCodeScreen from './components/GroupCode';
import Calendar from './components/Calendar';
import Sidebar from './components/Sidebar';
import { io } from "socket.io-client";

import { getGroupByCode, createGroup } from './api';

const socket = io("https://cloud-ktc9.onrender.com");

function App() {
  const [members, setMembers] = useState([]);
  const [groupCode, setGroupCode] = useState(null);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [status, setStatus] = useState(null);

  const enterGroup = async (code) => {
    try {
      const res = await getGroupByCode(code);
      if (!res || res.status !== 200) { setStatus(404); return; }
      const normalizedMembers = res.users.map(user => ({ ...user, events: user.events ?? [] }));
      setStatus(res.status);
      setGroupCode(code);
      setMembers(normalizedMembers);
      localStorage.setItem("groupCode", code);
    } catch (e) {
      setStatus(404);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("groupCode");
    setGroupCode(null);
    setMembers([]);
  };

  const handleJoinGroup = async (code) => {
    try {
      setLoadingJoin(true);
      await enterGroup(code);
    } catch (e) {
      alert("Invalid group code", e);
    } finally {
      setLoadingJoin(false);
    }
  };

  const handleCreateGroup = async () => {
    try {
      setStatus(null);
      setLoadingCreate(true);
      const data = await createGroup();
      await enterGroup(data.group_code);
    } catch (e) {
      alert("Cannot make groups at this time");
    } finally {
      setLoadingCreate(false);
    }
  };

  const refresh = useCallback(async () => {
    if (!groupCode) return;
    const data = await getGroupByCode(groupCode);
    setMembers(data.users.map(u => ({ ...u, events: u.events ?? [] })));
  }, [groupCode]);

  useEffect(() => {
    const savedCode = localStorage.getItem("groupCode");
    if (savedCode) enterGroup(savedCode);
  }, []);

  useEffect(() => {
    socket.on('event-added', (newEvent) => { console.log('New event added:', newEvent); });
    return () => { socket.off('event-added'); };
  }, []);

  if (!groupCode) {
    return (
      <GroupCodeScreen
        onSubmit={handleJoinGroup}
        onCreateGroup={handleCreateGroup}
        loadingJoin={loadingJoin}
        loadingCreate={loadingCreate}
        statusCode={status}
      />
    );
  }

  return (
    <div className="flex flex-row w-screen h-screen overflow-hidden fixed inset-0">
      {/* Slim sidebar rail — always visible */}
      <Sidebar
        members={members}
        groupCode={groupCode}
        onLogout={handleLogout}
        onNewMember={refresh}
        onUpdate={refresh}
        onUserDelete={refresh}
      />

      {/* Main calendar area takes remaining space */}
      <div className="flex-1 min-w-0">
        <Calendar
          members={members}
          onNewEvent={refresh}
          onDeleteEvent={refresh}
          onUpdate={refresh}
          onRefresh={refresh}
        />
      </div>
    </div>
  );
}

export default App;