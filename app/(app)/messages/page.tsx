import { TopBar } from "@/components/shell/topbar";
import { MessagesView } from "./messages-view";

export default function MessagesPage() {
  return (
    <>
      <TopBar
        crumbs={[{ label: "Inkwell Studio" }, { label: "Messages" }]}
      />
      <MessagesView />
    </>
  );
}
