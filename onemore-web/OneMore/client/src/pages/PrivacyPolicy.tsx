import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { BottomNavigation } from '@/components/BottomNavigation';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/">
            <button className="touch-target p-2 -ml-2" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Privacy Policy</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="p-4 pb-24 prose prose-sm dark:prose-invert max-w-none">
        <p className="text-muted-foreground text-sm">Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Introduction</h2>
        <p>
          Welcome to OneMore ("we," "our," or "us"). We are committed to protecting your privacy and personal data. 
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use 
          our location-based event discovery platform.
        </p>

        <h2>2. Information We Collect</h2>
        
        <h3>2.1 Personal Information</h3>
        <p>We collect the following personal information:</p>
        <ul>
          <li><strong>Account Information:</strong> Name, email address, profile picture (via authentication provider)</li>
          <li><strong>Event Information:</strong> Events you create, attend, like, or pass on</li>
          <li><strong>Communication Data:</strong> Messages sent through our platform</li>
          <li><strong>Profile Data:</strong> User preferences, search radius, default currency</li>
        </ul>

        <h3>2.2 Location Data (GDPR/CCPA Compliant)</h3>
        <p>
          We collect and process your <strong>precise geolocation data</strong> to provide location-based event discovery. 
          This includes:
        </p>
        <ul>
          <li>GPS coordinates when you use our service</li>
          <li>City and region derived from your location</li>
          <li>Search radius preferences</li>
        </ul>
        <p>
          <strong>Your location data is:</strong>
        </p>
        <ul>
          <li>Only collected with your explicit consent via browser permission</li>
          <li>Used solely to show you nearby events</li>
          <li>Not shared with third parties for advertising</li>
          <li>Can be deleted upon request</li>
        </ul>

        <h3>2.3 Automatically Collected Information</h3>
        <ul>
          <li>Device information (browser type, operating system)</li>
          <li>Usage data (pages visited, features used)</li>
          <li>Cookies and similar tracking technologies</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <p>We use your data to:</p>
        <ul>
          <li>Provide location-based event discovery and matching</li>
          <li>Enable communication between event organizers and attendees</li>
          <li>Process event registrations and manage capacity</li>
          <li>Display events in your preferred currency</li>
          <li>Improve and personalize your experience</li>
          <li>Ensure platform security and prevent fraud</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h2>4. Data Sharing and Disclosure</h2>
        <p>We do not sell your personal data. We may share data with:</p>
        <ul>
          <li><strong>Other Users:</strong> Your profile information is visible when you create events or interact with events</li>
          <li><strong>Service Providers:</strong> Cloud hosting (Replit, Neon), authentication services, email providers</li>
          <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
        </ul>

        <h2>5. Your Rights (GDPR & CCPA)</h2>
        
        <h3>5.1 EU/UK Users (GDPR Rights)</h3>
        <p>You have the right to:</p>
        <ul>
          <li><strong>Access:</strong> Request a copy of your personal data</li>
          <li><strong>Rectification:</strong> Correct inaccurate data</li>
          <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
          <li><strong>Restriction:</strong> Limit how we process your data</li>
          <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
          <li><strong>Object:</strong> Object to processing of your data</li>
          <li><strong>Withdraw Consent:</strong> Revoke location permission at any time</li>
        </ul>

        <h3>5.2 California Users (CCPA Rights)</h3>
        <p>California residents have the right to:</p>
        <ul>
          <li>Know what personal information we collect, use, and disclose</li>
          <li>Delete personal information (with certain exceptions)</li>
          <li>Opt-out of sale of personal information (we don't sell data)</li>
          <li>Non-discrimination for exercising privacy rights</li>
        </ul>

        <h3>5.3 Exercising Your Rights</h3>
        <p>
          To exercise any of these rights, please contact us at: <strong>luiscantobrum@gmail.com</strong>
          <br />
          We will respond within 30 days (GDPR) or 45 days (CCPA).
        </p>

        <h2>6. Location Data Management</h2>
        <p>You can control location access:</p>
        <ul>
          <li><strong>Browser Settings:</strong> Revoke location permission in your browser</li>
          <li><strong>Platform Settings:</strong> Adjust search radius or disable location features</li>
          <li><strong>Account Deletion:</strong> All location data is deleted when you delete your account</li>
        </ul>

        <h2>7. Data Retention</h2>
        <p>We retain your data:</p>
        <ul>
          <li>Account data: Until you delete your account</li>
          <li>Event data: For event history and legal compliance</li>
          <li>Location data: Only while actively using the service</li>
          <li>Messages: Until deleted by users or account closure</li>
        </ul>

        <h2>8. Security</h2>
        <p>
          We implement industry-standard security measures including:
        </p>
        <ul>
          <li>HTTPS encryption for data in transit</li>
          <li>Secure database storage with access controls</li>
          <li>HTTP-only session cookies</li>
          <li>Regular security audits</li>
        </ul>

        <h2>9. Children's Privacy</h2>
        <p>
          OneMore is not intended for users under 13 years old. We do not knowingly collect data 
          from children under 13. If you believe we have collected data from a child, please contact us.
        </p>

        <h2>10. International Data Transfers</h2>
        <p>
          OneMore is operated from Luxembourg and serves users primarily in the European Union 
          (Luxembourg, Poland, Portugal). Your data is stored within the EU and processed in 
          accordance with GDPR standards. Data is hosted on Replit/Neon infrastructure which 
          complies with EU data protection regulations.
        </p>

        <h2>11. Cookies and Tracking</h2>
        <p>We use cookies for:</p>
        <ul>
          <li><strong>Essential Cookies:</strong> Authentication and security (required)</li>
          <li><strong>Functional Cookies:</strong> Remember preferences (currency, radius)</li>
          <li><strong>Analytics Cookies:</strong> Understand usage patterns (with consent)</li>
        </ul>
        <p>You can manage cookies through our cookie consent banner and browser settings.</p>

        <h2>12. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy periodically. We will notify you of material changes 
          via email or platform notice. Continued use after changes constitutes acceptance.
        </p>

        <h2>13. Contact Us</h2>
        <p>
          For privacy questions, data requests, or concerns:
          <br />
          <strong>Email:</strong> luiscantobrum@gmail.com
          <br />
          <strong>Operator:</strong> Luis do Canto Brum
          <br />
          <strong>Jurisdiction:</strong> Luxembourg
        </p>

        <h2>14. Legal Basis for Processing (GDPR)</h2>
        <p>We process your data based on:</p>
        <ul>
          <li><strong>Consent:</strong> Location data collection</li>
          <li><strong>Contract Performance:</strong> Providing event services</li>
          <li><strong>Legitimate Interests:</strong> Platform security and improvement</li>
          <li><strong>Legal Obligations:</strong> Compliance with applicable laws</li>
        </ul>
      </div>

      <BottomNavigation />
    </div>
  );
}
