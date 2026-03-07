import { MOCK_RESOURCES } from "./mock-data";
import { Resource } from "./types";

let resources: Resource[] = [...MOCK_RESOURCES];

export async function getResources(): Promise<Resource[]> {
  return resources;
}

export async function getResource(id: string): Promise<Resource | undefined> {
  return resources.find((r) => r.id === id);
}

export async function createResource(resource: Resource): Promise<void> {
  resources.unshift(resource);
}
