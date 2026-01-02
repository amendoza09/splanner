import { useState } from 'react';

const GroupCodeScreen = ({ onSubmit, onCreateGroup, loadingJoin, loadingCreate}) => {
  const [code, setCode] = useState("");

  return (
    <div className="h-screen w-screen justify-center items-center flex flex-col">
      <div className="flex flex-col items-center">
        <h1>Enter Group Code</h1>
        <input 
          className="border border-gray-300 px-3 py-2 my-3 rounded-lg flex text-center"
          value={code}
          onChange={ (e) => setCode(e.target.value.toUpperCase())}
          placeHolder="XXXXX"
        />
        <button
          onClick={() => onSubmit(code)}
          disabled={loadingJoin}
          className=" bg-[#91f573] px-5 py-3 rounded"
        >
          {loadingJoin ? "Joining..." : "Join Group"}
        </button>
      </div>

      <div className="my-20 flex flex-col items-center">
        <h2>Don't have one? make one here!</h2>

        <button
          onClick={onCreateGroup}
          disabled={loadingCreate}
          className="bg-[#b370fa] px-5 py-3 my-5 rounded"
        >
          {loadingCreate ? "Creating Group..." : "Create New Group"}
        </button>
      </div>
    </div>
  )
}

export default GroupCodeScreen;