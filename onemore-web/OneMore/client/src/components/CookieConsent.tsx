import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Link } from 'wouter';

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setTimeout(() => setShow(true), 1000);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShow(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-background/98 border-t border-border shadow-lg z-50 p-4 animate-in slide-in-from-bottom-5"
      data-testid="cookie-consent-banner"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">🍪 We Use Cookies</h3>
            <p className="text-sm text-muted-foreground mb-3">
              We use essential cookies to keep you signed in and functional cookies to remember your preferences (currency, search radius). 
              We also use analytics cookies to improve our service. By clicking "Accept", you consent to our use of cookies. 
              See our <Link href="/privacy-policy" className="text-primary underline">Privacy Policy</Link> for more details.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button 
                size="sm" 
                onClick={acceptCookies}
                data-testid="button-accept-cookies"
              >
                Accept All
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={declineCookies}
                data-testid="button-decline-cookies"
              >
                Essential Only
              </Button>
              <Link href="/privacy-policy">
                <Button 
                  size="sm" 
                  variant="ghost"
                  data-testid="button-cookie-settings"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={declineCookies}
            data-testid="button-close-cookies"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
