import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { SiGoogledocs } from "react-icons/si";
import { Building2Icon, CircleUserIcon } from "lucide-react";

import { TableCell, TableRow } from "@/components/ui/table";

import { DocumentMenu } from "./document-menu";
import { Doc } from "../../../convex/_generated/dataModel";

interface DocumentRowProps {
  document: Doc<"documents">;
};

export const DocumentRow = ({ document }: DocumentRowProps) => {
  const router = useRouter();

  return (
    <TableRow
      onClick={() => router.push(`/documents/${document._id}`)}
      className="cursor-pointer"
    >
      <TableCell className="w-[50px]">
        <SiGoogledocs className="size-6 fill-blue-500" />
      </TableCell>
      <TableCell className="font-medium md:w-[45%]">
        {document.title}
      </TableCell>
      <TableCell className="text-muted-foreground hidden md:flex items-center gap-2">
        {document.organizationId 
          ? <Building2Icon className="size-4" /> 
          : <CircleUserIcon className="size-4" />
        }
        <span>{document.organizationId ? "Organization" : "Personal"}</span>
        {document.accessLevel === "view" && (
          <span className="text-[11px] bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full border border-blue-200">
            Public View
          </span>
        )}
        {document.accessLevel === "edit" && (
          <span className="text-[11px] bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full border border-emerald-200">
            Public Edit
          </span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground hidden md:table-cell">
        {format(new Date(document._creationTime), "MMM dd, yyyy")}
      </TableCell>
      <TableCell className="flex justify-end">
        <DocumentMenu
          documentId={document._id}
          title={document.title}
          accessLevel={document.accessLevel}
          onNewTab={() => window.open(`/documents/${document._id}`, "_blank")}
        />
      </TableCell>
    </TableRow>
  )
}
