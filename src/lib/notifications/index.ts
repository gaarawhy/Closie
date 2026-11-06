// Notificações (pedidos para seguir, novos seguidores, curtidas/respostas/reações nos seus
// stories). Montadas a partir de social + stories; com backend, viram uma consulta à API.
export { buildNotifications, countUnread, unreadCount } from "./build";
export { useNotifications } from "./hooks";
export { getLastSeen, markNotificationsSeen } from "./seen";
export type { NotificationItem, NotificationKind } from "./types";
