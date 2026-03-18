"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getResource, deleteResource } from "@/lib/api";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Resource } from "@/lib/types";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

export default function ResourceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [resource, setResource] = useState<Resource | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.token) return;
    getResource(user.token, params.id).then((data) => {
      setResource(data);
      setIsLoading(false);
    });
  }, [params.id, user]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  if (!resource) {
    return <div className="text-sm text-red-500">Resource not found.</div>;
  }

  const isInstructor = user?.role === "instructor";

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/resources"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to resources
        </Link>

        <div className="flex gap-2">
          {isInstructor && (
            <Link href={`/resources/${resource.id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
          )}

          {isInstructor && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">Delete</Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Resource</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this resource? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex gap-2">
                  <DialogTrigger asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogTrigger>

                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (!user?.token) return;
                      await deleteResource(user.token, resource.id);
                      toast.success("Resource deleted");
                      router.push("/resources");
                    }}
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">{resource.title}</h1>
        <p className="text-sm text-muted-foreground">
          View resource details and metadata.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-5 space-y-4">
          <h2 className="font-medium">Metadata</h2>

          <div>
            <p className="text-sm text-muted-foreground">Course</p>
            <p>{resource.courseCode}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Policy</p>
            <Badge variant="outline">{resource.policy}</Badge>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Tags</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {resource.tags.length > 0 ? resource.tags.map((tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              )) : <span className="text-sm text-muted-foreground">—</span>}
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-5 space-y-4">
          <h2 className="font-medium">File Info</h2>

          <div>
            <p className="text-sm text-muted-foreground">Content Type</p>
            <p>{resource.contentType}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Object Key</p>
            <p className="text-xs font-mono break-all text-muted-foreground">{resource.objectKey}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
