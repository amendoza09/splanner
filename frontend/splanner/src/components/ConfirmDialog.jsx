const ConfirmDialog = ({ title, message, confirmLabel, busyLabel, busy, onCancel, onConfirm }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
    <div role="alertdialog" aria-modal="true" className="bg-white rounded-2xl p-5 w-full max-w-sm flex flex-col gap-4 shadow-xl">
      <div className="flex flex-col gap-1">
        <h3 className="font-bold text-base break-words">{title}</h3>
        <p className="text-sm text-gray-500">{message}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          disabled={busy}
          className="flex-1 py-3 rounded-xl bg-gray-100 text-sm font-medium disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
        >
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmDialog;
