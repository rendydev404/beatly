import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const KEYS_FILE = path.join(DATA_DIR, 'api-keys.json');

export interface ApiKey {
    id: string;
    name: string;
    key: string;
    createdAt: string;
}

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(KEYS_FILE)) {
        fs.writeFileSync(KEYS_FILE, JSON.stringify([]));
    }
}

export function getApiKeys(): ApiKey[] {
    ensureDataDir();
    try {
        const data = fs.readFileSync(KEYS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading API keys:', error);
        return [];
    }
}

export function generateApiKey(name: string): ApiKey {
    ensureDataDir();
    const keys = getApiKeys();

    const newKey: ApiKey = {
        id: crypto.randomUUID(),
        name,
        key: 'sk_' + crypto.randomBytes(16).toString('hex'),
        createdAt: new Date().toISOString(),
    };

    keys.push(newKey);
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));

    return newKey;
}

export function revokeApiKey(id: string): boolean {
    ensureDataDir();
    let keys = getApiKeys();
    const initialLength = keys.length;

    keys = keys.filter(k => k.id !== id);

    if (keys.length !== initialLength) {
        fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
        return true;
    }

    return false;
}

export function validateApiKey(key: string): boolean {
    const keys = getApiKeys();
    return keys.some(k => k.key === key);
}
