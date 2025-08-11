import * as https from 'https';
import * as crypto from 'crypto';
import * as querystring from 'querystring';
import { config } from '../core/config.js';

const api_config = {
  api_key: config.okx.apiKey,
  secret_key: config.okx.secretKey,
  passphrase: config.okx.passphrase,
};

// Validate that all required OKX credentials are available
if (!api_config.api_key || !api_config.secret_key || !api_config.passphrase) {
  throw new Error('Missing required OKX API credentials. Please check your package configuration.');
}

function preHash(timestamp: string, method: string, request_path: string, params?: any): string {
  let query_string = '';
  if (method === 'GET' && params) {
    query_string = '?' + querystring.stringify(params);
  }
  if (method === 'POST' && params) {
    query_string = JSON.stringify(params);
  }
  return timestamp + method + request_path + query_string;
}

function sign(message: string, secret_key: string): string {
  const hmac = crypto.createHmac('sha256', secret_key);
  hmac.update(message);
  return hmac.digest('base64');
}

export function createSignature(method: string, request_path: string, params?: any): { signature: string; timestamp: string } {
  const timestamp = new Date().toISOString().slice(0, -5) + 'Z';
  const message = preHash(timestamp, method, request_path, params);
  const signature = sign(message, api_config.secret_key);
  return { signature, timestamp };
}

export function sendGetRequest(request_path: string, params?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const { signature, timestamp } = createSignature('GET', request_path, params);

    const headers = {
      'OK-ACCESS-KEY': api_config.api_key,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': api_config.passphrase,
      'Content-Type': 'application/json'
    };

    const options = {
      hostname: 'web3.okx.com',
      path: request_path + (params ? `?${querystring.stringify(params)}` : ''),
      method: 'GET',
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

export function sendPostRequest(request_path: string, params?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const { signature, timestamp } = createSignature('POST', request_path, params);

    const postData = params ? JSON.stringify(params) : '';

    const headers = {
      'OK-ACCESS-KEY': api_config.api_key,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': api_config.passphrase,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };

    const options = {
      hostname: 'web3.okx.com',
      path: request_path,
      method: 'POST',
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Export the API config for access to keys if needed
export { api_config };
