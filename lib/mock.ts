// Mock data — used as fallback when Supabase env vars are not configured,
// and as the seed source for the SQL migration.

export type Role =
  | "Director"
  | "Writer"
  | "Editor"
  | "Producer"
  | "Designer"
  | "Composer"
  | "Talent"
  | "Manager";

export type BlockStatus =
  | "Drafting"
  | "In Review"
  | "Producing"
  | "Shipped"
  | "On Hold";

export type Person = {
  id: string;
  name: string;
  handle: string;
  role: Role;
  avatar: string;
  online?: boolean;
};

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=transparent`;
}

export const people: Person[] = [
  { id: "p1", name: "Aria Kade", handle: "ariakade", role: "Director", avatar: avatarUrl("ariakade"), online: true },
  { id: "p2", name: "Milo Tran", handle: "milotran", role: "Writer", avatar: avatarUrl("milotran"), online: true },
  { id: "p3", name: "Sasha Reyes", handle: "sashareyes", role: "Editor", avatar: avatarUrl("sashareyes"), online: false },
  { id: "p4", name: "Jude Park", handle: "judepark", role: "Producer", avatar: avatarUrl("judepark"), online: true },
  { id: "p5", name: "Noor Halabi", handle: "noorh", role: "Designer", avatar: avatarUrl("noorh"), online: false },
  { id: "p6", name: "Theo Lin", handle: "theolin", role: "Composer", avatar: avatarUrl("theolin"), online: true },
  { id: "p7", name: "Imani Ross", handle: "imani", role: "Talent", avatar: avatarUrl("imani"), online: false },
  { id: "p8", name: "Reza Aboud", handle: "reza", role: "Manager", avatar: avatarUrl("reza"), online: true },
];

export type Workspace = {
  id: string;
  name: string;
  initials: string;
  hue: string;
};

export const workspaces: Workspace[] = [
  { id: "w1", name: "Inkwell Studio", initials: "IS", hue: "from-amber-400/80 to-rose-400/80" },
  { id: "w2", name: "Northbeam Films", initials: "NF", hue: "from-rose-500/80 to-orange-500/80" },
  { id: "w3", name: "Solo · Personal", initials: "SO", hue: "from-emerald-500/80 to-teal-500/80" },
];

export type KanbanCard = {
  id: string;
  title: string;
  assigneeId?: string;
  dueIn?: string;
  tag?: string;
};

export type KanbanColumn = {
  id: string;
  title: string;
  cards: KanbanCard[];
};

export type ActivityEvent = {
  id: string;
  kind: "comment" | "upload" | "status" | "join" | "edit";
  actorId: string;
  text: string;
  at: string;
};

export type FileAsset = {
  id: string;
  name: string;
  kind: "doc" | "image" | "audio" | "video" | "pdf";
  size: string;
  updated: string;
  cover?: string;
};

export type Thread = {
  id: string;
  title: string;
  lastMessage: string;
  lastActorId: string;
  unread: number;
  at: string;
};

// The two product Block types. This is the central distinction in WrytrsBlock.
export type BlockType = "collaboration" | "service";

export type CompletionStatus = "open" | "active" | "in_review" | "completed";

// Split Sheet — first-class for music collaboration.
export type SplitContributor = {
  id: string; // person id
  role: string; // Songwriter, Producer, Vocalist…
  writing: number; // writer split %
  publishing: number; // publishing split %
  signed: boolean;
};
export type SplitSheet = {
  status: "draft" | "circulated" | "signed";
  contributors: SplitContributor[];
};

export type Deliverable = {
  id: string;
  title: string;
  status: "pending" | "submitted" | "approved";
  dueIn?: string;
  ownerId?: string;
};

// Service Block details — scope of paid work.
// `summary` holds the description; `scope` holds "what's included".
export type ServiceDetail = {
  title?: string;
  category?: string;
  summary: string;
  scope: string[];
  price: string;
  turnaround: string;
  revisions: string;
  requirements?: string;
  providerId: string;
};

export type Block = {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  blockType: BlockType;
  status: BlockStatus;
  completion: { status: CompletionStatus; percent: number };
  progress: number;
  deadline: string;
  cover: string;
  leadId: string;
  team: string[];
  tags: string[];
  budget?: string;
  kind: "Audio Drama" | "Film" | "Editorial" | "Album" | "Series" | "Music" | "Other";
  // What the creator is looking for (Collaboration) — drives marketplace cards.
  seeking?: string[];
  board: KanbanColumn[];
  activity: ActivityEvent[];
  files: FileAsset[];
  threads: Thread[];
  splits?: SplitSheet;
  deliverables?: Deliverable[];
  service?: ServiceDetail;
};

export const blocks: Block[] = [
  {
    id: "midnight-press",
    title: "Midnight Press",
    slug: "midnight-press",
    tagline:
      "A six-part audio drama about an underground newsroom in 1973. Noir, intimate, score-forward.",
    blockType: "collaboration",
    status: "Producing",
    completion: { status: "active", percent: 64 },
    progress: 64,
    deadline: "Jun 28, 2026",
    cover:
      "https://images.unsplash.com/photo-1490971588422-52f6262a237a?auto=format&fit=crop&w=2400&q=80",
    leadId: "p1",
    team: ["p1", "p2", "p3", "p4", "p6", "p7"],
    tags: ["Audio Drama", "Period", "Serial"],
    seeking: ["Composer", "Vocalist", "Sound Designer"],
    budget: "$84,500",
    kind: "Audio Drama",
    splits: {
      status: "circulated",
      contributors: [
        { id: "p2", role: "Writer", writing: 40, publishing: 25, signed: true },
        { id: "p6", role: "Composer", writing: 35, publishing: 25, signed: true },
        { id: "p1", role: "Director", writing: 15, publishing: 25, signed: false },
        { id: "p7", role: "Vocalist", writing: 10, publishing: 25, signed: false },
      ],
    },
    deliverables: [
      { id: "d1", title: "Ep. 1–3 final mix", status: "approved", ownerId: "p3" },
      { id: "d2", title: "Newsroom theme — master", status: "submitted", ownerId: "p6", dueIn: "2d" },
      { id: "d3", title: "Cover art — final", status: "pending", ownerId: "p5", dueIn: "1w" },
    ],
    board: [
      {
        id: "b1",
        title: "Brief",
        cards: [
          { id: "k1", title: "Episode 4 cold open rewrite", assigneeId: "p2", dueIn: "2d", tag: "Script" },
          { id: "k2", title: "Foley shot list, Ep. 5", assigneeId: "p3", dueIn: "5d", tag: "Sound" },
        ],
      },
      {
        id: "b2",
        title: "In Progress",
        cards: [
          { id: "k3", title: "Record VO — Imani (Ep. 3)", assigneeId: "p7", dueIn: "Today", tag: "VO" },
          { id: "k4", title: "Score motif — Newsroom theme", assigneeId: "p6", dueIn: "3d", tag: "Music" },
          { id: "k5", title: "Cover art v2", assigneeId: "p5", dueIn: "1w", tag: "Design" },
        ],
      },
      {
        id: "b3",
        title: "Review",
        cards: [
          { id: "k6", title: "Ep. 2 picture lock review", assigneeId: "p1", dueIn: "Tomorrow", tag: "Edit" },
          { id: "k7", title: "Legal pass — Source clearance", assigneeId: "p8", dueIn: "4d", tag: "Legal" },
        ],
      },
      {
        id: "b4",
        title: "Shipped",
        cards: [
          { id: "k8", title: "Ep. 1 — final mix", assigneeId: "p3", tag: "Mix" },
        ],
      },
    ],
    activity: [
      { id: "a1", kind: "comment", actorId: "p1", text: "Pushed notes on the Ep.3 cold open — pacing still wobbles on the printing press cue.", at: "12 min ago" },
      { id: "a2", kind: "upload", actorId: "p6", text: "uploaded newsroom-theme-v4.wav", at: "38 min ago" },
      { id: "a3", kind: "status", actorId: "p4", text: "moved Ep.2 picture lock → Review", at: "1h ago" },
      { id: "a4", kind: "edit", actorId: "p2", text: "edited Script · Ep.4 · Scene 11", at: "2h ago" },
      { id: "a5", kind: "join", actorId: "p7", text: "joined the Block", at: "Yesterday" },
    ],
    files: [
      { id: "f1", name: "Ep.3 — Cold Open.fdx", kind: "doc", size: "84 KB", updated: "12 min ago" },
      { id: "f2", name: "newsroom-theme-v4.wav", kind: "audio", size: "26.4 MB", updated: "38 min ago" },
      { id: "f3", name: "cover-art-v2.png", kind: "image", size: "4.1 MB", updated: "3h ago", cover: "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?auto=format&fit=crop&w=800&q=80" },
      { id: "f4", name: "Ep.2 picture-lock.mp4", kind: "video", size: "412 MB", updated: "1h ago", cover: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80" },
      { id: "f5", name: "Legal — Source clearance.pdf", kind: "pdf", size: "212 KB", updated: "Yesterday" },
      { id: "f6", name: "Foley shot list.numbers", kind: "doc", size: "34 KB", updated: "Yesterday" },
    ],
    threads: [
      { id: "t1", title: "Writers' room", lastMessage: "Milo: can we kill the diner scene? it's not paying off", lastActorId: "p2", unread: 3, at: "8m" },
      { id: "t2", title: "Post · Picture", lastMessage: "Sasha: locked v3, pushing to Frame", lastActorId: "p3", unread: 0, at: "1h" },
      { id: "t3", title: "Cast · Imani", lastMessage: "Imani: VO Tues works, will send avails", lastActorId: "p7", unread: 1, at: "2h" },
    ],
  },
  {
    id: "lantern-zine",
    title: "Lantern · Issue 04",
    slug: "lantern-zine",
    tagline: "Quarterly print + web zine on quiet design. Seeking a cover illustrator.",
    blockType: "collaboration",
    status: "Drafting",
    completion: { status: "open", percent: 22 },
    progress: 22,
    deadline: "Aug 14, 2026",
    cover:
      "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=2400&q=80",
    leadId: "p5",
    team: ["p5", "p2", "p8"],
    tags: ["Editorial", "Print", "Web"],
    seeking: ["Illustrator", "Writer"],
    kind: "Editorial",
    board: [],
    activity: [],
    files: [],
    threads: [],
  },
  {
    id: "halftone",
    title: "Halftone",
    slug: "halftone",
    tagline: "Short film. 12 minutes. Coming-of-age in a print shop. Need a composer.",
    blockType: "collaboration",
    status: "In Review",
    completion: { status: "in_review", percent: 81 },
    progress: 81,
    deadline: "May 31, 2026",
    cover:
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=2400&q=80",
    leadId: "p1",
    team: ["p1", "p3", "p4", "p6"],
    tags: ["Short Film", "Drama"],
    seeking: ["Composer", "Colorist"],
    kind: "Film",
    board: [],
    activity: [],
    files: [],
    threads: [],
  },
  {
    id: "mix-master-neon",
    title: "Mix & Master — Singles",
    slug: "mix-master-neon",
    tagline: "Radio-ready mixes and masters for indie singles and EPs. Fast, warm, loud.",
    blockType: "service",
    status: "Producing",
    completion: { status: "active", percent: 45 },
    progress: 45,
    deadline: "Open",
    cover:
      "https://images.unsplash.com/photo-1558584673-650f1a52f5bd?auto=format&fit=crop&w=2400&q=80",
    leadId: "p6",
    team: ["p6"],
    tags: ["Mixing", "Mastering", "Music"],
    kind: "Music",
    service: {
      summary:
        "Professional mix and master for one single (up to 24 stems). Analog-modeled chain, reference-matched, delivered radio- and streaming-ready.",
      scope: [
        "1 mix revision pass included (additional at $120/ea)",
        "Master for streaming (-14 LUFS) + a louder club master",
        "Stems accepted as WAV/AIFF, 24-bit",
        "Up to 24 input stems",
      ],
      price: "$650 / single",
      turnaround: "5–7 business days",
      revisions: "1 included",
      providerId: "p6",
    },
    deliverables: [
      { id: "sd1", title: "Receive & check stems", status: "approved", ownerId: "p6" },
      { id: "sd2", title: "Rough mix v1", status: "submitted", ownerId: "p6", dueIn: "2d" },
      { id: "sd3", title: "Final master (streaming + club)", status: "pending", ownerId: "p6", dueIn: "5d" },
    ],
    board: [],
    activity: [
      { id: "sa1", kind: "upload", actorId: "p6", text: "uploaded rough-mix-v1.wav", at: "1h ago" },
      { id: "sa2", kind: "comment", actorId: "p4", text: "client requested more low-mid on the vocal", at: "3h ago" },
    ],
    files: [
      { id: "sf1", name: "neon-rain-stems.zip", kind: "audio", size: "1.2 GB", updated: "Yesterday" },
      { id: "sf2", name: "rough-mix-v1.wav", kind: "audio", size: "48 MB", updated: "1h ago" },
      { id: "sf3", name: "reference-track.mp3", kind: "audio", size: "8.4 MB", updated: "2d ago" },
    ],
    threads: [
      { id: "st1", title: "Delivery thread", lastMessage: "Theo: rough mix is up, take a listen", lastActorId: "p6", unread: 1, at: "1h" },
    ],
  },
];

export function getPerson(id: string) {
  return people.find((p) => p.id === id);
}

// ---------- Creator profiles (Marketplace → Profile → Block) ----------

export type Credit = { title: string; role: string; year: string };
export type ServiceOffer = { title: string; price: string; slug?: string };

export type CreatorProfile = {
  personId: string;
  tagline: string;
  location: string;
  rating: number;
  reviews: number;
  skills: string[];
  credits: Credit[];
  services: ServiceOffer[];
  portfolio: string[]; // cover image urls
  openTo: ("collaboration" | "service")[];
};

export const creatorProfiles: Record<string, CreatorProfile> = {
  p1: {
    personId: "p1",
    tagline:
      "Director & showrunner for audio drama and film. Noir, intimate, performance-first.",
    location: "New York, NY",
    rating: 4.9,
    reviews: 38,
    skills: ["Directing", "Showrunning", "Story", "Casting", "Picture Edit"],
    credits: [
      { title: "Midnight Press", role: "Director", year: "2026" },
      { title: "Halftone", role: "Director", year: "2025" },
    ],
    services: [
      { title: "Direction & creative supervision", price: "from $3,000/proj" },
    ],
    portfolio: [
      "https://images.unsplash.com/photo-1490971588422-52f6262a237a?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80",
    ],
    openTo: ["collaboration", "service"],
  },
  p6: {
    personId: "p6",
    tagline: "Composer & mix engineer. Warm, cinematic, score-forward.",
    location: "Los Angeles, CA",
    rating: 5.0,
    reviews: 64,
    skills: ["Mixing", "Mastering", "Original Score", "Sound Design", "Ambient"],
    credits: [
      { title: "Midnight Press", role: "Composer", year: "2026" },
      { title: "Neon Rain — Single", role: "Mix & Master", year: "2026" },
      { title: "Halftone", role: "Composer", year: "2025" },
    ],
    services: [
      { title: "Mix & Master — Singles", price: "from $650", slug: "mix-master-neon" },
      { title: "Original score — strings & ambient", price: "from $2,400" },
    ],
    portfolio: [
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1558584673-650f1a52f5bd?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
    ],
    openTo: ["collaboration", "service"],
  },
  p2: {
    personId: "p2",
    tagline: "Writer for serialized audio & screen. Noir, intimate, character-first.",
    location: "Brooklyn, NY",
    rating: 4.7,
    reviews: 54,
    skills: ["Screenwriting", "Story Editing", "Punch-up", "Series Bibles"],
    credits: [
      { title: "Midnight Press", role: "Writer", year: "2026" },
      { title: "Lantern · Issue 04", role: "Contributor", year: "2026" },
    ],
    services: [{ title: "Story editing & punch-up", price: "from $600/day" }],
    portfolio: [
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=600&q=80",
    ],
    openTo: ["collaboration"],
  },
  p3: {
    personId: "p3",
    tagline: "Editor & foley artist for narrative podcasts and film.",
    location: "Austin, TX",
    rating: 4.9,
    reviews: 127,
    skills: ["Picture Editing", "Foley", "Sound Design", "Dialogue Edit"],
    credits: [
      { title: "Midnight Press", role: "Editor", year: "2026" },
      { title: "Halftone", role: "Editor", year: "2025" },
    ],
    services: [{ title: "Foley & sound design — narrative", price: "from $1,800/ep" }],
    portfolio: [
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80",
    ],
    openTo: ["collaboration", "service"],
  },
  p7: {
    personId: "p7",
    tagline: "Vocalist & voice actor. Narrative, character, and topline.",
    location: "Atlanta, GA",
    rating: 4.9,
    reviews: 212,
    skills: ["Vocals", "Topline", "Voiceover", "Narration"],
    credits: [{ title: "Midnight Press", role: "Vocalist", year: "2026" }],
    services: [{ title: "Voiceover — narrative & character", price: "from $300/hr" }],
    portfolio: [
      "https://images.unsplash.com/photo-1605722243979-fe0be8158232?auto=format&fit=crop&w=600&q=80",
    ],
    openTo: ["collaboration", "service"],
  },
  p5: {
    personId: "p5",
    tagline: "Designer & illustrator. Quiet, editorial, type-driven.",
    location: "Portland, OR",
    rating: 4.8,
    reviews: 89,
    skills: ["Cover Art", "Illustration", "Editorial Design", "Type"],
    credits: [{ title: "Lantern · Issue 04", role: "Designer", year: "2026" }],
    services: [{ title: "Cover & key art — editorial", price: "from $950/set" }],
    portfolio: [
      "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=600&q=80",
    ],
    openTo: ["service"],
  },
};

export function getCreatorByHandle(handle: string): {
  person: Person;
  profile: CreatorProfile;
} | null {
  const person = people.find((p) => p.handle === handle);
  if (!person) return null;
  const profile = creatorProfiles[person.id] ?? {
    personId: person.id,
    tagline: `${person.role} on WrytrsBlock.`,
    location: "Remote",
    rating: 4.8,
    reviews: 0,
    skills: [person.role],
    credits: [],
    services: [],
    portfolio: [],
    openTo: ["collaboration"],
  };
  return { person, profile };
}

export function blocksForPerson(id: string): Block[] {
  return blocks.filter((b) => b.team.includes(id));
}

export function featuredCreators(): { person: Person; profile: CreatorProfile }[] {
  return Object.values(creatorProfiles)
    .map((profile) => ({ person: getPerson(profile.personId)!, profile }))
    .filter((x) => x.person);
}

// A Block is "established" once it has real content. Fresh Blocks (just created,
// or synthesized in demo mode) have none — panels show empty states for them
// instead of demo filler.
export function isEstablishedBlock(b: Block): boolean {
  const cards = b.board.reduce((n, c) => n + c.cards.length, 0);
  return (
    cards > 0 ||
    b.files.length > 0 ||
    b.activity.length > 0 ||
    b.threads.length > 0
  );
}

export function getBlock(slug: string) {
  return blocks.find((b) => b.slug === slug);
}
