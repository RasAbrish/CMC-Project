import { prisma } from "@/lib/prisma";

type NotificationType =
    | "POST_CREATED"
    | "POST_UPDATED"
    | "POST_DELETED"
    | "PAGE_CREATED"
    | "PAGE_UPDATED"
    | "USER_JOINED"
    | "MEDIA_UPLOADED";

interface CreateNotificationOptions {
    actorId: string;     // the user who performed the action
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
}

/**
 * Creates a notification for every user EXCEPT the actor.
 * Also creates one for the actor themselves if it's a system-level event.
 */
export async function broadcastNotification({
    actorId,
    type,
    title,
    message,
    link,
}: CreateNotificationOptions) {
    try {
        const allUsers = await prisma.user.findMany({ select: { id: true } });
        // Everyone gets notified (admins always)
        const recipients = allUsers.filter((u) => u.id !== actorId);

        if (recipients.length === 0) return;

        await prisma.notification.createMany({
            data: recipients.map((u) => ({
                userId: u.id,
                type,
                title,
                message,
                link: link ?? null,
                read: false,
            })),
        });
    } catch (error) {
        console.error("[broadcastNotification] error:", error);
    }
}
