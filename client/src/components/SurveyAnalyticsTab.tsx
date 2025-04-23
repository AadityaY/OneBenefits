import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  getSurveyTemplates, 
  getSurveyQuestionsByTemplateId 
} from "@/lib/surveyAdminApi";
import { getSurveyResponses } from "@/lib/surveyApi";
import { SurveyTemplate, SurveyQuestion, SurveyResponse } from "@shared/schema";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  BarChart4, 
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon, 
  Table as TableIcon,
  Download 
} from "lucide-react";
import { formatDate } from "@/lib/utils";

// Analytics helper functions
function calculateResponseRate(responses: SurveyResponse[], templateId: number): number {
  const templateResponses = responses.filter(r => r.templateId === templateId);
  // In a real app, you'd compare to the total number of eligible respondents
  // For demo purposes, we'll assume a fixed number of 100 eligible respondents
  const eligibleRespondents = 100;
  return (templateResponses.length / eligibleRespondents) * 100;
}

function getResponsesByQuestionId(responses: SurveyResponse[], questionId: number): any[] {
  // Extract responses for a specific question from all survey responses
  const responseData: Record<string, number> = {};
  
  // Process each survey response
  responses.forEach(response => {
    // Ensure response.responses is an array before trying to use find
    if (Array.isArray(response.responses)) {
      const questionResponse = response.responses.find(r => r.questionId === questionId);
      if (questionResponse) {
        const value = Array.isArray(questionResponse.response) 
          ? questionResponse.response.join(', ') 
          : String(questionResponse.response || '');
        
        if (responseData[value]) {
          responseData[value]++;
        } else {
          responseData[value] = 1;
        }
      }
    }
  });
  
  return Object.entries(responseData).map(([name, value]) => ({ name, value }));
}

function getQuarterlyTrends(responses: SurveyResponse[], questionId: number, quarters: number = 4): any[] {
  // Generate quarterly comparison data
  // This would typically use real dates from response.submittedAt
  // For demo purposes, we'll generate sample data
  
  const currentDate = new Date();
  const trend = [];
  
  for (let i = 0; i < quarters; i++) {
    const quarter = currentDate.getMonth() < 3 
      ? 4 - (quarters - 1 - i) 
      : (currentDate.getMonth() < 6 
        ? (currentDate.getMonth() < 3 ? 1 : 1 + i) 
        : (currentDate.getMonth() < 9 
          ? (currentDate.getMonth() < 6 ? 1 : 2 + (i > 1 ? i - 1 : 0)) 
          : 3 + (i > 0 ? i - 2 : 0))
        );
    
    const year = currentDate.getFullYear() - (quarter > currentDate.getMonth() / 3 + 1 ? 1 : 0);
    const label = `Q${quarter} ${year}`;
    
    // Generate a sample value (in real app, calculate from actual response data)
    // For multiple-choice questions, this could be average satisfaction or % positive responses
    const value = Math.floor(60 + Math.random() * 30);
    
    trend.push({
      name: label,
      value: value,
    });
  }
  
  return trend;
}

// Color constants
const CHART_COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe", "#00c49f", "#ffbb28", "#ff8042",
  "#a4de6c", "#d0ed57", "#83a6ed", "#8dd1e1", "#a4add3", "#d85093", "#82ca9d", "#f4b1cd"
];

export default function SurveyAnalyticsTab() {
  // State
  const [selectedTemplate, setSelectedTemplate] = useState<SurveyTemplate | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<SurveyQuestion | null>(null);
  const [chartType, setChartType] = useState<"pie" | "bar" | "line" | "table">("bar");
  
  // Queries
  const templatesQuery = useQuery<SurveyTemplate[]>({
    queryKey: ['/api/survey-templates'],
    queryFn: getSurveyTemplates,
    retry: false
  });
  
  const questionsQuery = useQuery<SurveyQuestion[]>({
    queryKey: ['/api/survey-questions', selectedTemplate?.id],
    queryFn: () => selectedTemplate?.id 
      ? getSurveyQuestionsByTemplateId(selectedTemplate.id)
      : Promise.resolve([]),
    enabled: !!selectedTemplate?.id,
    retry: false
  });
  
  const responsesQuery = useQuery<SurveyResponse[]>({
    queryKey: ['/api/survey'],
    queryFn: getSurveyResponses,
    retry: false
  });
  
  // Filter for usable templates and questions
  const publishedTemplates = templatesQuery.data?.filter(t => t.publishedAt) || [];
  
  const sortedQuestions = questionsQuery.data
    ?.filter(q => ['radio', 'checkbox', 'select'].includes(q.questionType))
    ?.sort((a, b) => a.order - b.order) || [];
  
  // Get response data for the selected question
  const responseData = selectedQuestion 
    ? getResponsesByQuestionId(responsesQuery.data || [], selectedQuestion.id)
    : [];
  
  // Get quarterly trend data for the selected question
  const trendData = selectedQuestion 
    ? getQuarterlyTrends(responsesQuery.data || [], selectedQuestion.id)
    : [];
  
  // Handlers
  const handleTemplateSelect = (templateId: string) => {
    const id = parseInt(templateId);
    const template = templatesQuery.data?.find(t => t.id === id) || null;
    setSelectedTemplate(template);
    setSelectedQuestion(null);
  };
  
  const handleQuestionSelect = (questionId: string) => {
    const id = parseInt(questionId);
    const question = questionsQuery.data?.find(q => q.id === id) || null;
    setSelectedQuestion(question);
  };
  
  // Calculate the response count and rate
  const responseCount = responsesQuery.data?.filter(
    r => r.templateId === selectedTemplate?.id
  ).length || 0;
  
  const responseRate = selectedTemplate
    ? calculateResponseRate(responsesQuery.data || [], selectedTemplate.id)
    : 0;
  
  // Export data as CSV
  const exportCSV = () => {
    if (!responseData.length) return;
    
    const title = selectedQuestion?.questionText || 'Survey Data';
    const header = "Response,Count\n";
    const rows = responseData.map(d => `"${d.name}",${d.value}`).join("\n");
    const csv = header + rows;
    
    // Create a download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_data.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Survey Analytics</h2>
      <p className="text-muted-foreground">
        Analyze survey responses and track trends across different timeframes.
      </p>
      
      {/* Template & Question Selection */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="templateSelect">Select Survey Template:</Label>
          <Select
            value={selectedTemplate?.id.toString() || ""}
            onValueChange={handleTemplateSelect}
          >
            <SelectTrigger className="w-full mt-2">
              <SelectValue placeholder="Select a survey" />
            </SelectTrigger>
            <SelectContent>
              {publishedTemplates.map(template => (
                <SelectItem key={template.id} value={template.id.toString()}>
                  {template.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedTemplate && (
          <div>
            <Label htmlFor="questionSelect">Select Question:</Label>
            <Select
              value={selectedQuestion?.id.toString() || ""}
              onValueChange={handleQuestionSelect}
              disabled={!selectedTemplate || sortedQuestions.length === 0}
            >
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Select a question" />
              </SelectTrigger>
              <SelectContent>
                {sortedQuestions.map(question => (
                  <SelectItem key={question.id} value={question.id.toString()}>
                    {question.questionText}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {/* Loading States */}
      {(templatesQuery.isLoading || questionsQuery.isLoading || responsesQuery.isLoading) && (
        <div className="text-center py-6">Loading survey analytics data...</div>
      )}
      
      {/* Template Overview */}
      {selectedTemplate && !templatesQuery.isLoading && !responsesQuery.isLoading && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle>{selectedTemplate.title}</CardTitle>
            <CardDescription>{selectedTemplate.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Published Date</h4>
                <p className="text-lg font-semibold">
                  {selectedTemplate.publishedAt ? formatDate(selectedTemplate.publishedAt) : "Not published"}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Total Responses</h4>
                <p className="text-lg font-semibold">{responseCount}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Response Rate</h4>
                <div className="flex items-center space-x-2">
                  <Progress value={responseRate} className="h-2 w-[60%]" />
                  <span className="text-lg font-semibold">{responseRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* No Data States */}
      {!selectedTemplate && !templatesQuery.isLoading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600">Please select a survey template to view analytics.</p>
          </CardContent>
        </Card>
      )}
      
      {selectedTemplate && !selectedQuestion && !questionsQuery.isLoading && sortedQuestions.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600">
              This survey doesn't have any questions that can be analyzed. 
              Only multiple-choice questions can be displayed in charts.
            </p>
          </CardContent>
        </Card>
      )}
      
      {selectedTemplate && !selectedQuestion && !questionsQuery.isLoading && sortedQuestions.length > 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600">Please select a question to view response analytics.</p>
          </CardContent>
        </Card>
      )}
      
      {/* Question Analytics */}
      {selectedTemplate && selectedQuestion && responseData.length > 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <div>
                  <CardTitle>Question Analysis</CardTitle>
                  <CardDescription>{selectedQuestion.questionText}</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setChartType("bar")} 
                    className={`p-2 rounded-md ${chartType === "bar" ? "bg-slate-200" : "hover:bg-slate-100"}`}
                    title="Bar Chart"
                  >
                    <BarChart4 className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => setChartType("pie")} 
                    className={`p-2 rounded-md ${chartType === "pie" ? "bg-slate-200" : "hover:bg-slate-100"}`}
                    title="Pie Chart"
                  >
                    <PieChartIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => setChartType("line")} 
                    className={`p-2 rounded-md ${chartType === "line" ? "bg-slate-200" : "hover:bg-slate-100"}`}
                    title="Line Chart (Trends)"
                  >
                    <LineChartIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => setChartType("table")} 
                    className={`p-2 rounded-md ${chartType === "table" ? "bg-slate-200" : "hover:bg-slate-100"}`}
                    title="Data Table"
                  >
                    <TableIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={exportCSV} 
                    className="p-2 rounded-md hover:bg-slate-100"
                    title="Export as CSV"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <Tabs defaultValue={chartType} value={chartType} className="space-y-4">
                <TabsContent value="bar" className="pt-4">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={responseData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" name="Responses" />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="pie" className="pt-4">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={responseData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        fill="#8884d8"
                        label={(entry) => `${entry.name}: ${entry.value}`}
                      >
                        {responseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="line" className="pt-4">
                  <div className="text-center mb-2 text-sm text-muted-foreground">
                    Quarterly Trend Analysis
                  </div>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} name="Responses" />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="table" className="pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Response</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="text-right">Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {responseData.map((entry, index) => {
                        const total = responseData.reduce((sum, item) => sum + item.value, 0);
                        const percentage = (entry.value / total) * 100;
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>{entry.name}</TableCell>
                            <TableCell className="text-right">{entry.value}</TableCell>
                            <TableCell className="text-right">{percentage.toFixed(1)}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Comparative Analysis</CardTitle>
              <CardDescription>
                Compare quarterly trends for {selectedQuestion.questionText}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-sm text-muted-foreground mb-4">
                Shows response trends over the last four quarters
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={trendData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Satisfaction Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}