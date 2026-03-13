"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createResource } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [topic, setTopic] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [fileName, setFileName] = useState("");

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newResource = {
      id: crypto.randomUUID(),
      title,
      course,
      topic,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      updatedAt: new Date().toISOString().slice(0, 10),
      description,
      fileName,
    };

    await createResource(newResource);

    router.push("/resources");
    router.refresh();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Upload Resource</h1>
        <p className="text-sm text-muted-foreground">
          Add a new learning resource with metadata and file information.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input
            placeholder="e.g. Lecture 3 - Kubernetes Basics"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Course</label>
            <Input
              placeholder="e.g. ECE1779"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Topic</label>
            <Input
              placeholder="e.g. Docker"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tags</label>
          <Input
            placeholder="lecture, docker, week-3"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Separate tags with commas.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            placeholder="Write a short description for this resource..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[120px]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">File</label>
          <Input
            type="file"
            onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
          />
          {fileName && (
            <p className="text-sm text-muted-foreground">
              Selected file: {fileName}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit">Upload Resource</Button>
        </div>
      </form>
    </div>
  );
}
