import { useState, useEffect } from 'react';
import { Search, Loader2, Wand2, Copy, Download, Save, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { jiraApi, templatesApi, testplanApi } from '@/services/api';
import ReactMarkdown from 'react-markdown';

interface Ticket {
  key: string;
  summary: string;
  description: string;
  priority: string;
  status: string;
  assignee?: string;
  labels: string[];
  acceptanceCriteria?: string;
}

interface RecentTicket {
  ticketId: string;
  summary: string;
  fetchedAt: string;
}

export default function Dashboard() {
  // Input state
  const [ticketId, setTicketId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);

  // Data state
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);

  // UI state
  const [fetching, setFetching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generatedPlan, setGeneratedPlan] = useState('');
  const [error, setError] = useState('');

  // Load templates and recent tickets on mount
  useEffect(() => {
    loadTemplates();
    loadRecentTickets();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await templatesApi.getAll();
      setTemplates(res.data || []);
      // Select default template
      const defaultTemplate = res.data?.find((t: any) => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate.id);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadRecentTickets = async () => {
    try {
      const res = await jiraApi.getRecentTickets();
      setRecentTickets(res.data || []);
    } catch (error) {
      console.error('Failed to load recent tickets:', error);
    }
  };

  const handleFetchTicket = async () => {
    if (!ticketId.trim()) return;

    setFetching(true);
    setError('');
    setTicket(null);
    setGeneratedPlan('');

    try {
      const res = await jiraApi.fetchTicket(ticketId);
      setTicket(res.data);
      await loadRecentTickets();
    } catch (error: any) {
      setError(error.message || 'Failed to fetch ticket');
    } finally {
      setFetching(false);
    }
  };

  const handleGenerate = async () => {
    if (!ticket || !selectedTemplate) return;

    setGenerating(true);
    setGeneratedPlan('');
    setError('');

    // Simulate progress steps
    const steps = [
      'Fetching Ticket...',
      'Analyzing Context...',
      'Generating Plan...',
      'Complete'
    ];

    for (let i = 0; i < steps.length - 1; i++) {
      setGenerationStep(i);
      await new Promise(r => setTimeout(r, 800));
    }

    try {
      const res = await testplanApi.generate({
        ticketId: ticket.key,
        templateId: selectedTemplate,
      });
      
      setGeneratedPlan(res.data.generatedContent);
      setGenerationStep(3);
    } catch (error: any) {
      setError(error.message || 'Failed to generate test plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPlan);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedPlan], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-plan-${ticket?.key || 'generated'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      if (ticket && !generating) {
        handleGenerate();
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto" onKeyDown={handleKeyDown}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Generate Test Plan</h1>
        <p className="text-muted-foreground mt-1">
          Fetch a JIRA ticket and generate a test plan using AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Input */}
        <div className="space-y-6">
          {/* Ticket Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Step 1: Fetch Ticket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="VWO-123"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value.toUpperCase())}
                  className="uppercase"
                />
                <Button 
                  onClick={handleFetchTicket} 
                  disabled={fetching || !ticketId.trim()}
                >
                  {fetching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Fetch
                </Button>
              </div>

              {recentTickets.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Recent</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {recentTickets.map((t) => (
                      <Button
                        key={t.ticketId}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTicketId(t.ticketId);
                          setTicket(null);
                        }}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {t.ticketId}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ticket Display */}
          {ticket && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Ticket Details</span>
                  <Badge variant={ticket.priority === 'High' ? 'destructive' : 'default'}>
                    {ticket.priority}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Key</Label>
                  <p className="font-medium">{ticket.key}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Summary</Label>
                  <p className="font-medium">{ticket.summary}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <p>{ticket.status}</p>
                </div>
                {ticket.assignee && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Assignee</Label>
                    <p>{ticket.assignee}</p>
                  </div>
                )}
                {ticket.labels.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Labels</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ticket.labels.map((label) => (
                        <Badge key={label} variant="outline" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {ticket.acceptanceCriteria && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Acceptance Criteria</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{ticket.acceptanceCriteria}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Generation Controls */}
          {ticket && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Step 2: Generate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {generating && (
                  <div className="space-y-2">
                    <Progress value={(generationStep + 1) * 25} />
                    <p className="text-sm text-muted-foreground text-center">
                      {['Fetching Ticket...', 'Analyzing Context...', 'Generating Plan...', 'Complete'][generationStep]}
                    </p>
                  </div>
                )}

                <Button 
                  onClick={handleGenerate} 
                  disabled={generating || !selectedTemplate}
                  className="w-full"
                  size="lg"
                >
                  {generating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Generate Test Plan
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Press Ctrl+Enter to generate
                </p>
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Right Column - Output */}
        <div>
          <Card className="h-full min-h-[600px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generated Test Plan
              </CardTitle>
              {generatedPlan && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {generatedPlan ? (
                <div className="markdown-preview prose prose-sm max-w-none">
                  <ReactMarkdown>{generatedPlan}</ReactMarkdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-20">
                  <FileText className="h-12 w-12 mb-4 opacity-50" />
                  <p>Generated test plan will appear here</p>
                  <p className="text-sm mt-1">Fetch a ticket and click Generate</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
