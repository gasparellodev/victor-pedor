"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/contexts/SidebarContext";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const ChevronLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const HelpIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const navItems: NavItem[] = [
  { href: "/videos", label: "Projects", icon: <FolderIcon /> },
  { href: "/settings", label: "Settings", icon: <SettingsIcon /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={`hidden md:flex flex-col pt-8 pb-6 h-[calc(100vh-64px)] bg-[#10131a]/80 sticky top-16 border-r border-[var(--outline-variant)]/20 transition-all duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Toggle button */}
      <div className={`flex mb-4 ${collapsed ? "justify-center px-0" : "justify-end px-4"}`}>
        <button
          onClick={toggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1 rounded-md text-slate-500 hover:bg-slate-800/50 hover:text-slate-200 transition-colors duration-150"
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>

      {/* Workspace info */}
      {!collapsed && (
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--surface-container-highest)] flex items-center justify-center overflow-hidden border border-[var(--outline-variant)]/20">
              <span className="text-sm font-bold text-blue-300 font-[family-name:var(--font-manrope)]">SC</span>
            </div>
            <div>
              <p className="text-sm font-medium tracking-wide text-[var(--on-surface)]">Workspace</p>
              <p className="text-[10px] uppercase tracking-widest text-[var(--primary)] font-bold">Free Plan</p>
            </div>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="flex justify-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-[var(--surface-container-highest)] flex items-center justify-center overflow-hidden border border-[var(--outline-variant)]/20">
            <span className="text-sm font-bold text-blue-300 font-[family-name:var(--font-manrope)]">SC</span>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/videos"
              ? pathname === "/videos" || pathname.startsWith("/videos/")
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center gap-3 py-2 text-sm font-medium tracking-wide transition-all duration-200 ease-in-out ${
                collapsed ? "justify-center px-0" : "px-4"
              } ${
                isActive
                  ? "bg-blue-500/10 text-blue-300 border-l-2 border-blue-400"
                  : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              {item.icon}
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto px-4">
        <Link
          href="/videos/new"
          title="New Project"
          className={`w-full brand-gradient text-[var(--on-primary-container)] rounded-lg py-3 flex items-center font-bold mb-6 active:scale-95 duration-150 ${
            collapsed ? "justify-center px-0" : "justify-center gap-2"
          }`}
        >
          <PlusIcon />
          {!collapsed && "New Project"}
        </Link>
        <button
          title="Help Center"
          className={`flex items-center gap-3 text-slate-500 py-2 hover:bg-slate-800/50 hover:text-slate-200 text-sm font-medium tracking-wide w-full ${
            collapsed ? "justify-center px-0" : "px-4"
          }`}
        >
          <HelpIcon />
          {!collapsed && "Help Center"}
        </button>
      </div>
    </aside>
  );
}
