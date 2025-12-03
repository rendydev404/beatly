// const fetch = require('node-fetch'); // Using global fetch

const BASE_URL = 'https://spotify-clone-by-rendydev.vercel.app';

async function runVerification() {
    console.log('Starting Verification...');

    // 1. Generate API Key
    console.log('\n1. Generating API Key...');
    const createRes = await fetch(`${BASE_URL}/api/admin/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Key' }),
    });

    if (!createRes.ok) {
        console.error('Failed to create key:', await createRes.text());
        return;
    }

    const keyData = await createRes.json();
    console.log('Key Created:', keyData.key);
    const apiKey = keyData.key;
    const keyId = keyData.id;

    // 2. Test Unified API with Valid Key
    console.log('\n2. Testing Unified API with Valid Key...');
    // Query: "Faded Alan Walker"
    const query = 'Faded Alan Walker';
    const apiRes = await fetch(`${BASE_URL}/api/unified?query=${encodeURIComponent(query)}&apiKey=${apiKey}`);

    if (apiRes.ok) {
        const data = await apiRes.json();
        console.log('API Response Status: OK');
        console.log('Spotify Data:', data.spotify ? 'Found' : 'Missing');
        console.log('YouTube Data:', data.youtube ? 'Found' : 'Missing');
        console.log('Lyrics Data:', data.lyrics ? 'Found' : 'Missing');
    } else {
        console.error('API Request Failed:', await apiRes.text());
    }

    // 3. Revoke Key
    console.log('\n3. Revoking API Key...');
    const deleteRes = await fetch(`${BASE_URL}/api/admin/keys?id=${keyId}`, {
        method: 'DELETE',
    });

    if (deleteRes.ok) {
        console.log('Key Revoked Successfully');
    } else {
        console.error('Failed to revoke key');
    }

    // 4. Test Unified API with Revoked Key
    console.log('\n4. Testing Unified API with Revoked Key...');
    const revokedRes = await fetch(`${BASE_URL}/api/unified?query=${encodeURIComponent(query)}&apiKey=${apiKey}`);

    if (revokedRes.status === 403) {
        console.log('Access Denied as expected (403)');
    } else {
        console.error('Unexpected Status:', revokedRes.status);
    }
}

runVerification();
