import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Mail, FileText } from "lucide-react";
import { cn, generateCalendarDays, formatDateShort } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CalendarEvent } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { getCalendarEvents } from "@/lib/calendarApi";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function CalendarTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const { data: events, isLoading } = useQuery({
    queryKey: ['/api/events'],
    queryFn: getCalendarEvents
  });
  
  const days = generateCalendarDays(year, month);
  
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const getEventsForDay = (day: number): CalendarEvent[] => {
    if (!events) return [];
    
    const dayDate = new Date(year, month, day);
    return events.filter(event => {
      const eventDate = new Date(event.eventDate);
      return (
        eventDate.getFullYear() === dayDate.getFullYear() &&
        eventDate.getMonth() === dayDate.getMonth() &&
        eventDate.getDate() === dayDate.getDate()
      );
    });
  };
  
  const getEventColorClasses = (eventType: string): string => {
    switch(eventType) {
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'survey':
        return 'bg-green-100 text-green-800';
      case 'meeting':
        return 'bg-purple-100 text-purple-800';
      case 'deadline':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };
  
  const getEventIcon = (eventType: string) => {
    switch(eventType) {
      case 'email':
        return <Mail className="text-blue-600" />;
      case 'survey':
        return <FileText className="text-green-600" />;
      default:
        return <Calendar className="text-purple-600" />;
    }
  };
  
  // Find upcoming events (future events sorted by date)
  const upcomingEvents = events
    ? events
        .filter(event => new Date(event.eventDate) >= new Date())
        .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
        .slice(0, 2)
    : [];
  
  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-1">Engagement Calendar</h2>
          <p className="text-slate-600">Scheduled emails, surveys, and important benefits dates.</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-medium">{MONTHS[month]} {year}</h3>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>
      
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-sm font-medium">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="py-2 text-center">{day}</div>
          ))}
        </div>
        
        {/* Calendar Body */}
        {isLoading ? (
          <Skeleton className="h-[600px] w-full" />
        ) : (
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const dayEvents = day.currentMonth ? getEventsForDay(day.date) : [];
              
              return (
                <div 
                  key={index} 
                  className={cn(
                    "border-r border-b border-slate-200 p-1",
                    index % 7 === 6 && "border-r-0", // Last column
                    Math.floor(index / 7) === 5 && "border-b-0", // Last row
                    !day.currentMonth && "text-slate-400",
                    day.today && "bg-blue-50"
                  )}
                >
                  <div className={cn(
                    "text-sm p-1",
                    day.today && "font-bold text-primary"
                  )}>
                    {day.date}
                  </div>
                  
                  {day.currentMonth && (
                    <div className="max-h-[80px] overflow-y-auto">
                      {dayEvents.map((event, eventIndex) => (
                        <div
                          key={eventIndex}
                          className={cn(
                            "text-xs px-1 py-0.5 rounded mb-1 truncate",
                            getEventColorClasses(event.eventType)
                          )}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-3">Upcoming Engagements</h3>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-[80px] w-full" />
            <Skeleton className="h-[80px] w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div key={event.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center">
                  <div className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center",
                    event.eventType === 'email' ? 'bg-blue-100' :
                    event.eventType === 'survey' ? 'bg-green-100' :
                    event.eventType === 'meeting' ? 'bg-purple-100' :
                    'bg-slate-100'
                  )}>
                    {getEventIcon(event.eventType)}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                      <div>
                        <h4 className="font-medium">{event.title}</h4>
                        <p className="text-sm text-slate-500">Scheduled for {formatDateShort(event.eventDate)}</p>
                      </div>
                      <div className="mt-2 md:mt-0">
                        <Button variant="link" className="text-primary p-0 h-auto">Preview</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 bg-white rounded-lg border border-slate-200">
                No upcoming events scheduled.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
