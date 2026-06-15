"use client";

import { useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";

function fire(title: string, body: string, href: string) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const n = new Notification(title, { body, icon: "/icon.svg" });
  n.onclick = () => {
    window.focus();
    window.location.href = href;
  };
}

export function NotificationListener() {
  const sbRef = useRef(
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  useEffect(() => {
    const sb = sbRef.current;

    const regCh = sb
      .channel("admin-notif-registrations")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "registrations" },
        (payload) => {
          const r = payload.new as {
            first_name: string;
            last_name:  string;
            email?:     string | null;
          };
          fire(
            "New registration",
            `${r.first_name} ${r.last_name}${r.email ? ` · ${r.email}` : ""}`,
            "/admin/registrants"
          );
        }
      )
      .subscribe();

    const enqCh = sb
      .channel("admin-notif-enquiries")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "enquiries" },
        (payload) => {
          const e = payload.new as { full_name: string; interest: string };
          const label = e.interest === "partner" ? "partnership interest" : e.interest;
          fire(
            "New enquiry",
            `${e.full_name} — ${label}`,
            "/admin/enquiries"
          );
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(regCh);
      sb.removeChannel(enqCh);
    };
  }, []);

  return null;
}
