import { apiRequest } from "@/lib/queryClient";
import { CalendarEvent, InsertCalendarEvent } from "@shared/schema";

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const response = await fetch('/api/events', {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }
  
  return response.json();
}

export async function createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
  const response = await apiRequest('POST', '/api/events', event);
  return response.json();
}

export async function updateCalendarEvent(id: number, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent> {
  const response = await apiRequest('PATCH', `/api/events/${id}`, event);
  return response.json();
}

export async function deleteCalendarEvent(id: number): Promise<void> {
  await apiRequest('DELETE', `/api/events/${id}`, undefined);
}
