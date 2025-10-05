import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { eventsApi } from '../api/events';

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  date: z.date(),
  time: z.date(),
  address: z.string().min(1, 'Address is required'),
  latitude: z.string().min(1, 'Location coordinates required'),
  longitude: z.string().min(1, 'Location coordinates required'),
  priceAmount: z.string().optional(),
  priceCurrencyCode: z.string().default('USD'),
  capacity: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceType: z.string().nullable().refine(
    (val, ctx) => {
      const isRecurring = ctx.parent?.isRecurring;
      if (isRecurring && (!val || val === '')) {
        return false;
      }
      return true;
    },
    { message: 'Recurrence pattern is required when recurring is enabled' }
  ),
  recurrenceEndDate: z.date().nullable().refine(
    (val, ctx) => {
      const isRecurring = ctx.parent?.isRecurring;
      if (isRecurring && !val) {
        return false;
      }
      // Check 2-month maximum constraint
      if (isRecurring && val) {
        const startDate = ctx.parent?.date;
        if (startDate) {
          const twoMonthsLater = new Date(startDate);
          twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
          if (val > twoMonthsLater) {
            return false;
          }
        }
      }
      return true;
    },
    { message: 'End date must be within 2 months of start date' }
  ),
});

type CreateEventForm = z.infer<typeof createEventSchema>;

const categories = [
  { value: 'arts', label: '🎨 Arts' },
  { value: 'community', label: '🤝 Community' },
  { value: 'culture', label: '🎭 Culture' },
  { value: 'sports', label: '⚽ Sports' },
  { value: 'workshops', label: '📚 Workshops' },
];

export const CreateEventScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRecurrenceEndPicker, setShowRecurrenceEndPicker] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'community',
      date: new Date(),
      time: new Date(),
      address: '',
      latitude: '37.7749',
      longitude: '-122.4194',
      priceAmount: '',
      priceCurrencyCode: 'USD',
      capacity: '',
      isRecurring: false,
      recurrenceType: null,
      recurrenceEndDate: null,
    },
  });

  const isRecurring = watch('isRecurring');

  const createEventMutation = useMutation({
    mutationFn: async (data: CreateEventForm) => {
      const dateTime = new Date(data.date);
      dateTime.setHours(data.time.getHours(), data.time.getMinutes(), 0, 0);

      const eventData = {
        title: data.title,
        description: data.description,
        category: data.category,
        date: dateTime.toISOString(),
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        priceAmount: data.priceAmount ? parseFloat(data.priceAmount) : null,
        priceCurrencyCode: data.priceCurrencyCode,
        capacity: data.capacity ? parseInt(data.capacity, 10) : null,
        isRecurring: data.isRecurring,
        recurrenceType: data.isRecurring ? data.recurrenceType : null,
        recurrenceEndDate: data.isRecurring && data.recurrenceEndDate 
          ? data.recurrenceEndDate.toISOString() 
          : null,
      };

      return await eventsApi.createEvent(eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      Alert.alert('Success', 'Event created successfully! 🎉');
      navigation.goBack();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create event';
      Alert.alert('Error', message);
    },
  });

  const onSubmit = (data: CreateEventForm) => {
    createEventMutation.mutate(data);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Event Details</Text>

          {/* Title */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Event Title *</Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.title && styles.inputError]}
                  placeholder="Enter event title"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}
          </View>

          {/* Category */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Category *</Text>
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, value } }) => (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={value}
                    onValueChange={onChange}
                    style={styles.picker}
                  >
                    {categories.map((cat) => (
                      <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
                    ))}
                  </Picker>
                </View>
              )}
            />
            {errors.category && <Text style={styles.errorText}>{errors.category.message}</Text>}
          </View>

          {/* Description */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Description *</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.textArea, errors.description && styles.inputError]}
                  placeholder="Describe your event"
                  multiline
                  numberOfLines={4}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description.message}</Text>
            )}
          </View>

          {/* Date & Time */}
          <View style={styles.rowContainer}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Date *</Text>
              <Controller
                control={control}
                name="date"
                render={({ field: { value } }) => (
                  <>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text>{value.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={value}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                          setShowDatePicker(Platform.OS === 'ios');
                          if (selectedDate) {
                            setValue('date', selectedDate);
                          }
                        }}
                      />
                    )}
                  </>
                )}
              />
            </View>

            <View style={styles.halfField}>
              <Text style={styles.label}>Time *</Text>
              <Controller
                control={control}
                name="time"
                render={({ field: { value } }) => (
                  <>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Text>{value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </TouchableOpacity>
                    {showTimePicker && (
                      <DateTimePicker
                        value={value}
                        mode="time"
                        display="default"
                        onChange={(event, selectedTime) => {
                          setShowTimePicker(Platform.OS === 'ios');
                          if (selectedTime) {
                            setValue('time', selectedTime);
                          }
                        }}
                      />
                    )}
                  </>
                )}
              />
            </View>
          </View>

          {/* Address */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Address *</Text>
            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.address && styles.inputError]}
                  placeholder="Enter event location"
                  onBlur={(e) => {
                    onBlur();
                    // TODO: Implement geocoding to get lat/lng from address
                    // For now, using default coordinates
                    if (value && value.length > 0) {
                      setValue('latitude', '37.7749'); // San Francisco default
                      setValue('longitude', '-122.4194');
                    }
                  }}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.address && <Text style={styles.errorText}>{errors.address.message}</Text>}
            <Text style={styles.warningText}>
              ⚠️ Location coordinates need geocoding integration. Using default coordinates for now.
            </Text>
          </View>

          {/* Price */}
          <View style={styles.rowContainer}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Price Amount</Text>
              <Controller
                control={control}
                name="priceAmount"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </View>

            <View style={styles.halfField}>
              <Text style={styles.label}>Currency</Text>
              <Controller
                control={control}
                name="priceCurrencyCode"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={value}
                      onValueChange={onChange}
                      style={styles.picker}
                    >
                      <Picker.Item label="$ USD" value="USD" />
                      <Picker.Item label="€ EUR" value="EUR" />
                      <Picker.Item label="£ GBP" value="GBP" />
                    </Picker>
                  </View>
                )}
              />
            </View>
          </View>
          <Text style={styles.helperText}>Leave amount empty for free events</Text>

          {/* Capacity */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Capacity (Optional)</Text>
            <Controller
              control={control}
              name="capacity"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="50"
                  keyboardType="number-pad"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </View>

          {/* Recurring Event */}
          <View style={styles.switchContainer}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.label}>Recurring Event</Text>
              <Text style={styles.helperText}>Create a recurring event</Text>
            </View>
            <Controller
              control={control}
              name="isRecurring"
              render={({ field: { onChange, value } }) => (
                <Switch value={value} onValueChange={onChange} />
              )}
            />
          </View>

          {isRecurring && (
            <>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Recurrence Pattern *</Text>
                <Controller
                  control={control}
                  name="recurrenceType"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={value || 'none'}
                        onValueChange={(val) => onChange(val === 'none' ? null : val)}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select pattern" value="none" />
                        <Picker.Item label="Weekly" value="weekly" />
                        <Picker.Item label="Biweekly" value="biweekly" />
                        <Picker.Item label="Monthly" value="monthly" />
                      </Picker>
                    </View>
                  )}
                />
                {errors.recurrenceType && (
                  <Text style={styles.errorText}>{errors.recurrenceType.message}</Text>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>End Date *</Text>
                <Controller
                  control={control}
                  name="recurrenceEndDate"
                  render={({ field: { value } }) => (
                    <>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowRecurrenceEndPicker(true)}
                      >
                        <Text>
                          {value ? value.toLocaleDateString() : 'Select end date'}
                        </Text>
                      </TouchableOpacity>
                      {showRecurrenceEndPicker && (
                        <DateTimePicker
                          value={value || new Date()}
                          mode="date"
                          display="default"
                          minimumDate={watch('date')}
                          onChange={(event, selectedDate) => {
                            setShowRecurrenceEndPicker(Platform.OS === 'ios');
                            if (selectedDate) {
                              setValue('recurrenceEndDate', selectedDate);
                            }
                          }}
                        />
                      )}
                    </>
                  )}
                />
                {errors.recurrenceEndDate && (
                  <Text style={styles.errorText}>{errors.recurrenceEndDate.message}</Text>
                )}
                <Text style={styles.helperText}>Maximum 2 months from start date</Text>
              </View>
            </>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit(onSubmit)}
              disabled={createEventMutation.isPending}
            >
              <Text style={styles.submitButtonText}>
                {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfField: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
  },
  switchTextContainer: {
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
