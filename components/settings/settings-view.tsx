"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  AtSign,
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Compass,
  Eye,
  FileText,
  Image as ImageIcon,
  Inbox,
  KeyRound,
  LogOut,
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
import { deleteAccountAction } from "@/app/actions/account";

export function SettingsView({ email }: { email: string }) {
  return (
    <div className="space-y-6">
      {/* 1 — Account (collapsed on mobile) */}
      <Group title="Account" desc="Your login and profile." collapseOnMobile>
        <LinkRow
          href="/profile/edit"
          icon={Pencil}
          label="Edit Profile"
          desc="Name, photo, bio, roles, and links"
        />
        <ChangeEmailRow currentEmail={email} />
        <ChangePasswordRow />
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

      {/* 4 — Portfolio (collapsed on mobile) */}
      <Group
        title="Portfolio"
        desc="The showcase that answers 'why start a Block with me?'"
        collapseOnMobile
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

      {/* 5 — Legal (collapsed on mobile) */}
      <Group
        title="Legal"
        desc="The rules of the road on WrytrsBlock."
        collapseOnMobile
      >
        <LinkRow href="/terms" icon={FileText} label="Terms of Service" newTab />
        <LinkRow href="/privacy" icon={Shield} label="Privacy Policy" newTab />
        <LinkRow
          href="/community-guidelines"
          icon={BookOpen}
          label="Community Guidelines"
          newTab
        />
      </Group>

      {/* Pinned bottom — account exits live OUTSIDE the accordions so Delete
          Account and Log Out are always reachable without expanding a section. */}
      <div className="space-y-3 pt-1">
        <section className="lg-glass overflow-hidden !rounded-2xl">
          <DeleteAccountRow />
        </section>
        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface text-[13.5px] font-medium text-danger transition-colors hover:bg-danger/10"
          >
            <LogOut size={16} /> Log out
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Section + rows ──────────────────────────────────────────────────────────
function Group({
  title,
  desc,
  children,
  collapseOnMobile = false,
}: {
  title: string;
  desc?: string;
  children: ReactNode;
  // Start collapsed under the `sm` breakpoint so mobile Settings opens tidy.
  collapseOnMobile?: boolean;
}) {
  const [open, setOpen] = useState(true);

  // Collapse the marked sections on mobile only. We default open for SSR (so
  // markup is deterministic) and collapse after mount when the viewport is small.
  useEffect(() => {
    if (
      collapseOnMobile &&
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 639px)").matches
    ) {
      setOpen(false);
    }
  }, [collapseOnMobile]);

  return (
    <section className="lg-glass overflow-hidden !rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-5 sm:px-6 py-4 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span className="flex-1 min-w-0">
          <span className="block text-[12px] font-bold uppercase tracking-[0.14em] text-white/60">
            {title}
          </span>
          {desc && (
            <span className="block text-[12px] text-white/50 mt-1">{desc}</span>
          )}
        </span>
        <ChevronDown
          size={18}
          className={cn(
            "shrink-0 text-white/45 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="divide-y divide-white/[0.08] border-t border-white/[0.12]">
          {children}
        </div>
      )}
    </section>
  );
}

const ROW = "flex items-center gap-3 px-5 sm:px-6 py-3.5";

function RowIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="h-9 w-9 shrink-0 rounded-lg bg-white/[0.08] border border-white/[0.16] flex items-center justify-center text-white/70">
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
  const cls = cn(ROW, "hover:bg-white/[0.06] transition-colors");
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
      {open && <DeleteAccountConfirm />}
    </div>
  );
}

function DeleteAccountConfirm() {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startDelete] = useTransition();
  const armed = confirmText.trim().toUpperCase() === "DELETE";

  function onDelete() {
    if (!armed || pending) return;
    setError(null);
    startDelete(async () => {
      const res = await deleteAccountAction();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Account + session are gone — leave the app entirely.
      router.replace("/sign-in?deleted=1");
      router.refresh();
    });
  }

  return (
    <div className="mt-3 pl-12">
      <div className="rounded-lg border border-danger/30 bg-danger/[0.06] px-3.5 py-3">
        <p className="text-[12.5px] text-ink leading-relaxed">
          Deleting your account is permanent and can&apos;t be undone. Your
          Creator Profile and Featured Content are removed immediately; content
          already shared inside a Block may remain so your collaborators keep
          their records.
        </p>

        <label className="mt-3 block text-[11.5px] font-medium text-muted">
          Type <span className="font-semibold text-danger">DELETE</span> to
          confirm
        </label>
        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
          autoComplete="off"
          spellCheck={false}
          className="mt-1.5 max-w-[220px]"
          aria-label="Type DELETE to confirm account deletion"
        />

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onDelete}
            disabled={!armed || pending}
            style={{ color: "#FFFFFF" }}
            className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-danger text-[12.5px] font-semibold text-white transition-colors hover:bg-danger/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "Deleting…" : "Permanently delete account"}
          </button>
          <a
            href="mailto:support@wrytrsblock.com?subject=Delete%20my%20WrytrsBlock%20account"
            className="text-[11.5px] text-muted hover:text-ink transition-colors"
          >
            Need help? Email support
          </a>
        </div>

        {error && (
          <p className="mt-2.5 text-[12px] text-danger">{error}</p>
        )}
      </div>
    </div>
  );
}
