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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getResources } from "@/lib/api";
import { Resource } from "@/lib/types";

export default function Home() {
  const [search, setSearch] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    getResources().then(setResources);
  }, []);

  const filteredResources = resources.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Resources</h1>
        <p className="text-sm text-muted-foreground">
          Browse, search, and download learning materials.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search resources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-[140px]">Updated</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredResources.map((r) => (
              <TableRow key={r.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <Link href={`/resources/${r.id}`} className="hover:underline">
                    {r.title}
                  </Link>
                </TableCell>
                <TableCell>{r.course}</TableCell>
                <TableCell>{r.topic}</TableCell>
                <TableCell className="space-x-1">
                  {r.tags.map((t) => (
                    <Badge key={t} variant="outline">
                      {t}
                    </Badge>
                  ))}
                </TableCell>
                <TableCell>{r.updatedAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
