import { redirect } from "next/navigation";
import { NotificationsClient } from "@/components/notifications/NotificationsClient";
import { PushToggle } from "@/components/notifications/PushToggle";
import { Banner } from "@/components/ui";
import { getUser } from "@/lib/auth";
import { getNotifications } from "@/lib/data/notifications";
import { journaliserErreur } from "@/lib/journal";
import { pushResponsableActif } from "@/lib/notify";

export const metadata = { title: "Notifications — DeEplan" };

export default async function NotificationsResponsablePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  let notifications;
  try {
    notifications = await getNotifications(user.id, "responsable");
  } catch (e) {
    journaliserErreur("responsable/notifications", e);
    return (
      <>
        <h1 className="font-display text-[24px] font-semibold tracking-[-0.3px] text-ink">
          Notifications
        </h1>
        <Banner tone="danger" className="mt-4 max-w-[560px]">
          Impossible de charger vos notifications. Rechargez la page.
        </Banner>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-[24px] font-semibold tracking-[-0.3px] text-ink">
        Notifications
      </h1>
      {pushResponsableActif() && (
        <div className="mt-4 max-w-[560px]">
          <PushToggle />
        </div>
      )}
      <NotificationsClient notifications={notifications} espace="responsable" />
    </>
  );
}
