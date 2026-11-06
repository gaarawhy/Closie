import type { Person } from "@/lib/social";
import type { Story } from "@/lib/stories";

// Formato das notificações. Com backend, a API deve devolver estes mesmos campos.

type Base = { id: string; from: Person; at: string };

export type NotificationItem =
  | (Base & { kind: "follow_request" })
  | (Base & { kind: "new_follower" })
  | (Base & { kind: "request_accepted" })
  | (Base & { kind: "like"; story: Story })
  | (Base & { kind: "reply"; story: Story; text: string })
  | (Base & { kind: "reaction"; story: Story; emoji: string });

export type NotificationKind = NotificationItem["kind"];
