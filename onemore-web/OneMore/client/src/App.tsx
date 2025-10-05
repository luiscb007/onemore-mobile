import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CookieConsent } from "@/components/CookieConsent";
import { LocationProvider } from "@/contexts/LocationContext";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import CreateEvent from "@/pages/CreateEvent";
import EditEvent from "@/pages/EditEvent";
import MyEvents from "@/pages/MyEvents";
import Messages from "@/pages/Messages";
import Profile from "@/pages/Profile";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public pages accessible to everyone */}
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/create-event" component={CreateEvent} />
          <Route path="/edit-event/:id" component={EditEvent} />
          <Route path="/my-events" component={MyEvents} />
          <Route path="/matches" component={MyEvents} />
          <Route path="/messages" component={Messages} />
          <Route path="/profile" component={Profile} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocationProvider>
        <TooltipProvider>
          <Toaster />
          <CookieConsent />
          <Router />
        </TooltipProvider>
      </LocationProvider>
    </QueryClientProvider>
  );
}

export default App;
