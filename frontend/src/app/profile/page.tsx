"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { authFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle2 } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  email_verified: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  ta: "Teaching Assistant",
  instructor: "Instructor",
  user: "User",
  admin: "Admin",
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between py-3">
      <span className="text-sm font-medium text-muted-foreground w-36 shrink-0">{label}</span>
      <span className="text-sm font-medium break-all">{value}</span>
    </div>
  );
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function ChangePasswordForm({ token }: { token: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch("/user/change-password", token, {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Password change failed.");
        return;
      }
      toast.success("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="current-password">Current password</Label>
        <Input
          id="current-password"
          type="password"
          placeholder="••••••••"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          placeholder="••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    authFetch(`/user/by-email?email=${encodeURIComponent(user.email)}`, user.token)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        setProfile(data.user ?? null);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load profile from user service.");
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const displayName = profile?.name || user.email;
  const role = profile?.role ?? user.role;

  return (
    <div className="mx-auto max-w-lg space-y-8 py-8">
      {/* Avatar + header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-muted">
          <UserCircle2 className="size-10 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{displayName}</h1>
          <Badge variant="secondary">{ROLE_LABELS[role] ?? role}</Badge>
        </div>
      </div>

      {/* Account details card */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Account Details
        </h2>
        <Separator className="mb-1" />

        {loading && (
          <p className="py-4 text-sm text-muted-foreground text-center">Loading…</p>
        )}
        {error && (
          <p className="py-4 text-sm text-destructive text-center">{error}</p>
        )}
        {profile && !loading && (
          <>
            <InfoRow label="Name" value={profile.name ?? "—"} />
            <Separator />
            <InfoRow label="Email" value={profile.email} />
            <Separator />
            <InfoRow label="Role" value={ROLE_LABELS[profile.role] ?? profile.role} />
            <Separator />
            <InfoRow label="Member since" value={formatDate(profile.created_at)} />
          </>
        )}
      </div>

      {/* Change password card */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Change Password
        </h2>
        <Separator className="mb-4" />
        <ChangePasswordForm token={user.token} />
      </div>
    </div>
  );
}
