// "use client";
// import { useApp } from "@/components/app-provider";
// import { Card, PageHeading, Button, Badge } from "@/components/ui";
// import { Bell, Check } from "lucide-react";
// import { formatDate } from "@/lib/utils";
// export default function Notifications() {
//   const { data, markNotificationRead } = useApp();
//   const notices = data.notifications;
//   return (
//     <>
//       <PageHeading
//         title="Notifications"
//         description="Assignment updates and reminders for your workspace."
//       />
//       <Card>
//         <div className="space-y-2">
//           {notices.map((n) => (
//             <div
//               key={n.id}
//               className={`flex items-start gap-3 rounded-xl p-4 ${n.read ? "bg-white" : "bg-indigo-50/60"}`}
//             >
//               <div className="rounded-xl bg-white p-2 text-brand">
//                 <Bell size={18} />
//               </div>
//               <div className="min-w-0 flex-1">
//                 <div className="flex flex-wrap items-center gap-2">
//                   <h3 className="text-sm font-semibold">{n.title}</h3>
//                   {!n.read && <Badge tone="blue">New</Badge>}
//                 </div>
//                 <p className="mt-1 text-sm text-muted">{n.message}</p>
//                 <p className="mt-2 text-xs text-muted">
//                   {formatDate(n.createdAt.slice(0, 10))}
//                 </p>
//               </div>
//               {!n.read && (
//                 <Button
//                   variant="ghost"
//                   onClick={() => markNotificationRead(n.id)}
//                 >
//                   <Check size={16} /> Mark read
//                 </Button>
//               )}
//             </div>
//           ))}
//         </div>
//         {!notices.length && (
//           <p className="py-10 text-center text-sm text-muted">
//             You're all caught up.
//           </p>
//         )}
//       </Card>
//     </>
//   );
// }



"use client";

import { useApp } from "@/components/app-provider";
import { useRouter } from "next/navigation";
import { Card, PageHeading, Button, Badge } from "@/components/ui";
import { Bell, Check } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function Notifications() {
  const {
    data,
    role,
    markNotificationRead,
  } = useApp();

  const router = useRouter();
  const notices = data.notifications;

  const handleNotificationClick = async (
    notification: (typeof notices)[number],
  ) => {
    if (notification.assignmentId) {
      const assignment = data.assignments.find(
        (item) => item.id === notification.assignmentId,
      );

      if (assignment) {
        const destination =
          role === "supplier_user"
            ? `/supplier/questionnaires/${assignment.id}`
            : `/questionnaires/${assignment.questionnaireId}`;

        if (!notification.read) {
          await markNotificationRead(notification.id);
        }

        router.push(destination);
        return;
      }
    }

    if (!notification.read) {
      await markNotificationRead(notification.id);
    }
  };

  return (
    <>
      <PageHeading
        title="Notifications"
        description="Assignment updates and reminders for your workspace."
      />

      <Card>
        <div className="space-y-2">
          {notices.map((n) => (
            <div
              key={n.id}
              onClick={() => void handleNotificationClick(n)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  void handleNotificationClick(n);
                }
              }}
              className={`flex cursor-pointer items-start gap-3 rounded-xl p-4 transition hover:bg-slate-50 ${
                n.read ? "bg-white" : "bg-indigo-50/60"
              }`}
            >
              <div className="rounded-xl bg-white p-2 text-brand">
                <Bell size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{n.title}</h3>
                  {!n.read && <Badge tone="blue">New</Badge>}
                </div>

                <p className="mt-1 text-sm text-muted">{n.message}</p>

                <p className="mt-2 text-xs text-muted">
                  {formatDate(n.createdAt.slice(0, 10))}
                </p>
              </div>

              {!n.read && (
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    void markNotificationRead(n.id);
                  }}
                >
                  <Check size={16} />
                  Mark As read
                </Button>
              )}
            </div>
          ))}
        </div>

        {!notices.length && (
          <p className="py-10 text-center text-sm text-muted">
            You're all caught up.
          </p>
        )}
      </Card>
    </>
  );
}
