export function getWaitlistEmailHTML(name: string, position?: number, referralCode?: string): string {
  const siteUrl = 'https://salmon-mud-01e8ee30f.2.azurestaticapps.net'
  const referralLink = referralCode ? `${siteUrl}/waitlist?ref=${referralCode}` : ''

  // Position-based perks
  let perksText = ''
  if (position) {
    if (position <= 50) {
      perksText = '🏆 <strong style="color: #fbbf24;">Founder Status!</strong> Lifetime 50% discount + Exclusive Discord access'
    } else if (position <= 100) {
      perksText = '🎖️ <strong style="color: #60a5fa;">Early Bird!</strong> Lifetime 40% discount + Priority support'
    } else if (position <= 500) {
      perksText = '⭐ <strong style="color: #a78bfa;">Insider!</strong> First 3 months 50% off + Beta access Week 3'
    } else if (position <= 1000) {
      perksText = '🎯 <strong style="color: #34d399;">Early Access!</strong> First month 50% off'
    } else {
      perksText = '✨ <strong style="color: #94a3b8;">Community Member!</strong> Early access to all features'
    }
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ReddyFit Waitlist</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #312e81 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6 0%, #9333ea 100%); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; color: white; margin-bottom: 20px;">
                RF
              </div>
              ${position ? `
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); display: inline-block; padding: 10px 24px; border-radius: 50px; margin-bottom: 20px;">
                <p style="margin: 0; color: white; font-size: 24px; font-weight: bold;">
                  You're #${position} on the waitlist! 🎉
                </p>
              </div>
              ` : ''}
              <h1 style="margin: 0; font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                Welcome to ReddyFit!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="color: #e2e8f0; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi <strong>${name}</strong>! 👋
              </p>
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Thanks for joining the <strong>ReddyFit waitlist</strong>! You're one step closer to transforming your fitness journey with AI-powered tracking.
              </p>

              ${perksText ? `
              <!-- Your Perks -->
              <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%); border: 2px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 24px; margin: 30px 0;">
                <h2 style="color: #f1f5f9; font-size: 20px; margin: 0 0 16px 0;">🎁 Your Exclusive Perks:</h2>
                <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0;">
                  ${perksText}
                </p>
              </div>
              ` : ''}

              ${referralLink ? `
              <!-- Referral Section -->
              <div style="background: rgba(16, 185, 129, 0.1); border: 2px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 24px; margin: 30px 0;">
                <h2 style="color: #f1f5f9; font-size: 20px; margin: 0 0 12px 0;">🚀 Move Up the Waitlist!</h2>
                <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                  Share your unique referral link and <strong style="color: #10b981;">move up 10 positions</strong> for each friend who joins!
                </p>
                <div style="background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 8px; margin: 16px 0;">
                  <p style="color: #94a3b8; font-size: 12px; margin: 0 0 6px 0;">Your Referral Link:</p>
                  <p style="color: #60a5fa; font-size: 14px; margin: 0; word-break: break-all;">${referralLink}</p>
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0 0 0;">
                  <tr>
                    <td align="center">
                      <a href="${referralLink}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                        Copy & Share Link
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
              ` : ''}

              <!-- Features Box -->
              <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 24px; margin: 30px 0;">
                <h2 style="color: #f1f5f9; font-size: 20px; margin: 0 0 16px 0;">What to Expect:</h2>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #10b981; font-size: 18px; margin-right: 10px;">✓</span>
                      <span style="color: #e2e8f0; font-size: 15px;">AI-powered workout tracking</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #10b981; font-size: 18px; margin-right: 10px;">✓</span>
                      <span style="color: #e2e8f0; font-size: 15px;">Personalized meal planning</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #10b981; font-size: 18px; margin-right: 10px;">✓</span>
                      <span style="color: #e2e8f0; font-size: 15px;">Social fitness community</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #10b981; font-size: 18px; margin-right: 10px;">✓</span>
                      <span style="color: #e2e8f0; font-size: 15px;">AI Agent Marketplace</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${siteUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #3b82f6 0%, #9333ea 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 5px;">
                      Visit Website
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                See you soon!<br>
                <strong style="color: #cbd5e1;">The ReddyFit Team</strong>
              </p>
              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0;">
                <em>P.S. Got questions? Reply to this email!</em>
              </p>
            </td>
          </tr>

          <!-- Social Links -->
          <tr>
            <td align="center" style="padding: 20px 40px 40px 40px;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0 0 10px 0;">Follow us:</p>
              <div style="margin: 10px 0;">
                <a href="#" style="color: #60a5fa; text-decoration: none; margin: 0 10px; font-size: 12px;">Twitter</a>
                <a href="#" style="color: #60a5fa; text-decoration: none; margin: 0 10px; font-size: 12px;">Discord</a>
                <a href="#" style="color: #60a5fa; text-decoration: none; margin: 0 10px; font-size: 12px;">Blog</a>
              </div>
            </td>
          </tr>
        </table>

        <!-- Unsubscribe -->
        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 20px 0 0 0;">
          © 2025 ReddyFit. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export function getWaitlistEmailText(name: string, position?: number, referralCode?: string): string {
  const siteUrl = 'https://salmon-mud-01e8ee30f.2.azurestaticapps.net'
  const referralLink = referralCode ? `${siteUrl}/waitlist?ref=${referralCode}` : ''

  let positionText = ''
  if (position) {
    positionText = `\n🎉 You're #${position} on the waitlist!\n`
  }

  let perksText = ''
  if (position) {
    if (position <= 50) {
      perksText = '\n🏆 FOUNDER STATUS! Lifetime 50% discount + Exclusive Discord access\n'
    } else if (position <= 100) {
      perksText = '\n🎖️ EARLY BIRD! Lifetime 40% discount + Priority support\n'
    } else if (position <= 500) {
      perksText = '\n⭐ INSIDER! First 3 months 50% off + Beta access Week 3\n'
    } else if (position <= 1000) {
      perksText = '\n🎯 EARLY ACCESS! First month 50% off\n'
    } else {
      perksText = '\n✨ COMMUNITY MEMBER! Early access to all features\n'
    }
  }

  let referralText = ''
  if (referralLink) {
    referralText = `
🚀 MOVE UP THE WAITLIST!

Share your unique referral link and move up 10 positions for each friend who joins:

${referralLink}

The more you share, the higher you climb!
`
  }

  return `
Hi ${name}!
${positionText}
Thanks for joining the ReddyFit waitlist! You're one step closer to transforming your fitness journey with AI-powered tracking.
${perksText}${referralText}
What to expect:
✓ AI-powered workout tracking
✓ Personalized meal planning
✓ Social fitness community
✓ AI Agent Marketplace

We'll notify you as soon as ReddyFit is ready.

Visit our website: ${siteUrl}

See you soon!
The ReddyFit Team

P.S. Got questions? Reply to this email!
  `.trim()
}
