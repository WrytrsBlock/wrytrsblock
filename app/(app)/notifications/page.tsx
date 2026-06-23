import { TopBar } from "@/components/shell/topbar";
import { BlockRequestInbox } from "@/components/block/block-request-inbox";
import { NotificationsList } from "@/components/shell/notifications-list";
import { getIncomingBlockRequests, getNotifications } from "@/lib/data";
import { supabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const [blockRequests, notifications] = await Promise.all([
    getIncomingBlockRequests(),
    getNotifications(),
  ]);

  return (
    <>
      <TopBar
        crumbs={[{ label: "The CR8TV Collectv" }, { label: "Notifications" }]}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="page-fluid pb-12 pt-5 md:pt-6 animate-fade-up">
          <h1 className="mb-3 text-[18px] md:text-[21px] font-semibold text-white">
            Notifications
          </h1>

          {/* Incoming Block Requests — accept to create the Block + unlock chat */}
          <BlockRequestInbox requests={blockRequests} />

          <NotificationsList
            initial={notifications}
            demo={!supabaseConfigured}
          />
        </div>
      </div>
    </>
  );
}
