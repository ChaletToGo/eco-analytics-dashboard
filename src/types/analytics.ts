export interface EventSummary {
  totalViews: number;
  totalSessions: number;
  avgTimeSpent: number;
  bounceRate: number;
}

export interface ComponentEngagement {
  componentName: string;
  totalViews: number;
  avgTimeSeconds: number;
  maxTimeSeconds: number;
}

export interface ScrollDepthStats {
  depthPercentage: number;
  count: number;
}

export interface SessionTimeline {
  id: string;
  created_at: string;
  event_name: string;
  component_name: string | null;
  button_label: string | null;
  metadata: Record<string, any>;
}