"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getResourcesForUser, deleteResource } from "@/lib/api";
import { Resource } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useAuth } from "@/lib/AuthContext";

export default function ManagePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadResources(token: string) {
    setIsLoading(true);
    try {
      setResources(await getResourcesForUser(token));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading || !user?.token) return;
    loadResources(user.token);
  }, [user, authLoading]);

  async function handleDelete(id: string) {
    if (!user?.token) return;
    await deleteResource(user.token, id);
    toast.success("Resource deleted");
    await loadResources(user.token);
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
              <TableHead>Policy</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-[260px]">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Loading…
                </TableCell>
              </TableRow>
            ) : resources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-8">
                  No resources available.
                </TableCell>
              </TableRow>
            ) : (
              resources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell className="font-medium">{resource.title}</TableCell>
                  <TableCell>{resource.courseCode}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{resource.policy}</Badge>
                  </TableCell>
                  <TableCell className="space-x-1">
                    {resource.tags.map((t) => (
                      <Badge key={t} variant="secondary">{t}</Badge>
                    ))}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/resources/${resource.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>

                      <Link href={`/resources/${resource.id}/edit`}>
                        <Button variant="outline" size="sm">Edit</Button>
                      </Link>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm">Delete</Button>
                        </DialogTrigger>

                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Resource</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete &quot;{resource.title}&quot;? This
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
