import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation as useRouterLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { isUnauthorizedError } from '@/lib/authUtils';
import { apiRequest, ApiError } from '@/lib/queryClient';
import { baseEventFormSchema, type Currency } from '@shared/schema';
import { z } from 'zod';

const createEventSchema = baseEventFormSchema.omit({
  organizerId: true,
}).extend({
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  address: z.string().min(1, 'Address is required'),
  priceAmount: z.union([
    z.string().transform(val => val === '' ? null : parseFloat(val)),
    z.number(),
    z.null()
  ]).nullable(),
  capacity: z.union([
    z.string().transform(val => val === '' ? undefined : parseInt(val, 10)),
    z.number(),
    z.undefined()
  ]).optional(),
  recurrenceEndDate: z.string().nullable(),
});

type CreateEventForm = z.infer<typeof createEventSchema>;

const categories = [
  { value: 'arts', label: '🎨 Arts' },
  { value: 'community', label: '🤝 Community' },
  { value: 'culture', label: '🎭 Culture' },
  { value: 'sports', label: '⚽ Sports' },
  { value: 'workshops', label: '📚 Workshops' },
];

export default function CreateEvent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useRouterLocation();
  const queryClient = useQueryClient();

  const { data: currencies, isLoading: currenciesLoading } = useQuery<Currency[]>({
    queryKey: ['/api/currencies'],
    staleTime: 1000 * 60 * 60,
  });

  const defaultCurrency = user?.defaultCurrencyCode || 'EUR';

  const form = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'community',
      date: new Date().toISOString().split('T')[0],
      time: '18:00',
      latitude: '37.7749',
      longitude: '-122.4194',
      address: '',
      priceAmount: null,
      priceCurrencyCode: defaultCurrency,
      capacity: undefined,
      isRecurring: false,
      recurrenceType: null,
      recurrenceEndDate: null,
    },
  });

  useEffect(() => {
    if (user?.defaultCurrencyCode) {
      form.setValue('priceCurrencyCode', user.defaultCurrencyCode);
    }
  }, [user, form]);

  const createEventMutation = useMutation({
    mutationFn: async (data: CreateEventForm) => {
      const eventDateTime = new Date(`${data.date}T${data.time}`);
      
      const eventData = {
        ...data,
        date: eventDateTime.toISOString(),
        latitude: data.latitude,
        longitude: data.longitude,
        priceAmount: data.priceAmount !== null ? String(data.priceAmount) : null,
        priceCurrencyCode: data.priceCurrencyCode,
        capacity: data.capacity ?? null,
        isRecurring: data.isRecurring || false,
        recurrenceType: data.isRecurring ? data.recurrenceType : null,
        recurrenceEndDate: data.isRecurring && data.recurrenceEndDate 
          ? new Date(`${data.recurrenceEndDate}T23:59:59`).toISOString() 
          : null,
      };

      const result = await apiRequest('POST', '/api/events', eventData);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events/organizer', user?.id] });
      toast({
        title: "Success",
        description: "Event created successfully! 🎉",
      });
      navigate('/');
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      // Handle validation errors from backend
      if (error instanceof ApiError && error.errors) {
        // Set form errors for specific fields
        error.errors.forEach((err) => {
          const fieldName = err.path.join('.') as any;
          if (fieldName && form.setError) {
            form.setError(fieldName, {
              type: 'manual',
              message: err.message,
            });
          }
        });
        toast({
          title: "Validation Error",
          description: "Please fix the highlighted errors and try again.",
          variant: "destructive",
        });
      } else {
        // Generic error message
        toast({
          title: "Error",
          description: error instanceof ApiError ? error.message : "Failed to create event. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: CreateEventForm) => {
    createEventMutation.mutate(data);
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleBack}
            className="touch-target p-2 -ml-2"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Create Event</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="p-4 pb-20">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter event title" 
                          {...field} 
                          data-testid="input-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your event"
                          rows={3}
                          {...field}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            data-testid="input-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            {...field}
                            data-testid="input-time"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Recurring Event</FormLabel>
                        <FormDescription className="text-sm">
                          Create a recurring event (max 2 months duration)
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-recurring"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch('isRecurring') && (
                  <>
                    <FormField
                      control={form.control}
                      name="recurrenceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recurrence Pattern</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="select-recurrence-type">
                                <SelectValue placeholder="Select pattern" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Biweekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recurrenceEndDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value || null)}
                              min={form.watch('date')}
                              data-testid="input-recurrence-end-date"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Maximum 2 months from start date
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <AddressAutocomplete
                          value={field.value}
                          onChange={field.onChange}
                          onSelectAddress={(address, lat, lon) => {
                            field.onChange(address);
                            form.setValue('latitude', lat);
                            form.setValue('longitude', lon);
                          }}
                          placeholder="Search for event location..."
                          data-testid="input-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input type="hidden" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input type="hidden" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Price</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priceAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value === '' ? null : parseFloat(value));
                              }}
                              data-testid="input-price-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priceCurrencyCode"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} value={field.value || defaultCurrency}>
                            <FormControl>
                              <SelectTrigger data-testid="select-currency">
                                <SelectValue placeholder="Currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currenciesLoading ? (
                                <SelectItem value={defaultCurrency} disabled>
                                  Loading...
                                </SelectItem>
                              ) : currencies && currencies.length > 0 ? (
                                currencies.map((currency) => (
                                  <SelectItem key={currency.code} value={currency.code}>
                                    {currency.symbol} {currency.code}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="EUR">€ EUR</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Leave amount empty for free events</p>
                </div>

                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="50"
                          {...field}
                          value={field.value ?? ''}
                          data-testid="input-capacity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createEventMutation.isPending}
                    className="flex-1"
                    data-testid="button-create"
                  >
                    {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
