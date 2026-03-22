const { Resend } = require("resend");

async function main({ subject, body, emails }) {
  if (!subject || !body || !Array.isArray(emails) || emails.length === 0) {
    return { error: "subject, body, and emails[] are required", sent: 0 };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to: emails,
    subject,
    text: body,
  });

  return { sent: emails.length };
}

module.exports = { main };
