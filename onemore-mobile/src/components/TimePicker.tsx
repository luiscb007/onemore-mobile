import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

interface TimePickerProps {
  visible: boolean;
  value: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  visible,
  value,
  onSelect,
  onClose,
}) => {
  const [selectedHour, setSelectedHour] = useState(value.getHours());
  const [selectedMinute, setSelectedMinute] = useState(value.getMinutes());
  
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      setSelectedHour(value.getHours());
      setSelectedMinute(value.getMinutes());
    }
  }, [visible, value]);

  const handleConfirm = () => {
    const newDate = new Date(value);
    newDate.setHours(selectedHour, selectedMinute, 0, 0);
    onSelect(newDate);
    onClose();
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Time</Text>
          </View>

          {/* Time display */}
          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>
              {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}
            </Text>
          </View>

          {/* Time pickers */}
          <View style={styles.pickerContainer}>
            {/* Hours */}
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Hours</Text>
              <ScrollView
                ref={hourScrollRef}
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
              >
                {hours.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.timeItem,
                      selectedHour === hour && styles.selectedTimeItem,
                    ]}
                    onPress={() => setSelectedHour(hour)}
                  >
                    <Text
                      style={[
                        styles.timeItemText,
                        selectedHour === hour && styles.selectedTimeItemText,
                      ]}
                    >
                      {String(hour).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Separator */}
            <Text style={styles.separator}>:</Text>

            {/* Minutes */}
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Minutes</Text>
              <ScrollView
                ref={minuteScrollRef}
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
              >
                {minutes.map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.timeItem,
                      selectedMinute === minute && styles.selectedTimeItem,
                    ]}
                    onPress={() => setSelectedMinute(minute)}
                  >
                    <Text
                      style={[
                        styles.timeItemText,
                        selectedMinute === minute && styles.selectedTimeItemText,
                      ]}
                    >
                      {String(minute).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
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
    width: '85%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  timeDisplay: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  timeText: {
    fontSize: 48,
    fontWeight: '600',
    color: '#3b82f6',
    fontVariant: ['tabular-nums'],
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  scrollView: {
    height: 200,
    width: '100%',
  },
  timeItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedTimeItem: {
    backgroundColor: '#3b82f6',
  },
  timeItemText: {
    fontSize: 18,
    color: '#333',
  },
  selectedTimeItemText: {
    color: '#fff',
    fontWeight: '600',
  },
  separator: {
    fontSize: 32,
    fontWeight: '600',
    color: '#6b7280',
    marginHorizontal: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
