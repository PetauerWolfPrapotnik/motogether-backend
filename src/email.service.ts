import nodemailer from 'nodemailer';
import environment from './environment';

export default nodemailer.createTransport({
  host: environment.EMAIL_URL,
  port: environment.EMAIL_PORT,
  secure: environment.EMAIL_SECURE,
  auth: {
    user: environment.EMAIL_USER,
    pass: environment.EMAIL_PASSWORD
  }
});
