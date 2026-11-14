"use client";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useApp } from "./app-provider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
export function AppShell({ children }: { children: React.ReactNode }) {
  const { role, loading, error, mode } = useApp();
  const path = usePathname();
  const router = useRouter();
  const isSupplierRoute = path === "/supplier" || path.startsWith("/supplier/");
  useEffect(() => {
    if (loading) return;
    if (
      mode === "supabase" &&
      !error &&
      role === "supplier_user" &&
      !isSupplierRoute &&
      path !== "/notifications"
    )
      router.replace("/supplier");
    if (
      mode === "supabase" &&
      !error &&
      role !== "supplier_user" &&
      isSupplierRoute
    )
      router.replace("/dashboard");
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
  return (
    <div>
      <Sidebar />
      <div className="min-h-screen lg:pl-64">
        <Topbar />
        <main className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
