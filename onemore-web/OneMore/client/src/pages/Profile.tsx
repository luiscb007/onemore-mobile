import { ArrowLeft, LogOut, MapPin, TrendingUp, Users, Star, Trash2, MessageSquare } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { BottomNavigation } from '@/components/BottomNavigation';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchRadius, setSearchRadius] = useState(100);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionFeedback, setDeletionFeedback] = useState('');

  const { data: stats } = useQuery<{ eventsCreated: number; eventsAttended: number; averageRating: number }>({
    queryKey: ['/api/users', user?.id, 'stats'],
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (user?.searchRadius !== undefined) {
      setSearchRadius(user.searchRadius);
    }
  }, [user?.searchRadius]);

  const updateRadiusMutation = useMutation({
    mutationFn: async (radius: number) => {
      return apiRequest('PUT', '/api/user/search-radius', { radius });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
  });

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const sendFeedbackMutation = useMutation({
    mutationFn: async (feedbackText: string) => {
      return apiRequest('POST', '/api/feedback', { feedback: feedbackText });
    },
    onSuccess: () => {
      toast({
        title: "Thank you!",
        description: "Your feedback has been sent successfully.",
      });
      setFeedback('');
      setFeedbackDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', '/api/user/delete', { 
        reason: deletionReason,
        feedback: deletionFeedback 
      });
    },
    onSuccess: () => {
      window.location.href = '/';
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getFullName = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return 'User';
    return `${firstName || ''} ${lastName || ''}`.trim();
  };

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/">
            <button className="touch-target p-2 -ml-2" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Profile</h1>
          <div className="w-9" /> {/* Spacer for center alignment */}
        </div>
      </header>

      <div className="p-4 space-y-6 pb-20">
        {/* User Info Card */}
        <Card>
          <CardHeader className="text-center">
            <Avatar className="w-20 h-20 mx-auto mb-4">
              <AvatarImage 
                src={user?.profileImageUrl || undefined} 
                alt={getFullName(user?.firstName, user?.lastName)}
              />
              <AvatarFallback className="text-lg">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <CardTitle data-testid="text-user-name">
              {getFullName(user?.firstName, user?.lastName)}
            </CardTitle>
            {user?.email && (
              <p className="text-muted-foreground" data-testid="text-user-email">
                {user.email}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-bold" data-testid="text-events-created">
                  {stats?.eventsCreated || 0}
                </div>
                <div className="text-xs text-muted-foreground">Events Created</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-bold" data-testid="text-events-attended">
                  {stats?.eventsAttended || 0}
                </div>
                <div className="text-xs text-muted-foreground">Events Attended</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Star className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-bold" data-testid="text-average-rating">
                  {stats?.eventsCreated && stats?.averageRating ? stats.averageRating.toFixed(1) : '-'}
                </div>
                <div className="text-xs text-muted-foreground">Avg Rating</div>
              </div>
            </div>

            {/* Search Radius Slider */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Search Radius</span>
                <span className="text-sm text-primary font-semibold" data-testid="text-search-radius">
                  {searchRadius} km
                </span>
              </div>
              <Slider
                data-testid="slider-search-radius"
                value={[searchRadius]}
                onValueChange={(value) => setSearchRadius(value[0])}
                onValueCommit={(value) => updateRadiusMutation.mutate(value[0])}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 km</span>
                <span>100 km</span>
              </div>
            </div>
            
            {user?.currentLatitude && user?.currentLongitude && (
              <div className="flex items-center space-x-2 pt-2 border-t">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground" data-testid="text-user-location">
                  {parseFloat(user.currentLatitude).toFixed(3)}, {parseFloat(user.currentLongitude).toFixed(3)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardHeader>
            <CardTitle>About OneMore</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              OneMore helps you discover local events and connect with your community. 
              Whether you're looking to attend events or organize them, we make it easy to find your tribe.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🎨</span>
                <span>Discover arts, culture, and creative events</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🤝</span>
                <span>Connect with your local community</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">⚽</span>
                <span>Find sports and fitness activities</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">📚</span>
                <span>Learn through workshops and classes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Dialog */}
        <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline"
              className="w-full"
              data-testid="button-give-feedback"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Give us feedback
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Feedback</DialogTitle>
              <DialogDescription>
                Help us improve OneMore by sharing your thoughts and suggestions.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Tell us what you think..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[120px]"
              data-testid="input-feedback"
            />
            <DialogFooter>
              <Button
                onClick={() => sendFeedbackMutation.mutate(feedback)}
                disabled={!feedback.trim() || sendFeedbackMutation.isPending}
                data-testid="button-submit-feedback"
              >
                {sendFeedbackMutation.isPending ? 'Sending...' : 'Send Feedback'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Logout Button */}
        <Button 
          onClick={handleLogout}
          variant="outline"
          className="w-full"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>

        {/* Delete Account Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              data-testid="button-delete-account"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account and remove all your data including events, interactions, messages, and ratings from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Why are you leaving? (optional)</Label>
                <RadioGroup value={deletionReason} onValueChange={setDeletionReason}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not-enough-events" id="not-enough-events" data-testid="radio-not-enough-events" />
                    <Label htmlFor="not-enough-events" className="font-normal cursor-pointer">Not enough events in my area</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not-using" id="not-using" data-testid="radio-not-using" />
                    <Label htmlFor="not-using" className="font-normal cursor-pointer">Not using the app anymore</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="privacy-concerns" id="privacy-concerns" data-testid="radio-privacy-concerns" />
                    <Label htmlFor="privacy-concerns" className="font-normal cursor-pointer">Privacy concerns</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deletion-feedback" className="text-sm font-medium">Additional feedback (optional)</Label>
                <Textarea
                  id="deletion-feedback"
                  placeholder="Tell us more about your decision..."
                  value={deletionFeedback}
                  onChange={(e) => setDeletionFeedback(e.target.value)}
                  className="min-h-[80px]"
                  data-testid="input-deletion-feedback"
                />
              </div>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteAccountMutation.mutate()}
                disabled={deleteAccountMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
