import { useState, useEffect } from "react";
import GroupCodeScreen from './components/GroupCode';
import Calendar from './components/Calendar';
import Sidebar from './components/Sidebar';

import { getGroupByCode } from './api';

function App() {
  const [members, setMembers] = useState([]);
  const groupCode = "P4VZF"

  useEffect(() => {
    async function fetchGroup() {
      try {
        const data = await getGroupByCode(groupCode);
        setMembers(data.users);
      } catch (e) {
        console.error("Failed to fetch group", e);
      }
    }
    fetchGroup();
  }, [groupCode]);
  
  return (
    <div className="flex flex-row w-screen">
      <div>
        <Sidebar members={members} groupCode={groupCode}/>
      </div>
      <div>
        <Calendar members={members} />
      </div>
    </div>
  );
}

export default App;
