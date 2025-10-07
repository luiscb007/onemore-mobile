import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface CalendarPickerProps {
  visible: boolean;
  value: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
  minimumDate?: Date;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  visible,
  value,
  onSelect,
  onClose,
  minimumDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(value.getFullYear(), value.getMonth(), 1));

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    // Check if date is before minimum date
    if (minimumDate && selectedDate < minimumDate) {
      return;
    }
    
    // Preserve the time from the current value
    selectedDate.setHours(value.getHours(), value.getMinutes(), value.getSeconds(), value.getMilliseconds());
    onSelect(selectedDate);
    onClose();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = [];

    // Fill in empty days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      week.push(null);
    }

    // Fill in the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    // Fill in remaining empty days
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      weeks.push(week);
    }

    const isSelected = (day: number) => {
      return (
        day === value.getDate() &&
        currentMonth.getMonth() === value.getMonth() &&
        currentMonth.getFullYear() === value.getFullYear()
      );
    };

    const isBeforeMinimum = (day: number) => {
      if (!minimumDate) return false;
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      return date < minimumDate;
    };

    return (
      <View style={styles.calendar}>
        {/* Day headers */}
        <View style={styles.weekRow}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Text key={day} style={styles.dayHeader}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        {weeks.map((weekDays, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {weekDays.map((day, dayIndex) => {
              if (day === null) {
                return <View key={dayIndex} style={styles.dayCell} />;
              }

              const selected = isSelected(day);
              const disabled = isBeforeMinimum(day);

              return (
                <TouchableOpacity
                  key={dayIndex}
                  style={[
                    styles.dayCell,
                    selected && styles.selectedDay,
                    disabled && styles.disabledDay,
                  ]}
                  onPress={() => !disabled && handleDateSelect(day)}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.dayText,
                      selected && styles.selectedDayText,
                      disabled && styles.disabledDayText,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
              <ChevronLeft size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.monthYear}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
              <ChevronRight size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Calendar */}
          <ScrollView style={styles.calendarContainer}>
            {renderCalendar()}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  navButton: {
    padding: 8,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  calendarContainer: {
    padding: 16,
  },
  calendar: {
    gap: 4,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  dayHeader: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  dayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  selectedDay: {
    backgroundColor: '#3b82f6',
  },
  disabledDay: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledDayText: {
    color: '#9ca3af',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
});
