import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation as useRouterLocation, useRoute } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { isUnauthorizedError } from '@/lib/authUtils';
import { apiRequest, ApiError } from '@/lib/queryClient';
import { baseEventFormSchema, type Currency } from '@shared/schema';
import { z } from 'zod';
import type { Event } from '@shared/schema';

const editEventSchema = baseEventFormSchema.omit({
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
});

type EditEventForm = z.infer<typeof editEventSchema>;

const categories = [
  { value: 'arts', label: '🎨 Arts' },
  { value: 'community', label: '🤝 Community' },
  { value: 'culture', label: '🎭 Culture' },
  { value: 'sports', label: '⚽ Sports' },
  { value: 'workshops', label: '📚 Workshops' },
];

export default function EditEvent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useRouterLocation();
  const queryClient = useQueryClient();
  const [match, params] = useRoute('/edit-event/:id');
  const eventId = params?.id;

  const { data: currencies, isLoading: currenciesLoading } = useQuery<Currency[]>({
    queryKey: ['/api/currencies'],
    staleTime: 1000 * 60 * 60,
  });

  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
  });

  const defaultCurrency = user?.defaultCurrencyCode || 'EUR';

  const form = useForm<EditEventForm>({
    resolver: zodResolver(editEventSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'community',
      date: '',
      time: '',
      latitude: '37.7749',
      longitude: '-122.4194',
      address: '',
      priceAmount: null,
      priceCurrencyCode: defaultCurrency,
      capacity: undefined,
    },
  });

  useEffect(() => {
    if (event) {
      if (event.organizerId !== user?.id) {
        toast({
          title: "Error",
          description: "You can only edit your own events",
          variant: "destructive",
        });
        navigate('/my-events');
        return;
      }

      const eventDate = new Date(event.date);
      const dateString = eventDate.toISOString().split('T')[0];
      const timeString = eventDate.toTimeString().slice(0, 5);

      form.reset({
        title: event.title,
        description: event.description,
        category: event.category,
        date: dateString,
        time: timeString,
        latitude: event.latitude,
        longitude: event.longitude,
        address: event.address,
        priceAmount: event.priceAmount ? Number(event.priceAmount) : null,
        priceCurrencyCode: event.priceCurrencyCode || defaultCurrency,
        capacity: event.capacity || undefined,
      });
    }
  }, [event, user?.id, form, toast, navigate, defaultCurrency]);

  const updateEventMutation = useMutation({
    mutationFn: async (data: EditEventForm) => {
      if (!eventId) throw new Error('No event ID provided');
      
      const eventDateTime = new Date(`${data.date}T${data.time}`);
      
      const eventData = {
        ...data,
        date: eventDateTime.toISOString(),
        latitude: data.latitude,
        longitude: data.longitude,
        priceAmount: data.priceAmount !== null ? String(data.priceAmount) : null,
        priceCurrencyCode: data.priceCurrencyCode,
        capacity: data.capacity ?? null,
      };

      const result = await apiRequest('PUT', `/api/events/${eventId}`, eventData);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events/organizer', user?.id] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
      toast({
        title: "Success",
        description: "Event updated successfully! 🎉",
      });
      navigate('/my-events');
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
          description: error instanceof ApiError ? error.message : "Failed to update event. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: EditEventForm) => {
    updateEventMutation.mutate(data);
  };

  if (!match || !eventId) {
    return <div>Event not found</div>;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto bg-background min-h-screen">
        <div className="p-4 text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground">Failed to load event data</p>
          <Button onClick={() => navigate('/my-events')} className="mt-4">
            Back to My Events
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto bg-background min-h-screen">
        <div className="p-8 text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate('/my-events')}
            className="touch-target p-2 -ml-2" 
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Edit Event</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="p-4 pb-8">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select a category" />
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
                          className="min-h-[100px]"
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
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Event location address" 
                          {...field}
                          data-testid="input-address"
                        />
                      </FormControl>
                      <FormMessage />
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
                          value={field.value || ''}
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
                    onClick={() => navigate('/my-events')}
                    className="flex-1"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateEventMutation.isPending}
                    className="flex-1"
                    data-testid="button-update"
                  >
                    {updateEventMutation.isPending ? 'Updating...' : 'Update Event'}
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
