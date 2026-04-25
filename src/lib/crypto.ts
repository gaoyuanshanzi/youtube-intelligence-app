import CryptoJS from 'crypto-js';

const SECRET_KEY = "super_secret_yt_intelligence_key_for_local_storage"; // Simple static key for local demo

export const encryptKey = (key: string) => {
  return CryptoJS.AES.encrypt(key, SECRET_KEY).toString();
};

export const decryptKey = (encryptedKey: string) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedKey, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    return "";
  }
};
