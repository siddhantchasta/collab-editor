import { Liveblocks } from "@liveblocks/node";
import { ConvexHttpClient } from "convex/browser";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";

import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

interface CustomSessionClaims {
  org_id?: string;
  orgId?: string;
}

export async function POST(req: Request) {
  const { sessionClaims, orgId } = await auth();
  if (!sessionClaims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const user = await currentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { room } = await req.json();
  const document = await convex.query(api.documents.getById, { id: room });

  if (!document) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const isOwner = document.ownerId === user.id;

  let isOrganizationMember = false;
  if (document.organizationId) {
    const claims = sessionClaims as CustomSessionClaims | null;
    const activeOrgId = orgId || claims?.org_id || claims?.orgId;
    if (activeOrgId === document.organizationId) {
      isOrganizationMember = true;
    } else {
      try {
        const clerk = await clerkClient();
        const memberships = await clerk.users.getOrganizationMembershipList({
          userId: user.id,
        });
        isOrganizationMember = memberships.data.some(
          (membership) => membership.organization.id === document.organizationId
        );
      } catch (error) {
        console.error("Error checking organization membership:", error);
      }
    }
  }

  if (!isOwner && !isOrganizationMember) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const name = user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Anonymous";
  const nameToNumber = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = Math.abs(nameToNumber) % 360;
  const color = `hsl(${hue}, 80%, 60%)`;

  const session = liveblocks.prepareSession(user.id, {
    userInfo: {
      name,
      avatar: user.imageUrl,
      color,
    },
  });
  session.allow(room, session.FULL_ACCESS);
  const { body, status } = await session.authorize();

  return new Response(body, { status });
}
