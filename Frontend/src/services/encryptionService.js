// client/src/services/encryptionService.js
import CryptoJS from 'crypto-js';

// Generate a key pair for a chat
export const generateChatKey = async (chatId) => {
  // Create a unique key for this chat
  const chatKey = CryptoJS.lib.WordArray.random(256/8).toString();
  
  // Store it in local storage (in a real app, might use a more secure method)
  localStorage.setItem(`chat_key_${chatId}`, chatKey);
  
  return chatKey;
};

// Get the encryption key for a chat
export const getChatKey = (chatId) => {
  return localStorage.getItem(`chat_key_${chatId}`);
};

// Encrypt a message
export const encryptMessage = (message, chatId) => {
  const key = getChatKey(chatId);
  if (!key) return message; // Fall back to unencrypted if no key
  
  return CryptoJS.AES.encrypt(message, key).toString();
};

// Decrypt a message
export const decryptMessage = (encryptedMessage, chatId) => {
  const key = getChatKey(chatId);
  if (!key) return encryptedMessage; // Fall back to as-is if no key
  
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Failed to decrypt message:', error);
    return '[Encrypted message]';
  }
};

export default {
  generateChatKey,
  getChatKey,
  encryptMessage,
  decryptMessage
};