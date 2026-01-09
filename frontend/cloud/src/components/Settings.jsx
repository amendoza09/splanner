const Settings = ({ isOpen, onClose, groupCode, onLogout }) => {

    if(!isOpen) return null;

    return(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg px-10 w-[380px] md:w-[500px] h-[300px] relative justify-center flex flex-col">
            <h2 className="text-lg font-bold mb-4">Settings</h2>
            <p>Group Code: {groupCode}</p>
            <div className="flex flex-col items-start pt-10 gap-7">
                <button className="text-red-600">Request new group code</button>
                <button className="text-red-600" onClick={onLogout}>Logout</button>
                <button  className="" onClick={onClose}>
                Close
                </button>
            </div>
            
        </div>
      </div>
    );
};

export default Settings;