import axios from "axios";
import { io } from "socket.io-client";

const API_URL = process.env.REACT_APP_API_URL;
export const API = axios.create({
  baseURL: API_URL,
});

console.log(process.env.REACT_APP_API_URL);
const socket = io(API_URL);

export const getGroupByCode = async (groupCode) => {
    try {
        const res = await API.get(`/group/${groupCode}`);
        
        return{
          status: res.status,
          users: res.data.users
        };
    } catch(err) {
        console.error("failed to fetch group:", err);
        return { users: [] };
    }
};


export const getMembers = async (groupCode) => {
    try {
        const res = await API.get(`/group/${groupCode}/members`);
        return res.data;
    } catch(err) {
        console.error("failed to fetch group:", err);
        return { users: [] };
    }
};

export const addUserToGroup = async (groupCode, member) => {
  const res = await API.post(`/group/${groupCode}/members`, member);
  return res.data;
};

export const addEventToUser = async (groupCode, userId, event) => {
  try{
    const res = await API.post(`/members/${userId}/events`, event, { params: { group_code: groupCode } });
    socket.emit("event-added", res.data);

    return res.data
  } catch (err) {
    console.error("failed to create event", err);
  }

};

export const createGroup = async () => {
  const res = await API.post("/group");
  return res.data;
}

export const updateUser = async(groupCode, userID, updatedPayload) => {
  const res = await API.patch(`/group/${groupCode}/members/${userID}`, updatedPayload)
  return res.data
}

export const deleteUser = async(groupCode, user_id) => {
  const res = await API.delete(`/members/${user_id}`, { params: { group_code: groupCode } })
  return res.data;
}

export const deleteEvent = async(groupCode, user_id, event_id) => {
  const res = await API.delete(`/members/${user_id}/events/${event_id}`, { params: { group_code: groupCode } })
  return res.data;
}

export const updateEvent = async(groupCode, userID, eventID, updatedPayload) => {
  const res = await API.patch(`/members/${userID}/events/${eventID}`, updatedPayload, { params: { group_code: groupCode } })
  return res.data;
}

const COORDS_KEY  = "weather_coords";
const GRID_KEY    = "weather_grid"; 

const requestCoords = () =>
  new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject)
  );
 
const getCachedOrRequestCoords = async () => {
  const cached = localStorage.getItem(COORDS_KEY);
  if (cached) return JSON.parse(cached);
 
  // First time — prompt for permission and cache the result
  const position = await requestCoords();
  const coords = {
    lat: position.coords.latitude,
    lon: position.coords.longitude,
  };
  localStorage.setItem(COORDS_KEY, JSON.stringify(coords));
  return coords;
};
const getGrid = async (lat, lon) => {
  const cached = localStorage.getItem(GRID_KEY);
  if (cached) return JSON.parse(cached);
 
  // NWS points API resolves lat/lon → gridId, gridX, gridY
  const res = await axios.get(`https://api.weather.gov/points/${lat},${lon}`);
  const { gridId, gridX, gridY } = res.data.properties;
  const grid = { gridId, gridX, gridY };
  localStorage.setItem(GRID_KEY, JSON.stringify(grid));
  return grid;
};export const getWeather = async () => {
  const { lat, lon } = await getCachedOrRequestCoords();
  const { gridId, gridX, gridY } = await getGrid(lat, lon);
  const res = await axios.get(
    `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/forecast/hourly?units=us`
  );
  return res.data;
};
 
// Call this to reset location (e.g. from Settings if the Pi moves)
export const clearCachedLocation = () => {
  localStorage.removeItem(COORDS_KEY);
  localStorage.removeItem(GRID_KEY);
};
export const getChores = async (groupCode) => {
  try {
    const res = await API.get(`/group/${groupCode}/chores`);
    return res.data;
  } catch (err) {
    console.error("failed to fetch chores:", err);
    return [];
  }
};

export const addChore = async (groupCode, chore) => {
  const res = await API.post(`/group/${groupCode}/chores`, chore);
  return res.data;
};

export const toggleChore = async (groupCode, choreId, completed) => {
  const res = await API.patch(`/chores/${choreId}`, { completed }, { params: { group_code: groupCode } });
  return res.data;
};

export const deleteChore = async (groupCode, choreId) => {
  const res = await API.delete(`/chores/${choreId}`, { params: { group_code: groupCode } });
  return res.data;
};