import Header from "./Header";
import Reveal from "./Reveal";

const displayFont = { fontFamily: "var(--font-display)" };

const Section = ({ title, children }) => (
  <Reveal className="border-t border-gray-200 first:border-t-0 pt-8 pb-8 flex flex-col gap-3">
    <h2 className="text-2xl text-gray-900" style={displayFont}>
      {title}
    </h2>
    <div className="flex flex-col gap-2 text-sm text-gray-600 leading-relaxed max-w-xl">
      {children}
    </div>
  </Reveal>
);

const List = ({ items }) => (
  <ul className="list-disc pl-5 flex flex-col gap-1">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

const UserManual = () => {
  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <Header />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <Reveal className="pb-2">
          <h1 className="text-4xl text-gray-900 mb-3" style={displayFont}>
            User Manual
          </h1>
          <p className="text-gray-500">
            Everything Splanner can do, in one place. No accounts, no settings to dig through —
            just a calendar your whole group shares.
          </p>
        </Reveal>

        <Section title="Getting started">
          <p>
            Splanner doesn't use accounts. Instead, your group is
            identified by a 5-character code.
          </p>
          <List
            items={[
              `"Create New Group" generates a brand-new code for your household.`,
              `"Join Group" lets you enter a code someone else already created.`,
              "Once you've joined, the code is remembered on that device — you won't see this screen again unless you log out.",
            ]}
          />
        </Section>

        <Section title="Calendar views">
          <p>The toolbar at the top switches between three views:</p>
          <List
            items={[
              "Week — an hour-by-hour grid for the current week, with a red line marking the current time.",
              "Month — a full month at a glance, with a colored bar per event (color matches the member) and a legend at the bottom.",
              "Chores — the per-member checklist (see below).",
            ]}
          />
          <p>
            The current local temperature shows in the top-right corner, pulled from your
            device's location automatically.
          </p>
        </Section>

        <Section title="Adding an event or task">
          <p>
            Tap the green <strong>+</strong> button in the bottom-right corner (hidden while
            you're on the Chores tab).
          </p>
          <List
            items={[
              "Pick which member it's for, give it a title, and choose a time.",
              `Toggle "Task (all-day)" for something without a specific time — it'll span the whole day instead.`,
              "Setting a start time automatically sets the end time to one hour later; adjust it if needed.",
              "Notes are optional.",
            ]}
          />
        </Section>

        <Section title="Editing or deleting an event">
          <p>Tap any event or task to open it. From there you can:</p>
          <List
            items={[
              "Edit — change the title, time, notes, or even reassign it to a different member.",
              "Delete — remove it for everyone in the group.",
            ]}
          />
        </Section>

        <Section title="Members">
          <p>
            On desktop, members appear as colored circles in the left rail. On mobile, tap the
            menu icon in the top-left to open the member list.
          </p>
          <List
            items={[
              `Tap "+" to add a new member — give them a name and pick a color.`,
              "Tap a member's circle (or their row, on mobile) to edit their name/color or remove them from the group.",
              "Every member's events and chores are color-coded to match them throughout the app.",
            ]}
          />
        </Section>

        <Section title="Chores">
          <p>
            The Chores tab groups a checklist per member, with a quick done/total count next to
            their name.
          </p>
          <List
            items={[
              `Tap "+" next to a member to add a chore for them.`,
              "Tap the circle next to a chore to mark it done — tap again to undo.",
              "A trash icon appears next to each chore to delete it.",
            ]}
          />
        </Section>

        <Section title="Staying in sync">
          <p>
            Every change — a new event, a completed chore, a new member — broadcasts instantly to
            every device connected to the same group. There's nothing to refresh or save; if
            someone else updates the calendar, you'll see it appear live.
          </p>
        </Section>

        <Section title="Settings">
          <p>
            The gear icon (bottom of the sidebar on desktop, or in the mobile menu) shows your
            group's code, in case you need to invite someone else, and a "Log out" option that
            clears the saved group from this device.
          </p>
        </Section>
      </div>
    </div>
  );
};

export default UserManual;
