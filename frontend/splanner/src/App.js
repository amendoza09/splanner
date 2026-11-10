import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GroupCodeScreen from './components/GroupCode';
import Calendar from './components/Calendar';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { io } from "socket.io-client";

import { getGroupByCode, createGroup, regenerateGroupCode } from './api';

const SOCKET_URL = process.env.REACT_APP_API_URL;
const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
});

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [groupCode, setGroupCode] = useState(null);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [status, setStatus] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // True while this tab's own regenerate-code request is in flight, so the
  // broadcast it triggers doesn't log this tab itself out (see the
  // "group_code_changed" listener below).
  const selfRotatingRef = useRef(false);
  // Mirrors groupCode synchronously, so a response that lands after a logout or
  // group switch can tell it no longer applies.
  const codeRef = useRef(null);
  const fetching = useRef(false);
  const fetchAgain = useRef(false);
  const creating = useRef(false);

  const applyGroup = (code, res) => {
    setStatus(res.status);
    codeRef.current = code;
    setGroupCode(code);
    setMembers(res.users);
    localStorage.setItem("groupCode", code);
  };

  const clearSession = useCallback(() => {
    // Another tab may have already saved a newer code; only forget our own.
    if (localStorage.getItem("groupCode") === codeRef.current) {
      localStorage.removeItem("groupCode");
    }
    codeRef.current = null;
    setGroupCode(null);
    setMembers([]);
  }, []);

  const enterGroup = async (code) => {
    const res = await getGroupByCode(code);
    if (res.status === 200) applyGroup(code, res);
    else setStatus(res.status === 404 ? 404 : "unreachable");
  };

  const handleJoinGroup = async (code) => {
    try {
      setLoadingJoin(true);
      await enterGroup(code);
    } finally {
      setLoadingJoin(false);
    }
  };

  const handleCreateGroup = async () => {
    if (creating.current) return;
    creating.current = true;
    try {
      setStatus(null);
      setLoadingCreate(true);
      const data = await createGroup();
      await enterGroup(data.group_code);
    } catch (e) {
      alert("Cannot make groups at this time");
    } finally {
      creating.current = false;
      setLoadingCreate(false);
    }
  };

  const handleRegenerateCode = async () => {
    selfRotatingRef.current = true;
    // Safety net in case the broadcast this triggers never arrives (e.g. a
    // dropped connection) — don't leave the flag stuck suppressing a future,
    // unrelated rotation by someone else.
    setTimeout(() => { selfRotatingRef.current = false; }, 5000);
    const data = await regenerateGroupCode(groupCode);
    localStorage.setItem("groupCode", data.group_code);
    codeRef.current = data.group_code;
    setGroupCode(data.group_code);
  };

  // Runs one request at a time so responses can't land out of order; a call
  // made during a request queues one more pass. A failed fetch keeps what's on
  // screen, but a 404 means the code is no longer valid (e.g. it was rotated
  // while this device was offline and missed the broadcast).
  const refresh = useCallback(async () => {
    if (fetching.current) { fetchAgain.current = true; return; }
    fetching.current = true;
    try {
      do {
        fetchAgain.current = false;
        const code = codeRef.current;
        if (!code) break;
        const res = await getGroupByCode(code);
        if (code !== codeRef.current) continue;
        if (res.status === 200) setMembers(res.users);
        else if (res.status === 404 && !selfRotatingRef.current) clearSession();
      } while (fetchAgain.current);
    } finally {
      fetching.current = false;
    }
  }, [clearSession]);

  // On mount — restore saved group, or auto-create one if the user
  // arrived here via a "Create Group" link
  useEffect(() => {
    const savedCode = localStorage.getItem("groupCode");
    if (savedCode) {
      // If the server is unreachable, keep waiting instead of treating the
      // saved code as invalid, so an unattended reload can recover by itself.
      let cancelled = false;
      let retryTimer;
      const restore = async () => {
        const res = await getGroupByCode(savedCode);
        if (cancelled) return;
        if (res.retryable) {
          retryTimer = setTimeout(restore, 5000);
          return;
        }
        if (res.status === 200) {
          applyGroup(savedCode, res);
        } else if (res.status === 404) {
          // The group is really gone; forget the code so Landing stops
          // redirecting here.
          localStorage.removeItem("groupCode");
          setStatus(404);
        }
        setCheckingSession(false);
      };
      restore();
      return () => {
        cancelled = true;
        clearTimeout(retryTimer);
      };
    }
    setCheckingSession(false);
  }, []);

  // A "Create Group" link is a one-time request. Clear it right away, because
  // history state survives a reload and would otherwise create another group.
  useEffect(() => {
    if (!location.state?.autoCreate) return;
    navigate(location.pathname, { replace: true, state: null });
    if (!localStorage.getItem("groupCode")) handleCreateGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Refresh once the server confirms the join, so a change made just before
  // it can't be missed. A rejected join also refreshes, which finds the 404.
  const joinRoom = useCallback((code) => {
    socket.emit("join_group", { group_code: code }, () => refresh());
  }, [refresh]);

  // The "connect" listener below handles joining when offline, and the server
  // drops room membership on disconnect, so nothing needs to be queued.
  useEffect(() => {
    if (!groupCode) return;
    if (socket.connected) joinRoom(groupCode);
    return () => {
      if (socket.connected) socket.emit("leave_group", { group_code: groupCode });
    };
  }, [groupCode, joinRoom]);

  // Listen for the group's code changing or the group being deleted —
  // these reach every connected client, not just the one that requested it.
  // The server never sends the new code over this channel (only in the HTTP
  // response to whoever requested it), so for everyone else this is a forced
  // logout — they need the new code shared with them out of band.
  useEffect(() => {
    const onCodeChanged = () => {
      if (selfRotatingRef.current) {
        selfRotatingRef.current = false;
        return;
      }
      clearSession();
    };
    socket.on("group_code_changed", onCodeChanged);
    socket.on("group_deleted", clearSession);
    return () => {
      socket.off("group_code_changed", onCodeChanged);
      socket.off("group_deleted", clearSession);
    };
  }, [clearSession]);

  // Listen for server-side refresh broadcasts
  useEffect(() => {
    const handler = () => refresh();
    socket.on("refresh", handler);

    const onReconnect = () => {
      if (groupCode) joinRoom(groupCode);
    };
    socket.on("connect", onReconnect);

    return () => {
      socket.off("refresh", handler);
      socket.off("connect", onReconnect);
    };
  }, [refresh, groupCode, joinRoom]);

  if (checkingSession) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div
          className="w-10 h-10 rounded-full animate-spin"
          style={{ border: "4px solid #e0e0e0", borderTopColor: "var(--red)" }}
        />
      </div>
    );
  }

  if (!groupCode) {
    return (
      <div className="h-screen flex flex-col">
        <Header />
        <div className="flex-1 min-h-0">
          <GroupCodeScreen
            onSubmit={handleJoinGroup}
            onCreateGroup={handleCreateGroup}
            loadingJoin={loadingJoin}
            loadingCreate={loadingCreate}
            statusCode={status}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row w-screen h-screen overflow-hidden fixed inset-0">
      <Sidebar
        members={members}
        groupCode={groupCode}
        onLogout={clearSession}
        onRegenerateCode={handleRegenerateCode}
        onNewMember={refresh}
        onUpdate={refresh}
        onUserDelete={refresh}
        drawerOpen={drawerOpen}
        onDrawerChange={setDrawerOpen}
      />
      {/* On mobile, Calendar takes full width since Sidebar is an overlay */}
      <div className="flex-1 min-w-0">
        <Calendar
          members={members}
          groupCode={groupCode}
          onNewEvent={refresh}
          onDeleteEvent={refresh}
          onUpdate={refresh}
          onOpenMenu={() => setDrawerOpen(true)}
        />
      </div>
    </div>
  );
}

export default App;