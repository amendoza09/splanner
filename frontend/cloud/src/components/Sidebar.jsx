import { useState } from "react";
import { addUserToGroup } from '../api';
import { IoSettingsOutline } from "react-icons/io5";
import AddMember from "./AddMember";
import Member from './Member';
import Settings from "./Settings";

const Sidebar = ({ members, groupCode, onNewMember, onLogout, onUpdate }) => {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [memberOpen, setMemberOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState("");

    const handleAddMember = async (member) => {
        try {
            await addUserToGroup(groupCode, member);
            await onNewMember();
            setIsAddOpen(false);
        } catch(e) {
            alert("Failed to add member");
        }
    };
    
    return(
        <div className="h-screen md:w-[8rem] border border-1 py-8 px-2 flex flex-col">
            <div className="w-full flex flex-col items-start gap-5">
                {members.map((member) => (
                    <button 
                        key={member.user_id}
                        className={`px-1 py-2 sm:text-xs md:text-lg rounded-full w-full whitespace-nowrap`}
                        style={{ backgroundColor: member.color }}
                        onClick={() =>{
                            setMemberOpen(true)
                            setSelectedMember(member)
                        }}
                    >
                        <span className="hidden sm:block">
                            {member.name}
                        </span>
                        <span className="sm:hidden block">
                            {member.name[0]}
                        </span>
                        
                    </button>
                ))}
                <button className="px-3" onClick={()=> setIsAddOpen(true)}>+</button>
            </div>
            <div className="mt-[auto]">
                <div className="flex my-5 justify-center">
                    <button onClick={()=> setSettingsOpen(true)}>
                        <IoSettingsOutline size={32} color="gray" />
                    </button>
                </div>
            </div>

            <AddMember
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onAdd={handleAddMember}
            />
            <Member 
                isOpen={memberOpen}
                onClose={() => setMemberOpen(false)}
                groupCode={groupCode}
                member={selectedMember}
                onUpdate={onUpdate}
            />
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