import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const RECIPIENT_EMAIL = 'luiscantobrum@gmail.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export async function sendFeedbackEmail(userEmail: string, userName: string, feedback: string): Promise<void> {
  if (!SENDGRID_API_KEY) {
    throw new Error('SendGrid API key not configured');
  }

  const msg = {
    to: RECIPIENT_EMAIL,
    from: RECIPIENT_EMAIL,
    subject: 'OneMore - User Feedback',
    text: `New feedback received from ${userName} (${userEmail}):\n\n${feedback}`,
    html: `
      <h2>New Feedback from OneMore</h2>
      <p><strong>From:</strong> ${userName} (${userEmail})</p>
      <p><strong>Feedback:</strong></p>
      <p>${feedback.replace(/\n/g, '<br>')}</p>
    `,
  };

  await sgMail.send(msg);
}

export async function sendAccountDeletionEmail(
  userEmail: string,
  userName: string,
  reason?: string,
  feedback?: string
): Promise<void> {
  if (!SENDGRID_API_KEY) {
    throw new Error('SendGrid API key not configured');
  }

  let reasonText = 'Not specified';
  if (reason === 'not-enough-events') {
    reasonText = 'Not enough events in my area';
  } else if (reason === 'not-using') {
    reasonText = 'Not using the app anymore';
  } else if (reason === 'privacy-concerns') {
    reasonText = 'Privacy concerns';
  }

  const msg = {
    to: RECIPIENT_EMAIL,
    from: RECIPIENT_EMAIL,
    subject: 'OneMore - Account Deleted',
    text: `User ${userName} (${userEmail}) has deleted their account.\n\nReason: ${reasonText}${feedback ? `\n\nAdditional feedback:\n${feedback}` : ''}`,
    html: `
      <h2>Account Deletion Notification</h2>
      <p><strong>User:</strong> ${userName} (${userEmail})</p>
      <p><strong>Reason:</strong> ${reasonText}</p>
      ${feedback ? `<p><strong>Additional feedback:</strong></p><p>${feedback.replace(/\n/g, '<br>')}</p>` : ''}
    `,
  };

  await sgMail.send(msg);
}
