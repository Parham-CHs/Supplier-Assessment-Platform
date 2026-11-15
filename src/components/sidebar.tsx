
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  Package,
  Truck,
  Bell,
  ShieldCheck,
  X,
} from "lucide-react";
import { useApp } from "./app-provider";

const org = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/products", label: "Products", icon: Package },
  { href: "/questionnaires", label: "Questionnaires", icon: ClipboardList },
  { href: "/assignments", label: "Assignments", icon: FileCheck2 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const supplier = [
  { href: "/supplier", label: "Overview", icon: LayoutDashboard },
  {
    href: "/supplier/questionnaires",
    label: "My questionnaires",
    icon: ClipboardList,
  },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const path = usePathname();
  const { role } = useApp();
  const links = role === "supplier_user" ? supplier : org;
  const homeHref = role === "supplier_user" ? "/supplier" : "/dashboard";

  const navigation = (
    <>
      <Link
        href={homeHref}
        onClick={onClose}
        className="mb-9 flex items-center gap-3 px-2"
      >
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white">
          <Activity size={22} />
        </div>
        <div>
          <div className="font-bold tracking-tight">SupplyScope</div>
          <div className="text-xs text-muted">Supplier intelligence</div>
        </div>
      </Link>

      <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[.12em] text-gray-400">
        Workspace
      </div>

      <nav className="space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              path === href || path.startsWith(href + "/")
                ? "bg-brand-soft text-brand"
                : "text-muted hover:bg-gray-50 hover:text-ink"
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto rounded-2xl bg-slate-50 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck size={17} className="text-brand" />
          Secure workspace
        </div>
        <p className="text-xs leading-5 text-muted">
          Supplier responses are separated by company permissions.
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-white px-4 py-5 lg:flex">
        {navigation}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={onClose}
            className="absolute inset-0 bg-black/40"
          />

          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white px-4 py-5 shadow-xl">
            <div className="mb-5 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation menu"
                className="rounded-lg p-2 text-muted hover:bg-gray-100"
              >
                <X size={21} />
              </button>
            </div>

            {navigation}
          </aside>
        </div>
      )}
    </>
  );
}
