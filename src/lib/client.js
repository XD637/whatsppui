import nodemailer from "nodemailer";
import { configDotenv } from "dotenv";

configDotenv(); // Load env vars if needed

const emailClient = nodemailer.createTransport({
  host: "mail.sporadasecure.com",
  port: 465,
  secure: true,
  auth: {
    user: "support@sporadasecure.com",
    pass: "Sporada@2014", // Preferably use process.env.SMTP_PASS
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await emailClient.sendMail({
      from: '"Sporada Secure" <support@sporadasecure.com>',
      to,
      subject,
      html,
    });
    console.log("Email sent to:", to);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export { sendEmail };
