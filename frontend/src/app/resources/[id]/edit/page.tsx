"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getResource, updateResource } from "@/lib/api";
import { Resource } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

export default function EditResourcePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [resource, setResource] = useState<Resource | null>(null);

  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [topic, setTopic] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    getResource(params.id).then((data) => {
      if (!data) return;

      setResource(data);
      setTitle(data.title);
      setCourse(data.course);
      setTopic(data.topic);
      setTags(data.tags.join(", "));
      setDescription(data.description);
    });
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!resource) return;

    const updatedResource: Resource = {
      ...resource,
      title,
      course,
      topic,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      description,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    await updateResource(updatedResource);

    router.push(`/resources/${resource.id}`);
    router.refresh();
  }

  if (!resource) {
    return <div className="text-sm text-red-500">Resource not found.</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/resources/${resource.id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to resource
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">Edit Resource</h1>
        <p className="text-sm text-muted-foreground">
          Update the metadata for this resource.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Course</label>
            <Input value={course} onChange={(e) => setCourse(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Topic</label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tags</label>
          <Input value={tags} onChange={(e) => setTags(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            Separate tags with commas.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[120px]"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Link href={`/resources/${resource.id}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>

          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
