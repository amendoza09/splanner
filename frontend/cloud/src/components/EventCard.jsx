

const EventCard = ({ isOpen, onClose, event }) => {
    if(!isOpen) return null;

    return(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-[500px] h-[300px] relative justify-center flex flex-col">
          <div>
            <h2 className="text-lg font-bold mb-4">event info</h2>
          </div>
          <div className="flex justify-end gap-2">
            <button  className="px-4 py-2 text-red-600 rounded" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
};

export default EventCard;