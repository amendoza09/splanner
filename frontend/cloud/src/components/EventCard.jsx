
import { FaRegTrashAlt } from "react-icons/fa";
import { deleteEvent } from "../api";

const EventCard = ({ isOpen, onClose, event, onDelete}) => {

    if(!isOpen) return null;

    const deleteAnEvent = async () => {
      try {
        await deleteEvent(event.user_id, event.id);
        onDelete?.();   // refresh parent
        onClose();      // close modal
      } catch (err) {
        console.error("Failed to delete event", err);
      }
    };

    return(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-[500px] h-[300px] relative justify-center flex flex-col">
          <div>
            <h2 className="text-lg font-bold mb-4">event info</h2>
            <div className="gap-3">
              <h3 className="font-bold py-2">{event.title}</h3>
              <p>{event.notes}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <button className="px-4 py-2 text-red-600"  
              onClick={() => {
                deleteAnEvent()
              }}
            >
              <FaRegTrashAlt />
            </button>
            <button  className="px-4 py-2 text-red-600 rounded" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
};

export default EventCard;