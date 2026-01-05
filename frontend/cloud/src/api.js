import axios from 'axios';

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const getGroupByCode = async (groupCode) => {
    try {
        const res = await API.get(`/group/${groupCode}`);
        return res.data;
    } catch(err) {
        console.error("failed to fetch group:", err);
        return { users: [] };
    }
};


export const getMembers = async (groupCode) => {
    try {
        const res = await API.get(`/group/code/${groupCode}/members`);
        return res.data;
    } catch(err) {
        console.error("failed to fetch group:", err);
        return { users: [] };
    }
};

export const addUserToGroup = async (groupCode, member) => {
  const res = await API.post(`/group/code/${groupCode}/members`, member);
  return res.data;
};

export const addEventToUser = async (userId, event) => {
  const res = await API.post(`/members/${userId}/events`, event);
  return res.data;
};

export const createGroup = async () => {
  const res = await API.post("/group");
  return res.data;
}

export const updateUser = async(groupCode, userID, updatedPayload) => {
  const res = await API.patch(`/group/code/${groupCode}/members/${userID}`, updatedPayload)
  return res.data
}

export const deleteEvent = async(user_id, event_id) => {
  const res = await API.delete(`/members/${user_id}/events/${event_id}`)
  return res.data;
}