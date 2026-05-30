import {
  Bookmark,
  Heart,
  MessageCircle,
  Repeat2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { TopBar } from "@/components/shell/topbar";
import { Avatar, Badge, Card } from "@/components/ui/primitives";
import { getPerson, people } from "@/lib/mock";

const posts = [
  {
    id: "post1",
    actorId: "p2",
    at: "2h",
    text: "Hot take: the cold open is the only contract you make with an audio audience. If they don't lean in by minute two, you've already lost them.",
    tags: ["craft"],
    likes: 184,
    comments: 27,
    reshares: 12,
  },
  {
    id: "post2",
    actorId: "p6",
    at: "5h",
    text: "Made a free pack of 12 room tones recorded around an old letterpress shop. Free to use with credit — link in profile.",
    tags: ["sound", "free"],
    likes: 312,
    comments: 41,
    reshares: 88,
  },
  {
    id: "post3",
    actorId: "p1",
    at: "Yesterday",
    text: "We just locked Episode 2 of Midnight Press. Six months of work. The team is unreal. Premiere of Ep.1 next month — DM if you'd like an early link.",
    tags: ["release"],
    likes: 522,
    comments: 64,
    reshares: 31,
  },
  {
    id: "post4",
    actorId: "p5",
    at: "Yesterday",
    text: "Quiet brand systems > loud ones. Show me one editorial design from the last decade that aged better than New York Mag pre-2018. I'll wait.",
    tags: ["design"],
    likes: 96,
    comments: 22,
    reshares: 4,
  },
];

export default function CommunityPage() {
  return (
    <>
      <TopBar
        crumbs={[{ label: "Inkwell Studio" }, { label: "Community" }]}
      />
      <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-8 max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feed */}
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-[12px] uppercase tracking-[0.18em] text-muted">
                Community
              </p>
              <h1 className="mt-1 font-display text-[32px] leading-tight tracking-tight text-ink">
                What creators are saying today.
              </h1>
            </div>
          </div>

          {/* Composer */}
          <Card className="p-4 mb-4">
            <div className="flex gap-3">
              <Avatar src={people[0].avatar} name={people[0].name} size={32} />
              <textarea
                rows={2}
                placeholder="Share a craft note, a release, or ask the room…"
                className="flex-1 resize-none bg-transparent text-[13.5px] text-ink placeholder:text-muted/70 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {["Tip", "Release", "Question", "Hiring"].map((t) => (
                  <button
                    key={t}
                    className="h-7 px-2.5 rounded-md text-[11.5px] text-muted hover:text-ink hover:bg-surface-2"
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-ink text-bg text-[12.5px] font-medium">
                Post
              </button>
            </div>
          </Card>

          <div className="space-y-3">
            {posts.map((p) => {
              const actor = getPerson(p.actorId);
              if (!actor) return null;
              return (
                <Card
                  key={p.id}
                  className="p-5 hover:border-line-strong transition"
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={actor.avatar}
                      name={actor.name}
                      size={36}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13.5px] font-semibold text-ink">
                          {actor.name}
                        </span>
                        <span className="text-[11.5px] text-muted">
                          @{actor.handle}
                        </span>
                        <span className="text-muted/50">·</span>
                        <span className="text-[11.5px] text-muted font-mono">
                          {p.at}
                        </span>
                        <Badge tone="soft" className="ml-1">
                          {actor.role}
                        </Badge>
                      </div>
                      <p className="mt-2 text-[14px] text-ink/90 leading-relaxed">
                        {p.text}
                      </p>
                      <div className="mt-3 flex items-center gap-1.5">
                        {p.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[11.5px] text-accent hover:text-accent-2 cursor-pointer"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center gap-5 text-muted">
                        <button className="inline-flex items-center gap-1.5 text-[12px] hover:text-ink">
                          <Heart size={13} /> {p.likes}
                        </button>
                        <button className="inline-flex items-center gap-1.5 text-[12px] hover:text-ink">
                          <MessageCircle size={13} /> {p.comments}
                        </button>
                        <button className="inline-flex items-center gap-1.5 text-[12px] hover:text-ink">
                          <Repeat2 size={13} /> {p.reshares}
                        </button>
                        <button className="ml-auto inline-flex items-center gap-1.5 text-[12px] hover:text-ink">
                          <Bookmark size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Side rail */}
        <div className="space-y-4">
          <Card className="p-5 bg-grad-mesh">
            <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
              <Sparkles size={13} className="text-accent" /> Suggested for you
            </div>
            <p className="mt-2 text-[13px] text-ink/90 leading-snug">
              Other audio drama producers you'd probably get on with.
            </p>
            <ul className="mt-4 space-y-3">
              {people.slice(1, 5).map((p) => (
                <li key={p.id} className="flex items-center gap-2.5">
                  <Avatar src={p.avatar} name={p.name} size={28} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] text-ink font-medium leading-tight truncate">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-muted leading-tight truncate">
                      {p.role}
                    </p>
                  </div>
                  <button className="h-6 px-2 rounded-md border border-line text-[11px] text-ink hover:bg-surface-2">
                    Follow
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
              <TrendingUp size={13} /> Trending
            </div>
            <ul className="mt-3 space-y-2.5">
              {[
                { tag: "#audiodrama", posts: "2,184" },
                { tag: "#cover-art", posts: "913" },
                { tag: "#fdx", posts: "611" },
                { tag: "#postsupervisor", posts: "412" },
                { tag: "#firstcut", posts: "388" },
              ].map((t) => (
                <li
                  key={t.tag}
                  className="flex items-center justify-between text-[12.5px]"
                >
                  <span className="text-accent">{t.tag}</span>
                  <span className="text-muted font-mono">{t.posts}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
      </div>
    </>
  );
}
