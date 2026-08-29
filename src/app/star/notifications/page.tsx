import { Banner } from "@/components/ui";
import { NotificationsClient } from "@/components/notifications/NotificationsClient";
import { PushToggle } from "@/components/notifications/PushToggle";
import { getUser } from "@/lib/auth";
import { getNotifications } from "@/lib/data/notifications";

export const metadata = { title: "Notifications — DeEplan" };

export default async function NotificationsPage() {
  const user = await getUser();
  if (!user) return null;

  let notifications;
  try {
    notifications = await getNotifications(user.id);
  } catch {
    return (
      <>
        <h2 className="font-display text-[20px] font-semibold tracking-[-0.3px] text-ink">
          Notifications
        </h2>
        <Banner tone="danger" className="mt-4 max-w-[560px]">
          Impossible de charger vos notifications. Rechargez la page.
        </Banner>
      </>
    );
  }

  return (
    <>
      <h2 className="font-display text-[20px] font-semibold tracking-[-0.3px] text-ink">
        Notifications
      </h2>
      <div className="mt-4 max-w-[560px]">
        <PushToggle />
      </div>
      <NotificationsClient notifications={notifications} />
    </>
  );
}
