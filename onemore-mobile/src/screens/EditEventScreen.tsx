import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { eventsApi } from '../api/events';

const editEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  date: z.date(),
  time: z.date(),
  address: z.string().min(1, 'Address is required'),
  latitude: z.string().min(1, 'Location coordinates required'),
  longitude: z.string().min(1, 'Location coordinates required'),
  priceAmount: z.string().optional(),
  priceCurrencyCode: z.string().default('EUR'),
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

type EditEventForm = z.infer<typeof editEventSchema>;

const categories = [
  'arts',
  'community',
  'culture',
  'sports',
  'workshops',
];

export const EditEventScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { eventId } = route.params as { eventId: string };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRecurrenceEndPicker, setShowRecurrenceEndPicker] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.getEventById(eventId),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EditEventForm>({
    resolver: zodResolver(editEventSchema),
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
      priceCurrencyCode: 'EUR',
      capacity: '',
      isRecurring: false,
      recurrenceType: null,
      recurrenceEndDate: null,
    },
  });

  useEffect(() => {
    if (event) {
      setValue('title', event.title);
      setValue('description', event.description);
      setValue('category', event.category);
      setValue('date', new Date(event.date));
      const eventTime = new Date(event.date);
      setValue('time', eventTime);
      setValue('address', event.address);
      setValue('latitude', event.latitude);
      setValue('longitude', event.longitude);
      if (event.priceAmount) setValue('priceAmount', event.priceAmount);
      if (event.priceCurrencyCode) setValue('priceCurrencyCode', event.priceCurrencyCode);
      if (event.capacity) setValue('capacity', event.capacity.toString());
      if (event.recurrenceType) {
        setValue('isRecurring', true);
        setValue('recurrenceType', event.recurrenceType);
        if (event.recurrenceEndDate) {
          setValue('recurrenceEndDate', new Date(event.recurrenceEndDate));
        }
      }
    }
  }, [event, setValue]);

  const updateEventMutation = useMutation({
    mutationFn: async (data: EditEventForm) => {
      const eventDateTime = new Date(data.date);
      eventDateTime.setHours(data.time.getHours(), data.time.getMinutes());

      const payload = {
        title: data.title,
        description: data.description,
        category: data.category,
        date: eventDateTime.toISOString(),
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        priceAmount: data.priceAmount || null,
        priceCurrencyCode: data.priceCurrencyCode || 'EUR',
        capacity: data.capacity ? parseInt(data.capacity) : null,
        recurrenceType: data.isRecurring ? data.recurrenceType : null,
        recurrenceEndDate: data.isRecurring && data.recurrenceEndDate
          ? data.recurrenceEndDate.toISOString()
          : null,
      };

      return eventsApi.updateEvent(eventId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-events'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      navigation.goBack();
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: () => eventsApi.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      navigation.goBack();
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteEventMutation.mutate(),
        },
      ]
    );
  };

  const isRecurring = watch('isRecurring');

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Event</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={styles.deleteButton}>Delete</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Title *</Text>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="Event title"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Description *</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.textArea, errors.description && styles.inputError]}
                placeholder="Event description"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            )}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}
        </View>

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
                    <Picker.Item
                      key={cat}
                      label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                      value={cat}
                    />
                  ))}
                </Picker>
              </View>
            )}
          />
        </View>

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
                      minimumDate={new Date()}
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
                  if (value && value.length > 0) {
                    setValue('latitude', '37.7749');
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
            ⚠️ Location coordinates need geocoding integration
          </Text>
        </View>

        <View style={styles.rowContainer}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Price</Text>
            <Controller
              control={control}
              name="priceAmount"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="decimal-pad"
                />
              )}
            />
          </View>

          <View style={styles.halfField}>
            <Text style={styles.label}>Capacity</Text>
            <Controller
              control={control}
              name="capacity"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Unlimited"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="number-pad"
                />
              )}
            />
          </View>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Recurring Event</Text>
          <Controller
            control={control}
            name="isRecurring"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                style={[styles.switch, value && styles.switchActive]}
                onPress={() => onChange(!value)}
              >
                <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
              </TouchableOpacity>
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

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelActionButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelActionButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              updateEventMutation.isPending && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit((data) => updateEventMutation.mutate(data))}
            disabled={updateEventMutation.isPending}
          >
            <Text style={styles.submitButtonText}>
              {updateEventMutation.isPending ? 'Updating...' : 'Update Event'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  cancelButton: {
    fontSize: 16,
    color: '#64748b',
  },
  deleteButton: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '500',
  },
  form: {
    padding: 16,
    paddingBottom: 100,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    minHeight: 100,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  halfField: {
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  switch: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#cbd5e1',
    padding: 2,
  },
  switchActive: {
    backgroundColor: '#22c55e',
  },
  switchThumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
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
  cancelActionButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
