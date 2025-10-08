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
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { useNavigation } from '@react-navigation/native';
import { eventsApi } from '../api/events';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { CalendarPicker } from '../components/CalendarPicker';
import { TimePicker } from '../components/TimePicker';
import { OptionPicker } from '../components/OptionPicker';
import { useAuth } from '../contexts/AuthContext';
import type { EventCategory } from '../types';

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  date: z.date(),
  time: z.date(),
  address: z.string().min(1, 'Address is required'),
  latitude: z.string().min(1, 'Location coordinates required'),
  longitude: z.string().min(1, 'Location coordinates required'),
  priceAmount: z.string().optional().default(''),
  priceCurrencyCode: z.string().optional().default('EUR'),
  capacity: z.string().optional().default(''),
  isRecurring: z.boolean().default(false),
  recurrenceType: z.string().nullable(),
  recurrenceEndDate: z.date().nullable(),
}).superRefine((data, ctx) => {
  // Validate recurrence type is selected when recurring
  if (data.isRecurring) {
    if (!data.recurrenceType || data.recurrenceType === '' || data.recurrenceType === 'none') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Recurrence pattern is required when recurring is enabled',
        path: ['recurrenceType'],
      });
    }
    
    if (!data.recurrenceEndDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date is required when recurring is enabled',
        path: ['recurrenceEndDate'],
      });
    }
    
    // Check 2-month maximum constraint
    if (data.recurrenceEndDate && data.date) {
      const twoMonthsLater = new Date(data.date);
      twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
      if (data.recurrenceEndDate > twoMonthsLater) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End date must be within 2 months of start date',
          path: ['recurrenceEndDate'],
        });
      }
    }
  }
});

type CreateEventForm = z.infer<typeof createEventSchema>;

const categories = [
  { value: 'arts', label: '🎨 Arts' },
  { value: 'community', label: '🤝 Community' },
  { value: 'culture', label: '🎭 Culture' },
  { value: 'sports', label: '⚽ Sports' },
  { value: 'workshops', label: '📚 Workshops' },
];

const currencies = [
  { value: 'EUR', label: '€ EUR' },
  { value: 'PLN', label: 'zł PLN' },
  { value: 'GBP', label: '£ GBP' },
  { value: 'USD', label: '$ USD' },
];

const recurrenceOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
];

export const CreateEventScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRecurrenceEndPicker, setShowRecurrenceEndPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);

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
      latitude: '',
      longitude: '',
      priceAmount: '',
      priceCurrencyCode: user?.defaultCurrencyCode || 'EUR',
      capacity: '',
      isRecurring: false,
      recurrenceType: null,
      recurrenceEndDate: null,
    },
  });

  const isRecurring = watch('isRecurring');

  // Update currency when user's default currency changes (location-based)
  React.useEffect(() => {
    if (user?.defaultCurrencyCode) {
      setValue('priceCurrencyCode', user.defaultCurrencyCode);
    }
  }, [user?.defaultCurrencyCode, setValue]);

  const createEventMutation = useMutation({
    mutationFn: async (data: CreateEventForm) => {
      const dateTime = new Date(data.date);
      dateTime.setHours(data.time.getHours(), data.time.getMinutes(), 0, 0);

      // Format time as HH:MM string (required by backend)
      const hours = data.time.getHours().toString().padStart(2, '0');
      const minutes = data.time.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      const eventData = {
        title: data.title,
        description: data.description,
        category: data.category as EventCategory,
        date: dateTime.toISOString(),
        time: timeString,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        priceAmount: data.priceAmount || null,
        priceCurrencyCode: data.priceCurrencyCode || 'EUR',
        capacity: data.capacity ? parseInt(data.capacity, 10) : null,
        isRecurring: data.isRecurring,
        recurrenceType: data.isRecurring ? (data.recurrenceType || null) : null,
        recurrenceEndDate: data.isRecurring && data.recurrenceEndDate 
          ? data.recurrenceEndDate.toISOString() 
          : null,
      };

      console.log('Sending event data:', JSON.stringify(eventData, null, 2));
      return await eventsApi.createEvent(eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      Alert.alert('Success', 'Event created successfully! 🎉');
      navigation.goBack();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create event';
      const errors = error.response?.data?.errors;
      console.error('Event creation error:', JSON.stringify(error.response?.data, null, 2));
      
      if (errors && errors.length > 0) {
        const errorDetails = errors.map((e: any) => `${e.path?.join('.')}: ${e.message}`).join('\n');
        Alert.alert('Error', `${message}\n\n${errorDetails}`);
      } else {
        Alert.alert('Error', message);
      }
    },
  });

  const onSubmit: SubmitHandler<CreateEventForm> = (data) => {
    createEventMutation.mutate(data);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
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
                <>
                  <TouchableOpacity
                    style={[styles.input, styles.selectButton]}
                    onPress={() => setShowCategoryPicker(true)}
                  >
                    <Text style={styles.selectButtonText}>
                      {categories.find(c => c.value === value)?.label || 'Select category'}
                    </Text>
                  </TouchableOpacity>
                  <OptionPicker
                    visible={showCategoryPicker}
                    value={value}
                    options={categories}
                    onSelect={onChange}
                    onClose={() => setShowCategoryPicker(false)}
                    title="Select Category"
                  />
                </>
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
                    <CalendarPicker
                      visible={showDatePicker}
                      value={value}
                      onSelect={(date) => setValue('date', date)}
                      onClose={() => setShowDatePicker(false)}
                    />
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
                    <TimePicker
                      visible={showTimePicker}
                      value={value}
                      onSelect={(time) => setValue('time', time)}
                      onClose={() => setShowTimePicker(false)}
                    />
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
              render={({ field: { onChange, value } }) => (
                <AddressAutocomplete
                  value={value}
                  onChange={onChange}
                  onSelectAddress={(address, lat, lon) => {
                    onChange(address);
                    setValue('latitude', lat);
                    setValue('longitude', lon);
                  }}
                  onClearCoordinates={() => {
                    setValue('latitude', '');
                    setValue('longitude', '');
                  }}
                  placeholder="Search for event location..."
                  error={!!errors.address}
                />
              )}
            />
            {errors.address && <Text style={styles.errorText}>{errors.address.message}</Text>}
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
                  <>
                    <TouchableOpacity
                      style={[styles.input, styles.selectButton]}
                      onPress={() => setShowCurrencyPicker(true)}
                    >
                      <Text style={styles.selectButtonText}>
                        {currencies.find(c => c.value === value)?.label || 'Select'}
                      </Text>
                    </TouchableOpacity>
                    <OptionPicker
                      visible={showCurrencyPicker}
                      value={value}
                      options={currencies}
                      onSelect={onChange}
                      onClose={() => setShowCurrencyPicker(false)}
                      title="Select Currency"
                    />
                  </>
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
                    <>
                      <TouchableOpacity
                        style={[styles.input, styles.selectButton]}
                        onPress={() => setShowRecurrencePicker(true)}
                      >
                        <Text style={styles.selectButtonText}>
                          {recurrenceOptions.find(r => r.value === value)?.label || 'Select pattern'}
                        </Text>
                      </TouchableOpacity>
                      <OptionPicker
                        visible={showRecurrencePicker}
                        value={value || ''}
                        options={recurrenceOptions}
                        onSelect={onChange}
                        onClose={() => setShowRecurrencePicker(false)}
                        title="Select Recurrence Pattern"
                      />
                    </>
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
                      <CalendarPicker
                        visible={showRecurrenceEndPicker}
                        value={value || new Date()}
                        onSelect={(date) => setValue('recurrenceEndDate', date)}
                        onClose={() => setShowRecurrenceEndPicker(false)}
                        minimumDate={watch('date')}
                      />
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
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
  selectButton: {
    justifyContent: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#1e293b',
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
