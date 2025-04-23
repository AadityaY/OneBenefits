import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowLeft, Clock, CalendarClock, BookOpen } from 'lucide-react';
import PDFViewer from '@/components/PDFViewer';

type DocumentItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string;
  icon: string;
  avatars: string[];
};

export default function DocumentViewerPage() {
  const [_, setLocation] = useLocation();
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);

  // Sample document data
  const documents: DocumentItem[] = [
    {
      id: '1',
      title: 'Employee Benefits Guide',
      description: 'Complete overview of employee benefits package including health, dental, vision, and retirement plans',
      type: 'PDF',
      date: 'Updated Mar 2023',
      icon: 'file-text',
      avatars: [
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Bailey',
      ]
    },
    {
      id: '2',
      title: 'Health Insurance Options',
      description: 'Detailed information about available health insurance plans, coverage details, and enrollment periods',
      type: 'PDF',
      date: 'Updated Jan 2023',
      icon: 'file-text',
      avatars: [
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
      ]
    },
    {
      id: '3',
      title: '401(k) Retirement Plan',
      description: 'Information about our 401(k) retirement plan, company matching, and investment options',
      type: 'PDF',
      date: 'Updated Feb 2023',
      icon: 'file-text',
      avatars: [
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Bailey',
      ]
    },
    {
      id: '4',
      title: 'Wellness Programs',
      description: 'Learn about wellness initiatives, fitness reimbursements, mental health resources, and health incentive programs',
      type: 'PDF',
      date: 'Updated Apr 2023',
      icon: 'file-text',
      avatars: [
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
      ]
    }
  ];

  const handleOpenDocument = (document: DocumentItem) => {
    setSelectedDocument(document);
  };
  
  const handleCloseViewer = () => {
    setSelectedDocument(null);
  };

  // If a document is selected, show the PDF viewer
  if (selectedDocument) {
    return (
      <div className="w-full h-screen">
        <PDFViewer
          fileUrl="/samples/benefits-guide.pdf"
          title={selectedDocument.title}
          description={selectedDocument.description}
          onClose={handleCloseViewer}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="ghost" onClick={() => setLocation('/')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold gradient-text mb-2">Benefits Documents</h1>
          <p className="text-muted-foreground">
            Review and download important information about your employee benefits
          </p>
        </div>

        <div className="flex -space-x-4">
          {['Felix', 'Aneka', 'Bailey', 'Mia', 'Zoe'].map((seed, i) => (
            <Avatar key={i} className="w-10 h-10 border-2 border-background">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} alt="Avatar" />
              <AvatarFallback>{seed[0]}</AvatarFallback>
            </Avatar>
          ))}
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-xs font-medium border-2 border-background">
            +8
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <Card key={doc.id} className="card-hover frost-glass overflow-hidden border-gradient">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="gradient-text">{doc.title}</CardTitle>
                <Badge variant="secondary">{doc.type}</Badge>
              </div>
              <CardDescription className="line-clamp-2">{doc.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center text-xs text-muted-foreground">
                  <CalendarClock className="h-3 w-3 mr-1.5" />
                  <span>{doc.date}</span>
                </div>
                
                <div className="flex -space-x-2">
                  {doc.avatars.map((avatar, i) => (
                    <div key={i} className="w-7 h-7 rounded-full border-2 border-background overflow-hidden">
                      <img src={avatar} alt="User avatar" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-0">
              <Button 
                onClick={() => handleOpenDocument(doc)} 
                className="w-full group"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                <span>View Document</span>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}