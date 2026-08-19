"use client";

import { useState } from "react";
import Image from "next/image";

import { ClientSideSuspense } from "@liveblocks/react";
import { useOthers, useSelf } from "@liveblocks/react/suspense";

import { Separator } from "@/components/ui/separator";

const AVATAR_SIZE = 36;

export const Avatars = () => {
  return (
    <ClientSideSuspense fallback={null}>
      <AvatarStack />
    </ClientSideSuspense>
  );
};

const AvatarStack = () => {
  const users = useOthers();
  const currentUser = useSelf();

  if (users.length === 0) return null;

  return (
    <>
      <div className="flex items-center">
        {currentUser && (
          <div className="relative ml-2">
            <Avatar src={currentUser.info.avatar} name="You" />
          </div>
        )}
        <div className="flex">
          {users.map(({ connectionId, info }) => {
            return (
              <Avatar key={connectionId} src={info.avatar} name={info.name} />
            )
          })}
        </div>
      </div>
      <Separator orientation="vertical" className="h-6" />
    </>
  )
}

interface AvatarProps {
  src?: string;
  name: string;
}

const Avatar = ({ src, name }: AvatarProps) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div 
      style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
      className="group -ml-2 flex shrink-0 items-center justify-center relative border-4 border-white rounded-full bg-gray-400 overflow-hidden select-none"
    >
      <div className="opacity-0 group-hover:opacity-100 absolute top-full py-1 px-2 text-white text-xs rounded-lg mt-2.5 z-10 bg-black whitespace-nowrap transition-opacity pointer-events-none">
        {name}
      </div>
      {src && !hasError ? (
        <Image
          alt={name}
          src={src}
          width={AVATAR_SIZE}
          height={AVATAR_SIZE}
          className="size-full object-cover rounded-full"
          onError={() => setHasError(true)}
          unoptimized
        />
      ) : (
        <span className="text-white text-xs font-semibold uppercase">
          {name.charAt(0) || "U"}
        </span>
      )}
    </div>
  );
};
