// client/src/services/encryptionService.js
import CryptoJS from 'crypto-js';

// Generate a key pair for a chat
export const generateChatKey = async (chatId) => {
  // Create a unique key for this chat
  const chatKey = CryptoJS.lib.WordArray.random(256/8).toString();

  // Store it in a secure way (considering localStorage is not safe for keys in production)
  // Ideally, you would use something like the Web Crypto API or IndexedDB for secure storage.
  localStorage.setItem(`chat_key_${chatId}`, chatKey);

  return chatKey;
};

// Get the encryption key for a chat
export const getChatKey = (chatId) => {
  // Check if key exists in localStorage
  return localStorage.getItem(`chat_key_${chatId}`);
};

// Encrypt a message
export const encryptMessage = (message, chatId) => {
  const key = getChatKey(chatId);
  if (!key) {
    console.warn('No encryption key found, sending unencrypted message');
    return message; // Fallback to unencrypted if no key
  }

  try {
    // Encrypt the message using AES with the chat-specific key
    return CryptoJS.AES.encrypt(message, key).toString();
  } catch (error) {
    console.error('Failed to encrypt message:', error);
    return message; // Fallback to original message if encryption fails
  }
};

// Decrypt a message
export const decryptMessage = (encryptedMessage, chatId) => {
  const key = getChatKey(chatId);
  if (!key) {
    console.warn('No encryption key found, returning unencrypted message');
    return encryptedMessage; // Return encrypted message as-is if no key
  }

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
    const decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedMessage) {
      console.warn('Decryption failed, returning encrypted message');
      return '[Unable to decrypt message]';
    }

    return decryptedMessage;
  } catch (error) {
    console.error('Failed to decrypt message:', error);
    return '[Encrypted message]'; // Fallback to a default message in case of failure
  }
};

export default {
  generateChatKey,
  getChatKey,
  encryptMessage,
  decryptMessage
};
