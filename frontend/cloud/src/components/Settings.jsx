const Settings = ({ isOpen, onClose, groupCode, onLogout }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex flex-col justify-end z-50">
      <div className="bg-white rounded-t-2xl p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">Settings</h2>
          <button onClick={onClose} className="text-gray-400 w-10 h-10 flex items-center justify-center text-xl">✕</button>
        </div>
        <div className="bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-400 mb-1">Group Code</p>
          <p className="font-mono font-bold tracking-widest text-lg">{groupCode}</p>
        </div>
        <div className="flex flex-col gap-3">
          <button className="w-full py-3 rounded-xl bg-red-50 text-red-500 font-medium text-sm">
            Request new group code
          </button>
          <button onClick={onLogout} className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold text-sm">
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;