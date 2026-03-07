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

export async function deleteResource(id: string): Promise<void> {
  resources = resources.filter((r) => r.id !== id);
}

export async function updateResource(updatedResource: Resource): Promise<void> {
  const index = resources.findIndex((r) => r.id === updatedResource.id);

  if (index !== -1) {
    resources[index] = updatedResource;
  }
}
