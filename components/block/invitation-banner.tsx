"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { respondToInvitationAction } from "@/app/actions/invitations";

// Shown at the top of a Block when the signed-in user has a pending invitation.
// Accept → becomes an accepted member; Decline → dismisses.
export function InvitationBanner({ slug }: { slug: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<null | "accepted" | "declined">(null);

  function respond(accept: boolean) {
    startTransition(async () => {
      const res = await respondToInvitationAction(slug, accept);
      if (res.ok) {
        setDone(accept ? "accepted" : "declined");
        router.refresh();
      }
    });
  }

  if (done) return null;

  return (
    <div className="shrink-0 border-b border-accent/30 bg-accent/10 px-5 md:px-8 py-3">
      <div className="max-w-[1100px] flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <p className="inline-flex items-center gap-2 text-[13px] text-ink">
          <Mail size={15} className="text-accent shrink-0" />
          You&apos;ve been invited to collaborate on this Block.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => respond(true)}
            disabled={pending}
          >
            <Check size={13} /> Accept
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => respond(false)}
            disabled={pending}
          >
            <X size={13} /> Decline
          </Button>
        </div>
      </div>
    </div>
  );
}
