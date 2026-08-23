"use server";

import { ConvexHttpClient } from "convex/browser";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function getDocuments(ids: Id<"documents">[]) {
  return await convex.query(api.documents.getByIds, { ids });
}

interface CustomSessionClaims {
  org_id?: string;
  orgId?: string;
}

export async function getUsers() {
  const { sessionClaims, orgId } = await auth();
  const user = await currentUser();

  if (!user) {
    return [];
  }

  const claims = sessionClaims as CustomSessionClaims | null;
  const activeOrgId = orgId || claims?.org_id || claims?.orgId;

  if (activeOrgId) {
    try {
      const clerk = await clerkClient();
      const response = await clerk.users.getUserList({
        organizationId: [activeOrgId],
      });

      return response.data.map((u) => ({
        id: u.id,
        name: u.fullName ?? u.primaryEmailAddress?.emailAddress ?? "Anonymous",
        avatar: u.imageUrl,
        color: "",
      }));
    } catch (error) {
      console.error("Failed to fetch organization users:", error);
    }
  }

    return [
    {
      id: user.id,
      name: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Anonymous",
      avatar: user.imageUrl,
      color: "",
    },
  ];
}

export async function getUsersByIds(userIds: string[]) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!userIds || userIds.length === 0) return [];

  // Limit batch size to prevent enumeration
  const sanitizedIds = userIds.slice(0, 25);

  try {
    const clerk = await clerkClient();
    const response = await clerk.users.getUserList({
      userId: sanitizedIds,
    });

    return response.data.map((u) => ({
      id: u.id,
      name: u.fullName ?? u.primaryEmailAddress?.emailAddress ?? "Anonymous",
      avatar: u.imageUrl,
      color: "",
    }));
  } catch (error) {
    console.error("Failed to fetch users by IDs:", error);
    return [];
  }
}