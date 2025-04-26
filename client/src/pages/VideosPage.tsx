import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/ui/page-header";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Play, Clock, Info, Calendar, Heart, Shield, PiggyBank, Activity } from "lucide-react";
import { useCompanyTheme } from "@/hooks/use-company-theme";

export default function VideosPage() {
  // Define types for videos
  type VideoCategory = "featured" | "overview" | "medical" | "retirement" | "wellness" | "enrollment";
  
  type Video = {
    id: number;
    title: string;
    description: string;
    duration: string;
    thumbnail: string;
    views: number;
    date: string;
  };
  
  type VideoMap = {
    [key in VideoCategory]: Video[];
  };

  const { user } = useAuth();
  const { companySettings } = useCompanyTheme();
  const [activeTab, setActiveTab] = useState<VideoCategory>("featured");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  // Categories for videos
  const categories: Array<{id: VideoCategory, name: string, icon: React.ReactNode}> = [
    { id: "featured", name: "Featured", icon: <Heart className="h-4 w-4" /> },
    { id: "overview", name: "Benefits Overview", icon: <Info className="h-4 w-4" /> },
    { id: "medical", name: "Medical", icon: <Shield className="h-4 w-4" /> },
    { id: "retirement", name: "Retirement", icon: <PiggyBank className="h-4 w-4" /> },
    { id: "wellness", name: "Wellness", icon: <Activity className="h-4 w-4" /> },
    { id: "enrollment", name: "Enrollment", icon: <Calendar className="h-4 w-4" /> },
  ];

  // Dummy videos data
  const videosData: VideoMap = {
    featured: [
      {
        id: 1,
        title: "2025 Benefits Overview",
        description: "An overview of all the benefits available for 2025",
        duration: "12:45",
        thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8YmVuZWZpdHN8ZW58MHx8MHx8fDA%3D",
        views: 1205,
        date: "Jan 15, 2025"
      },
      {
        id: 2,
        title: "Understanding Your HSA & FSA Options",
        description: "Learn the differences between HSA and FSA accounts and how to maximize your tax savings.",
        duration: "8:30",
        thumbnail: "https://images.unsplash.com/photo-1563986768711-b3bde3dc821e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fG1vbmV5fGVufDB8fDB8fHww",
        views: 892,
        date: "Jan 22, 2025"
      },
      {
        id: 3,
        title: "Maximizing Your 401(k) Contributions",
        description: "Strategies to maximize your retirement savings through your 401(k) plan.",
        duration: "10:15",
        thumbnail: "https://images.unsplash.com/photo-1579621970590-9d624316904b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8cmV0aXJlbWVudHxlbnwwfHwwfHx8MA%3D%3D",
        views: 753,
        date: "Feb 3, 2025"
      }
    ],
    overview: [
      {
        id: 4,
        title: "2025 Benefits Summary",
        description: "A comprehensive overview of all benefits for the 2025 plan year.",
        duration: "15:30",
        thumbnail: "https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8YmVuZWZpdHN8ZW58MHx8MHx8fDA%3D",
        views: 1024,
        date: "Jan 5, 2025"
      },
      {
        id: 5,
        title: "New Benefits for 2025",
        description: "Discover what's new in your benefits package this year.",
        duration: "7:20",
        thumbnail: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGJlbmVmaXRzfGVufDB8fDB8fHww",
        views: 612,
        date: "Jan 12, 2025"
      }
    ],
    medical: [
      {
        id: 6,
        title: "Comparing Our Medical Plans",
        description: "A detailed comparison of all medical plans offered by the company.",
        duration: "14:10",
        thumbnail: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZG9jdG9yfGVufDB8fDB8fHww",
        views: 873,
        date: "Jan 18, 2025"
      },
      {
        id: 7,
        title: "Using Your Telehealth Benefits",
        description: "How to access and use your telehealth services.",
        duration: "6:45",
        thumbnail: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dGVsZWhlYWx0aHxlbnwwfHwwfHx8MA%3D%3D",
        views: 418,
        date: "Jan 25, 2025"
      },
      {
        id: 8,
        title: "Dental & Vision Coverage",
        description: "Everything you need to know about your dental and vision benefits.",
        duration: "9:30",
        thumbnail: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8ZGVudGlzdHxlbnwwfHwwfHx8MA%3D%3D",
        views: 521,
        date: "Feb 1, 2025"
      }
    ],
    retirement: [
      {
        id: 9,
        title: "401(k) Plan Overview",
        description: "Understanding your 401(k) plan options and benefits.",
        duration: "11:20",
        thumbnail: "https://images.unsplash.com/photo-1532726635173-11baa02e9151?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cmV0aXJlbWVudHxlbnwwfHwwfHx8MA%3D%3D",
        views: 725,
        date: "Jan 20, 2025"
      },
      {
        id: 10,
        title: "Roth vs. Traditional 401(k)",
        description: "Comparing Roth and Traditional 401(k) options to choose what's right for you.",
        duration: "8:50",
        thumbnail: "https://images.unsplash.com/photo-1607944024060-0450380ddd33?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fHJldGlyZW1lbnR8ZW58MHx8MHx8fDA%3D",
        views: 643,
        date: "Feb 5, 2025"
      },
      {
        id: 11,
        title: "Retirement Planning Strategies",
        description: "Long-term strategies to ensure a comfortable retirement.",
        duration: "13:15",
        thumbnail: "https://images.unsplash.com/photo-1586473219010-2ffc57b0d282?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fHJldGlyZW1lbnR8ZW58MHx8MHx8fDA%3D",
        views: 512,
        date: "Feb 15, 2025"
      }
    ],
    wellness: [
      {
        id: 12,
        title: "Mental Health Resources",
        description: "Exploring the mental health benefits available to you.",
        duration: "10:40",
        thumbnail: "https://images.unsplash.com/photo-1504199367641-aba8151af406?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjd8fHdlbGxuZXNzfGVufDB8fDB8fHww",
        views: 834,
        date: "Jan 22, 2025"
      },
      {
        id: 13,
        title: "Wellness Program Benefits",
        description: "How to take advantage of the company's wellness initiatives.",
        duration: "7:55",
        thumbnail: "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxzZWFyY2h8MXx8d2VsbG5lc3N8ZW58MHx8MHx8fDA%3D",
        views: 729,
        date: "Feb 8, 2025"
      }
    ],
    enrollment: [
      {
        id: 14,
        title: "2025 Open Enrollment Guide",
        description: "Step-by-step guide to completing your benefits enrollment for 2025.",
        duration: "12:30",
        thumbnail: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZW5yb2xsbWVudHxlbnwwfHwwfHx8MA%3D%3D",
        views: 1452,
        date: "Jan 3, 2025"
      },
      {
        id: 15,
        title: "Making Changes Outside of Open Enrollment",
        description: "Learn about qualifying life events that allow you to change your benefits mid-year.",
        duration: "9:15",
        thumbnail: "https://images.unsplash.com/photo-1496115965628-1a36d9d3511a?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8Y2hhbmdlfGVufDB8fDB8fHww",
        views: 387,
        date: "Jan 28, 2025"
      }
    ]
  };

  // Video player component (simulated)
  const VideoPlayer = ({ video }: { video: Video }) => {
    return (
      <Card className="w-full border-gradient-soft shadow-md">
        <CardHeader className="pb-0">
          <CardTitle className="text-xl">{video.title}</CardTitle>
          <CardDescription>{video.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="relative aspect-video bg-black/90 rounded-md overflow-hidden flex items-center justify-center">
            <img 
              src={video.thumbnail} 
              alt={video.title} 
              className="w-full h-full object-cover opacity-75"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-primary/90 w-16 h-16 rounded-full flex items-center justify-center">
                <Play className="h-8 w-8 text-white fill-current" />
              </div>
            </div>
            <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-sm">
              {video.duration}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{video.duration}</span>
          </div>
          <div>{video.views} views</div>
          <div>{video.date}</div>
        </CardFooter>
      </Card>
    );
  };

  // Video grid component
  const VideoGrid = ({ videos }: { videos: Video[] }) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div 
            key={video.id} 
            className="cursor-pointer transition-transform hover:-translate-y-1 duration-200"
            onClick={() => setSelectedVideo(video)}
          >
            <Card className="overflow-hidden h-full border-gradient hover:shadow-md">
              <div className="relative aspect-video">
                <img 
                  src={video.thumbnail} 
                  alt={video.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  {video.duration}
                </div>
                <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-primary/90 w-12 h-12 rounded-full flex items-center justify-center">
                    <Play className="h-6 w-6 text-white fill-current" />
                  </div>
                </div>
              </div>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg line-clamp-1">{video.title}</CardTitle>
                <CardDescription className="line-clamp-2 text-sm">{video.description}</CardDescription>
              </CardHeader>
              <CardFooter className="p-4 pt-0 flex justify-between text-xs text-muted-foreground">
                <div>{video.views} views</div>
                <div>{video.date}</div>
              </CardFooter>
            </Card>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 pt-1">
      <div className="space-y-8">
        <PageHeader 
          title="Benefits Videos" 
          description="Watch informational videos about your employee benefits."
        />

        {selectedVideo ? (
          <div className="space-y-6">
            <Button 
              variant="outline" 
              onClick={() => setSelectedVideo(null)}
              className="hover-lift"
            >
              Back to videos
            </Button>
            <VideoPlayer video={selectedVideo} />
          </div>
        ) : (
          <>
            <Tabs 
              defaultValue="featured" 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as VideoCategory)}
              className="space-y-6"
            >
              <div className="bg-white p-1 rounded-md border w-fit mx-auto">
                <TabsList className="grid grid-flow-col auto-cols-max gap-1">
                  {categories.map((category) => (
                    <TabsTrigger 
                      key={category.id} 
                      value={category.id}
                      className="flex items-center gap-1.5"
                    >
                      {category.icon}
                      <span>{category.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {Object.keys(videosData).map((categoryId) => (
                <TabsContent 
                  key={categoryId} 
                  value={categoryId} 
                  className="space-y-6 mt-6"
                >
                  <VideoGrid videos={videosData[categoryId as VideoCategory]} />
                </TabsContent>
              ))}
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}