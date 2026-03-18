"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getResource, updateResource } from "@/lib/api";
import { Resource } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

const POLICY_OPTIONS = [
  { value: "STUDENT", label: "Student — visible to all enrolled users" },
  { value: "TA", label: "TA — visible to TAs and instructors" },
  { value: "INSTRUCTOR", label: "Instructor — visible to instructors only" },
] as const;

export default function EditResourcePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [resource, setResource] = useState<Resource | null>(null);
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [policy, setPolicy] = useState("LECTURE");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.token) return;
    getResource(user.token, params.id).then((data) => {
      if (!data) return;
      setResource(data);
      setTitle(data.title);
      setCourseCode(data.courseCode);
      setPolicy(data.policy);
      setTags(data.tags.join(", "));
    });
  }, [params.id, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resource || !user?.token) return;

    setIsSubmitting(true);
    try {
      await updateResource(user.token, resource.id, {
        title: title.trim(),
        courseCode: courseCode.trim(),
        policy,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success("Resource updated.");
      router.push(`/resources/${resource.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update resource.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!resource) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
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
            <Input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Visibility policy</label>
            <Select value={policy} onValueChange={setPolicy}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select policy" />
              </SelectTrigger>
              <SelectContent>
                {POLICY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tags</label>
          <Input value={tags} onChange={(e) => setTags(e.target.value)} />
          <p className="text-xs text-muted-foreground">Separate tags with commas.</p>
        </div>

        <div className="flex justify-end gap-2">
          <Link href={`/resources/${resource.id}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
