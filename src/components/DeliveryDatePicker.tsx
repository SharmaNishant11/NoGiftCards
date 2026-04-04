import { useMemo } from 'react';

interface DeliveryDatePickerProps {
  value: string;
  onChange: (v: string) => void;
}

const DeliveryDatePicker = ({ value, onChange }: DeliveryDatePickerProps) => {
  const daysUntil = useMemo(() => {
    if (!value) return null;
    const diff = Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
    return diff;
  }, [value]);

  const isUrgent = daysUntil !== null && daysUntil < 3 && daysUntil >= 0;

  return (
    <div className="space-y-2">
      <label className="font-cinzel text-sm text-gold tracking-wider">When do you need it?</label>
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        min={new Date().toISOString().split('T')[0]}
        className="w-full bg-input border border-gold/30 rounded-md px-3 py-2 text-foreground font-crimson focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all duration-250"
      />
      {isUrgent && (
        <p className="text-sm font-crimson text-gold-light flex items-center gap-1 card-appear">
          ⚡ Express quest activated — {daysUntil} day{daysUntil !== 1 ? 's' : ''} remaining!
        </p>
      )}
    </div>
  );
};

export default DeliveryDatePicker;
