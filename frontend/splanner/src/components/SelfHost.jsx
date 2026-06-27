import Header from "./Header";
import Reveal from "./Reveal";

const displayFont = { fontFamily: "var(--font-display)" };

const Code = ({ children }) => (
  <pre className="bg-gray-900 text-gray-100 text-sm rounded-xl p-4 overflow-x-auto whitespace-pre">
    <code>{children}</code>
  </pre>
);

const Step = ({ n, title, children }) => (
  <Reveal className="flex flex-col gap-3">
    <h2 className="flex items-center gap-3 text-xl text-gray-900" style={displayFont}>
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center text-sm text-white flex-shrink-0"
        style={{ backgroundColor: "var(--red)", fontFamily: "initial" }}
      >
        {n}
      </span>
      {title}
    </h2>
    <div className="pl-10 flex flex-col gap-3 text-sm text-gray-600">{children}</div>
  </Reveal>
);

const SelfHost = () => {
  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <Header />

      <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col gap-10">
        <Reveal>
          <h1 className="text-4xl text-gray-900 mb-3" style={displayFont}>
            Run your own Splanner
          </h1>
          <p className="text-gray-500">
            Splanner is self-hostable! Clone the repo, point it at your own database, and build
            your own desktop app. Nothing runs through our servers; your group's data stays
            wherever you put it.
          </p>
        </Reveal>

        <Reveal className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-2">
          <h2 className="text-lg text-gray-900 font-semibold" style={displayFont}>
            Built for a Raspberry Pi + touchscreen
          </h2>
          <p className="text-gray-500 text-sm">
            These steps assume the reference setup: a Raspberry Pi with a touchscreen, booting
            straight into the kiosk build mounted on a wall. That's a recommendation, not a
            requirement. Anything that runs Python and Node works, from an old laptop to a mini
            PC to a regular monitor with a mouse and keyboard.
          </p>
        </Reveal>

        <Step n={1} title="Clone the repo">
          <Code>{`git clone https://github.com/amendoza09/splanner.git\ncd splanner`}</Code>
        </Step>

        <Step n={2} title="Set up the backend">
          <p>Create a Postgres database (Supabase's free tier works well), then:</p>
          <Code>{`cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\\Scripts\\activate
pip install -r requirements.txt`}</Code>
          <p>Create <code className="bg-gray-200 rounded px-1.5 py-0.5">backend/.env</code> with your own database connection string:</p>
          <Code>{`DB_URL=postgresql://user:password@host:port/dbname`}</Code>
          <p>Create the tables, then start the server:</p>
          <Code>{`python -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine)"
uvicorn app:app --host 0.0.0.0 --port 8000 --reload`}</Code>
        </Step>

        <Step n={3} title="Set up the frontend">
          <Code>{`cd frontend/splanner
npm install`}</Code>
          <p>Create <code className="bg-gray-200 rounded px-1.5 py-0.5">frontend/splanner/.env</code> pointing at your own backend:</p>
          <Code>{`REACT_APP_API_URL=http://localhost:8000`}</Code>
          <p>Run it in the browser, or as a desktop app during development:</p>
          <Code>{`npm start
# or
npm run electron-dev`}</Code>
        </Step>

        <Step n={4} title="Build your own desktop app">
          <p>Package installers for Mac, Windows, and Linux with Electron Builder:</p>
          <Code>{`npm run electron-prod`}</Code>
          <p>
            If the build runs out of memory, give Node more headroom:
          </p>
          <Code>{`NODE_OPTIONS=--max-old-space-size=4096 npm run electron-prod`}</Code>
        </Step>

        <Reveal className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex flex-col gap-2">
          <p className="font-semibold">A couple of gotchas</p>
          <p>
            <code className="bg-amber-100 rounded px-1.5 py-0.5">REACT_APP_API_URL</code> is baked into
            the app at build time, not read at runtime — set it correctly in{" "}
            <code className="bg-amber-100 rounded px-1.5 py-0.5">.env</code> before running
            <code className="bg-amber-100 rounded px-1.5 py-0.5 ml-1">electron-prod</code>, and rebuild
            if it changes.
          </p>
          <p>
            Never commit your <code className="bg-amber-100 rounded px-1.5 py-0.5">.env</code> files —
            both are already gitignored, but double-check before pushing a fork.
          </p>
        </Reveal>
      </div>
    </div>
  );
};

export default SelfHost;
