import { blocks, getPerson, type Block, type Person } from "@/lib/mock";

// ── Collaboration network ───────────────────────────────────────────────────
// Reputation on WrytrsBlock comes from real collaborations, not a gamified
// score. These helpers derive a creator's trust signals from the collaboration
// graph — who they've actually made Blocks with — so a profile reflects a real
// professional network. Only creator *identities* and aggregate counts are ever
// exposed; never which specific Block two people share (that stays private).

// A lightweight, serializable creator identity — safe to pass to client
// components. Deliberately omits anything project-specific.
export type CreatorRef = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  role: string;
};

export type CreatorNetwork = {
  creatorsConnected: CreatorRef[]; // unique creators collaborated with
  completedBlocks: number;
  totalBlocks: number;
  completionRate: number; // 0–100, rounded
};

function toRef(p: Person): CreatorRef {
  return {
    id: p.id,
    name: p.name,
    handle: p.handle,
    avatar: p.avatar,
    role: p.role,
  };
}

function blocksForPersonId(id: string): Block[] {
  return blocks.filter((b) => b.team.includes(id));
}

// The set of creators a person has shared a Block with (excluding themselves).
function connectedIds(personId: string): Set<string> {
  const ids = new Set<string>();
  for (const b of blocksForPersonId(personId)) {
    for (const member of b.team) {
      if (member !== personId) ids.add(member);
    }
  }
  return ids;
}

export function creatorNetwork(personId: string): CreatorNetwork {
  const mine = blocksForPersonId(personId);

  const creatorsConnected = [...connectedIds(personId)]
    .map((id) => getPerson(id))
    .filter((p): p is Person => Boolean(p))
    .map(toRef);

  const completedBlocks = mine.filter(
    (b) => b.completion?.status === "completed"
  ).length;

  // Completion rate is a track record: of the Blocks that actually got underway
  // (excluding ones still openly recruiting), how many were carried to
  // completion. New creators with no engaged Blocks report 0.
  const engaged = mine.filter((b) => b.completion?.status !== "open");
  const completionRate =
    engaged.length === 0
      ? 0
      : Math.round((completedBlocks / engaged.length) * 100);

  return {
    creatorsConnected,
    completedBlocks,
    totalBlocks: mine.length,
    completionRate,
  };
}

// Mutual creators between two people: creators they've BOTH collaborated with —
// the creative-network equivalent of mutual connections. Returns identities
// only; the Blocks behind the overlap are never revealed.
export function mutualCreators(aId: string, bId: string): CreatorRef[] {
  if (!aId || !bId || aId === bId) return [];
  const aSet = connectedIds(aId);
  return [...connectedIds(bId)]
    .filter((id) => aSet.has(id) && id !== aId && id !== bId)
    .map((id) => getPerson(id))
    .filter((p): p is Person => Boolean(p))
    .map(toRef);
}
