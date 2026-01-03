import { useState, useEffect } from "react";
import GroupCodeScreen from './components/GroupCode';
import Calendar from './components/Calendar';
import Sidebar from './components/Sidebar';

import { getGroupByCode, createGroup, getMembers } from './api';

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

  const getNewMembers = async () => {
    try{
      const data = await getMembers(groupCode);
      setMembers(data.users);
    } catch(e) {
      alert("failed to get members");
    }
  };

  const getNewEvents = async() => {
    try {
      const data = await getMembers(groupCode);
      setMembers(data.users);
    }catch(e) {
      alert("failed to get any new events");
    }
  }

  useEffect(() => {
    const savedCode = localStorage.getItem("groupCode");
    if(savedCode) enterGroup(savedCode);
  }, []);

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
    <div className="flex flex-row w-screen">
        <Sidebar members={members} groupCode={groupCode} onNewMember={getNewMembers} onLogout={handleLogout}/>
        <Calendar members={members} onNewEvent={getNewEvents} />
    </div>
  );
}

export default App;
