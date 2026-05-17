import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  buildConsentUrl,
  createBasiqUser,
  getClientToken,
} from "@/lib/basiq/basiq.client";
import { ROUTES } from "@/lib/constants/routes.constants";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, email: true, basiqUserId: true },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  try {
    let basiqUserId = user.basiqUserId;

    if (!basiqUserId) {
      basiqUserId = await createBasiqUser(user.email);
      await db.update(users).set({ basiqUserId }).where(eq(users.id, user.id));
    }

    const clientToken = await getClientToken(basiqUserId);
    const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const callbackUrl = `${appUrl}/api/integrations/basiq/callback`;
    const consentUrl = buildConsentUrl(clientToken, callbackUrl);

    return Response.json({ consentUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 502 });
  }
}
