import { DAY_LABELS } from '../lib/constants';

export default function CalendarGrid({ year, month, completedDays = [] }) {
  const today = new Date();
  const todayDate = today.getDate();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Monday = 0, Sunday = 6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells = [];

  for (let i = 0; i < startDow; i++) {
    cells.push(<div key={`empty-${i}`} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = isCurrentMonth && day === todayDate;
    const isPast = isCurrentMonth ? day < todayDate : true;
    const isCompleted = completedDays.includes(day);
    const isFuture = isCurrentMonth && day > todayDate;

    let circleClass = 'w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium transition-colors ';

    if (isCompleted) {
      circleClass += 'bg-accent text-white';
    } else if (isToday) {
      circleClass += 'border-2 border-white text-white bg-transparent';
    } else if (isFuture) {
      circleClass += 'border border-border text-border';
    } else if (isPast) {
      circleClass += 'bg-border/50 text-nav-inactive';
    }

    cells.push(
      <div key={day} className="flex justify-center">
        <div className={circleClass}>{day}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] text-text-secondary font-medium">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>
    </div>
  );
}
