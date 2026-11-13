"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { ChatFab as ChatFabType } from "@/components/chat/chat-fab";
import type { SessionPromptDialog as SessionPromptDialogType } from "@/components/layout/session-prompt-dialog";

/**
 * The chat button and the session prompt are both invisible until a timer
 * fires in the browser, so there is nothing to server-render and no reason to
 * ship their JavaScript in the first bundle of every public page.
 *
 * `ssr: false` is only allowed inside a client component, which is why this
 * wrapper exists rather than the dynamic() calls living in the layout.
 */
const ChatFab = dynamic(
  () => import("@/components/chat/chat-fab").then((m) => m.ChatFab),
  { ssr: false },
);
const SessionPromptDialog = dynamic(
  () => import("@/components/layout/session-prompt-dialog").then((m) => m.SessionPromptDialog),
  { ssr: false },
);

type ChatEvent   = ComponentProps<typeof ChatFabType>["event"];
type PromptEvent = ComponentProps<typeof SessionPromptDialogType>["event"];

export function DeferredWidgets({ event }: { event: (NonNullable<ChatEvent> & PromptEvent) | null }) {
  return (
    <>
      {event && <SessionPromptDialog event={event} />}
      <ChatFab event={event} />
    </>
  );
}
