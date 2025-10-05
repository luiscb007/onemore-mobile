import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Landing() {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="space-y-2">
            <div 
              className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/30 transform hover:scale-105 transition-transform"
              data-testid="logo-1plus"
              aria-label="OneMore app logo"
            >
              <span className="text-white font-black text-2xl tracking-tighter">1+</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">OneMore</h1>
            <p className="text-muted-foreground">
              Discover local events and connect with your community
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-1">🎨</div>
                <div className="font-medium">Arts & Culture</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">🤝</div>
                <div className="font-medium">Community</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">⚽</div>
                <div className="font-medium">Sports</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">📚</div>
                <div className="font-medium">Workshops</div>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleLogin}
            className="w-full"
            data-testid="button-login"
          >
            Get Started
          </Button>

          <p className="text-xs text-muted-foreground">
            Find events near you or create your own to bring people together
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
