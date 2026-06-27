import { useState } from 'react';
import logo from '../assets/splanner-logo.png';

const GroupCodeScreen = ({ onSubmit, onCreateGroup, loadingJoin, loadingCreate, statusCode }) => {
  const [code, setCode] = useState("");

  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f7f7f5',
      fontFamily: "'DM Sans', sans-serif",
      padding: '2rem',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

        .login-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 320px;
        }

        .logo-wrap {
          margin-bottom: 3rem;
        }

        .logo-wrap img {
          height: 44px;
          object-fit: contain;
        }

        .code-input {
          width: 100%;
          border: none;
          border-bottom: 2px solid #e0e0e0;
          padding: 12px 0;
          text-align: center;
          font-size: 24px;
          font-family: 'DM Mono', 'Courier New', monospace;
          font-weight: 500;
          letter-spacing: 0.3em;
          color: #1a1a1a;
          background: transparent;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .code-input:focus {
          border-color: #1a1a1a;
        }

        .code-input::placeholder {
          color: #d4d4d4;
          letter-spacing: 0.25em;
        }

        .error-msg {
          font-size: 12px;
          color: #e05252;
          margin-top: 8px;
          text-align: center;
          width: 100%;
        }

        .btn-join {
          width: 100%;
          padding: 15px;
          border-radius: 100px;
          border: none;
          background: var(--green, #6cc86a);
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 2rem;
          box-shadow: 0 8px 20px rgba(108, 200, 106, 0.35);
          transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;
        }

        .btn-join:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          box-shadow: none;
        }

        .btn-join:not(:disabled):active {
          transform: scale(0.98);
          box-shadow: 0 3px 10px rgba(108, 200, 106, 0.3);
        }
        @media (hover: hover) and (pointer: fine) {
          .btn-join:not(:disabled):hover { opacity: 0.88; }
        }

        .or-row {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          margin: 2rem 0;
        }

        .or-line {
          flex: 1;
          height: 1px;
          background: #e8e8e8;
        }

        .or-text {
          font-size: 12px;
          color: #bbb;
          font-weight: 500;
        }

        .btn-create {
          width: 100%;
          padding: 15px;
          border-radius: 100px;
          border: 1.5px solid #ddd;
          background: transparent;
          color: #8b4cf7;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.15s, transform 0.1s;
        }

        .btn-create:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .btn-create:not(:disabled):active { transform: scale(0.98); }
        @media (hover: hover) and (pointer: fine) {
          .btn-create:not(:disabled):hover { border-color: #c4a0f5; }
        }
      `}</style>

      <div className="login-wrap">

        <div className="">
          <img src={logo} alt="Logo" className="h-[15rem]"/>
        </div>

        <input
          className="code-input"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="XXXXX"
          maxLength={5}
          autoCapitalize="characters"
          spellCheck={false}
        />
        {statusCode === 404 && (
          <p className="error-msg">No group found with that code</p>
        )}

        <button
          className="btn-join"
          onClick={() => onSubmit(code)}
          disabled={loadingJoin || code.length < 5}
        >
          {loadingJoin ? "Joining…" : "Join Group"}
        </button>

        <div className="or-row">
          <div className="or-line" />
          <span className="or-text">or</span>
          <div className="or-line" />
        </div>

        <button
          className="btn-create"
          onClick={onCreateGroup}
          disabled={loadingCreate}
        >
          {loadingCreate ? "Creating…" : "Create New Group"}
        </button>

      </div>
    </div>
  );
};

export default GroupCodeScreen;