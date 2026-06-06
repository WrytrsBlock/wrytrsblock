import { redirect } from "next/navigation";
import { TopBar } from "@/components/shell/topbar";
import { MessagesView } from "./messages-view";
import {
  getConversations,
  getCurrentUserId,
  getDirectMessages,
  getOrStartConversationByHandle,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { to?: string; c?: string };
}) {
  // "Message" CTA from a creator card/profile arrives as ?to=<handle> — resolve
  // (or create) the 1:1 and land on it.
  if (searchParams.to) {
    const convId = await getOrStartConversationByHandle(searchParams.to);
    if (convId) redirect(`/messages?c=${convId}`);
  }

  const [conversations, meId] = await Promise.all([
    getConversations(),
    getCurrentUserId(),
  ]);
  const activeId =
    searchParams.c && conversations.some((c) => c.id === searchParams.c)
      ? searchParams.c
      : conversations[0]?.id ?? null;
  const messages = activeId ? await getDirectMessages(activeId) : [];

  return (
    <>
      <TopBar
        crumbs={[{ label: "The CR8TV Collectv" }, { label: "Messages" }]}
      />
      <MessagesView
        conversations={conversations}
        activeId={activeId}
        messages={messages}
        meId={meId ?? ""}
      />
    </>
  );
}
