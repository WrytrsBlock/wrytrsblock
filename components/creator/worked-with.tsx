import Link from "next/link";
import { Avatar } from "@/components/ui/primitives";
import type { ProfileCollaborator } from "@/lib/data";

// "Worked With" — the creators this person has actually made Blocks with. The
// faces behind the "Creators Connected" number: real collaboration history, the
// strongest trust signal on the profile. Identities only (no Block details).
export function WorkedWith({
  collaborators,
}: {
  collaborators: ProfileCollaborator[];
}) {
  if (collaborators.length === 0) return null;

  return (
    <section>
      <h2 className="font-display text-xl text-ink tracking-tight">
        Worked With
      </h2>
      <p className="mt-1 text-[12.5px] text-white/55">
        {collaborators.length} creator{collaborators.length === 1 ? "" : "s"}{" "}
        from real collaborations
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {collaborators.map((c) => (
          <Link
            key={c.id}
            href={`/profile/${c.handle}`}
            className="glass-tile glass-hover flex items-center gap-3 rounded-2xl p-3"
          >
            <Avatar src={c.avatar} name={c.name} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">
                {c.name}
              </p>
              <p className="truncate text-[11px] text-white/55">
                @{c.handle}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
