import { useState } from 'react';

const GroupCodeScreen = ({ onSubmit, onCreateGroup, loadingJoin, loadingCreate, statusCode }) => {
  const [code, setCode] = useState("");

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-10 bg-white px-8">
      {/* Join */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <h1 className="text-lg font-bold text-gray-800">Enter Group Code</h1>
        <input
          className="border-2 border-gray-300 rounded-xl px-4 py-3 w-full text-center text-xl font-mono tracking-widest focus:outline-none focus:border-gray-500 uppercase"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="XXXXX"
          maxLength={5}
        />
        {statusCode === 404 && <p className="text-red-500 text-sm">Group not found</p>}
        <button
          onClick={() => onSubmit(code)}
          disabled={loadingJoin || !code}
          className="w-full py-3 rounded-xl bg-[var(--green)] font-semibold text-base disabled:opacity-50 active:scale-98 transition-all"
        >
          {loadingJoin ? "Joining…" : "Join Group"}
        </button>
      </div>

      <div className="w-full max-w-xs flex flex-col items-center gap-3">
        <p className="text-sm text-gray-400">Don't have a code?</p>
        <button
          onClick={onCreateGroup}
          disabled={loadingCreate}
          className="w-full py-3 rounded-xl bg-[#b370fa] text-white font-semibold text-base disabled:opacity-50 active:scale-98 transition-all"
        >
          {loadingCreate ? "Creating…" : "Create New Group"}
        </button>
      </div>
    </div>
  );
};

export default GroupCodeScreen;