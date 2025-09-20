import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Brain, 
  CheckSquare, 
  Network, 
  Target
} from 'lucide-react';
import type { DashboardData } from '../../../server/src/schema';

interface DashboardViewProps {
  dashboardData: DashboardData | null;
  isLoading?: boolean;
}

export function DashboardView({ dashboardData, isLoading }: DashboardViewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Analysis Available
            </h3>
            <p className="text-gray-500 max-w-md">
              Upload an audio file or enter a transcript to get AI-powered analysis including 
              summary, tone analysis, action items, and mind mapping.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatActionItems = (actionItemsText: string) => {
    // Simple parsing to extract action items from text
    const lines = actionItemsText.split('\n').filter(line => line.trim());
    return lines.map((line) => {
      // Look for patterns like "- Task" or "1. Task" or "• Task"
      const cleaned = line.replace(/^[\d\-•*\s]+/, '').trim();
      return cleaned || line;
    });
  };

  const renderMindMap = (mindMapText: string) => {
    // For Mermaid syntax, display as formatted code for now
    // In a real implementation, you'd render this with a Mermaid library
    if (mindMapText.includes('graph') || mindMapText.includes('flowchart')) {
      return (
        <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
          <div className="text-center text-gray-600 mb-2">
            <Network className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Mind Map Visualization</p>
            <p className="text-xs text-gray-500">Mermaid diagram format</p>
          </div>
          <ScrollArea className="h-40">
            <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
              {mindMapText}
            </pre>
          </ScrollArea>
        </div>
      );
    }
    
    // Fallback for non-Mermaid format
    return (
      <div className="space-y-2">
        {mindMapText.split('\n').filter(line => line.trim()).map((line, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
            <span className="text-sm">{line.trim()}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Meeting Overview */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Meeting Analysis Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {dashboardData.components.summary ? '✓' : '○'}
              </div>
              <div className="text-sm opacity-90">Summary</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {dashboardData.components.tone_analysis ? '✓' : '○'}
              </div>
              <div className="text-sm opacity-90">Tone Analysis</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {dashboardData.components.action_items ? '✓' : '○'}
              </div>
              <div className="text-sm opacity-90">Action Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {dashboardData.components.mind_map ? '✓' : '○'}
              </div>
              <div className="text-sm opacity-90">Mind Map</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Summary */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Meeting Summary
            </CardTitle>
            {dashboardData.components.summary && (
              <Badge variant="secondary" className="w-fit">
                AI Generated
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {dashboardData.components.summary ? (
              <ScrollArea className="h-64">
                <div className="prose prose-sm max-w-none">
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {dashboardData.components.summary}
                    </p>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Summary will appear here after processing</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tone Analysis */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Tone & Sentiment
            </CardTitle>
            {dashboardData.components.tone_analysis && (
              <Badge variant="secondary" className="w-fit">
                AI Generated
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {dashboardData.components.tone_analysis ? (
              <ScrollArea className="h-64">
                <div className="space-y-4">
                  <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {dashboardData.components.tone_analysis}
                    </p>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <Brain className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Tone analysis will appear here after processing</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Items */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-green-600" />
              Action Items
            </CardTitle>
            {dashboardData.components.action_items && (
              <Badge variant="secondary" className="w-fit">
                {formatActionItems(dashboardData.components.action_items).length} items
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {dashboardData.components.action_items ? (
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {formatActionItems(dashboardData.components.action_items).map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckSquare className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{item}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <CheckSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Action items will appear here after processing</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mind Map */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-orange-600" />
              Mind Map
            </CardTitle>
            {dashboardData.components.mind_map && (
              <Badge variant="secondary" className="w-fit">
                Visual Structure
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {dashboardData.components.mind_map ? (
              <ScrollArea className="h-64">
                {renderMindMap(dashboardData.components.mind_map)}
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <Network className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Mind map visualization will appear here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}