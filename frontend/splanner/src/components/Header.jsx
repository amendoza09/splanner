import { Link } from "react-router-dom";
import logo from "../assets/splanner-logo.png";

// The downloaded desktop app should feel like a dedicated kiosk app, not a
// website with marketing nav — only show this header in a real browser.
const isElectron = typeof navigator !== "undefined" && /Electron/i.test(navigator.userAgent);

const Header = () => {
  if (isElectron) return null;

  return (
    <header className="border-b border-gray-100">
      <div className="flex items-center justify-between px-6 py-3 max-w-3xl mx-auto w-full">
        <Link
          to="/"
          className="flex items-center transition-transform duration-150 active:scale-95"
          style={{ transitionTimingFunction: "var(--ease-out)" }}
        >
          <img src={logo} alt="Splanner" className="h-20 object-contain" />
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            to="/app"
            className="btn-pill btn-pill-outline px-5 h-10 border border-gray-300 text-sm text-gray-700"
          >
            Join Group
          </Link>
          <Link
            to="/app"
            state={{ autoCreate: true }}
            className="btn-pill btn-pill-fill px-5 h-10 text-sm text-white"
            style={{ backgroundColor: "var(--red)" }}
          >
            Create Group
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
