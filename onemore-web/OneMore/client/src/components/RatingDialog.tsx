import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";

const ratingSchema = z.object({
  rating: z.number().min(0).max(5),
});

type RatingFormData = z.infer<typeof ratingSchema>;

interface RatingDialogProps {
  eventId: string;
  organizerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RatingDialog({ 
  eventId, 
  organizerName, 
  open, 
  onOpenChange 
}: RatingDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRating, setSelectedRating] = useState<number>(0);

  const form = useForm<RatingFormData>({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      rating: 0,
    },
  });

  // Check rating eligibility
  const { data: eligibility, isLoading: checkingEligibility } = useQuery({
    queryKey: ['/api/events', eventId, 'rating', 'eligibility'],
    enabled: open,
  });

  // Get existing rating for prefilling
  const { data: existingRating } = useQuery({
    queryKey: ['/api/events', eventId, 'rating', 'me'],
    enabled: open,
  });

  // Set existing rating when data loads
  useEffect(() => {
    if (existingRating?.rating !== undefined) {
      setSelectedRating(existingRating.rating);
      form.setValue('rating', existingRating.rating);
    }
  }, [existingRating, form]);

  const submitRatingMutation = useMutation({
    mutationFn: async (data: RatingFormData) => {
      return apiRequest('POST', `/api/events/${eventId}/rating`, data);
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'rating'] });
      
      toast({
        title: "Rating submitted",
        description: `Thank you for rating ${organizerName}!`,
      });
      
      onOpenChange(false);
      form.reset();
      setSelectedRating(0);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit rating",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleStarClick = (rating: number) => {
    setSelectedRating(rating);
    form.setValue('rating', rating, { shouldValidate: true });
  };

  const onSubmit = (data: RatingFormData) => {
    submitRatingMutation.mutate(data);
  };

  // Show loading state while checking eligibility
  if (checkingEligibility) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center p-6">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2">Checking eligibility...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show eligibility error if not eligible
  if (eligibility && !eligibility.eligible) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cannot Rate Event</DialogTitle>
            <DialogDescription>{eligibility.reason}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} data-testid="button-close-eligibility">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate {organizerName}</DialogTitle>
          <DialogDescription>
            How was your experience with this event organizer?
            {existingRating && " (You can update your previous rating)"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <div className="flex items-center justify-center space-x-1 py-4">
                      {[0, 1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleStarClick(star)}
                          className="touch-target p-1 transition-transform hover:scale-110"
                          data-testid={`star-${star}`}
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= selectedRating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <div className="text-center text-sm text-muted-foreground">
                    {selectedRating === 0 && "No Rating"}
                    {selectedRating === 1 && "Poor"}
                    {selectedRating === 2 && "Fair"}
                    {selectedRating === 3 && "Good"}
                    {selectedRating === 4 && "Very Good"}
                    {selectedRating === 5 && "Excellent"}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-rating"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitRatingMutation.isPending}
                data-testid="button-submit-rating"
              >
                {submitRatingMutation.isPending ? "Submitting..." : 
                 existingRating ? "Update Rating" : "Submit Rating"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}