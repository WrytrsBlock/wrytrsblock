import { redirect } from "next/navigation";

// The dashboard has been retired in favor of the creator-first Block Market
// homepage. Any lingering /home links (bookmarks, old sessions) land users
// on the new entry experience.
export default function HomePage() {
  redirect("/marketplace");
}
