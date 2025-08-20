// Server Time Synchronization Endpoint
// King/Blizzard standard: All time-based features use server authority

export default function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Return server time with high precision
    const serverTime = Date.now();
    
    res.status(200).json({
        serverTime,
        iso: new Date(serverTime).toISOString(),
        timezone: 'UTC'
    });
}