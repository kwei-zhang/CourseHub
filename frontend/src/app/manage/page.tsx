"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getResources, deleteResource } from "@/lib/api";
import { Resource } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function ManagePage() {
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    getResources().then(setResources);
  }, []);

  async function handleDelete(id: string) {
    await deleteResource(id);
    const updated = await getResources();
    setResources(updated);
    toast.success("Resource deleted");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Manage Resources</h1>
        <p className="text-sm text-muted-foreground">
          View, edit, and delete resources from one place.
        </p>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[260px]">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {resources.map((resource) => (
              <TableRow key={resource.id}>
                <TableCell className="font-medium">{resource.title}</TableCell>
                <TableCell>{resource.course}</TableCell>
                <TableCell>{resource.topic}</TableCell>
                <TableCell>{resource.updatedAt}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link href={`/resources/${resource.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>

                    <Link href={`/resources/${resource.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Delete
                        </Button>
                      </DialogTrigger>

                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Resource</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete this resource? This
                            action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>

                        <DialogFooter className="flex gap-2">
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>

                          <DialogClose asChild>
                            <Button
                              variant="destructive"
                              onClick={() => handleDelete(resource.id)}
                            >
                              Delete
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {resources.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No resources available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
