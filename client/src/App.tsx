import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { 
  Mic, 
  Brain, 
  MessageSquare,
  Calendar,
  Eye,
  Plus,
  Upload,
  FileAudio,
  Clock
} from 'lucide-react';
import type { Meeting, CreateMeetingInput, DashboardData } from '../../server/src/schema';
import { MeetingCard } from '@/components/MeetingCard';
import { ProcessingPanel } from '@/components/ProcessingPanel';
import { DashboardView } from '@/components/DashboardView';

function App() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<{
    meeting_id: number;
    status: string;
    message: string | null;
    progress: number;
  } | null>(null);

  // Form state for creating new meeting
  const [formData, setFormData] = useState<CreateMeetingInput>({
    title: '',
    description: null,
    audio_file_path: null
  });

  const [activeTab, setActiveTab] = useState('overview');

  // Load meetings on component mount
  const loadMeetings = useCallback(async () => {
    try {
      const result = await trpc.getMeetings.query();
      setMeetings(result);
    } catch (error) {
      console.error('Failed to load meetings:', error);
    }
  }, []);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  // Load dashboard data when a meeting is selected
  const loadDashboardData = useCallback(async (meetingId: number) => {
    try {
      const result = await trpc.getDashboardData.query({ meetingId });
      setDashboardData(result);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setDashboardData(null);
    }
  }, []);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createMeeting.mutate(formData);
      setMeetings((prev: Meeting[]) => [...prev, response]);
      setFormData({
        title: '',
        description: null,
        audio_file_path: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create meeting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMeeting = async (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    await loadDashboardData(meeting.id);
    setActiveTab('overview');
  };

  const handleProcessAudio = async (audioFile: File) => {
    if (!selectedMeeting) return;

    setIsLoading(true);
    try {
      // In a real implementation, you'd upload the file first and get the path
      const audioPath = `uploads/${audioFile.name}`; // Stub: real implementation would upload file
      
      const response = await trpc.processAudio.mutate({
        meeting_id: selectedMeeting.id,
        audio_file_path: audioPath
      });
      
      setProcessingStatus(response);
      // You might want to poll for status updates here
      await loadDashboardData(selectedMeeting.id);
    } catch (error) {
      console.error('Failed to process audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessText = async (textInput: string) => {
    if (!selectedMeeting) return;

    setIsLoading(true);
    try {
      const response = await trpc.processText.mutate({
        meeting_id: selectedMeeting.id,
        transcript: textInput
      });
      
      setProcessingStatus(response);
      // Reload dashboard data to get updated results
      await loadDashboardData(selectedMeeting.id);
    } catch (error) {
      console.error('Failed to process text:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMeeting = async (meetingId: number) => {
    try {
      await trpc.deleteMeeting.mutate({ id: meetingId });
      setMeetings((prev: Meeting[]) => prev.filter((m: Meeting) => m.id !== meetingId));
      if (selectedMeeting?.id === meetingId) {
        setSelectedMeeting(null);
        setDashboardData(null);
      }
    } catch (error) {
      console.error('Failed to delete meeting:', error);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                🎯 Meeting Assistant MVP
              </h1>
              <p className="text-gray-600 text-lg">
                AI-powered meeting transcription, analysis, and organization
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  New Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleCreateMeeting}>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Mic className="w-5 h-5" />
                      Create New Meeting
                    </DialogTitle>
                    <DialogDescription>
                      Set up a new meeting to start transcription and analysis.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Meeting Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Weekly Team Standup"
                        value={formData.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateMeetingInput) => ({ ...prev, title: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of the meeting..."
                        value={formData.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData((prev: CreateMeetingInput) => ({
                            ...prev,
                            description: e.target.value || null
                          }))
                        }
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
                      {isLoading ? 'Creating...' : 'Create Meeting'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Meetings List */}
          <div className="col-span-4">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Your Meetings
                </CardTitle>
                <CardDescription>
                  {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} total
                </CardDescription>
              </CardHeader>
              <CardContent>
                {meetings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Mic className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No meetings yet.</p>
                    <p className="text-sm">Create your first meeting to get started!</p>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-3 pr-4">
                      {meetings.map((meeting: Meeting) => (
                        <MeetingCard
                          key={meeting.id}
                          meeting={meeting}
                          isSelected={selectedMeeting?.id === meeting.id}
                          onSelect={handleSelectMeeting}
                          onDelete={handleDeleteMeeting}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="col-span-8">
            {!selectedMeeting ? (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <Brain className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      Select a Meeting
                    </h3>
                    <p className="text-gray-500">
                      Choose a meeting from the sidebar to view analysis and processing options
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Meeting Header */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          {selectedMeeting.title}
                        </h2>
                        {selectedMeeting.description && (
                          <p className="text-gray-600 mb-4">{selectedMeeting.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {selectedMeeting.created_at.toLocaleDateString()}
                          </span>
                          {selectedMeeting.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDuration(selectedMeeting.duration)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={selectedMeeting.transcript ? 'default' : 'secondary'}
                        className="px-3 py-1"
                      >
                        {selectedMeeting.transcript ? '✅ Processed' : '⏳ Pending'}
                      </Badge>
                    </div>

                    {processingStatus && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Processing Status</span>
                          <Badge variant="outline">{processingStatus.status}</Badge>
                        </div>
                        <Progress value={processingStatus.progress} className="mb-2" />
                        <p className="text-xs text-gray-600">{processingStatus.message}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tabs for different views */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur shadow-lg">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="process" className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Process
                    </TabsTrigger>
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Dashboard
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                            Transcript
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {selectedMeeting.transcript ? (
                            <ScrollArea className="h-48">
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {selectedMeeting.transcript}
                                </p>
                              </div>
                            </ScrollArea>
                          ) : (
                            <div className="flex items-center justify-center py-12 text-gray-500">
                              <div className="text-center">
                                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="font-medium">No transcript available</p>
                                <p className="text-sm">Upload audio or enter text to process</p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <FileAudio className="w-5 h-5 text-green-600" />
                            Audio File
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {selectedMeeting.audio_file_path ? (
                            <div className="text-center py-8">
                              <FileAudio className="w-16 h-16 text-green-500 mx-auto mb-4" />
                              <p className="text-sm font-medium text-gray-700 mb-1">Audio file uploaded</p>
                              <p className="text-xs text-gray-500 break-all">{selectedMeeting.audio_file_path}</p>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-12 text-gray-500">
                              <div className="text-center">
                                <FileAudio className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="font-medium">No audio file</p>
                                <p className="text-sm">Upload an audio file to get started</p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="process">
                    <ProcessingPanel
                      meeting={selectedMeeting}
                      onProcessAudio={handleProcessAudio}
                      onProcessText={handleProcessText}
                      isLoading={isLoading}
                      processingStatus={processingStatus}
                    />
                  </TabsContent>

                  <TabsContent value="dashboard">
                    <DashboardView
                      dashboardData={dashboardData}
                      isLoading={isLoading}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;