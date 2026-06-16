// // config/drive.js
// require('dotenv').config();
// const { google } = require('googleapis');

// async function getDrive() {
//   const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
//   const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY || '';
//   if (!clientEmail) throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL missing');
//   if (!privateKeyRaw) throw new Error('GOOGLE_PRIVATE_KEY missing');

//   // \n normalization (safe for both one-line and multiline)
//   const private_key = privateKeyRaw.includes('\\n')
//     ? privateKeyRaw.replace(/\\n/g, '\n')
//     : privateKeyRaw;

//   const auth = new google.auth.GoogleAuth({
//     scopes: ['https://www.googleapis.com/auth/drive'],
//     credentials: {
//       client_email: clientEmail,
//       private_key,
//     },
//   });

//   const client = await auth.getClient();

//   // 🔎 DEBUG: access token check (keep for now)
//   const token = await auth.getAccessToken();
//   console.log('[drive-auth] email:', clientEmail);
//   console.log('[drive-auth] token len:', token ? String(token).length : 0);

//   return google.drive({ version: 'v3', auth: client });
// }

// module.exports = { getDrive };
require('dotenv').config();
const { google } = require('googleapis');

async function getDrive() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google OAuth 2.0 credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN) are missing in environment');
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  // Optional debug: Verify the connection
  try {
    const tokenResponse = await oauth2Client.getAccessToken();
    console.log('[drive-auth] OAuth2 connection initialized. Token len:', tokenResponse?.token ? tokenResponse.token.length : 0);
  } catch (err) {
    console.error('[drive-auth] Error validating OAuth2 credentials:', err.message);
  }

  return google.drive({ version: 'v3', auth: oauth2Client });
}

module.exports = { getDrive };
