import { ArrowUpRight, Sparkles, Star } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  SectionLabel,
} from "@/components/ui/primitives";
import { people, type Block } from "@/lib/mock";

type Listing = {
  id: string;
  actorId: string;
  title: string;
  match: number;
  rate: string;
  rating: number;
  reviews: number;
  tags: string[];
};

const listings: Listing[] = [
  {
    id: "l1",
    actorId: "p3",
    title: "Foley & sound design — narrative podcasts",
    match: 96,
    rate: "from $1,800/ep",
    rating: 4.9,
    reviews: 127,
    tags: ["Foley", "Sound Design", "Audio Drama"],
  },
  {
    id: "l2",
    actorId: "p6",
    title: "Original score — strings & ambient",
    match: 92,
    rate: "from $2,400/proj",
    rating: 5.0,
    reviews: 64,
    tags: ["Composer", "Score", "Ambient"],
  },
  {
    id: "l3",
    actorId: "p7",
    title: "Voiceover — narrative & character",
    match: 88,
    rate: "from $300/hr",
    rating: 4.9,
    reviews: 212,
    tags: ["VO", "Narration", "Character"],
  },
];

export function HirePanel({ block }: { block: Block }) {
  return (
    <div className="px-8 py-7 space-y-5 animate-fade-up">
      <div>
        <SectionLabel>Marketplace</SectionLabel>
        <h2 className="mt-1.5 font-display text-3xl text-ink tracking-tight">
          Hire for {block.title}
        </h2>
        <p className="text-[12.5px] text-muted mt-1">
          Vetted collaborators that match this Block. Pay by milestone — escrow
          held until you sign off.
        </p>
      </div>

      {/* AI brief */}
      <Card className="p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-grad-mesh opacity-50 pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <span className="h-10 w-10 rounded-lg bg-grad-accent flex items-center justify-center text-bg shadow-glow shrink-0">
            <Sparkles size={16} strokeWidth={2} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-semibold text-ink">
              Blocky drafted a brief from this Block
            </p>
            <p className="text-[11.5px] text-muted mt-0.5">
              Foley artist for Eps. 4–6 · est. 14 days · $4.5k–6k · noir tone,
              vinyl & metal textures, deliver stems
            </p>
          </div>
          <Button variant="outline" size="md">
            Review brief
          </Button>
          <Button variant="primary" size="md">
            Send to 3 matches
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {listings.map((l) => {
          const actor = people.find((p) => p.id === l.actorId);
          if (!actor) return null;
          return (
            <Card key={l.id} hover className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={actor.avatar}
                    name={actor.name}
                    size={36}
                    online={actor.online}
                  />
                  <div>
                    <p className="text-[13px] font-semibold text-ink leading-tight">
                      {actor.name}
                    </p>
                    <p className="text-[11px] text-muted leading-tight mt-0.5">
                      {actor.role} · @{actor.handle}
                    </p>
                  </div>
                </div>
                <Badge tone="accent">{l.match}% match</Badge>
              </div>

              <h3 className="mt-4 text-[13px] font-medium text-ink leading-snug">
                {l.title}
              </h3>

              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                {l.tags.map((t) => (
                  <Badge key={t} tone="ghost">
                    {t}
                  </Badge>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between pt-4 border-t border-line">
                <span className="inline-flex items-center gap-1 text-[11.5px]">
                  <Star size={11} className="text-warning fill-warning" />
                  <span className="text-ink font-medium">
                    {l.rating.toFixed(1)}
                  </span>
                  <span className="text-muted">({l.reviews})</span>
                </span>
                <span className="text-[12px] font-mono text-ink">
                  {l.rate}
                </span>
              </div>

              <Button
                variant="outline"
                size="md"
                className="mt-4 w-full justify-between"
              >
                View profile <ArrowUpRight size={12} />
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
