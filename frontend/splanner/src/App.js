import { useState, useEffect, useCallback } from "react";
import GroupCodeScreen from './components/GroupCode';
import Calendar from './components/Calendar';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { io } from "socket.io-client";

import { getGroupByCode, createGroup } from './api';

const SOCKET_URL = process.env.REACT_APP_API_URL;
const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
});

function App() {
  const [members, setMembers] = useState([]);
  const [groupCode, setGroupCode] = useState(null);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [status, setStatus] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

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
    if (groupCode) socket.emit("leave_group", { group_code: groupCode });
    localStorage.removeItem("groupCode");
    setGroupCode(null);
    setMembers([]);
  };

  const handleJoinGroup = async (code) => {
    try {
      setLoadingJoin(true);
      await enterGroup(code);
    } catch (e) {
      alert("Invalid group code");
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

  // On mount — restore saved group
  useEffect(() => {
    const savedCode = localStorage.getItem("groupCode");
    if (!savedCode) {
      setCheckingSession(false);
      return;
    }
    enterGroup(savedCode).finally(() => setCheckingSession(false));
  }, []);

  // When groupCode is set, join the socket room
  useEffect(() => {
    if (!groupCode) return;
    socket.emit("join_group", { group_code: groupCode });
    return () => {
      socket.emit("leave_group", { group_code: groupCode });
    };
  }, [groupCode]);

  // Listen for server-side refresh broadcasts
  useEffect(() => {
    const handler = () => refresh();
    socket.on("refresh", handler);

    const onReconnect = () => {
      if (groupCode) socket.emit("join_group", { group_code: groupCode });
      refresh();
    };
    socket.on("connect", onReconnect);

    return () => {
      socket.off("refresh", handler);
      socket.off("connect", onReconnect);
    };
  }, [refresh, groupCode]);

  if (checkingSession) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div
          className="w-10 h-10 rounded-full animate-spin"
          style={{ border: "4px solid #e0e0e0", borderTopColor: "var(--red)" }}
        />
      </div>
    );
  }

  if (!groupCode) {
    return (
      <div className="h-screen flex flex-col">
        <Header />
        <div className="flex-1 min-h-0">
          <GroupCodeScreen
            onSubmit={handleJoinGroup}
            onCreateGroup={handleCreateGroup}
            loadingJoin={loadingJoin}
            loadingCreate={loadingCreate}
            statusCode={status}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row w-screen h-screen overflow-hidden fixed inset-0">
      <Sidebar
        members={members}
        groupCode={groupCode}
        onLogout={handleLogout}
        onNewMember={refresh}
        onUpdate={refresh}
        onUserDelete={refresh}
      />
      {/* On mobile, Calendar takes full width since Sidebar is an overlay */}
      <div className="flex-1 min-w-0">
        <Calendar
          members={members}
          groupCode={groupCode}
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