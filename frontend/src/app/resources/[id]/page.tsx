"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getResource } from "@/lib/api";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Resource } from "@/lib/types";

export default function ResourceDetailPage() {
  const params = useParams<{ id: string }>();
  const [resource, setResource] = useState<Resource | null>(null);

  useEffect(() => {
    getResource(params.id).then((data) => {
      if (data) setResource(data);
    });
  }, [params.id]);

  if (!resource) {
    return <div className="text-sm text-red-500">Resource not found.</div>;
  }

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
          <Button variant="outline">Download</Button>
          <Button variant="outline">Edit</Button>
          <Button variant="destructive">Delete</Button>
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
            <p>{resource.course}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Topic</p>
            <p>{resource.topic}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Updated</p>
            <p>{resource.updatedAt}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Tags</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {resource.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-5 space-y-4">
          <h2 className="font-medium">Description</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {resource.description}
          </p>

          <div>
            <p className="text-sm text-muted-foreground">File Type</p>
            <p>PDF</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Access Level</p>
            <p>Students / TAs / Instructors</p>
          </div>
        </div>
      </div>
    </div>
  );
}
