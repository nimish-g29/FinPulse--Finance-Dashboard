import { IconLayout, IconList, IconChart, IconSavings, IconLoan, IconCog, IconX } from "./Icons";

const NAV = [
  { id: "dashboard", label: "Overview", icon: IconLayout },
  { id: "analytics", label: "Analytics", icon: IconChart },
  { id: "transactions", label: "Transactions", icon: IconList },
  { id: "savings", label: "Savings", icon: IconSavings },
  { id: "loans", label: "Loans", icon: IconLoan },
  { id: "settings", label: "Settings", icon: IconCog },
];

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, onMobileClose }) {
  const select = (id) => {
    setActiveTab(id);
    onMobileClose?.();
  };

  const navContent = (
    <>
      <div className="px-4 pb-6 pt-8 lg:px-5 lg:pt-10">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <span className="font-display text-lg font-bold text-white">F</span>
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-white">FinPulse</p>
            <p className="text-xs text-slate-400">Finance control</p>
          </div>
        </div>

        <nav className="mt-10 space-y-1" aria-label="Main">
          {NAV.map((item) => {
            const active = activeTab === item.id;
            const NavIcon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => select(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  active
                    ? "bg-white/10 text-white shadow-inner ring-1 ring-white/10"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <NavIcon className={`h-5 w-5 shrink-0 ${active ? "text-indigo-300" : ""}`} />
                {item.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" aria-hidden />}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-white/5 px-5 py-5">
        <p className="text-xs text-slate-500">Local-first</p>
        <p className="text-[11px] text-slate-600">Your data stays in this browser · © Nimish Gupta</p>
      </div>
    </>
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!mobileOpen}
        onClick={onMobileClose}
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[min(18rem,100vw-3rem)] flex-col border-r border-white/5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-2xl transition-transform duration-300 ease-out lg:z-30 lg:w-64 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <button
          type="button"
          onClick={onMobileClose}
          className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <IconX className="h-5 w-5" />
        </button>
        {navContent}
      </aside>
    </>
  );
}
