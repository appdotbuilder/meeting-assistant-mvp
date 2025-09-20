import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FileAudio, MessageSquare, Upload, Brain } from 'lucide-react';
import { useState } from 'react';
import type { Meeting } from '../../../server/src/schema';

interface ProcessingPanelProps {
  meeting: Meeting;
  onProcessAudio: (file: File) => Promise<void>;
  onProcessText: (text: string) => Promise<void>;
  isLoading: boolean;
  processingStatus: {
    meeting_id: number;
    status: string;
    message: string | null;
    progress: number;
  } | null;
}

export function ProcessingPanel({ 
  meeting, 
  onProcessAudio, 
  onProcessText, 
  isLoading, 
  processingStatus 
}: ProcessingPanelProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');

  const handleAudioProcess = async () => {
    if (audioFile) {
      await onProcessAudio(audioFile);
      setAudioFile(null);
    }
  };

  const handleTextProcess = async () => {
    if (textInput.trim()) {
      await onProcessText(textInput.trim());
      setTextInput('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Processing Status */}
      {processingStatus && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="w-5 h-5 text-blue-600" />
                AI Processing Status
              </CardTitle>
              <Badge 
                variant={processingStatus.status === 'completed' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {processingStatus.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Progress value={processingStatus.progress} className="w-full" />
              <div className="flex justify-between text-sm">
                <span>{processingStatus.message}</span>
                <span>{processingStatus.progress}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Audio Upload */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileAudio className="w-5 h-5 text-purple-600" />
              Upload Audio File
            </CardTitle>
            <CardDescription>
              Upload an audio recording to transcribe with AI and analyze the conversation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="file"
                accept="audio/*,.wav,.mp3,.m4a,.ogg,.flac"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAudioFile(e.target.files?.[0] || null)
                }
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              {audioFile && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <FileAudio className="w-4 h-4 text-purple-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-900">{audioFile.name}</p>
                      <p className="text-xs text-purple-600">
                        {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Button
              onClick={handleAudioProcess}
              disabled={!audioFile || isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isLoading ? 'Processing Audio...' : 'Process Audio File'}
            </Button>
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Supports: WAV, MP3, M4A, OGG, FLAC</p>
              <p>• Max file size: 100MB</p>
              <p>• Processing includes: transcription, summary, tone analysis, action items</p>
            </div>
          </CardContent>
        </Card>

        {/* Text Input */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Enter Transcript
            </CardTitle>
            <CardDescription>
              Paste or type a meeting transcript directly for immediate AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste your meeting transcript here or type the conversation...

Example:
John: Good morning everyone, let's start with the quarterly review.
Sarah: Thanks John. Our revenue is up 15% this quarter, but we're seeing some challenges in customer retention.
Mike: I think we need to focus more on our onboarding process..."
              value={textInput}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setTextInput(e.target.value)
              }
              rows={8}
              className="resize-none text-sm"
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{textInput.length} characters</span>
              <span>{textInput.trim().split(/\s+/).filter(word => word.length > 0).length} words</span>
            </div>
            <Button
              onClick={handleTextProcess}
              disabled={!textInput.trim() || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Brain className="w-4 h-4 mr-2" />
              {isLoading ? 'Analyzing Text...' : 'Analyze Transcript'}
            </Button>
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Minimum: 50 words recommended</p>
              <p>• Processing includes: summary, sentiment analysis, action items, mind map</p>
              <p>• Tip: Include speaker names for better analysis</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Status */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm text-gray-700">Current Meeting Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${meeting.transcript ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={meeting.transcript ? 'text-green-700' : 'text-gray-500'}>
                Transcript
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${meeting.summary ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={meeting.summary ? 'text-green-700' : 'text-gray-500'}>
                Summary
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${meeting.tone_analysis ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={meeting.tone_analysis ? 'text-green-700' : 'text-gray-500'}>
                Tone Analysis
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${meeting.action_items ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={meeting.action_items ? 'text-green-700' : 'text-gray-500'}>
                Action Items
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}