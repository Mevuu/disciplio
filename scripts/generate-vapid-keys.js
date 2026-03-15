/**
 * Run once to generate VAPID keys for Web Push:
 *   node scripts/generate-vapid-keys.js
 *
 * Requires: npm install web-push (globally or in this project)
 */
import webpush from 'web-push';

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n=== VAPID Keys Generated ===\n');
console.log('Add these to your .env file:\n');
console.log(`VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('\nAdd VAPID_PRIVATE_KEY to your Supabase Edge Function secrets.');
console.log('Add VITE_VAPID_PUBLIC_KEY to Vercel environment variables.\n');
