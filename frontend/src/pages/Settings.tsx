import { useState, useEffect } from 'react';
import { Check, X, Upload, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { settingsApi, templatesApi } from '@/services/api';

export default function SettingsPage() {
  // JIRA State
  const [jiraConfig, setJiraConfig] = useState({
    baseUrl: '',
    username: '',
    apiToken: '',
  });
  const [jiraStatus, setJiraStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [jiraMessage, setJiraMessage] = useState('');

  // LLM State
  const [llmConfig, setLlmConfig] = useState({
    provider: 'groq' as 'groq' | 'ollama',
    groq: { apiKey: '', model: 'llama-3.3-70b-versatile', temperature: 0.7 },
    ollama: { baseUrl: 'http://localhost:11434', model: '' },
  });
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [llmStatus, setLlmStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [llmMessage, setLlmMessage] = useState('');

  // Templates State
  const [templates, setTemplates] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load saved configs on mount
  useEffect(() => {
    loadConfigs();
    loadTemplates();
  }, []);

  const loadConfigs = async () => {
    try {
      const [jiraRes, llmRes] = await Promise.all([
        settingsApi.getJiraConfig(),
        settingsApi.getLlmConfig(),
      ]);
      
      if (jiraRes.data?.configured) {
        setJiraConfig(prev => ({ ...prev, ...jiraRes.data.config }));
      }
      
      if (llmRes.data) {
        setLlmConfig(prev => ({
          ...prev,
          provider: llmRes.data.provider || 'groq',
          groq: { ...prev.groq, ...llmRes.data.groq },
          ollama: { ...prev.ollama, ...llmRes.data.ollama },
        }));
      }
    } catch (error) {
      console.error('Failed to load configs:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await templatesApi.getAll();
      setTemplates(res.data || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  // JIRA Handlers
  const testJiraConnection = async () => {
    setJiraStatus('loading');
    try {
      const res = await settingsApi.testJiraConnection(jiraConfig);
      if (res.success) {
        setJiraStatus('success');
        setJiraMessage(res.message);
      } else {
        setJiraStatus('error');
        setJiraMessage(res.message);
      }
    } catch (error: any) {
      setJiraStatus('error');
      setJiraMessage(error.message);
    }
  };

  const saveJiraConfig = async () => {
    try {
      await settingsApi.saveJiraConfig(jiraConfig);
      alert('JIRA configuration saved!');
    } catch (error: any) {
      alert('Failed to save: ' + error.message);
    }
  };

  // LLM Handlers
  const testLlmConnection = async () => {
    setLlmStatus('loading');
    try {
      const config = llmConfig.provider === 'groq' 
        ? { provider: 'groq', groq: llmConfig.groq }
        : { provider: 'ollama', ollama: llmConfig.ollama };
      
      const res = await settingsApi.testLlmConnection(config);
      if (res.success) {
        setLlmStatus('success');
        setLlmMessage(res.message);
      } else {
        setLlmStatus('error');
        setLlmMessage(res.message);
      }
    } catch (error: any) {
      setLlmStatus('error');
      setLlmMessage(error.message);
    }
  };

  const saveLlmConfig = async () => {
    try {
      const config = {
        provider: llmConfig.provider,
        groq: llmConfig.groq,
        ollama: llmConfig.ollama,
      };
      await settingsApi.saveLlmConfig(config);
      alert('LLM configuration saved!');
    } catch (error: any) {
      alert('Failed to save: ' + error.message);
    }
  };

  const loadOllamaModels = async () => {
    try {
      const res = await settingsApi.getOllamaModels();
      setOllamaModels(res.data || []);
    } catch (error) {
      console.error('Failed to load Ollama models:', error);
    }
  };

  // Template Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await templatesApi.upload(file);
      await loadTemplates();
      alert('Template uploaded successfully!');
    } catch (error: any) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (template: any) => {
    setTemplateToDelete(template);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;
    
    setDeleting(true);
    try {
      await templatesApi.delete(templateToDelete.id);
      await loadTemplates();
      setShowDeleteDialog(false);
      setTemplateToDelete(null);
    } catch (error: any) {
      alert('Delete failed: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setTemplateToDelete(null);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure JIRA, LLM providers, and templates</p>
      </div>

      <Tabs defaultValue="jira" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="jira">JIRA</TabsTrigger>
          <TabsTrigger value="llm">LLM</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* JIRA Configuration */}
        <TabsContent value="jira">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>JIRA Configuration</CardTitle>
                  <CardDescription>Connect to your JIRA instance</CardDescription>
                </div>
                {jiraStatus === 'success' && (
                  <Badge variant="default" className="bg-green-500">
                    <Check className="h-3 w-3 mr-1" /> Connected
                  </Badge>
                )}
                {jiraStatus === 'error' && (
                  <Badge variant="destructive">
                    <X className="h-3 w-3 mr-1" /> Failed
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {jiraMessage && (
                <Alert variant={jiraStatus === 'error' ? 'destructive' : 'default'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{jiraMessage}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="jira-url">JIRA Base URL</Label>
                <Input
                  id="jira-url"
                  placeholder="https://company.atlassian.net"
                  value={jiraConfig.baseUrl}
                  onChange={(e) => setJiraConfig({ ...jiraConfig, baseUrl: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jira-username">Username / Email</Label>
                <Input
                  id="jira-username"
                  placeholder="you@example.com"
                  value={jiraConfig.username}
                  onChange={(e) => setJiraConfig({ ...jiraConfig, username: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jira-token">API Token</Label>
                <Input
                  id="jira-token"
                  type="password"
                  placeholder="••••••••••••••••"
                  value={jiraConfig.apiToken}
                  onChange={(e) => setJiraConfig({ ...jiraConfig, apiToken: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Generate from{' '}
                  <a 
                    href="https://id.atlassian.com/manage-profile/security/api-tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Atlassian Account Settings
                  </a>
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={testJiraConnection} disabled={jiraStatus === 'loading'}>
                  {jiraStatus === 'loading' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Test Connection
                </Button>
                <Button variant="outline" onClick={saveJiraConfig}>Save Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LLM Configuration */}
        <TabsContent value="llm">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>LLM Provider Settings</CardTitle>
                  <CardDescription>Configure cloud or local LLM providers</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Use Local LLM</span>
                  <Switch
                    checked={llmConfig.provider === 'ollama'}
                    onCheckedChange={(checked) => {
                      setLlmConfig({ ...llmConfig, provider: checked ? 'ollama' : 'groq' });
                      if (checked) loadOllamaModels();
                    }}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {llmMessage && (
                <Alert variant={llmStatus === 'error' ? 'destructive' : 'default'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{llmMessage}</AlertDescription>
                </Alert>
              )}

              {llmConfig.provider === 'groq' ? (
                <>
                  <div className="space-y-2">
                    <Label>Groq API Key</Label>
                    <Input
                      type="password"
                      placeholder="gsk_..."
                      value={llmConfig.groq.apiKey}
                      onChange={(e) => setLlmConfig({
                        ...llmConfig,
                        groq: { ...llmConfig.groq, apiKey: e.target.value }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select
                      value={llmConfig.groq.model}
                      onValueChange={(value) => setLlmConfig({
                        ...llmConfig,
                        groq: { ...llmConfig.groq, model: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B (Recommended)</SelectItem>
                        <SelectItem value="llama-3.1-70b-versatile">Llama 3.1 70B</SelectItem>
                        <SelectItem value="llama-3.1-8b-instant">Llama 3.1 8B (Fast)</SelectItem>
                        <SelectItem value="mixtral-8x7b-32768">Mixtral 8x7B</SelectItem>
                        <SelectItem value="gemma-7b-it">Gemma 7B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Temperature: {llmConfig.groq.temperature}</Label>
                    <Slider
                      value={[llmConfig.groq.temperature]}
                      min={0}
                      max={1}
                      step={0.1}
                      onValueChange={([v]) => setLlmConfig({
                        ...llmConfig,
                        groq: { ...llmConfig.groq, temperature: v }
                      })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Ollama Base URL</Label>
                    <Input
                      placeholder="http://localhost:11434"
                      value={llmConfig.ollama.baseUrl}
                      onChange={(e) => setLlmConfig({
                        ...llmConfig,
                        ollama: { ...llmConfig.ollama, baseUrl: e.target.value }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Model</Label>
                    <div className="flex gap-2">
                      <Select
                        value={llmConfig.ollama.model}
                        onValueChange={(value) => setLlmConfig({
                          ...llmConfig,
                          ollama: { ...llmConfig.ollama, model: value }
                        })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a model..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ollamaModels.map((model) => (
                            <SelectItem key={model} value={model}>{model}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={loadOllamaModels} size="icon">
                        <Loader2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Make sure Ollama is running. Run `ollama pull &lt;model&gt;` to download models.
                    </p>
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button onClick={testLlmConnection} disabled={llmStatus === 'loading'}>
                  {llmStatus === 'loading' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Test Connection
                </Button>
                <Button variant="outline" onClick={saveLlmConfig}>Save Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Template Management</CardTitle>
              <CardDescription>Upload and manage test plan templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-2">Upload PDF Template</p>
                <p className="text-xs text-muted-foreground mb-4">Drag & drop or click to select</p>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="max-w-xs mx-auto"
                />
              </div>

              <div>
                <h3 className="font-medium mb-3">Available Templates</h3>
                <div className="space-y-2">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {template.isDefault ? 'Default template' : `Added ${new Date(template.createdAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {template.isDefault && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                        {!template.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteClick(template)}
                            title="Delete template"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {templates.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No templates uploaded yet</p>
                  )}
                </div>
              </div>

              {/* Delete Confirmation Dialog */}
              {showDeleteDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-background rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
                    <h3 className="text-lg font-semibold mb-2">Delete Template</h3>
                    <p className="text-muted-foreground mb-4">
                      Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={handleDeleteCancel} disabled={deleting}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
                        {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
