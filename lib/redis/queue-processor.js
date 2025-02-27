'use strict';

const nodemailer = require('nodemailer');
const log = require(__base + 'lib/winston/logger');
const redisClient = require(__base + 'lib/redis/redis-async');

const REMINDER_QUEUE = 'attendance_clock_in_reminder_queue';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const processQueue = async () => {
  try {
    const task = await redisClient.lpop(REMINDER_QUEUE);
    if (!task) return;

    const { email, name } = JSON.parse(task);

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Clock-in Reminder',
      html: `
        <p>Hello ${name},</p>
        <p>This is a reminder that you haven't clocked in today. Please clock in as soon as possible.</p>
        <p>Thank you!</p>
      `
    });

    log.info(`[Queue] Sent reminder email to ${email}`);
  } catch (error) {
    log.error('[Queue] Error processing task:', error);
  }
};

module.exports = () => {
  setInterval(processQueue, 5000); // 5 seconds
  log.info('[Queue] Reminder processor started');
};
