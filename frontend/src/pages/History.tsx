import { useState, useEffect } from 'react';
import { Clock, FileText, Trash2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { jiraApi, testplanApi } from '@/services/api';
import ReactMarkdown from 'react-markdown';

interface TestPlanHistory {
  id: number;
  ticket_id: string;
  template_id: string;
  generated_content: string;
  provider_used: string;
  created_at: string;
  template_name?: string;
}

interface RecentTicket {
  ticketId: string;
  summary: string;
  fetchedAt: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<TestPlanHistory[]>([]);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TestPlanHistory | null>(null);

  useEffect(() => {
    loadHistory();
    loadRecentTickets();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await testplanApi.getHistory();
      setHistory(res.data || []);
    } catch (error) {
      console.error('Failed to load history:', error);
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">History</h1>
        <p className="text-muted-foreground mt-1">Recently fetched tickets and generated test plans</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent tickets</p>
                <p className="text-sm mt-1">Tickets you fetch will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTickets.map((ticket) => (
                  <div
                    key={ticket.ticketId}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{ticket.ticketId}</Badge>
                      </div>
                      <p className="text-sm mt-1 font-medium">{ticket.summary}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fetched {formatDate(ticket.fetchedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generated Test Plans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generated Test Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No generated test plans</p>
                <p className="text-sm mt-1">Test plans you generate will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPlan?.id === plan.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{plan.ticket_id}</Badge>
                          <Badge variant="secondary">{plan.provider_used}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {plan.template_name || 'Default Template'} • {formatDate(plan.created_at)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Delete functionality
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected Plan Preview */}
      {selectedPlan && (
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{selectedPlan.ticket_id} - Test Plan</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Generated using {selectedPlan.provider_used} on {formatDate(selectedPlan.created_at)}
              </p>
            </div>
            <Button variant="outline" onClick={() => setSelectedPlan(null)}>
              Close
            </Button>
          </CardHeader>
          <CardContent>
            <div className="markdown-preview prose prose-sm max-w-none max-h-96 overflow-y-auto p-4 bg-muted rounded-lg">
              <ReactMarkdown>{selectedPlan.generated_content}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
