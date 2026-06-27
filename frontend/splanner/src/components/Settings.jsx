import { useState } from "react";
import { deleteGroup } from "../api";

const Settings = ({ isOpen, onClose, groupCode, onLogout, onRegenerateCode }) => {
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setConfirmingRegenerate(false);
    setConfirmingDelete(false);
    onClose();
  };

  const handleRegenerateCode = async () => {
    try {
      setRegenerating(true);
      await onRegenerateCode();
    } catch (e) {
      alert("Could not generate a new code");
    } finally {
      setRegenerating(false);
      setConfirmingRegenerate(false);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      setDeleting(true);
      await deleteGroup(groupCode);
      onLogout();
    } catch (e) {
      alert("Could not delete group");
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <div className="sheet-backdrop fixed inset-0 bg-black/60 flex flex-col justify-end z-50">
      <div className="sheet-panel bg-white rounded-t-2xl p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">Settings</h2>
          <button onClick={handleClose} className="text-gray-400 w-10 h-10 flex items-center justify-center text-xl">✕</button>
        </div>
        <div className="bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-400 mb-1">Group Code</p>
          <p className="font-mono font-bold tracking-widest text-lg">{groupCode}</p>
        </div>
        <div className="flex flex-col gap-3">
          {confirmingRegenerate ? (
            <div className="rounded-xl bg-red-50 p-3 flex flex-col gap-2">
              <p className="text-xs text-red-500">
                Everyone in the group will need the new code to sign back in. Continue?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmingRegenerate(false)}
                  className="flex-1 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegenerateCode}
                  disabled={regenerating}
                  className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {regenerating ? "Generating…" : "Yes, generate"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingRegenerate(true)}
              className="w-full py-3 rounded-xl bg-red-50 text-red-500 font-medium text-sm"
            >
              Request new group code
            </button>
          )}

          {confirmingDelete ? (
            <div className="rounded-xl bg-red-50 p-3 flex flex-col gap-2">
              <p className="text-xs text-red-500">
                This permanently deletes the group, its members, and all events for everyone. Continue?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="flex-1 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteGroup}
                  disabled={deleting}
                  className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Yes, delete group"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold text-sm"
            >
              Delete group
            </button>
          )}

          <button onClick={onLogout} className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm">
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
