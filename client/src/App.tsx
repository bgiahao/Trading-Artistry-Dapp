import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import AuthGate from "./components/AuthGate";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ProfileSettings from "./pages/ProfileSettings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Home} />
      <Route path="/journal" component={Home} />
      <Route path="/trades/:id" component={Home} />
      <Route path="/trades" component={Home} />
      <Route path="/playbook" component={Home} />
      <Route path="/analytics" component={Home} />
      <Route path="/knowledge" component={Home} />
      <Route path="/links" component={Home} />
      <Route path="/tools" component={Home} />
      <Route path="/settings/profile" component={ProfileSettings} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster theme="dark" />
          <AuthGate><Router /></AuthGate>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
