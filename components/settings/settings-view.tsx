"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  AtSign,
  Bell,
  BookOpen,
  ChevronRight,
  Compass,
  Eye,
  FileText,
  Image as ImageIcon,
  Inbox,
  KeyRound,
  Mail,
  MapPin,
  PartyPopper,
  Pencil,
  Shield,
  Store,
  Trash2,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { Button, Input } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { supabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SettingsView({ email }: { email: string }) {
  return (
    <div className="space-y-6">
      {/* 1 — Account */}
      <Group title="Account" desc="Your login and profile.">
        <LinkRow
          href="/profile/edit"
          icon={Pencil}
          label="Edit Profile"
          desc="Name, photo, bio, roles, and links"
        />
        <ChangeEmailRow currentEmail={email} />
        <ChangePasswordRow />
        <DeleteAccountRow />
      </Group>

      {/* 2 — Notifications */}
      <Group title="Notifications" desc="Choose what WrytrsBlock tells you about.">
        <ToggleRow
          id="notif_block_requests"
          icon={Inbox}
          label="Block Requests"
          desc="When a creator wants to start a Block with you"
        />
        <ToggleRow
          id="notif_block_invitations"
          icon={Bell}
          label="Block Invitations"
          desc="When you're invited to join a Block"
        />
        <ToggleRow
          id="notif_block_party"
          icon={PartyPopper}
          label="Block Party Notifications"
          desc="Reminders and updates for events you're part of"
        />
        <ToggleRow
          id="notif_marketplace"
          icon={Store}
          label="Marketplace Activity"
          desc="New creators and activity in the Block Market"
        />
        <ToggleRow
          id="notif_email"
          icon={Mail}
          label="Email Notifications"
          desc="Receive the above as emails too"
        />
      </Group>

      {/* 3 — Privacy */}
      <Group title="Privacy" desc="Control how creators discover you.">
        <ToggleRow
          id="privacy_public_profile"
          icon={Eye}
          label="Public Profile"
          desc="Let anyone view your Creator Profile and Featured Content"
        />
        <ToggleRow
          id="privacy_show_location"
          icon={MapPin}
          label="Show Location"
          desc="Display your city and region on your profile"
        />
        <ToggleRow
          id="privacy_discovery"
          icon={Compass}
          label="Creator Discovery"
          desc="Appear in Block Market search, filters, and suggestions"
        />
      </Group>

      {/* 4 — Featured Content */}
      <Group
        title="Featured Content"
        desc="The showcase that answers 'why start a Block with me?'"
      >
        <LinkRow
          href="/profile/edit#featured"
          icon={ImageIcon}
          label="Manage Featured Content"
          desc="Add, edit, or remove your showcase pieces"
        />
        <LinkRow
          href="/profile/edit#featured"
          icon={Upload}
          label="Upload Content"
          desc="Add a video, reel, audio, image, or portfolio link"
        />
        <LinkRow
          href="/profile/edit#featured"
          icon={ArrowUpDown}
          label="Reorder Content"
          desc="Choose your ⭐ Featured item and the order"
        />
      </Group>

      {/* 5 — Legal */}
      <Group title="Legal" desc="The rules of the road on WrytrsBlock.">
        <LinkRow href="/terms" icon={FileText} label="Terms of Service" newTab />
        <LinkRow href="/privacy" icon={Shield} label="Privacy Policy" newTab />
        <LinkRow
          href="/community-guidelines"
          icon={BookOpen}
          label="Community Guidelines"
          newTab
        />
      </Group>
    </div>
  );
}

// ── Section + rows ──────────────────────────────────────────────────────────
function Group({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface overflow-hidden">
      <div className="px-5 sm:px-6 pt-4 pb-3 border-b border-line">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted">
          {title}
        </h2>
        {desc && <p className="text-[12px] text-muted/80 mt-1">{desc}</p>}
      </div>
      <div className="divide-y divide-line">{children}</div>
    </section>
  );
}

const ROW = "flex items-center gap-3 px-5 sm:px-6 py-3.5";

function RowIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="h-9 w-9 shrink-0 rounded-lg bg-surface-2 border border-line flex items-center justify-center text-muted">
      <Icon size={16} strokeWidth={1.75} />
    </span>
  );
}

function LinkRow({
  href,
  icon,
  label,
  desc,
  newTab,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  desc?: string;
  newTab?: boolean;
}) {
  const body = (
    <>
      <RowIcon icon={icon} />
      <span className="flex-1 min-w-0">
        <span className="block text-[13.5px] font-medium text-ink">{label}</span>
        {desc && <span className="block text-[12px] text-muted mt-0.5">{desc}</span>}
      </span>
      <ChevronRight size={16} className="text-muted/60 shrink-0" />
    </>
  );
  const cls = cn(ROW, "hover:bg-surface-2 transition-colors");
  return newTab ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {body}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {body}
    </Link>
  );
}

function ToggleRow({
  id,
  icon,
  label,
  desc,
  defaultOn = true,
}: {
  id: string;
  icon: LucideIcon;
  label: string;
  desc?: string;
  defaultOn?: boolean;
}) {
  const key = `wb:pref:${id}`;
  const [on, setOn] = useState(defaultOn);

  useEffect(() => {
    try {
      const v = localStorage.getItem(key);
      if (v !== null) setOn(v === "1");
    } catch {}
  }, [key]);

  function toggle() {
    setOn((o) => {
      const next = !o;
      try {
        localStorage.setItem(key, next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  return (
    <div className={ROW}>
      <RowIcon icon={icon} />
      <span className="flex-1 min-w-0">
        <span className="block text-[13.5px] font-medium text-ink">{label}</span>
        {desc && <span className="block text-[12px] text-muted mt-0.5">{desc}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={toggle}
        className={cn(
          "relative ml-1 h-6 w-11 shrink-0 rounded-full border transition-colors",
          on ? "bg-accent border-accent" : "bg-surface-3 border-line-strong"
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform",
            on && "translate-x-[18px]"
          )}
        />
      </button>
    </div>
  );
}

// ── Account actions ─────────────────────────────────────────────────────────
function StatusNote({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <p
      className={cn(
        "mt-2 text-[12px] rounded-md px-3 py-2 border",
        ok
          ? "text-success bg-success/10 border-success/30"
          : "text-danger bg-danger/10 border-danger/30"
      )}
    >
      {children}
    </p>
  );
}

function ChangeEmailRow({ currentEmail }: { currentEmail: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(currentEmail);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  async function save() {
    setStatus(null);
    if (!supabaseConfigured) {
      setStatus({ ok: false, msg: "Connect your account to change your email." });
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setStatus({ ok: false, msg: "Enter a valid email address." });
      return;
    }
    setBusy(true);
    try {
      const sb = createSupabaseBrowserClient();
      const { error } = await sb.auth.updateUser({ email: email.trim() });
      if (error) setStatus({ ok: false, msg: error.message });
      else
        setStatus({
          ok: true,
          msg: "Check your inbox to confirm your new email address.",
        });
    } catch (e) {
      setStatus({
        ok: false,
        msg: e instanceof Error ? e.message : "Couldn't update your email.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-5 sm:px-6 py-3.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 text-left"
      >
        <RowIcon icon={AtSign} />
        <span className="flex-1 min-w-0">
          <span className="block text-[13.5px] font-medium text-ink">
            Change Email
          </span>
          <span className="block text-[12px] text-muted mt-0.5 truncate">
            {currentEmail || "Update your account email"}
          </span>
        </span>
        <ChevronRight
          size={16}
          className={cn(
            "text-muted/60 shrink-0 transition-transform",
            open && "rotate-90"
          )}
        />
      </button>
      {open && (
        <div className="mt-3 pl-12">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <div className="mt-2.5">
            <Button variant="primary" size="sm" onClick={save} disabled={busy} style={{ color: "#FFFFFF" }}>
              {busy ? "Saving…" : "Update email"}
            </Button>
          </div>
          {status && <StatusNote ok={status.ok}>{status.msg}</StatusNote>}
        </div>
      )}
    </div>
  );
}

function ChangePasswordRow() {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  async function save() {
    setStatus(null);
    if (!supabaseConfigured) {
      setStatus({ ok: false, msg: "Connect your account to change your password." });
      return;
    }
    if (pw.length < 8) {
      setStatus({ ok: false, msg: "Use at least 8 characters." });
      return;
    }
    if (pw !== confirm) {
      setStatus({ ok: false, msg: "Passwords don't match." });
      return;
    }
    setBusy(true);
    try {
      const sb = createSupabaseBrowserClient();
      const { error } = await sb.auth.updateUser({ password: pw });
      if (error) setStatus({ ok: false, msg: error.message });
      else {
        setStatus({ ok: true, msg: "Password updated." });
        setPw("");
        setConfirm("");
      }
    } catch (e) {
      setStatus({
        ok: false,
        msg: e instanceof Error ? e.message : "Couldn't update your password.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-5 sm:px-6 py-3.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 text-left"
      >
        <RowIcon icon={KeyRound} />
        <span className="flex-1 min-w-0">
          <span className="block text-[13.5px] font-medium text-ink">
            Change Password
          </span>
          <span className="block text-[12px] text-muted mt-0.5">
            Set a new password for your account
          </span>
        </span>
        <ChevronRight
          size={16}
          className={cn(
            "text-muted/60 shrink-0 transition-transform",
            open && "rotate-90"
          )}
        />
      </button>
      {open && (
        <div className="mt-3 pl-12 space-y-2.5">
          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="New password"
            autoComplete="new-password"
          />
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
          />
          <Button variant="primary" size="sm" onClick={save} disabled={busy} style={{ color: "#FFFFFF" }}>
            {busy ? "Saving…" : "Update password"}
          </Button>
          {status && <StatusNote ok={status.ok}>{status.msg}</StatusNote>}
        </div>
      )}
    </div>
  );
}

function DeleteAccountRow() {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-5 sm:px-6 py-3.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 text-left"
      >
        <span className="h-9 w-9 shrink-0 rounded-lg bg-danger/10 border border-danger/30 flex items-center justify-center text-danger">
          <Trash2 size={16} strokeWidth={1.75} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13.5px] font-medium text-danger">
            Delete Account
          </span>
          <span className="block text-[12px] text-muted mt-0.5">
            Permanently remove your account and data
          </span>
        </span>
        <ChevronRight
          size={16}
          className={cn(
            "text-muted/60 shrink-0 transition-transform",
            open && "rotate-90"
          )}
        />
      </button>
      {open && (
        <div className="mt-3 pl-12">
          <div className="rounded-lg border border-danger/30 bg-danger/[0.06] px-3.5 py-3">
            <p className="text-[12.5px] text-ink leading-relaxed">
              Deleting your account is permanent. Your Creator Profile and
              Featured Content will be removed; content already shared inside a
              Block may remain so your collaborators keep their records. To
              confirm a deletion request, email us and we&apos;ll process it.
            </p>
            <a
              href="mailto:support@wrytrsblock.com?subject=Delete%20my%20WrytrsBlock%20account"
              className="mt-3 inline-flex items-center justify-center h-9 px-4 rounded-lg bg-danger text-[12.5px] font-semibold text-white hover:bg-danger/90 transition-colors"
              style={{ color: "#FFFFFF" }}
            >
              Request account deletion
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
