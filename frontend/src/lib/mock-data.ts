import { Resource } from "./types";

export const MOCK_RESOURCES: Resource[] = [
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
