import { useState, useEffect, useCallback } from "react";
import GroupCodeScreen from './components/GroupCode';
import Calendar from './components/Calendar';
import Sidebar from './components/Sidebar';
import { io } from "socket.io-client"; 

import { GiHamburgerMenu } from "react-icons/gi";

import { getGroupByCode, createGroup} from './api';

const socket = io(import.meta.env.API_URL);

function App() {
  const [members, setMembers] = useState([]);
  const [groupCode, setGroupCode] = useState(null);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const enterGroup = async(code) => {
    const data = await getGroupByCode(code);
    const normalizedMembers = data.users.map(user => ({
      ...user,
      events: user.events ?? []
    }));

    setGroupCode(code);
    setMembers(normalizedMembers);
    localStorage.setItem("groupCode", code);
  }

  const handleLogout = () => {
    localStorage.removeItem("groupCode");
    setGroupCode(null);
    setMembers([]);
  };

  const handleJoinGroup = async (code) => {
    try{
      setLoadingJoin(true);
      await enterGroup(code);
      
    }catch (e) {
      alert("Invalid group code", e);
    } finally {
      setLoadingJoin(false);
    }
  };

  const handleCreateGroup = async () => {
    try {
      setLoadingCreate(true);
      const data = await createGroup();

      await enterGroup(data.group_code);
    } catch(e) {
      alert("Cannot make groups at this time");
    } finally {
      setLoadingCreate(false);
    }
  }

  const refresh = useCallback(async () => {
    if (!groupCode) return;
    const data = await getGroupByCode(groupCode);
    setMembers(
      data.users.map(u => ({ ...u, events: u.events ?? [] }))
    );
  }, [groupCode]);

  useEffect(() => {
    const savedCode = localStorage.getItem("groupCode");
    if(savedCode) enterGroup(savedCode);
  }, []);

  useEffect(() => {
    if(!groupCode) return;

    socket.emit("join-group",groupCode);
    socket.on("group-updated", refresh)

    return () => {
      socket.off("group-updated", refresh);
      socket.emit("leave-group", groupCode);
    }
  }, [groupCode, refresh])

  if(!groupCode) {
    return (
        <GroupCodeScreen 
          onSubmit={handleJoinGroup} 
          onCreateGroup={handleCreateGroup}
          loadingJoin={loadingJoin}
          loadingCreate={loadingCreate}
        />
    )
  }

  return (
    <div className="flex flex-row w-screen overflow-hidden inset-0 fixed">
      <button
        className="sm:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded"
        onClick={() => setSidebarVisible(true)}
      >
        <GiHamburgerMenu size={24} />
      </button>
      <span className="hidden sm:block">
        <Sidebar 
          members={members} 
          groupCode={groupCode} 
          onLogout={handleLogout}
          onNewMember={refresh} 
          onUpdate={refresh}
          onUserDelete={refresh}
        />
      </span>
      {sidebarVisible && (
        <div
          className="fixed inset-0 bg-black/40 z-40 sm:hidden"
          onClick={() => setSidebarVisible(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full w-32 bg-white z-50 transform
          transition-transform duration-300 ease-in-out
          sm:hidden
          ${sidebarVisible ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar
          members={members}
          groupCode={groupCode}
          onLogout={() => {
            setSidebarVisible(false);
            handleLogout();
          }}
          onNewMember={refresh}
          onUpdate={refresh}
          onUserDelete={refresh}
        />
      </div>
        <Calendar 
          members={members} 
          onNewEvent={refresh} 
          onDeleteEvent={refresh} 
          onUpdate={refresh}
          onRefresh={refresh}
        />
    </div>
  );
}

export default App;
