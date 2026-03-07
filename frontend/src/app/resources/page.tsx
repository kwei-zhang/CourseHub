import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const MOCK = [
  {
    id: "r1",
    title: "Lecture 1 - Intro to gRPC",
    course: "ECE1779",
    topic: "gRPC",
    tags: ["lecture", "grpc"],
    updatedAt: "2026-03-01",
  },
  {
    id: "r2",
    title: "Assignment 2 - Docker Checklist",
    course: "ECE1779",
    topic: "Docker",
    tags: ["assignment", "docker"],
    updatedAt: "2026-03-03",
  },
];

export default function Home() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Resources</h1>
        <p className="text-sm text-muted-foreground">
          Browse, search, and download learning materials.
        </p>
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
            {MOCK.map((r) => (
              <TableRow key={r.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{r.title}</TableCell>
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
