// api/transak-widget.js
// Generates a Transak secure widget URL for on-ramp (BNB on opBNB)
//
// GET /api/transak-widget?address=0x...

const TRANSAK_API_KEY = process.env.TRANSAK_API_KEY;
const TRANSAK_API_SECRET = process.env.TRANSAK_API_SECRET;
const TOKEN_URL = 'https://api.transak.com/partners/api/v2/refresh-token';
const SESSION_URL = 'https://api-gateway.transak.com/api/v2/auth/session';

const setCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version'
    );
};

// Cache access token in memory (valid 7 days, refreshed on cold start)
let cachedAccessToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
    if (cachedAccessToken && Date.now() < tokenExpiresAt) {
        console.log('[transak-widget] Using cached access token');
        return cachedAccessToken;
    }

    console.log('[transak-widget] Refreshing access token...');
    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-secret': TRANSAK_API_SECRET,
        },
        body: JSON.stringify({ apiKey: TRANSAK_API_KEY }),
    });

    const text = await res.text();
    console.log('[transak-widget] Token response:', res.status, text.slice(0, 500));

    if (!res.ok) {
        throw new Error(`Transak token refresh failed: ${res.status} ${text}`);
    }

    const data = JSON.parse(text);
    cachedAccessToken = data.data?.accessToken || data.accessToken;
    if (!cachedAccessToken) {
        throw new Error(`No accessToken in response: ${JSON.stringify(data).slice(0, 300)}`);
    }
    // Refresh 1 day before expiry (token valid 7 days)
    tokenExpiresAt = Date.now() + 6 * 24 * 60 * 60 * 1000;
    console.log('[transak-widget] Access token obtained, length:', cachedAccessToken.length);
    return cachedAccessToken;
}

async function createWidgetUrl(walletAddress) {
    const accessToken = await getAccessToken();

    const widgetParams = {
        apiKey: TRANSAK_API_KEY,
        referrerDomain: 'backcoin.org',
        productsAvailed: 'BUY',
        cryptoCurrencyCode: 'BNB',
        network: 'opbnb',
        fiatCurrency: 'BRL',
        defaultPaymentMethod: 'pix',
        disableWalletAddressForm: true,
    };
    if (walletAddress) widgetParams.walletAddress = walletAddress;

    const res = await fetch(SESSION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'access-token': accessToken,
        },
        body: JSON.stringify({ widgetParams }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Transak widget URL failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data.data?.widgetUrl || null;
}

export default async function handler(req, res) {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (!TRANSAK_API_KEY || !TRANSAK_API_SECRET) {
        return res.status(500).json({ error: 'Transak credentials not configured' });
    }

    try {
        const walletAddress = req.query.address || '';
        console.log('[transak-widget] Generating widget URL for:', walletAddress || '(no address)');
        const widgetUrl = await createWidgetUrl(walletAddress);

        if (!widgetUrl) {
            return res.status(500).json({ error: 'Failed to generate widget URL' });
        }

        console.log('[transak-widget] Widget URL generated successfully');
        return res.status(200).json({ url: widgetUrl });
    } catch (err) {
        console.error('[transak-widget] Error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}
