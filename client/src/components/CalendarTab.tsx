import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { 
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from "date-fns";
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  Loader2,
  Calendar as CalendarIcon,
  X,
  Info,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit,
  Check
} from "lucide-react";
import { CalendarEvent } from "@shared/schema";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Define form schema for calendar events
const eventSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  location: z.string().optional(),
  startTime: z.date(),
  endTime: z.date(),
  allDay: z.boolean().default(false),
  category: z.string().default("general"),
});

type EventFormValues = z.infer<typeof eventSchema>;

// UI Event structure that the component expects
interface UIEvent {
  id: number;
  companyId: number;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  category: string;
  color?: string;
}

// Function to adapt DB events to UI events format
function adaptDBEventsToUIEvents(dbEvents: CalendarEvent[] | undefined): UIEvent[] {
  if (!dbEvents) return [];
  
  return dbEvents.map(event => {
    // Create a date object for the event date
    const eventDate = new Date(event.eventDate);
    
    // Map event type to proper category and set appropriate color
    const category = event.eventType || "general";
    
    return {
      id: event.id,
      companyId: event.companyId,
      title: event.title,
      description: event.description || "",
      location: "",
      // Use the eventDate for both start and end times
      startTime: eventDate,
      endTime: eventDate,
      allDay: true,
      // Map eventType to category
      category: category,
      color: event.color || getCategoryDefaultColor(category),
    };
  });
}

// Define categories and their colors (match with eventType in database)
const EVENT_CATEGORIES = [
  { value: "general", label: "General", color: "bg-blue-100 text-blue-800" },
  { value: "benefits", label: "Benefits", color: "bg-green-100 text-green-800" },
  { value: "deadline", label: "Deadline", color: "bg-red-100 text-red-800" },
  { value: "meeting", label: "Meeting", color: "bg-purple-100 text-purple-800" },
  { value: "holiday", label: "Holiday", color: "bg-yellow-100 text-yellow-800" },
];

// Helper function to get default color for a category
function getCategoryDefaultColor(category: string): string {
  const foundCategory = EVENT_CATEGORIES.find(c => c.value === category);
  return foundCategory?.color.split(' ')[0] || "bg-blue-100";
}

export default function CalendarTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [editEventId, setEditEventId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "day">("month");
  
  // Get company ID from user
  const companyId = user?.companyId;
  
  // Set up form
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      startTime: new Date(),
      endTime: new Date(new Date().setHours(new Date().getHours() + 1)),
      allDay: false,
      category: "general",
    },
  });
  
  // Fetch calendar events
  const { 
    data: events, 
    isLoading: loadingEvents 
  } = useQuery<CalendarEvent[]>({ 
    queryKey: ["/api/events", companyId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!companyId,
  });
  
  // Create a new calendar event
  const createEventMutation = useMutation({
    mutationFn: async (eventData: EventFormValues) => {
      // Convert UI form data to database format
      const dbEventData = {
        title: eventData.title,
        description: eventData.description,
        eventDate: eventData.startTime, // Use the start time as the event date
        eventType: eventData.category,  // Map category to eventType
        color: EVENT_CATEGORIES.find(c => c.value === eventData.category)?.color.split(' ')[0] || "bg-blue-100"
      };
      
      const res = await apiRequest(
        "POST", 
        "/api/events", 
        dbEventData
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setCreateEventOpen(false);
      form.reset();
      toast({
        title: "Event created",
        description: "The event has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create event",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update calendar event
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, eventData }: { id: number, eventData: EventFormValues }) => {
      // Convert UI form data back to database format
      const dbEventData = {
        title: eventData.title,
        description: eventData.description,
        eventDate: eventData.startTime, // Use the start time as the event date
        eventType: eventData.category   // Map category back to eventType
      };
      
      const res = await apiRequest(
        "PATCH", 
        `/api/events/${id}`, 
        dbEventData
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setEditEventId(null);
      setCreateEventOpen(false);
      form.reset();
      toast({
        title: "Event updated",
        description: "The event has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update event",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete calendar event
  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(
        "DELETE", 
        `/api/events/${id}`
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete event",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handler to open create event dialog
  const handleCreateEvent = (date?: Date) => {
    if (date) {
      const newDate = new Date(date);
      form.setValue("startTime", newDate);
      
      const endTime = new Date(newDate);
      endTime.setHours(endTime.getHours() + 1);
      form.setValue("endTime", endTime);
    }
    
    setEditEventId(null);
    setCreateEventOpen(true);
  };
  
  // Handler to open edit event dialog
  const handleEditEvent = (event: UIEvent) => {
    form.reset({
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      startTime: event.startTime,
      endTime: event.endTime,
      allDay: event.allDay,
      category: event.category,
    });
    
    setEditEventId(event.id);
    setCreateEventOpen(true);
  };
  
  // Handle form submission for creating/updating event
  const onSubmit = (data: EventFormValues) => {
    if (editEventId) {
      updateEventMutation.mutate({ id: editEventId, eventData: data });
    } else {
      createEventMutation.mutate(data);
    }
  };
  
  // Handle deleting an event
  const handleDeleteEvent = (id: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteEventMutation.mutate(id);
    }
  };
  
  // Convert database events to UI events
  const uiEvents = useMemo(() => adaptDBEventsToUIEvents(events), [events]);
  
  // Get events for the selected date
  const eventsForSelectedDate = selectedDate 
    ? uiEvents.filter(event => {
        return isSameDay(event.startTime, selectedDate);
      })
    : [];
  
  // Get days in current month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });
  
  // Navigate to previous month
  const previousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };
  
  // Navigate to next month
  const nextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };
  
  // Get category color class
  const getCategoryColorClass = (category: string) => {
    const foundCategory = EVENT_CATEGORIES.find(c => c.value === category);
    return foundCategory?.color || "bg-gray-100 text-gray-800";
  };
  
  // Render loading state
  if (loadingEvents) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading calendar...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold gradient-heading">Events Calendar</h2>
          <p className="text-muted-foreground">
            View and manage company events, holidays, and important dates
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setViewMode("month")}
            className={cn(
              "hover-lift transition-all", 
              viewMode === "month" ? "bg-primary/10 border-primary" : ""
            )}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Month View
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setViewMode("day")}
            className={cn(
              "hover-lift transition-all", 
              viewMode === "day" ? "bg-primary/10 border-primary" : ""
            )}
          >
            <Clock className="h-4 w-4 mr-2" />
            Day View
          </Button>
          <Button 
            onClick={() => handleCreateEvent()}
            className="animated-gradient-bg hover-lift text-background"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Section */}
        <Card className={cn(
          "col-span-1 frost-glass shadow-md", 
          viewMode === "month" ? "lg:col-span-3" : "lg:col-span-2"
        )}>
          <CardHeader className="pb-2 border-b bg-background/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Button variant="ghost" size="sm" onClick={previousMonth} className="hover-lift">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="px-2 font-medium text-lg text-foreground">
                  <span style={{ 
                    backgroundImage: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {format(currentMonth, "MMMM yyyy")}
                  </span>
                </h3>
                <Button variant="ghost" size="sm" onClick={nextMonth} className="hover-lift">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => {
                const today = new Date();
                setCurrentMonth(today);
                setSelectedDate(today);
              }} className="hover-lift">
                Today
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {viewMode === "month" ? (
              <div className="grid grid-cols-7 gap-2">
                {/* Day Labels */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="h-8 flex items-center justify-center text-sm font-medium"
                  >
                    {day}
                  </div>
                ))}
                
                {/* Placeholder for days from previous month */}
                {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, index) => (
                  <div key={`empty-start-${index}`} className="h-24 p-1 border bg-muted/20"></div>
                ))}
                
                {/* Days in current month */}
                {daysInMonth.map((day) => {
                  // Get events for this day
                  const dayEvents = uiEvents.filter(event => isSameDay(event.startTime, day));
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  
                  return (
                    <div
                      key={day.toString()}
                      className={cn(
                        "h-24 min-h-[6rem] p-1 border overflow-hidden",
                        isToday ? "bg-primary/5 border-primary/20" : "",
                        isSelected ? "ring-2 ring-primary" : "",
                        "hover:bg-muted/30 cursor-pointer"
                      )}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="flex justify-between items-start">
                        <span className={cn(
                          "inline-flex items-center justify-center w-6 h-6 text-xs",
                          isToday ? "font-bold text-primary" : ""
                        )}>
                          {format(day, "d")}
                        </span>
                        {dayEvents.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {dayEvents.length}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "text-xs rounded-sm px-1 py-0.5 truncate",
                              getCategoryColorClass(event.category || "general")
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(event);
                            }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground pl-1">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Placeholder for days from next month */}
                {Array.from({ length: 6 - endOfMonth(currentMonth).getDay() }).map((_, index) => (
                  <div key={`empty-end-${index}`} className="h-24 p-1 border bg-muted/20"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center pb-2 border-b">
                  <h3 className="text-lg font-medium">
                    {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {eventsForSelectedDate.length} events scheduled
                  </p>
                </div>
                
                <div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="mx-auto"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Daily Events Section - Only show in Day View */}
        {viewMode === "day" && (
          <Card className="col-span-1 frost-glass shadow-md">
            <CardHeader className="border-b bg-background/70">
              <CardTitle className="text-xl">
                <span style={{ 
                  backgroundImage: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {selectedDate 
                    ? format(selectedDate, "MMMM d, yyyy") 
                    : "Select a date"}
                </span>
              </CardTitle>
              <CardDescription>
                {eventsForSelectedDate.length} scheduled events
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {eventsForSelectedDate.length === 0 ? (
                <div className="text-center py-6">
                  <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Events Scheduled</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    There are no events scheduled for this day.
                  </p>
                  <Button 
                    onClick={() => handleCreateEvent(selectedDate)}
                    className="animated-gradient-bg hover-lift text-background"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group events by time, sorted chronologically */}
                  {eventsForSelectedDate
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map((event) => (
                      <div key={event.id} className="relative border rounded-md p-3 hover:bg-muted/20 gradient-border card-hover frost-glass">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-base">
                              <span style={{ 
                                backgroundImage: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                color: 'transparent',
                                WebkitTextFillColor: 'transparent'
                              }}>
                                {event.title}
                              </span>
                            </h4>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <Clock className="h-3.5 w-3.5 mr-1 shrink-0" />
                              <span>
                                {event.allDay 
                                  ? "All day" 
                                  : `${format(new Date(event.startTime), "h:mm a")} - ${format(new Date(event.endTime), "h:mm a")}`}
                              </span>
                            </div>
                            
                            {event.location && (
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <MapPin className="h-3.5 w-3.5 mr-1 shrink-0" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                          
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48" align="end">
                              <div className="grid gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="justify-start"
                                  onClick={() => handleEditEvent(event)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Event
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="justify-start text-destructive"
                                  onClick={() => handleDeleteEvent(event.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Event
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        {event.description && (
                          <div className="mt-2 text-sm">
                            {event.description}
                          </div>
                        )}
                        
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "absolute top-3 right-12",
                            getCategoryColorClass(event.category || "general")
                          )}
                        >
                          {EVENT_CATEGORIES.find(c => c.value === event.category)?.label || "General"}
                        </Badge>
                      </div>
                    ))}
                    
                    <div className="pt-4 text-center">
                      <Button 
                        onClick={() => handleCreateEvent(selectedDate)}
                        className="animated-gradient-bg hover-lift text-background"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Event
                      </Button>
                    </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Event Creation/Editing Dialog */}
      <Dialog open={createEventOpen} onOpenChange={setCreateEventOpen}>
        <DialogContent className="sm:max-w-[500px] frost-glass">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl">
              <span style={{ 
                backgroundImage: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                WebkitTextFillColor: 'transparent'
              }}>
                {editEventId ? "Edit Event" : "Create New Event"}
              </span>
            </DialogTitle>
            <DialogDescription>
              {editEventId 
                ? "Edit the details of your event below" 
                : "Add the details of your new event below"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Team Meeting" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Event details..." 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Time</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP p")
                              ) : (
                                <span>Start Time</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) {
                                const newDate = new Date(date);
                                newDate.setHours(field.value.getHours());
                                newDate.setMinutes(field.value.getMinutes());
                                field.onChange(newDate);
                              }
                            }}
                            initialFocus
                          />
                          <div className="border-t p-3">
                            <Input
                              type="time"
                              value={format(field.value, "HH:mm")}
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(":");
                                const newDate = new Date(field.value);
                                newDate.setHours(parseInt(hours));
                                newDate.setMinutes(parseInt(minutes));
                                field.onChange(newDate);
                              }}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Time</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP p")
                              ) : (
                                <span>End Time</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) {
                                const newDate = new Date(date);
                                newDate.setHours(field.value.getHours());
                                newDate.setMinutes(field.value.getMinutes());
                                field.onChange(newDate);
                              }
                            }}
                            initialFocus
                          />
                          <div className="border-t p-3">
                            <Input
                              type="time"
                              value={format(field.value, "HH:mm")}
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(":");
                                const newDate = new Date(field.value);
                                newDate.setHours(parseInt(hours));
                                newDate.setMinutes(parseInt(minutes));
                                field.onChange(newDate);
                              }}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Conference Room A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {EVENT_CATEGORIES.map((category) => (
                        <div
                          key={category.value}
                          className={cn(
                            "flex items-center px-3 py-1.5 rounded-full border cursor-pointer",
                            field.value === category.value
                              ? "ring-2 ring-primary bg-primary/5 frost-glass"
                              : "hover:bg-muted/30 hover-lift"
                          )}
                          onClick={() => field.onChange(category.value)}
                        >
                          <Badge className={category.color}>
                            {category.label}
                          </Badge>
                          {field.value === category.value && (
                            <Check className="h-4 w-4 ml-2 text-primary" />
                          )}
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="allDay"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-x-2 space-y-0 rounded-md border p-3 frost-glass">
                    <div className="space-y-0.5">
                      <FormLabel className="gradient-heading text-base">All Day Event</FormLabel>
                      <FormDescription>
                        Event will be scheduled for the entire day
                      </FormDescription>
                    </div>
                    <FormControl>
                      <div 
                        className={cn(
                          "h-6 w-11 rounded-full relative cursor-pointer transition-colors",
                          field.value ? "animated-gradient-bg" : "bg-muted"
                        )}
                        onClick={() => field.onChange(!field.value)}
                      >
                        <div 
                          className={cn(
                            "h-5 w-5 rounded-full bg-white absolute top-[2px] transition-transform shadow-md",
                            field.value ? "translate-x-[22px]" : "translate-x-[2px]"
                          )} 
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => setCreateEventOpen(false)}
                  className="hover-lift"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createEventMutation.isPending || updateEventMutation.isPending}
                  className="animated-gradient-bg hover-lift text-background"
                >
                  {(createEventMutation.isPending || updateEventMutation.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editEventId ? "Saving..." : "Creating..."}
                    </>
                  ) : (
                    editEventId ? "Save Changes" : "Create Event"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}