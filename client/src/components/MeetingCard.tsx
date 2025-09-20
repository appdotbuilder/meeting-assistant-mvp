import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Trash2, FileAudio, MessageSquare } from 'lucide-react';
import type { Meeting } from '../../../server/src/schema';

interface MeetingCardProps {
  meeting: Meeting;
  isSelected: boolean;
  onSelect: (meeting: Meeting) => void;
  onDelete: (meetingId: number) => void;
}

export function MeetingCard({ meeting, isSelected, onSelect, onDelete }: MeetingCardProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProcessingStatus = () => {
    if (meeting.summary && meeting.tone_analysis && meeting.action_items && meeting.mind_map) {
      return { label: 'Fully Processed', variant: 'default' as const, icon: '✅' };
    } else if (meeting.transcript) {
      return { label: 'Transcribed', variant: 'secondary' as const, icon: '📝' };
    } else {
      return { label: 'Pending', variant: 'outline' as const, icon: '⏳' };
    }
  };

  const status = getProcessingStatus();

  return (
    <Card 
      className={`transition-all duration-200 cursor-pointer hover:shadow-md ${
        isSelected 
          ? 'ring-2 ring-indigo-500 border-indigo-200 bg-indigo-50' 
          : 'border-gray-200 hover:border-indigo-200'
      }`}
      onClick={() => onSelect(meeting)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium truncate pr-2">
            {meeting.title}
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onDelete(meeting.id);
            }}
            className="text-gray-400 hover:text-red-500 p-1 h-6 w-6"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
        {meeting.description && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {meeting.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Status and indicators */}
          <div className="flex items-center justify-between">
            <Badge variant={status.variant} className="text-xs">
              {status.icon} {status.label}
            </Badge>
            <div className="flex gap-1">
              {meeting.audio_file_path && (
                <div className="text-green-600" title="Has audio file">
                  <FileAudio className="w-3 h-3" />
                </div>
              )}
              {meeting.transcript && (
                <div className="text-blue-600" title="Has transcript">
                  <MessageSquare className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>
          
          {/* Date and duration */}
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {meeting.created_at.toLocaleDateString()}
            </span>
            {meeting.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(meeting.duration)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}