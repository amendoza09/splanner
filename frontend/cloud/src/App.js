import { useState, useEffect, useCallback } from "react";
import GroupCodeScreen from './components/GroupCode';
import Calendar from './components/Calendar';
import Sidebar from './components/Sidebar';
import { io } from "socket.io-client"; 

import { getGroupByCode, createGroup} from './api';

const socket = io(import.meta.env.API_URL);

function App() {
  const [members, setMembers] = useState([]);
  const [groupCode, setGroupCode] = useState(null);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);

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
        <Sidebar 
          members={members} 
          groupCode={groupCode} 
          onLogout={handleLogout}
          onNewMember={refresh} 
          onUpdate={refresh}
          onUserDelete={refresh}
        />
        <Calendar 
          members={members} 
          onNewEvent={refresh} 
          onDeleteEvent={refresh} 
          onUpdate={refresh} 
        />
    </div>
  );
}

export default App;
