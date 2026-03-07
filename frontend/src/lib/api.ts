import { MOCK_RESOURCES } from "./mock-data";
import { Resource } from "./types";

export async function getResources(): Promise<Resource[]> {
  return MOCK_RESOURCES;
}

export async function getResource(id: string): Promise<Resource | undefined> {
  return MOCK_RESOURCES.find((r) => r.id === id);
}
