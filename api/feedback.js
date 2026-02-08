// Vercel Serverless Function for Feedback Submission
// Stores in Supabase + sends email via Resend

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { feedback, email, category, page, timestamp, userAgent } = req.body;

    if (!feedback || !feedback.trim()) {
      return res.status(400).json({ error: 'Feedback is required' });
    }

    const feedbackData = {
      feedback: feedback.trim(),
      email: email || null,
      category: category || 'general',
      page: page || '/',
      timestamp: timestamp || new Date().toISOString(),
      user_agent: userAgent || null,
    };

    // 1. Store in Supabase (if configured)
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('feedback').insert([feedbackData]);
        console.log('Feedback stored in Supabase');
      } catch (dbErr) {
        console.warn('Supabase insert failed (table may not exist yet):', dbErr.message);
        // Non-blocking — continue to email
      }
    }

    // 2. Send email via Resend (if API key is configured)
    const resendKey = process.env.RESEND_API_KEY;

    if (resendKey) {
      const categoryEmoji = { bug: '🐛', feature: '💡', general: '💬' };
      const emoji = categoryEmoji[category] || '💬';

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a1a2e; color: white; padding: 20px 24px; border-radius: 12px 12px 0 0;">
            <h2 style="margin: 0; font-size: 18px;">${emoji} MOTUS Feedback — ${category.charAt(0).toUpperCase() + category.slice(1)}</h2>
          </div>
          <div style="background: #16213e; color: #e0e0e0; padding: 24px; border-radius: 0 0 12px 12px;">
            <div style="background: #0f3460; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
              <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${feedback}</p>
            </div>
            <table style="width: 100%; font-size: 13px; color: #a0a0a0;">
              <tr><td style="padding: 4px 0;"><strong>From:</strong></td><td>${email || 'Anonymous'}</td></tr>
              <tr><td style="padding: 4px 0;"><strong>Category:</strong></td><td>${category}</td></tr>
              <tr><td style="padding: 4px 0;"><strong>Page:</strong></td><td>${page || '/'}</td></tr>
              <tr><td style="padding: 4px 0;"><strong>Time:</strong></td><td>${new Date(timestamp).toLocaleString()}</td></tr>
            </table>
          </div>
        </div>
      `;

      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'MOTUS Feedback <feedback@resend.dev>',
            to: ['tylerjyoung5@gmail.com'],
            subject: `${emoji} MOTUS Feedback: ${category} — ${feedback.substring(0, 50)}${feedback.length > 50 ? '...' : ''}`,
            html: emailHtml,
          }),
        });

        if (emailRes.ok) {
          console.log('Feedback email sent via Resend');
        } else {
          const errBody = await emailRes.text();
          console.warn('Resend email failed:', errBody);
        }
      } catch (emailErr) {
        console.warn('Email send failed:', emailErr.message);
        // Non-blocking — feedback is still stored in Supabase
      }
    } else {
      console.log('RESEND_API_KEY not set — feedback stored in Supabase only');
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Feedback handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
