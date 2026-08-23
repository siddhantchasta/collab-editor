"use client";

import { toast } from "sonner";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { ReactNode, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { FullscreenLoader } from "@/components/fullscreen-loader";
import { LEFT_MARGIN_DEFAULT, RIGHT_MARGIN_DEFAULT } from "@/constants/margins";

import { useUser } from "@clerk/nextjs";
import { getUsers, getUsersByIds, getDocuments } from "./actions";
import { Id } from "../../../../convex/_generated/dataModel";

type User = { id: string; name: string; avatar: string; color: string; };

export function Room({ children }: { children: ReactNode }) {
  const params = useParams();
  const { user: clerkUser } = useUser();

  const [users, setUsers] = useState<User[]>(() => {
    if (clerkUser) {
      return [
        {
          id: clerkUser.id,
          name: clerkUser.fullName ?? clerkUser.primaryEmailAddress?.emailAddress ?? "Anonymous",
          avatar: clerkUser.imageUrl,
          color: "",
        },
      ];
    }
    return [];
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const list = await getUsers();
        setUsers((prev) => {
          const map = new Map(prev.map((u) => [u.id, u]));
          list.forEach((u) => map.set(u.id, u));
          return Array.from(map.values());
        });
      } catch {
        toast.error("Failed to fetch users");
      }
    };

    fetchUsers();
  }, []);

  return (
    <LiveblocksProvider
      throttle={16}
      authEndpoint={async () => {
        const endpoint = "/api/liveblocks-auth";
        const room = params.documentId as string;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ room }),
        });

        if (!response.ok) {
          throw new Error("Unauthorized");
        }

        return await response.json();
      }}
      resolveUsers={async ({ userIds }) => {
        const missing = userIds.filter(
          (id) => !users.some((u) => u.id === id)
        );

        let currentUsers = users;
        if (missing.length > 0) {
          try {
            const fetched = await getUsersByIds(missing);
            if (fetched.length > 0) {
              setUsers((prev) => {
                const map = new Map(prev.map((u) => [u.id, u]));
                fetched.forEach((u) => map.set(u.id, u));
                return Array.from(map.values());
              });
              currentUsers = [...currentUsers, ...fetched];
            }
          } catch {
            // Ignore fetch failure and fallback
          }
        }

        return userIds.map(
          (userId) => currentUsers.find((user) => user.id === userId) ?? undefined
        );
      }}
      resolveMentionSuggestions={({ text }) => {
        let filteredUsers = users;

        if (text) {
          filteredUsers = users.filter((user) => 
            user.name.toLowerCase().includes(text.toLowerCase())
          );
        }

        return filteredUsers.map((user) => user.id);
      }}
      resolveRoomsInfo={async ({ roomIds }) => {
        const documents = await getDocuments(roomIds as Id<"documents">[]);
        return documents.map((document) => ({
          id: document.id,
          name: document.name,
        }));
      }}
    >
      <RoomProvider 
        id={params.documentId as string} 
        initialStorage={{ leftMargin: LEFT_MARGIN_DEFAULT, rightMargin: RIGHT_MARGIN_DEFAULT }}
      >
        <ClientSideSuspense fallback={<FullscreenLoader label="Room loading..." />}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}