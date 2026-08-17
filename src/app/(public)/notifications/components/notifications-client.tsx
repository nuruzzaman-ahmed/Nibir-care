"use client";

import { useState } from "react";
import { Bell, CheckCheck, BellRing, Calendar, FlaskConical, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
};

const typeIcon: Record<string, React.ReactNode> = {
  BOOKING_CONFIRMED: <Calendar className="h-4 w-4 text-teal-600" />,
  QUEUE_APPROACHING: <Clock className="h-4 w-4 text-amber-600" />,
  QUEUE_NEAR: <BellRing className="h-4 w-4 text-amber-600" />,
  QUEUE_VERY_NEAR: <BellRing className="h-4 w-4 text-orange-600" />,
  QUEUE_CURRENT: <BellRing className="h-4 w-4 text-teal-600" />,
  DOCTOR_DELAY: <AlertCircle className="h-4 w-4 text-amber-600" />,
  TEST_BOOKING_CONFIRMED: <FlaskConical className="h-4 w-4 text-blue-600" />,
  GENERAL: <Bell className="h-4 w-4 text-gray-500" />,
};

const typeBg: Record<string, string> = {
  BOOKING_CONFIRMED: "bg-teal-50",
  QUEUE_APPROACHING: "bg-amber-50",
  QUEUE_NEAR: "bg-amber-50",
  QUEUE_VERY_NEAR: "bg-orange-50",
  QUEUE_CURRENT: "bg-teal-50",
  DOCTOR_DELAY: "bg-amber-50",
  TEST_BOOKING_CONFIRMED: "bg-blue-50",
  GENERAL: "bg-gray-50",
};

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "এইমাত্র";
  if (mins < 60) return `${mins} মিনিট আগে`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ঘণ্টা আগে`;
  const days = Math.floor(hrs / 24);
  return `${days} দিন আগে`;
}

export function NotificationsClient({
  notifications: initialNotifications,
  userId,
}: {
  notifications: Notification[];
  userId: string;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    await fetch("/api/notifications/mark-all-read", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setMarkingAll(false);
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16">
        <Bell className="h-14 w-14 mx-auto mb-3 text-gray-200" />
        <h3 className="font-semibold text-gray-600 mb-1">কোনো নোটিফিকেশন নেই</h3>
        <p className="text-sm text-gray-400">নতুন আপডেট আসলে এখানে দেখা যাবে</p>
      </div>
    );
  }

  return (
    <div>
      {unreadCount > 0 && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">{unreadCount} টি অপঠিত</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={markAllRead}
            disabled={markingAll}
            className="text-xs text-teal-600 hover:text-teal-700"
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" />
            সব পড়া হয়েছে
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notif) => {
          const icon = typeIcon[notif.type] ?? typeIcon.GENERAL;
          const bg = typeBg[notif.type] ?? typeBg.GENERAL;
          return (
            <div
              key={notif.id}
              className={`bg-white rounded-2xl border shadow-sm p-4 flex items-start gap-3 transition-all cursor-pointer ${
                notif.isRead ? "border-gray-100 opacity-75" : "border-teal-100"
              }`}
              onClick={() => !notif.isRead && markRead(notif.id)}
            >
              <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${notif.isRead ? "text-gray-600" : "text-gray-900"}`}>
                  {notif.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.body}</p>
                <p className="text-[10px] text-gray-300 mt-1.5">{timeAgo(notif.createdAt)}</p>
              </div>
              {!notif.isRead && (
                <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0 mt-1.5" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
