import { Search, Calendar, MessageCircle, User } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

export function BottomNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['/api/messages/unread-count'],
    enabled: !!user,
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchIntervalInBackground: false, // Pause when tab is hidden
  });

  const totalUnreadCount = user ? (unreadData?.count || 0) : 0;

  const isActive = (path: string) => location === path;

  const getActiveClasses = (path: string) => {
    return isActive(path) 
      ? "text-primary" 
      : "text-muted-foreground hover:text-foreground";
  };

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-center justify-around px-4 py-2">
        <Link href="/">
          <button 
            data-testid="nav-discover"
            className={`flex flex-col items-center space-y-1 py-2 touch-target ${getActiveClasses('/')}`}
          >
            <Search className="w-5 h-5" />
            <span className="text-xs font-medium">Discover</span>
          </button>
        </Link>
        
        <Link href="/my-events">
          <button 
            data-testid="nav-my-events"
            className={`flex flex-col items-center space-y-1 py-2 touch-target ${getActiveClasses('/my-events')}`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-medium">My Events</span>
          </button>
        </Link>


        <Link href="/messages">
          <button 
            data-testid="nav-messages"
            className={`flex flex-col items-center space-y-1 py-2 touch-target relative ${getActiveClasses('/messages')}`}
          >
            <div className="relative">
              <MessageCircle className="w-5 h-5" />
              {totalUnreadCount > 0 && (
                <span 
                  data-testid="badge-total-unread"
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
                >
                  {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">Messages</span>
          </button>
        </Link>

        <Link href="/profile">
          <button 
            data-testid="nav-profile"
            className={`flex flex-col items-center space-y-1 py-2 touch-target ${getActiveClasses('/profile')}`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </Link>
      </div>
    </nav>
  );
}
