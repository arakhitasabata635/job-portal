import nodemailer from 'nodemailer';
import { config } from '../../config/env.js';

class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.emailOption.smtpHost,
      port: config.emailOption.smtpPort,
      secure: false,
      auth: {
        user: config.emailOption.smtpUser,
        pass: config.emailOption.smtpPassword,
      },
    });
  }
  async sendPasswordResetMail(email: string, resetLink: string) {
    await this.transporter.sendMail({
      from: `"Support" <${config.emailOption.smtpUser}>`,
      to: email,
      subject: 'Password Reset',
      html: `
       <h3>Password Reset</h3>
       <p>Click below to reset your password:</p>
         <a href="${resetLink}">${resetLink}</a>
        <p>This link expires in 10 minutes.</p>
      `,
    });
  }
}

export const emailService = new EmailService();
