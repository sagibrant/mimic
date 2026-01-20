/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file CryptoUtil.ts
 * @description 
 * Shared utility classes and functions for encrypt & decrypt
 * 
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as BrowserUtils from "./BrowserUtils";

/**
 * Encrypt plaintext using the extension ID-derived key
 * @param plaintext Data to encrypt (e.g., API key)
 * @returns Encrypted string (base64: iv + ciphertext)
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await _getSecretKey();

  // Generate 12-byte IV (AES-GCM recommended)
  const iv = self.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const plaintextBuffer = new TextEncoder().encode(plaintext);
  const ciphertext = await self.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintextBuffer
  );

  // Combine IV and ciphertext (IV is needed for decryption)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return _uint8ToBase64(combined);
}

/**
 * Decrypt data using the extension ID-derived key
 * @param encrypted Encrypted string (base64 from encrypt())
 * @returns Decrypted plaintext
 */
export async function decrypt(encrypted: string): Promise<string> {
  const key = await _getSecretKey();

  // Decode base64 and split IV + ciphertext
  const combined = _base64ToUint8(encrypted);
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  // Decrypt
  const decryptedBuffer = await self.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decryptedBuffer);
}

/**
* Initialize/derive the secret key from chrome.runtime.id (hardcoded for now)
* Todo: change to user generated in future
*/
async function _getSecretKey(): Promise<CryptoKey> {
  let extensionId = 'mimic_secret_key';
  // let extensionId = typeof chrome !== 'undefined' && chrome?.runtime?.id;
  // in sandbox, cannot access the chrome.runtime.id
  const browserInfo = BrowserUtils.getBrowserInfo();
  if (browserInfo.name === 'chrome') {
    extensionId = 'kpohfimcpcmbcihhpgnjcomihmcnfpna';
  }
  else if (browserInfo.name === 'edge') {
    extensionId = 'ilcdijkgbkkllhojpgbiajmnbdiadppj';
  }
  if (!extensionId) {
    throw new Error("Extension ID unavailable");
  }

  // Step 1: Convert extension ID to raw material
  const salt = new TextEncoder().encode(extensionId);

  // Step 2: Hash to get a 256-bit (32-byte) key using SHA-256
  const hashed = await self.crypto.subtle.digest("SHA-256", salt);

  // Step 3: Import as AES-GCM key (non-extractable)
  const secretKey = await self.crypto.subtle.importKey(
    "raw",
    hashed,
    { name: "AES-GCM" },
    false, // Non-extractable
    ["encrypt", "decrypt"]
  );

  return secretKey;
}

/**
 * Convert Uint8Array to Base64 string
 */
function _uint8ToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr));
}

/**
 * Convert Base64 string to Uint8Array
 */
function _base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i);
  }
  return arr;
}