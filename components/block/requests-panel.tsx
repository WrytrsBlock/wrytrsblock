"use client";

import { useState } from "react";
import { Check, Inbox, MessageCircle, X } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  SectionLabel,
} from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/empty-state";
import { getPerson, type Block } from "@/lib/mock";

type ReqStatus = "new" | "accepted" | "declined";
type Request = {
  id: string;
  fromId: string;
  note: string;
  at: string;
  status: ReqStatus;
};

const SEED: Request[] = [
  { id: "r1", fromId: "p4", note: "Need a mix + master for a 3-track EP. Indie pop, warm and loud.", at: "2h", status: "new" },
  { id: "r2", fromId: "p1", note: "One single, stems attached. Reference: early War on Drugs.", at: "1d", status: "new" },
  { id: "r3", fromId: "p2", note: "Master only — already mixed. Tuesday deadline possible?", at: "3d", status: "accepted" },
];

const tone: Record<ReqStatus, "accent" | "success" | "soft"> = {
  new: "accent",
  accepted: "success",
  declined: "soft",
};

export function RequestsPanel({ block }: { block: Block }) {
  const [requests, setRequests] = useState<Request[]>(SEED);

  function setStatus(id: string, status: ReqStatus) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  const open = requests.filter((r) => r.status === "new").length;

  return (
    <div className="px-6 md:px-8 py-8 max-w-[820px] space-y-5 animate-fade-up">
      <div className="flex items-end justify-between gap-4">
        <div>
          <SectionLabel>Service · {block.kind}</SectionLabel>
          <h2 className="mt-1.5 font-display text-3xl text-ink tracking-tight">
            Requests
          </h2>
          <p className="text-[12.5px] text-muted mt-1">
            Clients asking to book this service.
          </p>
        </div>
        {open > 0 && <Badge tone="accent">{open} new</Badge>}
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No requests yet"
          description="When clients request this service from the Block Market, they'll show up here to accept or decline."
        />
      ) : (
        <ul className="space-y-2.5">
          {requests.map((r) => {
            const from = getPerson(r.fromId);
            if (!from) return null;
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar src={from.avatar} name={from.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-ink">
                        {from.name}
                      </p>
                      <span className="text-[10.5px] text-muted font-mono">
                        {r.at} ago
                      </span>
                      <Badge tone={tone[r.status]} className="ml-auto capitalize">
                        {r.status}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-[12.5px] text-ink/90 leading-relaxed">
                      {r.note}
                    </p>
                    {r.status === "new" && (
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setStatus(r.id, "accepted")}
                        >
                          <Check size={12} /> Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setStatus(r.id, "declined")}
                        >
                          <X size={12} /> Decline
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageCircle size={12} /> Message
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
