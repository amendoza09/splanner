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

export const addEventToUser = async (userId, event) => {
  try{
    const res = await API.post(`/members/${userId}/events`, event);
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

export const deleteUser = async(user_id) => {
  const res = await API.delete(`/members/${user_id}`)
  return res.data;
}

export const deleteEvent = async(user_id, event_id) => {
  const res = await API.delete(`/members/${user_id}/events/${event_id}`)
  return res.data;
}

export const updateEvent = async(userID, eventID, updatedPayload) => {
  const res = await API.patch(`/members/${userID}/events/${eventID}`, updatedPayload)
  return res.data;
}

export const getWeather = async () => {
  // 1. Get user's coordinates from browser
  const position = await new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject)
  );

  const { latitude, longitude } = position.coords;

  // 2. Convert lat/lng to a weather.gov grid point
  const pointRes = await axios.get(`https://api.weather.gov/points/${latitude},${longitude}`);
  const { gridId, gridX, gridY } = pointRes.data.properties;

  // 3. Fetch hourly forecast for that grid point
  const forecastRes = await axios.get(
    `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/forecast/hourly?units=us`
  );

  return forecastRes.data;
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

export const toggleChore = async (choreId, completed) => {
  const res = await API.patch(`/chores/${choreId}`, { completed });
  return res.data;
};

export const deleteChore = async (choreId) => {
  const res = await API.delete(`/chores/${choreId}`);
  return res.data;
};