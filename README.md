# YouTube Intelligence App

A Next.js full-stack application that analyzes YouTube URLs and provides video summaries and comment sentiment analysis using the Gemini API.

## Features

- **Secure Login**: Simple admin access barrier.
- **Dynamic API Key Input**: Enter your Gemini API Key directly in the browser. It's stored locally and passed securely via headers.
- **Batch Processing**: Analyze up to 5 YouTube URLs simultaneously.
- **Gemini Integration**: Summarizes video content and provides a Pro/Neutral/Con ratio for top comments.
- **Email Reports**: Send the generated analysis report directly to an email address.

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

- **Login Credentials:**
  - ID: `admin`
  - PW: `123jesus`

## Vercel Deployment Guide

This app is optimized for Vercel deployment. Because the Gemini API Key is provided dynamically by the user on the client side, you do **not** need to set `GEMINI_API_KEY` in Vercel. 

However, you **must** configure the following environment variables in your Vercel project settings for the email functionality to work:

### Environment Variables

| Variable Name | Description | Example |
|---|---|---|
| `SMTP_HOST` | The hostname of your SMTP server. | `smtp.gmail.com`, `smtp.sendgrid.net` |
| `SMTP_PORT` | The port for your SMTP server (usually 587 or 465). | `587` |
| `SMTP_USER` | Your SMTP username or email address. | `your.email@gmail.com` |
| `SMTP_PASS` | Your SMTP password or App Password. | `xxxx-xxxx-xxxx-xxxx` |

*Note: If using Gmail, you will need to generate an "App Password" in your Google Account settings, rather than using your standard account password.*

## Technology Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS v4, custom UI components
- **YouTube Data**: `youtubei.js`
- **AI**: `@google/genai` (Gemini 2.5 Flash)
- **Email**: `nodemailer`
