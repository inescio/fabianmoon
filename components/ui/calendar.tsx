'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getAvailableDates, isDateAvailable, getDayName, formatDate } from '@/lib/booking-utils';
import { cn } from '@/lib/utils';

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  className?: string;
}

export function Calendar({ selectedDate, onDateSelect, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const availableDates = getAvailableDates();

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Agregar días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Agregar días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isDateSelectable = (date: Date | null): boolean => {
    if (!date) return false;
    return isDateAvailable(date);
  };

  const isDateSelected = (date: Date | null): boolean => {
    if (!date || !selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className={cn('glass rounded-2xl p-4 sm:p-6', className)}>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-lg glass-hover hover:bg-accent/10 transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
        </button>
        
        <h3 className="text-lg sm:text-xl font-semibold text-foreground capitalize px-2">
          {monthName}
        </h3>
        
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg glass-hover hover:bg-accent/10 transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-3 sm:mb-4">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs sm:text-sm lg:text-base font-medium text-foreground/60 py-1 sm:py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((date, index) => {
          const isSelectable = isDateSelectable(date);
          const isSelected = isDateSelected(date);
          const isToday = date && 
            date.getDate() === new Date().getDate() &&
            date.getMonth() === new Date().getMonth() &&
            date.getFullYear() === new Date().getFullYear();

          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          return (
            <button
              key={date.toISOString()}
              onClick={() => isSelectable && onDateSelect(date)}
              disabled={!isSelectable}
              className={cn(
                'aspect-square rounded-lg text-sm sm:text-base font-medium transition-all duration-200',
                {
                  'bg-accent text-accent-foreground shadow-gold-glow': isSelected,
                  'bg-accent/20 text-accent hover:bg-accent/30': isSelectable && !isSelected,
                  'text-foreground/30 cursor-not-allowed': !isSelectable,
                  'ring-2 ring-accent/50': isToday && !isSelected,
                }
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
          <p className="text-sm sm:text-base text-foreground/70">
            Fecha seleccionada:{' '}
            <span className="font-semibold text-accent">
              {formatDate(selectedDate)}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

