import Link from "next/link";
import {
  AtSign,
  GitBranch,
  MessageSquare,
  UserPlus,
  Upload,
} from "lucide-react";
import { TopBar } from "@/components/shell/topbar";
import { Avatar, Badge, Card, SectionLabel } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { getPerson } from "@/lib/mock";
import { BlockRequestInbox } from "@/components/block/block-request-inbox";
import { getIncomingBlockRequests } from "@/lib/data";

export const dynamic = "force-dynamic";

type Notif = {
  id: string;
  icon: typeof AtSign;
  tone: string;
  actorId: string;
  title: string;
  body: string;
  at: string;
  unread: boolean;
  href: string;
};

const NOTIFS: Notif[] = [
  { id: "n1", icon: AtSign, tone: "text-accent bg-accent/10 border-accent/30", actorId: "p3", title: "Sasha Reyes mentioned you", body: "“@aria can you sign off before EOD?” in Ep.2 picture-lock", at: "8m", unread: true, href: "/blocks/midnight-press?tab=files" },
  { id: "n2", icon: Upload, tone: "text-success bg-success/10 border-success/30", actorId: "p6", title: "Theo Lin uploaded a file", body: "newsroom-theme-v4.wav · Midnight Press", at: "38m", unread: true, href: "/blocks/midnight-press?tab=files" },
  { id: "n3", icon: GitBranch, tone: "text-warning bg-warning/10 border-warning/30", actorId: "p4", title: "Jude Park moved a task", body: "Ep.2 picture lock → Review", at: "1h", unread: true, href: "/blocks/midnight-press?tab=tasks" },
  { id: "n4", icon: MessageSquare, tone: "text-accent bg-accent/10 border-accent/30", actorId: "p2", title: "New messages in #writers-room", body: "3 unread from Milo and Aria", at: "2h", unread: true, href: "/blocks/midnight-press?tab=messages" },
  { id: "n5", icon: UserPlus, tone: "text-accent-2 bg-accent-2/10 border-accent-2/30", actorId: "p7", title: "Imani Ross joined Midnight Press", body: "as Talent", at: "Yesterday", unread: false, href: "/blocks/midnight-press?tab=team" },
];

export default async function NotificationsPage() {
  const unread = NOTIFS.filter((n) => n.unread).length;
  const blockRequests = await getIncomingBlockRequests();

  return (
    <>
      <TopBar
        crumbs={[{ label: "The CR8TV Collectv" }, { label: "Notifications" }]}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 md:px-8 py-8 max-w-[820px] w-full animate-fade-up">
          <div className="flex items-end justify-between mb-6">
            <div>
              <SectionLabel>Activity</SectionLabel>
              <h1 className="mt-2 font-display text-4xl text-ink tracking-tighter">
                Notifications
              </h1>
            </div>
            {unread > 0 && <Badge tone="accent">{unread} new</Badge>}
          </div>

          {/* Incoming Block Requests — accept to create the Block + unlock chat */}
          <BlockRequestInbox requests={blockRequests} />

          <Card className="overflow-hidden p-0">
            <ul className="divide-y divide-line">
              {NOTIFS.map((n) => {
                const actor = getPerson(n.actorId);
                const Icon = n.icon;
                return (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      className={cn(
                        "flex items-start gap-3.5 px-5 py-4 transition-colors hover:bg-surface-2",
                        n.unread && "bg-accent/[0.035]"
                      )}
                    >
                      <span className="relative shrink-0">
                        {actor && (
                          <Avatar src={actor.avatar} name={actor.name} size={38} />
                        )}
                        <span
                          className={cn(
                            "absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center ring-2 ring-surface border",
                            n.tone
                          )}
                        >
                          <Icon size={10} strokeWidth={2.25} />
                        </span>
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[13px] font-medium text-ink">
                            {n.title}
                          </p>
                          <span className="text-[10.5px] text-muted font-mono shrink-0">
                            {n.at}
                          </span>
                        </div>
                        <p className="text-[12px] text-muted leading-snug mt-0.5">
                          {n.body}
                        </p>
                      </div>
                      {n.unread && (
                        <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0 mt-2" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
