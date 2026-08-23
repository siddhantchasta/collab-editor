"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { EyeIcon } from "lucide-react";

import { Room } from "./room";
import { Editor } from "./editor";
import { Navbar } from "./navbar";
import { Toolbar } from "./toolbar";
import { api } from "../../../../convex/_generated/api";

interface DocumentProps {
  preloadedDocument: Preloaded<typeof api.documents.getById>;
};

export const Document = ({ preloadedDocument }: DocumentProps) => {
  const document = usePreloadedQuery(preloadedDocument);
  const { user } = useUser();
  const { orgId } = useAuth();

  const isOwner = user ? document.ownerId === user.id : false;
  const isOrgMember = !!(document.organizationId && document.organizationId === orgId);
  const isOwnerOrOrgMember = isOwner || isOrgMember;
  const canEdit = isOwnerOrOrgMember || document.accessLevel === "edit";
  const isReadOnly = !canEdit;

  return (
    <Room key={canEdit ? "edit-mode" : "view-mode"}>
      <div className="min-h-screen bg-[#FAFBFD]">
        <div className="flex flex-col px-4 pt-2 gap-y-2 fixed top-0 left-0 right-0 z-10 bg-[#FAFBFD] print:hidden">
          <Navbar 
            data={document} 
            isReadOnly={isReadOnly}
            isOwnerOrOrgMember={isOwnerOrOrgMember}
          />
          {!isReadOnly ? (
            <Toolbar />
          ) : (
            <div className="bg-amber-50/90 border border-amber-200 text-amber-900 px-4 py-1.5 rounded-full flex items-center justify-center gap-2 text-xs font-medium max-w-fit mx-auto shadow-xs">
              <EyeIcon className="size-3.5 text-amber-700" />
              <span>Viewing in read-only mode. Edits and formatting tools are disabled.</span>
            </div>
          )}
        </div>
        <div className={isReadOnly ? "pt-[96px] print:pt-0" : "pt-[114px] print:pt-0"}>
          <Editor initialContent={document.initialContent} isReadOnly={isReadOnly} />
        </div>
      </div>
    </Room>
   );
};
