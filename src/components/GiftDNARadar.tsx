import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { GiftDNA } from '@/types';

interface GiftDNARadarProps {
  dna: GiftDNA;
  recipientName: string;
  occasion: string;
  budget: number;
  deliveryDate: string;
}

const GiftDNARadar = ({ dna, recipientName, occasion, budget, deliveryDate }: GiftDNARadarProps) => {
  const data = [
    { axis: 'Sentimental', value: dna.sentimental },
    { axis: 'Practical', value: dna.practical },
    { axis: 'Adventurous', value: dna.adventurous },
    { axis: 'Luxurious', value: dna.luxurious },
    { axis: 'Quirky', value: dna.quirky },
  ];

  const daysUntil = deliveryDate
    ? Math.ceil((new Date(deliveryDate).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="space-y-4">
      <h3 className="font-cinzel text-lg text-gold">
        Gift DNA for {recipientName || '???'}
      </h3>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="hsl(38 66% 47% / 0.2)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: 'hsl(40 33% 85%)', fontSize: 11, fontFamily: 'Crimson Pro' }}
            />
            <Radar
              dataKey="value"
              stroke="hsl(38 66% 47%)"
              fill="hsl(38 66% 47% / 0.25)"
              strokeWidth={2}
              animationDuration={600}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {occasion && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-cinzel text-muted-foreground tracking-wider">Occasion</span>
          <span className="px-3 py-1 rounded-full text-sm border border-gold/40 bg-gold/10 text-gold-light font-crimson">
            {occasion}
          </span>
        </div>
      )}

      <div className="text-sm font-crimson text-gold-light">
        Quest Budget: <span className="font-cinzel">${budget}</span>
      </div>

      {daysUntil !== null && daysUntil >= 0 && (
        <div className={`text-sm font-crimson ${daysUntil < 3 ? 'text-gold-light' : 'text-muted-foreground'}`}>
          {daysUntil < 3 ? '⚡' : '📅'} {daysUntil} day{daysUntil !== 1 ? 's' : ''} until delivery
        </div>
      )}
    </div>
  );
};

export default GiftDNARadar;
