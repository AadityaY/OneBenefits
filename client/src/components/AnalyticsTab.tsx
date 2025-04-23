import { useState, useMemo } from "react";

// Helper function to safely handle options that could be string or string[]
const getOptionsArray = (options: string | string[] | null): string[] => {
  if (!options) return [];
  if (typeof options === 'string') return options.split('\n');
  return options;
};
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart,
  LineChart,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Bar,
  Cell,
  Line,
  Pie
} from "recharts";
import { 
  Loader2,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon,
  Calendar as CalendarIcon,
  Download
} from "lucide-react";
import {
  SurveyTemplate,
  SurveyResponse,
  SurveyQuestion
} from "@shared/schema";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AnalyticsTab() {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("current");
  
  // Get company ID from user
  const companyId = user?.companyId;
  
  // Fetch all survey templates
  const { 
    data: templates, 
    isLoading: loadingTemplates 
  } = useQuery<SurveyTemplate[]>({ 
    queryKey: ["/api/survey-templates", companyId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!companyId,
  });
  
  // Fetch survey responses
  const { 
    data: surveyResponses, 
    isLoading: loadingResponses 
  } = useQuery<SurveyResponse[]>({ 
    queryKey: ["/api/survey", selectedTemplate],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!selectedTemplate && !!companyId,
  });
  
  // Fetch questions for the selected template
  const { 
    data: questions, 
    isLoading: loadingQuestions 
  } = useQuery<SurveyQuestion[]>({ 
    queryKey: ["/api/survey-questions", selectedTemplate],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!selectedTemplate,
  });
  
  // Compute survey response statistics
  const statistics = useMemo(() => {
    if (!surveyResponses || !questions) return null;
    
    // Calculate response rate
    const totalUsers = 50; // This would come from a real API call in production
    const responseRate = (surveyResponses.length / totalUsers) * 100;
    
    // Process question-specific data
    const questionStats = questions.map(question => {
      // Get all responses for this question
      const questionResponses = surveyResponses
        .filter(response => {
          // Parse the nested response data and find this question
          const responseData = typeof response.responses === 'string' 
            ? JSON.parse(response.responses)
            : response.responses;
          
          return responseData.some((r: any) => r.questionId === question.id);
        })
        .map(response => {
          const responseData = typeof response.responses === 'string'
            ? JSON.parse(response.responses)
            : response.responses;
          
          const questionResponse = responseData.find((r: any) => r.questionId === question.id);
          return questionResponse ? questionResponse.response : null;
        })
        .filter(Boolean);
      
      // For multiple choice or select questions, count occurrences of each option
      if (question.questionType === 'multichoice' || 
          question.questionType === 'select' || 
          question.questionType === 'checkbox') {
        
        const options = question.options ? getOptionsArray(question.options)('\n') : [];
        const optionCounts: Record<string, number> = {};
        
        // Initialize counts
        options.forEach(option => {
          optionCounts[option] = 0;
        });
        
        // Count occurrences
        questionResponses.forEach(response => {
          if (Array.isArray(response)) {
            // Handle checkbox responses (multiple selections)
            response.forEach(selected => {
              if (optionCounts[selected] !== undefined) {
                optionCounts[selected]++;
              }
            });
          } else if (optionCounts[response] !== undefined) {
            optionCounts[response]++;
          }
        });
        
        // Convert to array for charts
        const chartData = Object.entries(optionCounts).map(([name, value]) => ({
          name,
          value
        }));
        
        return {
          question,
          responsesCount: questionResponses.length,
          chartData,
          type: 'categorical'
        };
      }
      
      // For scale questions
      if (question.questionType === 'scale') {
        const counts = [0, 0, 0, 0, 0]; // Counts for 1-5 ratings
        
        questionResponses.forEach(response => {
          const rating = parseInt(response);
          if (rating >= 1 && rating <= 5) {
            counts[rating - 1]++;
          }
        });
        
        const chartData = [1, 2, 3, 4, 5].map((rating, index) => ({
          name: `${rating}`,
          value: counts[index]
        }));
        
        // Calculate average rating
        const totalRating = questionResponses.reduce((sum, response) => {
          return sum + parseInt(response);
        }, 0);
        
        const averageRating = totalRating / questionResponses.length || 0;
        
        return {
          question,
          responsesCount: questionResponses.length,
          chartData,
          averageRating: averageRating.toFixed(1),
          type: 'scale'
        };
      }
      
      // For text/textarea questions, just return a sample of responses
      if (question.questionType === 'text' || question.questionType === 'textarea') {
        return {
          question,
          responsesCount: questionResponses.length,
          sampleResponses: questionResponses.slice(0, 10), // Limit to 10 for display
          type: 'text'
        };
      }
      
      // For other question types
      return {
        question,
        responsesCount: questionResponses.length,
        type: 'other'
      };
    });
    
    return {
      totalResponses: surveyResponses.length,
      responseRate,
      completionRate: 100, // This would be calculated based on completion of all required questions
      averageTimeToComplete: '5 minutes', // This would come from a real timestamp diff calculation
      questionStats
    };
  }, [surveyResponses, questions]);
  
  // Mock comparative data (in a real app, this would come from historical surveys)
  const getComparativeData = () => {
    // This function would query the API for previous survey data and compare
    const currentQuarterData = [
      { name: 'Work-Life Balance', current: 3.8, previous: 3.2 },
      { name: 'Compensation', current: 3.5, previous: 3.4 },
      { name: 'Career Growth', current: 4.0, previous: 3.7 },
      { name: 'Management', current: 3.9, previous: 3.5 },
      { name: 'Job Satisfaction', current: 4.2, previous: 3.9 },
    ];
    
    return currentQuarterData;
  };
  
  const comparativeData = getComparativeData();
  
  // Render loading state
  if (loadingTemplates) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading analytics data...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Survey Analytics</h2>
          <p className="text-muted-foreground">
            View detailed analytics and insights from your survey responses
          </p>
        </div>
        
        <div className="flex space-x-4">
          <Select
            value={selectedTemplate?.toString() || ""}
            onValueChange={(value) => setSelectedTemplate(parseInt(value))}
          >
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Select a survey template" />
            </SelectTrigger>
            <SelectContent>
              {templates && templates.map(template => (
                <SelectItem key={template.id} value={template.id.toString()}>
                  {template.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" disabled={!selectedTemplate || !surveyResponses}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>
      
      {!selectedTemplate && (
        <Card className="border bg-muted/30">
          <CardContent className="p-8 text-center">
            <BarChartIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Select a Survey to View Analytics</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Choose a survey template from the dropdown above to view detailed analytics and insights from the responses.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {templates && templates.slice(0, 3).map(template => (
                <Button 
                  key={template.id} 
                  variant="outline"
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  {template.title}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {selectedTemplate && (loadingResponses || loadingQuestions) && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading survey data...</span>
        </div>
      )}
      
      {selectedTemplate && statistics && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Responses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalResponses}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {templates?.find(t => t.id === selectedTemplate)?.title}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Response Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.responseRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Of total eligible participants
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.completionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Of started surveys
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg. Completion Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.averageTimeToComplete}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per survey response
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Tabs for different analytics views */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="questions">Question Analysis</TabsTrigger>
              <TabsTrigger value="comparison">Quarterly Comparison</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Response Overview</CardTitle>
                  <CardDescription>
                    Summary of responses and completion statistics
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={statistics.questionStats.map((stat, index) => ({
                          question: `Q${index + 1}`,
                          responses: stat.responsesCount
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="question" 
                          angle={-45} 
                          textAnchor="end" 
                          height={60} 
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="responses" fill="#8884d8" name="Responses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Rated Areas</CardTitle>
                    <CardDescription>
                      Highest scoring questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {statistics.questionStats
                        .filter(stat => stat.type === 'scale' && stat.averageRating)
                        .sort((a, b) => parseFloat(b.averageRating || '0') - parseFloat(a.averageRating || '0'))
                        .slice(0, 5)
                        .map((stat, index) => (
                          <li key={index} className="flex justify-between items-center p-2 rounded hover:bg-muted">
                            <span className="truncate max-w-[250px]">{stat.question.questionText}</span>
                            <span className="font-medium">{stat.averageRating}/5</span>
                          </li>
                        ))}
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Areas for Improvement</CardTitle>
                    <CardDescription>
                      Lowest scoring questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {statistics.questionStats
                        .filter(stat => stat.type === 'scale' && stat.averageRating)
                        .sort((a, b) => parseFloat(a.averageRating || '0') - parseFloat(b.averageRating || '0'))
                        .slice(0, 5)
                        .map((stat, index) => (
                          <li key={index} className="flex justify-between items-center p-2 rounded hover:bg-muted">
                            <span className="truncate max-w-[250px]">{stat.question.questionText}</span>
                            <span className="font-medium">{stat.averageRating}/5</span>
                          </li>
                        ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="questions" className="space-y-4">
              {statistics.questionStats.map((stat, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <span className="flex-none w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <span>{stat.question.questionText}</span>
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {stat.responsesCount} responses • {stat.type === 'scale' ? `${stat.averageRating}/5 average rating` : ''}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {stat.question.questionType}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(stat.type === 'categorical' || stat.type === 'scale') && stat.chartData && (
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          {stat.question.questionType === 'multichoice' || stat.question.questionType === 'select' ? (
                            <PieChart>
                              <Pie
                                data={stat.chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                fill="#8884d8"
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {stat.chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [`${value} responses`, '']} />
                              <Legend />
                            </PieChart>
                          ) : (
                            <BarChart
                              data={stat.chartData}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="value" fill="#8884d8" name="Responses" />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    )}
                    
                    {stat.type === 'text' && stat.sampleResponses && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm mb-2">Sample Responses</h4>
                        <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
                          {stat.sampleResponses.map((response, idx) => (
                            <li key={idx} className="p-2 bg-muted/50 rounded-md text-sm">
                              "{response}"
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="comparison" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Quarterly Comparison</h3>
                <Select
                  value={selectedQuarter}
                  onValueChange={setSelectedQuarter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select quarter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Q2 2023</SelectItem>
                    <SelectItem value="previous">Q1 2023</SelectItem>
                    <SelectItem value="q4_2022">Q4 2022</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Quarter-over-Quarter Changes</CardTitle>
                  <CardDescription>
                    Comparing current quarter with previous quarter
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={comparativeData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="current" fill="#8884d8" name="Current Quarter" />
                        <Bar dataKey="previous" fill="#82ca9d" name="Previous Quarter" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Biggest Improvements</CardTitle>
                    <CardDescription>
                      Areas with the most positive change
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {comparativeData
                        .map(item => ({
                          ...item,
                          change: item.current - item.previous
                        }))
                        .sort((a, b) => b.change - a.change)
                        .map((item, index) => (
                          <li key={index} className="flex justify-between items-center p-2 rounded hover:bg-muted">
                            <span>{item.name}</span>
                            <span className={`font-medium ${item.change > 0 ? 'text-green-600' : item.change < 0 ? 'text-red-600' : ''}`}>
                              {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Response Rate Trends</CardTitle>
                    <CardDescription>
                      Participation rate by quarter
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { name: 'Q4 2022', rate: 65 },
                            { name: 'Q1 2023', rate: 72 },
                            { name: 'Q2 2023', rate: 78 },
                          ]}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Response Rate']} />
                          <Line 
                            type="monotone" 
                            dataKey="rate" 
                            stroke="#8884d8" 
                            activeDot={{ r: 8 }} 
                            name="Response Rate"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sentiment Trends Over Time</CardTitle>
                  <CardDescription>
                    Key metrics trended over the last 4 quarters
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { name: 'Q3 2022', satisfaction: 3.2, engagement: 3.4, worklife: 3.0 },
                          { name: 'Q4 2022', satisfaction: 3.5, engagement: 3.6, worklife: 3.2 },
                          { name: 'Q1 2023', satisfaction: 3.7, engagement: 3.8, worklife: 3.5 },
                          { name: 'Q2 2023', satisfaction: 4.0, engagement: 4.1, worklife: 3.8 },
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="satisfaction" 
                          stroke="#8884d8" 
                          activeDot={{ r: 8 }} 
                          name="Job Satisfaction"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="engagement" 
                          stroke="#82ca9d" 
                          activeDot={{ r: 8 }} 
                          name="Employee Engagement"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="worklife" 
                          stroke="#ffc658" 
                          activeDot={{ r: 8 }} 
                          name="Work-Life Balance"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Demographic Insights</CardTitle>
                    <CardDescription>
                      Response patterns by department
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'Engineering', satisfaction: 4.2 },
                            { name: 'Marketing', satisfaction: 3.9 },
                            { name: 'Sales', satisfaction: 4.0 },
                            { name: 'Support', satisfaction: 3.7 },
                            { name: 'HR', satisfaction: 4.3 },
                          ]}
                          margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                          <YAxis domain={[0, 5]} />
                          <Tooltip />
                          <Bar dataKey="satisfaction" fill="#8884d8" name="Satisfaction Score" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Key Drivers Analysis</CardTitle>
                    <CardDescription>
                      Factors most correlated with overall satisfaction
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {[
                        { factor: 'Management Quality', correlation: 0.82 },
                        { factor: 'Career Development', correlation: 0.78 },
                        { factor: 'Work-Life Balance', correlation: 0.76 },
                        { factor: 'Recognition', correlation: 0.71 },
                        { factor: 'Compensation', correlation: 0.68 },
                      ].map((item, index) => (
                        <li key={index} className="flex justify-between items-center p-2 rounded hover:bg-muted">
                          <span>{item.factor}</span>
                          <div className="flex items-center">
                            <div className="w-24 h-2 bg-muted mr-2 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full" 
                                style={{ width: `${item.correlation * 100}%` }}
                              />
                            </div>
                            <span className="font-medium w-12 text-right">
                              {(item.correlation * 100).toFixed(0)}%
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}