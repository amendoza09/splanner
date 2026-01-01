import { useState } from "react";
import AddMember from "./AddMember";
import Member from './Member';

const Sidebar = ({ members, groupCode }) => {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [memberOpen, setMemberOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);

    const handleAddMember = () => {
        // api call to add person to database based on group code
        console.log("Member added");
        setIsAddOpen(false);
    }
    return(
        <div className="h-screen w-[8rem] border border-1 py-8 px-5 flex flex-col">
            <div className="w-full flex flex-col items-start gap-5">
                {members.map((member) => (
                    <button 
                        key={member.user_id}
                        className={`px-1 py-2 rounded-full w-full text-white`}
                        style={{ backgroundColor: member.color }}
                        onClick={() =>{
                            setMemberOpen(true)
                            setSelectedMember(member)
                        }}
                    >
                        {member.name}
                    </button>
                ))}
                <button onClick={()=> setIsAddOpen(true)}>+</button>
            </div>
            <div className="mt-[auto]">
                <p className="text-gray-500 text-sm">Group Code: </p>
                <p className="text-gray-500 text-sm">{groupCode}</p>
            </div>

            <AddMember
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onAdd={handleAddMember}
            />
            <Member 
                isOpen={memberOpen}
                onClose={() => setMemberOpen(false)}
                member={selectedMember}
            />
        </div>
    );
};

export default Sidebar;