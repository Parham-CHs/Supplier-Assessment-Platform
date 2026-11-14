"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  LockKeyhole,
  Mail,
  Building2,
  Truck,
} from "lucide-react";
import { Card, Button, Badge } from "@/components/ui";
import type { Role } from "@/lib/types";
import { useApp } from "@/components/app-provider";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const { setRole } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(
        "Supabase is not configured. Add the project URL and anon key to .env.local.",
      );
      setLoading(false);
      return;
    }
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    
    // const { data: profile, error: profileError } = await supabase
    //   .from("profiles")
    //   .select("role")
    //   .single();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Could not retrieve authenticated user.");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      throw new Error(
        profileError?.message ||
          "No SupplyScope profile is linked to this account.",
      );
    }


    if (profileError || !profile) {
      await supabase.auth.signOut();
      setError(
        "Your account is signed in, but no SupplyScope profile is linked. Ask an administrator to provision your profile.",
      );
      setLoading(false);
      return;
    }
    router.replace(
      profile.role === "supplier_user" ? "/supplier" : "/dashboard",
    );
    router.refresh();
  }
  const enterDemo = (role: Role) => {
    setRole(role);
    router.push(role === "supplier_user" ? "/supplier" : "/dashboard");
  };
  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white">
            <Activity size={25} />
          </div>
          <h1 className="text-2xl font-bold">Welcome to SupplyScope</h1>
          <p className="mt-2 text-sm text-muted">
            Sign in to your supplier assessment workspace.
          </p>
          <Badge tone="green">
            {isSupabaseConfigured() ? "Supabase authentication" : "Demo mode"}
          </Badge>
        </div>
        {!isSupabaseConfigured() ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <Building2 className="mb-3 text-brand" />
              <h2 className="font-semibold">Organization demo</h2>
              <Button
                className="mt-4 w-full"
                onClick={() => enterDemo("org_admin")}
              >
                Enter as admin
              </Button>
              <button
                className="mt-3 w-full text-xs text-brand"
                onClick={() => enterDemo("org_manager")}
              >
                Enter as manager
              </button>
            </Card>
            <Card>
              <Truck className="mb-3 text-emerald-600" />
              <h2 className="font-semibold">Supplier demo</h2>
              <Button
                variant="secondary"
                className="mt-4 w-full"
                onClick={() => enterDemo("supplier_user")}
              >
                Enter as supplier
              </Button>
            </Card>
          </div>
        ) : (
          <Card>
            <form onSubmit={signIn} className="space-y-4">
              <label className="block text-sm font-medium">
                Email
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-line px-3">
                  <Mail size={16} className="text-muted" />
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-3 text-sm outline-none"
                    placeholder="you@company.com"
                  />
                </div>
              </label>
              <label className="block text-sm font-medium">
                Password
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-line px-3">
                  <LockKeyhole size={16} className="text-muted" />
                  <input
                    required
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-3 text-sm outline-none"
                    placeholder="Your password"
                  />
                </div>
              </label>
              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}
              <Button className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
                <ArrowRight size={15} />
              </Button>
            </form>
          </Card>
        )}
        <p className="mt-5 text-center text-xs leading-5 text-muted">
          Accounts are created and assigned an organization or supplier role by
          an administrator. Demo role switching is disabled when Supabase is
          configured.
        </p>
      </div>
    </main>
  );
}
