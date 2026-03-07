type Resource = {
  id: string;
  title: string;
  course: string;
  topic: string;
  tags: string[];
  updatedAt: string;
  description: string;
};

const MOCK: Resource[] = [
  {
    id: "r1",
    title: "Lecture 1 - Intro to gRPC",
    course: "ECE1779",
    topic: "gRPC",
    tags: ["lecture", "grpc"],
    updatedAt: "2026-03-01",
    description:
      "Introduction to gRPC concepts, services, and communication patterns.",
  },
  {
    id: "r2",
    title: "Assignment 2 - Docker Checklist",
    course: "ECE1779",
    topic: "Docker",
    tags: ["assignment", "docker"],
    updatedAt: "2026-03-03",
    description:
      "Checklist and requirements for completing the Docker assignment.",
  },
];

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const resource = MOCK.find((item) => item.id === id);

  if (!resource) {
    return <div className="text-sm text-red-500">Resource not found.</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{resource.title}</h1>
        <p className="text-sm text-muted-foreground">
          View resource details and metadata.
        </p>
      </div>

      <div className="rounded-lg border p-6 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Course</p>
          <p className="font-medium">{resource.course}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Topic</p>
          <p className="font-medium">{resource.topic}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Updated</p>
          <p className="font-medium">{resource.updatedAt}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Tags</p>
          <div className="flex gap-2 mt-1">
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

        <div>
          <p className="text-sm text-muted-foreground">Description</p>
          <p className="font-medium">{resource.description}</p>
        </div>
      </div>
    </div>
  );
}
