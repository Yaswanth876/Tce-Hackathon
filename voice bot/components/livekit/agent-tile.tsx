import { type AgentState, BarVisualizer, type TrackReference } from '@livekit/components-react';
import { cn } from '@/lib/utils';

interface AgentAudioTileProps {
  state: AgentState;
  audioTrack: TrackReference;
  className?: string;
}

export const AgentTile = ({
  state,
  audioTrack,
  className,
  ref,
}: React.ComponentProps<'div'> & AgentAudioTileProps) => {
  return (
    <div ref={ref} className={cn('rounded-lg border border-blue-200 bg-white p-2', className)}>
      <BarVisualizer
        barCount={5}
        state={state}
        options={{ minHeight: 5 }}
        trackRef={audioTrack}
        className={cn('flex aspect-video w-40 items-center justify-center gap-1')}
      >
        <span
          className={cn([
            'min-h-4 w-4 rounded-full bg-blue-200',
            'origin-center transition-colors duration-250 ease-linear',
            'data-[lk-highlighted=true]:bg-blue-500 data-[lk-muted=true]:bg-gray-300',
          ])}
        />
      </BarVisualizer>
    </div>
  );
};
