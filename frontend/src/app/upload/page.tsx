"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUploadUrl, createResourceOnServer, getEnrollments } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CourseEnrollment } from "@/lib/types";

const POLICY_OPTIONS = [
  { value: "STUDENT", label: "Student — visible to all enrolled users" },
  { value: "TA", label: "TA — visible to TAs and instructors" },
  { value: "INSTRUCTOR", label: "Instructor — visible to instructors only" },
] as const;

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [instructorCourses, setInstructorCourses] = useState<CourseEnrollment[]>([]);
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [policy, setPolicy] = useState<string>("STUDENT");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.token) return;
    getEnrollments(user.token).then((enrollments) => {
      setInstructorCourses(enrollments.filter((e) => e.role === "instructor"));
    });
  }, [user?.token]);

  const tagList = tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user?.token) {
      toast.error("You must be signed in to upload.");
      return;
    }
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }
    if (!title.trim() || !course.trim()) {
      toast.error("Title and course are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const contentType = file.type || "application/octet-stream";

      const { url, object_key: objectKey } = await getUploadUrl(user.token, {
        title: title.trim(),
        courseCode: course.trim(),
        contentType,
        policy,
        tags: tagList,
        expires_in: 300,
      });

      const uploadRes = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": contentType },
      });
      if (!uploadRes.ok) {
        throw new Error(`Upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
      }

      await createResourceOnServer(user.token, {
        title: title.trim(),
        courseCode: course.trim(),
        contentType,
        objectKey,
        policy,
        tags: tagList,
      });

      toast.success("Resource uploaded successfully.");
      router.push("/resources");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Upload Resource</h1>
        <p className="text-sm text-muted-foreground">
          Add a new learning resource with metadata and file. File is stored in DigitalOcean Spaces.
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
            <Select value={course} onValueChange={setCourse}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Public — visible to everyone</SelectItem>
                {instructorCourses.map((c) => (
                  <SelectItem key={c.course_id} value={c.course_code}>
                    {c.course_code} — {c.course_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Uploading…" : "Upload Resource"}
          </Button>
        </div>
      </form>
    </div>
  );
}
