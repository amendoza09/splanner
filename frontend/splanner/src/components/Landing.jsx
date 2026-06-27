import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "./Header";
import Reveal from "./Reveal";
import AdRail from "./AdRail";

const FEATURES = [
  { title: "Shared Calendar", desc: "Everyone in the group sees the same week and month view, always in sync." },
  { title: "Chore Tracker", desc: "Assign chores per member and check them off as they're done." },
  { title: "Real-Time Sync", desc: "Changes show up instantly on every connected device." },
  { title: "No Accounts Needed", desc: "Just a 5-character code to join or create a group." },
];

const PI_POINTS = [
  { title: "Kiosk mode", desc: "Launches fullscreen with no browser chrome or taskbar — just the calendar." },
  { title: "Touch-first", desc: "Every button and view is sized for tapping, not just clicking." },
  { title: "Always current", desc: "Add an event from your phone and it appears on the wall instantly." },
];

const displayFont = { fontFamily: "var(--font-display)" };

const Landing = () => {
  const navigate = useNavigate();

  // Returning users (and the kiosk/Pi build) already have a saved group —
  // skip the marketing page and go straight into the calendar.
  useEffect(() => {
    if (localStorage.getItem("groupCode")) {
      navigate("/app", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <AdRail side="left" />
      <AdRail side="right" />
      <Header />

      <Reveal as="section" className="flex flex-col items-center text-center px-6 pt-16 pb-12 max-w-2xl mx-auto">
        <h1 className="text-4xl sm:text-5xl leading-tight text-gray-900 mb-5" style={displayFont}>
          A shared calendar your whole household actually uses
        </h1>
        <p className="text-gray-500 mb-8 max-w-md">
          Create a group, share the code, and everyone's events, chores, and schedules stay in
          sync — no accounts required.
        </p>
        <div className="flex gap-3">
          <Link
            to="/app"
            state={{ autoCreate: true }}
            className="btn-pill btn-pill-fill px-6 h-12 text-white"
            style={{ backgroundColor: "var(--red)" }}
          >
            Create Group
          </Link>
          <Link
            to="/app"
            className="btn-pill btn-pill-outline px-6 h-12 border border-gray-300 text-gray-700"
          >
            Join Group
          </Link>
        </div>
      </Reveal>

      <section className="px-6 py-16 max-w-2xl mx-auto">
        <h2 className="text-3xl text-gray-900 mb-10 text-center" style={displayFont}>
          What's inside
        </h2>
        <div className="flex flex-col">
          {FEATURES.map((f, i) => (
            <Reveal
              key={f.title}
              delay={i * 60}
              className="border-t border-gray-200 first:border-t-0 py-6 flex flex-col sm:flex-row sm:items-baseline sm:gap-8"
            >
              <h3 className="text-xl text-gray-900 sm:w-56 flex-shrink-0" style={displayFont}>
                {f.title}
              </h3>
              <p className="text-gray-500 mt-1 sm:mt-0">{f.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal as="section" className="px-6 py-20 bg-white border-y border-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl text-gray-900 mb-4" style={displayFont}>
            Built for a wall-mounted display
          </h2>
          <p className="text-gray-500 mb-10 max-w-md mx-auto">
            Splanner runs great as a dedicated family command center — mount a Raspberry Pi
            with a touchscreen on the wall and it boots straight into your calendar.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
            {PI_POINTS.map((p) => (
              <div key={p.title}>
                <h3 className="font-semibold text-gray-900 mb-1">{p.title}</h3>
                <p className="text-sm text-gray-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal as="footer" className="flex flex-col items-center gap-5 py-16">
        <Link
          to="/self-host"
          className="btn-pill btn-pill-outline px-6 h-12 border border-gray-300 text-gray-700"
        >
          Run your own instance
        </Link>
        <Link to="/manual" className="text-sm font-medium text-gray-400 hover:text-gray-600 underline">
          User Manual
        </Link>
      </Reveal>
    </div>
  );
};

export default Landing;
