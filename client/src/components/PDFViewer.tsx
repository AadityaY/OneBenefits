import { useState } from 'react';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { thumbnailPlugin } from '@react-pdf-viewer/thumbnail';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/thumbnail/lib/styles/index.css';

// UI components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, ThumbsUp, Share2, BookOpen } from 'lucide-react';

interface PDFViewerProps {
  fileUrl: string;
  title: string;
  description?: string;
  onClose?: () => void;
}

interface DocumentDetails {
  title: string;
  pageCount: number;
  lastUpdated: string;
  category: string;
  sharedBy: {
    name: string;
    avatarUrl: string;
  };
}

export default function PDFViewer({ fileUrl, title, description, onClose }: PDFViewerProps) {
  const [activeTab, setActiveTab] = useState('document');
  
  // Create plugins
  const thumbnailPluginInstance = thumbnailPlugin();
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    thumbnailPlugin: thumbnailPluginInstance,
  });
  
  // Mock document details
  const documentDetails: DocumentDetails = {
    title: title,
    pageCount: 14,
    lastUpdated: 'March 15, 2023',
    category: 'Benefits',
    sharedBy: {
      name: 'HR Team',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HR',
    },
  };
  
  // Simulated avatar data for recent viewers
  const recentViewers = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Bailey',
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <header className="flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur-sm">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onClose} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold gradient-text">{documentDetails.title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex -space-x-3 mr-4">
            {recentViewers.map((url, i) => (
              <Avatar key={i} className="h-8 w-8 border-2 border-background">
                <AvatarImage src={url} alt="Recent viewer" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            ))}
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-xs font-medium border-2 border-background">
              +7
            </div>
          </div>
          
          <Button variant="ghost" size="sm">
            <ThumbsUp className="h-4 w-4 mr-2" />
            Like
          </Button>
          
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          
          <Button variant="default" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 overflow-hidden">
          <div className="flex flex-col w-72 border-r bg-background/50 p-4 space-y-4">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="document">Document</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="document" className="flex-1 overflow-y-auto space-y-6 mt-0">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Document Structure</h3>
                <div className="space-y-1">
                  {['Overview', 'Medical Benefits', 'Dental Coverage', 'Vision Benefits', 'Life Insurance', 'Retirement Plans'].map((section, i) => (
                    <div key={i} className="p-2 text-sm hover:bg-muted rounded-md cursor-pointer flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-primary/70" />
                      {section}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Related Documents</h3>
                <div className="space-y-2">
                  {['401(k) Plan Details', 'Wellness Program', 'Remote Work Policy'].map((doc, i) => (
                    <div key={i} className="p-2 border rounded-md text-sm hover:bg-muted cursor-pointer">
                      {doc}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="flex-1 overflow-y-auto space-y-4 mt-0">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={documentDetails.sharedBy.avatarUrl} />
                    <AvatarFallback>HR</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Shared by</p>
                    <p className="text-sm text-muted-foreground">{documentDetails.sharedBy.name}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Category</span>
                    <Badge variant="outline">{documentDetails.category}</Badge>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pages</span>
                    <span>{documentDetails.pageCount}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last updated</span>
                    <span>{documentDetails.lastUpdated}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Format</span>
                    <span>PDF</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 space-y-2">
                <h3 className="text-sm font-medium">Who viewed this</h3>
                <div className="space-y-2">
                  {['Alex Johnson', 'Maria Garcia', 'Sam Taylor', 'Robin Chen'].map((name, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} />
                        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {i === 0 ? 'Just now' : 
                           i === 1 ? 'Yesterday' : 
                           i === 2 ? '2 days ago' : 
                           'Last week'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </div>
          
          <div className="flex-1 bg-muted/20">
            <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js`}>
              <div className="h-full w-full">
                <Viewer
                  fileUrl={fileUrl}
                  plugins={[defaultLayoutPluginInstance]}
                  defaultScale={SpecialZoomLevel.PageFit}
                />
              </div>
            </Worker>
          </div>
        </Tabs>
      </div>
    </div>
  );
}