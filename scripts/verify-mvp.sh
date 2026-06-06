#!/usr/bin/env bash
# verify-mvp.sh — schema + seed checks for the WrytrsBlock MVP launch audit.
#
# Run AFTER `supabase db reset` (local) or after applying migrations + seed to a
# cloud project. Prints PASS/FAIL per check and exits non-zero if anything fails.
#
# Usage:
#   ./scripts/verify-mvp.sh                # auto-detects local Supabase DB URL
#   DBURL="postgresql://..." ./scripts/verify-mvp.sh   # explicit (cloud/staging)
set -uo pipefail

# ----- resolve a Postgres connection string -----
if [[ -z "${DBURL:-}" ]]; then
  if command -v supabase >/dev/null 2>&1; then
    DBURL="$(supabase status -o env 2>/dev/null | grep -E '^DB_URL=' | cut -d= -f2- | tr -d '"')"
  fi
fi
if [[ -z "${DBURL:-}" ]]; then
  echo "✖ No DBURL. Set DBURL=postgresql://... or run inside a project with 'supabase start'." >&2
  exit 2
fi
if ! command -v psql >/dev/null 2>&1; then
  echo "✖ psql not found. Install postgresql-client." >&2
  exit 2
fi

pass=0; fail=0
q() { psql "$DBURL" -tA -c "$1" 2>/dev/null | tr -d '[:space:]'; }
check() { # name, actual, expected
  if [[ "$2" == "$3" ]]; then printf "  ✅ %-46s %s\n" "$1" "$2"; pass=$((pass+1));
  else printf "  ❌ %-46s got '%s' want '%s'\n" "$1" "$2" "$3"; fail=$((fail+1)); fi
}
atleast() { # name, actual, min
  if [[ "${2:-0}" =~ ^[0-9]+$ ]] && (( ${2:-0} >= $3 )); then printf "  ✅ %-46s %s\n" "$1" "$2"; pass=$((pass+1));
  else printf "  ❌ %-46s got '%s' want >=%s\n" "$1" "${2:-∅}" "$3"; fail=$((fail+1)); fi
}

echo "── Tables ───────────────────────────────────────────────"
for t in creator_profiles saved_creators block_members conversations conversation_members direct_messages; do
  check "table public.$t" "$(q "select to_regclass('public.$t') is not null;")" "t"
done

echo "── Columns / enums ──────────────────────────────────────"
check "block_members.status exists" "$(q "select exists(select 1 from information_schema.columns where table_name='block_members' and column_name='status');")" "t"
check "blocks.block_type has block_party" "$(q "select 'block_party' = any(enum_range(null::block_type)::text[]);")" "t"
check "profiles.onboarding (jsonb)" "$(q "select exists(select 1 from information_schema.columns where table_name='profiles' and column_name='onboarding');")" "t"

echo "── Functions ────────────────────────────────────────────"
for fn in get_or_create_dm is_conversation_member is_block_member; do
  check "function public.$fn" "$(q "select exists(select 1 from pg_proc where proname='$fn');")" "t"
done

echo "── Realtime ─────────────────────────────────────────────"
check "direct_messages in supabase_realtime" "$(q "select exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='direct_messages');")" "t"

echo "── RLS enabled ──────────────────────────────────────────"
for t in creator_profiles saved_creators block_members conversations conversation_members direct_messages; do
  check "rls on public.$t" "$(q "select relrowsecurity from pg_class where relname='$t';")" "t"
done

echo "── Seed data ────────────────────────────────────────────"
atleast "creator_profiles rows" "$(q "select count(*) from public.creator_profiles where is_published;")" 6
echo "  ↳ categories present:"
for cat in producer rapper singer songwriter engineer videographer influencer; do
  n="$(q "select count(*) from public.creator_profiles where '$cat' = any(creator_types);")"
  printf "     %-14s %s\n" "$cat" "${n:-0}"
done

echo "─────────────────────────────────────────────────────────"
echo "RESULT: $pass passed, $fail failed."
[[ "$fail" -eq 0 ]] && echo "✅ Schema + seed READY for browser E2E." || echo "❌ Fix failures before E2E."
exit $(( fail > 0 ? 1 : 0 ))
