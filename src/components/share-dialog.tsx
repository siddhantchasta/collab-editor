"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { CheckIcon, CopyIcon, EyeIcon, GlobeIcon, LockIcon, PencilIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

type AccessLevel = "private" | "view" | "edit";

interface ShareDialogProps {
  documentId: Id<"documents">;
  initialAccessLevel?: AccessLevel;
  isOwnerOrOrgMember: boolean;
  children: React.ReactNode;
}

export const ShareDialog = ({
  documentId,
  initialAccessLevel = "private",
  isOwnerOrOrgMember,
  children,
}: ShareDialogProps) => {
  const [open, setOpen] = useState(false);
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(initialAccessLevel);
  const [isCopied, setIsCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateAccess = useMutation(api.documents.updateAccessLevel);

  const handleAccessChange = (newLevel: AccessLevel) => {
    setAccessLevel(newLevel);
    setIsUpdating(true);

    updateAccess({ id: documentId, accessLevel: newLevel })
      .then(() => toast.success("Access permissions updated"))
      .catch(() => {
        toast.error("Failed to update access permissions");
        setAccessLevel(initialAccessLevel);
      })
      .finally(() => setIsUpdating(false));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getAccessIcon = (level: AccessLevel) => {
    switch (level) {
      case "private":
        return <LockIcon className="size-4 text-amber-600" />;
      case "view":
        return <EyeIcon className="size-4 text-blue-600" />;
      case "edit":
        return <PencilIcon className="size-4 text-emerald-600" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <GlobeIcon className="size-5 text-blue-600" />
            Share Document
          </DialogTitle>
          <DialogDescription>
            Manage role-based access permissions and sharing links for this document.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-y-4 py-2">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-background border shadow-xs">
                {getAccessIcon(accessLevel)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">General Access</span>
                <span className="text-xs text-muted-foreground">
                  {accessLevel === "private" && "Only you and workspace members can access"}
                  {accessLevel === "view" && "Anyone with the link can view (Read-Only)"}
                  {accessLevel === "edit" && "Anyone with the link can edit"}
                </span>
              </div>
            </div>

            {isOwnerOrOrgMember ? (
              <Select
                value={accessLevel}
                onValueChange={(val) => handleAccessChange(val as AccessLevel)}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <LockIcon className="size-3.5" />
                      <span>Restricted</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="view">
                    <div className="flex items-center gap-2">
                      <EyeIcon className="size-3.5" />
                      <span>Can View</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="edit">
                    <div className="flex items-center gap-2">
                      <PencilIcon className="size-3.5" />
                      <span>Can Edit</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="secondary" className="capitalize">
                {accessLevel === "private" ? "Restricted" : accessLevel}
              </Badge>
            )}
          </div>

          <div className="rounded-md bg-blue-50/50 dark:bg-blue-950/20 p-3 text-xs text-blue-900 dark:text-blue-200 border border-blue-100 dark:border-blue-900/50">
            {accessLevel === "view" && (
              <p>
                <strong>View-Only Mode:</strong> People opening this link will have editing tools disabled and cannot modify the document content.
              </p>
            )}
            {accessLevel === "edit" && (
              <p>
                <strong>Public Collaboration Mode:</strong> Anyone with the link will be able to edit and modify document text in real time.
              </p>
            )}
            {accessLevel === "private" && (
              <p>
                <strong>Restricted Mode:</strong> Only the document owner and members belonging to this workspace organization can open this document.
              </p>
            )}
          </div>
        </div>

        <Separator />

        <DialogFooter className="flex sm:justify-between items-center w-full gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="flex items-center gap-2"
          >
            {isCopied ? (
              <>
                <CheckIcon className="size-4 text-emerald-600" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <CopyIcon className="size-4" />
                <span>Copy Link</span>
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
