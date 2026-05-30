import Link from "next/link";
import { Filter, LayoutGrid, List, Search } from "lucide-react";
import { TopBar } from "@/components/shell/topbar";
import {
  AvatarStack,
  Badge,
  Button,
  Card,
  Input,
  Progress,
  SectionLabel,
} from "@/components/ui/primitives";
import { NewBlockButton } from "@/components/block/new-block-button";
import { getBlocks } from "@/lib/data";
import { getPerson } from "@/lib/mock";

const filters = ["All", "Collaboration", "Service", "Active", "Completed"];

export default async function BlocksListPage() {
  const blocks = await getBlocks();

  return (
    <>
      <TopBar
        crumbs={[{ label: "Inkwell Studio" }, { label: "Blocks" }]}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-8 max-w-[1400px] w-full animate-fade-up">
          <div className="flex items-end justify-between mb-7">
            <div>
              <SectionLabel>Workspace</SectionLabel>
              <h1 className="mt-2 font-display text-4xl text-ink tracking-tighter">
                Blocks
              </h1>
              <p className="text-[13px] text-muted mt-1.5 max-w-md">
                Everything you're making — alone, with the studio, or in a
                guest room with collaborators.
              </p>
            </div>
            <NewBlockButton size="lg" />
          </div>

          {/* Filter row */}
          <div className="flex items-center gap-2 mb-6">
            <div className="relative min-w-[300px]">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
              <Input
                placeholder="Search blocks, tags, leads…"
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-0.5 ml-2 p-0.5 rounded-lg bg-surface-2 border border-line">
              {filters.map((f, i) => (
                <button
                  key={f}
                  className={
                    i === 0
                      ? "h-7 px-2.5 rounded-md bg-surface text-ink text-[11.5px] font-medium shadow-soft"
                      : "h-7 px-2.5 rounded-md text-muted hover:text-ink text-[11.5px] transition-colors"
                  }
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <Button variant="outline" size="md">
              <Filter size={12} /> Filters
            </Button>
            <div className="flex items-center bg-surface-2 border border-line rounded-lg h-9 p-0.5">
              <button className="h-7 w-7 rounded-md bg-surface text-ink flex items-center justify-center shadow-soft">
                <LayoutGrid size={12} />
              </button>
              <button className="h-7 w-7 rounded-md text-muted hover:text-ink flex items-center justify-center">
                <List size={12} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {blocks.map((b, i) => {
              const lead = getPerson(b.leadId);
              return (
                <Link
                  key={b.id}
                  href={`/blocks/${b.slug}`}
                  className="group block animate-fade-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <Card hover className="overflow-hidden p-0">
                    <div className="relative h-40 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.cover}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-700 ease group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-grad-cinema" />
                      <div className="absolute left-4 top-3 right-4 flex items-center justify-between">
                        <Badge
                          tone={b.blockType === "service" ? "accent-2" : "accent"}
                          dot
                        >
                          {b.blockType === "service" ? "Service" : "Collaboration"}
                        </Badge>
                        <span className="text-[10px] uppercase tracking-[0.18em] text-muted">
                          {b.kind}
                        </span>
                      </div>
                      <div className="absolute left-4 bottom-3 right-4 flex items-center justify-between">
                        <AvatarStack
                          ids={b.team}
                          size={22}
                          max={4}
                          resolve={(id) => getPerson(id)}
                        />
                        <span className="text-[10.5px] text-muted font-mono">
                          {b.deadline}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-2xl text-ink leading-tight tracking-tight">
                        {b.title}
                      </h3>
                      <p className="mt-2 text-[12.5px] text-muted line-clamp-2 leading-relaxed">
                        {b.tagline}
                      </p>
                      <div className="mt-5">
                        <div className="flex items-center justify-between text-[11px] text-muted mb-1.5">
                          <span>Lead · {lead?.name.split(" ")[0]}</span>
                          <span className="font-mono">{b.progress}%</span>
                        </div>
                        <Progress value={b.progress} size="thin" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
