import { apiRequest } from "@/lib/queryClient";
import { Document } from "@shared/schema";

export async function uploadDocuments(files: File[]): Promise<Document[]> {
  const formData = new FormData();
  
  for (const file of files) {
    formData.append('documents', file);
  }
  
  const response = await fetch('/api/documents', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }
  
  return response.json();
}

export async function getDocuments(): Promise<Document[]> {
  const response = await fetch('/api/documents', {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }
  
  return response.json();
}

export async function deleteDocument(id: number): Promise<void> {
  await apiRequest('DELETE', `/api/documents/${id}`, undefined);
}
