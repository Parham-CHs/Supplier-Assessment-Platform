
"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useApp } from "./app-provider";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { role, loading, error, mode } = useApp();
  const path = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isSupplierRoute =
    path === "/supplier" || path.startsWith("/supplier/");

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [path]);

  useEffect(() => {
    if (loading) return;

    if (mode === "supabase" && !error && role === "unknown") {
      router.replace("/login");
      return;
    }

    if (
      mode === "supabase" &&
      !error &&
      role === "supplier_user" &&
      !isSupplierRoute &&
      path !== "/notifications"
    ) {
      router.replace("/supplier");
    }

    if (
      mode === "supabase" &&
      !error &&
      role !== "supplier_user" &&
      isSupplierRoute
    ) {
      router.replace("/dashboard");
    }
  }, [role, path, router, loading, error, mode, isSupplierRoute]);

  if (loading)
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted">
        Loading your secure workspace…
      </div>
    );

  if (mode === "supabase" && error)
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          <b>Unable to load your SupplyScope profile or data.</b>
          <p className="mt-2">{error}</p>
          <p className="mt-2">
            Check that your Auth user has a matching row in{" "}
            <code>public.profiles</code> and that the migration has been
            applied.
          </p>
        </div>
      </div>
    );

  if (mode === "supabase" && !loading && role === "unknown")
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted">
        Redirecting to sign in…
      </div>
    );

  return (
    <div>
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="min-h-screen lg:pl-64">
        {/* Mobile navigation button */}
        <div className="flex items-center gap-3 border-b border-line bg-white px-5 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            className="rounded-lg p-2 text-ink transition hover:bg-gray-100"
          >
            <Menu size={22} />
          </button>

          <span className="font-bold tracking-tight">SupplyScope</span>
        </div>

        <Topbar />

        <main className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
