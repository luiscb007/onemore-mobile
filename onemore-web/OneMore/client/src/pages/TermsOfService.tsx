import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { BottomNavigation } from '@/components/BottomNavigation';

export default function TermsOfService() {
  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/">
            <button className="touch-target p-2 -ml-2" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Terms of Service</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="p-4 pb-24 prose prose-sm dark:prose-invert max-w-none">
        <p className="text-muted-foreground text-sm">Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using OneMore ("Service," "Platform," "we," "us," or "our"), you agree to be bound by 
          these Terms of Service ("Terms"). If you do not agree, do not use the Service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          OneMore is a location-based event discovery platform that connects event organizers with attendees. 
          The Service allows users to:
        </p>
        <ul>
          <li>Create and manage events</li>
          <li>Discover local events based on location</li>
          <li>Interact with events (going, like, pass)</li>
          <li>Message event organizers and attendees</li>
          <li>Rate event organizers</li>
        </ul>

        <h2>3. User Accounts</h2>
        
        <h3>3.1 Account Creation</h3>
        <p>
          You must create an account through our authentication provider (Google, GitHub, Apple, X, or Email). 
          You are responsible for:
        </p>
        <ul>
          <li>Maintaining the confidentiality of your account</li>
          <li>All activities that occur under your account</li>
          <li>Providing accurate and current information</li>
        </ul>

        <h3>3.2 Age Requirement</h3>
        <p>
          You must be at least 13 years old to use the Service. By using the Service, you represent that you 
          meet this age requirement.
        </p>

        <h3>3.3 Account Termination</h3>
        <p>
          We reserve the right to suspend or terminate your account if you violate these Terms or engage in 
          conduct we deem harmful to the Service or other users.
        </p>

        <h2>4. User Conduct</h2>
        
        <h3>4.1 Prohibited Activities</h3>
        <p>You agree NOT to:</p>
        <ul>
          <li>Post false, misleading, or fraudulent event information</li>
          <li>Harass, abuse, or harm other users</li>
          <li>Post spam, advertisements, or promotional content without permission</li>
          <li>Create fake events or accounts</li>
          <li>Violate any local, state, national, or international law</li>
          <li>Infringe intellectual property rights</li>
          <li>Attempt to gain unauthorized access to the Service</li>
          <li>Use automated systems (bots) to create events or interactions</li>
          <li>Collect user data without consent</li>
        </ul>

        <h3>4.2 Content Standards</h3>
        <p>Event descriptions and user content must NOT contain:</p>
        <ul>
          <li>Hate speech, discrimination, or threats</li>
          <li>Sexually explicit or violent content</li>
          <li>False or defamatory information</li>
          <li>Illegal activities or promotions</li>
        </ul>

        <h2>5. Event Organizers</h2>
        
        <h3>5.1 Organizer Responsibilities</h3>
        <p>As an event organizer, you are solely responsible for:</p>
        <ul>
          <li>Accuracy of event information (date, time, location, price)</li>
          <li>Event execution and safety</li>
          <li>Obtaining necessary permits and licenses</li>
          <li>Complying with local laws and regulations</li>
          <li>Managing event capacity and attendee communications</li>
          <li>Cancellations and refunds (if applicable)</li>
        </ul>

        <h3>5.2 OneMore's Role</h3>
        <p>
          <strong>IMPORTANT:</strong> OneMore is a <strong>platform only</strong>. We do not organize, host, or 
          control events. We are not responsible for event quality, safety, or outcomes.
        </p>

        <h2>6. Event Attendees</h2>
        
        <h3>6.1 Attendee Responsibilities</h3>
        <p>As an attendee, you are responsible for:</p>
        <ul>
          <li>Verifying event details with the organizer</li>
          <li>Your own safety and conduct at events</li>
          <li>Paying event fees directly to organizers (when applicable)</li>
          <li>Following event rules and venue policies</li>
        </ul>

        <h3>6.2 No Guarantee</h3>
        <p>
          We do not guarantee that events will occur as described, be safe, or meet your expectations. 
          Attend events at your own risk.
        </p>

        <h2>7. Content Ownership and License</h2>
        
        <h3>7.1 Your Content</h3>
        <p>
          You retain ownership of content you post (events, messages, profiles). By posting, you grant us a 
          worldwide, non-exclusive, royalty-free license to use, display, and distribute your content to 
          operate the Service.
        </p>

        <h3>7.2 Our Content</h3>
        <p>
          The Service interface, design, and software are owned by OneMore and protected by copyright and 
          trademark laws.
        </p>

        <h2>8. Limitation of Liability</h2>
        
        <p><strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong></p>
        
        <h3>8.1 No Warranty</h3>
        <p>
          THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING 
          WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
        </p>

        <h3>8.2 Liability Limitation</h3>
        <p>
          ONEMORE SHALL NOT BE LIABLE FOR:
        </p>
        <ul>
          <li>Injuries, accidents, or harm occurring at events</li>
          <li>Event cancellations, changes, or no-shows</li>
          <li>Financial losses from event attendance or organization</li>
          <li>Inaccurate event information posted by organizers</li>
          <li>User conduct or interactions</li>
          <li>Service interruptions or data loss</li>
          <li>Indirect, incidental, special, or consequential damages</li>
        </ul>
        <p>
          OUR TOTAL LIABILITY SHALL NOT EXCEED $100 OR THE AMOUNT YOU PAID US IN THE LAST 12 MONTHS, 
          WHICHEVER IS GREATER.
        </p>

        <h2>9. Indemnification</h2>
        <p>
          You agree to indemnify and hold OneMore harmless from any claims, damages, or expenses arising from:
        </p>
        <ul>
          <li>Your use of the Service</li>
          <li>Your violation of these Terms</li>
          <li>Events you organize or attend</li>
          <li>Content you post</li>
          <li>Your violation of third-party rights</li>
        </ul>

        <h2>10. Payment and Fees</h2>
        
        <h3>10.1 Platform Fees</h3>
        <p>
          OneMore is currently free to use. We reserve the right to introduce fees with 30 days' notice.
        </p>

        <h3>10.2 Event Payments</h3>
        <p>
          Event ticket payments (if applicable) are between organizers and attendees. OneMore does not 
          process payments or handle refunds unless explicitly stated.
        </p>

        <h2>11. Privacy and Location Data</h2>
        <p>
          Your use of the Service is governed by our <Link href="/privacy-policy" className="text-primary">Privacy Policy</Link>, 
          which explains how we collect and use your location data in compliance with GDPR and CCPA.
        </p>

        <h2>12. Reporting and Moderation</h2>
        <p>
          Users can report inappropriate content or conduct. We reserve the right to:
        </p>
        <ul>
          <li>Remove content that violates these Terms</li>
          <li>Suspend or ban users for violations</li>
          <li>Cooperate with law enforcement</li>
        </ul>

        <h2>13. Modifications to Service</h2>
        <p>
          We may modify, suspend, or discontinue the Service at any time without notice. We are not liable 
          for any such changes.
        </p>

        <h2>14. Changes to Terms</h2>
        <p>
          We may update these Terms periodically. Material changes will be notified via email or platform 
          notice. Continued use after changes constitutes acceptance.
        </p>

        <h2>15. Governing Law and Dispute Resolution</h2>
        
        <h3>15.1 Governing Law</h3>
        <p>
          These Terms are governed by the laws of Luxembourg, without regard to conflict of law principles.
        </p>

        <h3>15.2 Dispute Resolution</h3>
        <p>
          Any disputes shall be resolved first through good faith negotiation. If unsuccessful, disputes 
          may be brought before the competent courts of Luxembourg. For EU users, you retain your rights 
          under EU consumer protection law to bring claims in your country of residence.
        </p>

        <h2>16. Severability</h2>
        <p>
          If any provision of these Terms is found invalid, the remaining provisions remain in full effect.
        </p>

        <h2>17. Entire Agreement</h2>
        <p>
          These Terms, along with our Privacy Policy, constitute the entire agreement between you and OneMore.
        </p>

        <h2>18. Contact Us</h2>
        <p>
          For questions about these Terms:
          <br />
          <strong>Email:</strong> luiscantobrum@gmail.com
          <br />
          <strong>Operator:</strong> Luis do Canto Brum
          <br />
          <strong>Jurisdiction:</strong> Luxembourg
        </p>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm font-semibold mb-2">Summary (Not Legal Advice)</p>
          <p className="text-xs text-muted-foreground">
            OneMore connects event organizers and attendees. We're a platform, not event organizers. 
            You're responsible for your own safety and conduct. Be honest, respectful, and follow laws. 
            We're not liable for events or user actions. Use at your own risk.
          </p>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
