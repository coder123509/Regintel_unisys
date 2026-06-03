import OpenAI from "openai";

// Groq is OpenAI compatible
const groq = new OpenAI({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
  baseURL: "https://api.groq.com/openai/v1",
});

const MAX_CHUNKS_CHAR = 300;
const MAX_CONCURRENT_REQUESTS = 1; // Strict 1 concurrent request
const INITIAL_RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRIES = 5;

class TranslationService {
  constructor() {
    this.cache = JSON.parse(localStorage.getItem("dynamic_translation_cache") || "{}");
    this.pendingRequests = new Map();
    this.queue = [];
    this.activeRequests = 0;
  }

  async translate(text, targetLanguage) {
    if (!text || targetLanguage === "en" || targetLanguage === "English") {
      return text;
    }

    const cacheKey = `${targetLanguage}_${text}`;
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const translationPromise = this._processTranslationRequest(text, targetLanguage, cacheKey);
    this.pendingRequests.set(cacheKey, translationPromise);
    
    try {
      return await translationPromise;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async translateBatch(texts, targetLanguage) {
    if (!texts.length || targetLanguage === "en" || targetLanguage === "English") {
      return texts;
    }

    // Filter out cached items and keep track of indices
    const results = new Array(texts.length).fill(null);
    const toTranslate = [];

    texts.forEach((text, index) => {
      const cacheKey = `${targetLanguage}_${text}`;
      if (this.cache[cacheKey]) {
        results[index] = this.cache[cacheKey];
      } else {
        toTranslate.push({ text, index });
      }
    });

    if (toTranslate.length === 0) return results;

    console.log(`[i18n] Batch translating ${toTranslate.length} items...`);

    // Group items into small batches to stay under TPM/token limits
    // Max 5 items or 1000 chars per batch
    const batchSize = 5;
    const batches = [];
    for (let i = 0; i < toTranslate.length; i += batchSize) {
      batches.push(toTranslate.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const batchTexts = batch.map(item => item.text);
      
      const translatedBatch = await new Promise((resolve) => {
        this.queue.push({
          task: () => this._performBatchTranslation(batchTexts, targetLanguage),
          resolve
        });
        this._processQueue();
      });

      if (translatedBatch && Array.isArray(translatedBatch)) {
        batch.forEach((item, i) => {
          const translated = translatedBatch[i] || item.text;
          results[item.index] = translated;
          // Note: Cache is already updated inside _performBatchTranslation for individual items
        });
      } else {
        // Fallback for failed batch
        batch.forEach(item => {
          results[item.index] = results[item.index] || item.text;
        });
      }
    }

    return results;
  }

  async _processTranslationRequest(text, targetLanguage, cacheKey) {
    if (text.length > MAX_CHUNKS_CHAR) {
      return await this._translateInChunks(text, targetLanguage, cacheKey);
    }

    return new Promise((resolve) => {
      this.queue.push({
        task: () => this._performTranslation(text, targetLanguage, cacheKey),
        resolve
      });
      this._processQueue();
    });
  }

  async _translateInChunks(text, targetLanguage, cacheKey) {
    const chunks = [];
    for (let i = 0; i < text.length; i += MAX_CHUNKS_CHAR) {
      chunks.push(text.slice(i, i + MAX_CHUNKS_CHAR));
    }

    const translatedChunks = [];
    for (const chunk of chunks) {
      translatedChunks.push(await this.translate(chunk, targetLanguage));
    }

    const fullTranslation = translatedChunks.join("");
    this.cache[cacheKey] = fullTranslation;
    this._persistCache();
    return fullTranslation;
  }

  async _processQueue() {
    if (this.activeRequests >= MAX_CONCURRENT_REQUESTS || this.queue.length === 0) {
      return;
    }

    const { task, resolve } = this.queue.shift();
    this.activeRequests++;

    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      console.error("[i18n] Queue task failed:", error);
      resolve(null);
    } finally {
      this.activeRequests--;
      // Small random jitter to prevent synchronized retry thundering herd
      const jitter = Math.floor(Math.random() * 200);
      setTimeout(() => this._processQueue(), 500 + jitter);
    }
  }

  async _performTranslation(text, targetLanguage, cacheKey, retryCount = 0) {
    try {
      const langName = this._getLangName(targetLanguage);
      const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `Translate to ${langName}. Return ONLY translation. Keep technical terms, IDs, URLs UNCHANGED.`
          },
          { role: "user", content: text }
        ],
        temperature: 0.1,
      });

      const translated = response.choices[0]?.message?.content?.trim() || text;
      this.cache[cacheKey] = translated;
      this._persistCache();
      return translated;
    } catch (error) {
      return await this._handleError(error, () => this._performTranslation(text, targetLanguage, cacheKey, retryCount + 1), retryCount, text);
    }
  }

  async _performBatchTranslation(texts, targetLanguage, retryCount = 0) {
    try {
      const langName = this._getLangName(targetLanguage);
      const prompt = texts.map((t, i) => `[${i}] ${t}`).join("\n");
      
      const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `Translate each line to ${langName}. Maintain the [index] prefix. Return ONLY the translated lines.`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content || "";
      const lines = content.split("\n");
      const translated = new Array(texts.length).fill(null);
      
      lines.forEach(line => {
        const match = line.match(/^\[(\d+)\]\s*(.*)/);
        if (match) {
          const index = parseInt(match[1]);
          if (index < texts.length) {
            const translatedText = match[2].trim();
            translated[index] = translatedText;
            // Cache individual items from the batch
            const originalText = texts[index];
            this.cache[`${targetLanguage}_${originalText}`] = translatedText;
          }
        }
      });

      // For any that failed to parse, use original text as fallback
      texts.forEach((original, i) => {
        if (!translated[i]) translated[i] = original;
      });

      this._persistCache();
      return translated;
    } catch (error) {
      return await this._handleError(error, () => this._performBatchTranslation(texts, targetLanguage, retryCount + 1), retryCount, texts);
    }
  }

  async _handleError(error, retryFn, retryCount, fallbackValue) {
    if (error?.status === 429 && retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.warn(`[i18n] 429 Rate Limit. Retrying in ${delay}ms (Attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(r => setTimeout(r, delay));
      return retryFn();
    }
    console.error("[i18n] Error:", error);
    return fallbackValue;
  }

  _getLangName(code) {
    const map = { hi: 'Hindi', kn: 'Kannada', ta: 'Tamil', te: 'Telugu' };
    return map[code] || code;
  }

  _persistCache() {
    try {
      localStorage.setItem("dynamic_translation_cache", JSON.stringify(this.cache));
    } catch (e) {
      console.warn("[i18n] Local storage full, clearing old items");
      const keys = Object.keys(this.cache);
      if (keys.length > 1000) {
        const newCache = {};
        keys.slice(-500).forEach(k => newCache[k] = this.cache[k]);
        this.cache = newCache;
        localStorage.setItem("dynamic_translation_cache", JSON.stringify(this.cache));
      }
    }
  }
}

export default new TranslationService();
