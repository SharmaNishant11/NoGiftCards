import { MapNode as MapNodeType } from '@/types';

interface AdventureMapProps {
  nodes: MapNodeType[];
  recipientName: string;
  occasion: string;
  budget: number;
}

const AdventureMap = ({ nodes, recipientName, occasion, budget }: AdventureMapProps) => {
  const visitedCount = nodes.filter(n => n.status === 'visited').length;
  const activeCount = nodes.filter(n => n.status === 'active').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-cinzel text-gold text-sm tracking-wider">🗺️ Adventure Map</h3>
        <div className="flex items-center gap-3 text-xs font-crimson">
          <span className="text-foreground">{recipientName}</span>
          <span className="px-2 py-0.5 rounded-full border border-gold/30 text-gold/80">{occasion}</span>
          <span className="text-gold">${budget}</span>
        </div>
      </div>

      {/* Node chain */}
      <div className="flex items-center justify-between overflow-x-auto pb-2">
        {nodes.map((node, i) => (
          <div key={node.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
              {node.status === 'active' && (
                <span className="w-2 h-2 rounded-full bg-gold" style={{ animation: 'goldPulse 1s ease infinite' }} />
              )}
              {node.status !== 'active' && <span className="w-2 h-2" />}
              <div
                className={`text-2xl transition-all duration-300 ${
                  node.status === 'queued' ? 'opacity-40 scale-90' :
                  node.status === 'active' ? 'scale-110 gold-pulse' :
                  'opacity-100'
                }`}
              >
                {node.emoji}
                {node.status === 'visited' && (
                  <span className="absolute -bottom-1 -right-1 text-xs">✅</span>
                )}
              </div>
              <span className={`text-[10px] font-cinzel tracking-wider text-center ${
                node.status === 'queued' ? 'text-muted-foreground/50' :
                node.status === 'active' ? 'text-gold' :
                'text-foreground/70'
              }`}>
                {node.label}
              </span>
            </div>
            {i < nodes.length - 1 && (
              <div className={`w-8 h-px mx-1 ${
                node.status === 'visited' ? 'bg-gold' : 'border-t border-dashed border-gold/30'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-crimson text-muted-foreground">
          <span>{visitedCount + activeCount} / {nodes.length} sites scouted</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full skeleton-gold transition-all duration-600"
            style={{ width: `${((visitedCount + activeCount) / nodes.length) * 100}%`, background: 'hsl(38 66% 47%)' }}
          />
        </div>
      </div>
    </div>
  );
};

export default AdventureMap;
