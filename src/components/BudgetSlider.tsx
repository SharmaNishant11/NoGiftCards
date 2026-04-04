interface BudgetSliderProps {
  value: number;
  onChange: (v: number) => void;
}

const BudgetSlider = ({ value, onChange }: BudgetSliderProps) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <label className="font-cinzel text-sm text-gold tracking-wider">Quest Budget</label>
      <span className="font-cinzel text-xl text-gold-light">${value}</span>
    </div>
    <input
      type="range"
      min={20}
      max={500}
      step={5}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-2 rounded-full appearance-none cursor-pointer"
      style={{
        background: `linear-gradient(to right, hsl(38 66% 47%) 0%, hsl(38 66% 47%) ${((value - 20) / 480) * 100}%, hsl(260 25% 18%) ${((value - 20) / 480) * 100}%, hsl(260 25% 18%) 100%)`,
        accentColor: 'hsl(38 66% 47%)',
      }}
    />
    <div className="flex justify-between text-xs text-muted-foreground font-crimson">
      <span>$20</span>
      <span>$500</span>
    </div>
  </div>
);

export default BudgetSlider;
