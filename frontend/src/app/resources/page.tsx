"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { listResourcesByCourse } from "@/lib/api";
import { Resource } from "@/lib/types";
import { useAuth } from "@/lib/AuthContext";
import { BookOpen } from "lucide-react";

export default function ResourcesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const courseCode = searchParams.get("course");

  const [search, setSearch] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSearch("");
    setResources([]);
    setError(null);

    if (authLoading || !user?.token || !courseCode) return;

    setIsLoading(true);
    listResourcesByCourse(user.token, courseCode)
      .then(setResources)
      .catch(() => setError("Failed to load resources."))
      .finally(() => setIsLoading(false));
  }, [courseCode, user, authLoading]);

  const filteredResources = resources.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  // No course selected — prompt the user
  if (!courseCode) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-center">
        <BookOpen className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-medium">Select a course</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Choose one of your enrolled courses from the sidebar to browse its resources.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{courseCode}</h1>
          <p className="text-sm text-muted-foreground">
            Browse and download learning materials for this course.
          </p>
        </div>
        <Input
          placeholder="Search by title or tag…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Policy</TableHead>
              <TableHead>Tags</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filteredResources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  {search ? "No resources match your search." : "No resources found for this course."}
                </TableCell>
              </TableRow>
            ) : (
              filteredResources.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <Link href={`/resources/${r.id}`} className="hover:underline">
                      {r.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.contentType.split("/").pop()?.toUpperCase() ?? r.contentType}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.policy}</Badge>
                  </TableCell>
                  <TableCell className="space-x-1">
                    {r.tags.map((t) => (
                      <Badge key={t} variant="secondary">{t}</Badge>
                    ))}
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
