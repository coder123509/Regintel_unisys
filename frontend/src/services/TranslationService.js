import OpenAI from "openai";

// Groq is OpenAI compatible
const groq = new OpenAI({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
  baseURL: "https://api.groq.com/openai/v1",
});

const MAX_CHUNKS_CHAR = 300;
const MAX_CONCURRENT_REQUESTS = 1; // Strict 1 concurrent request

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
      console.log(`[i18n] Cache HIT: "${text.substring(0, 20)}..."`);
      return this.cache[cacheKey];
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const translationPromise = this._processTranslationRequest(text, targetLanguage, cacheKey);
    this.pendingRequests.set(cacheKey, translationPromise);
    
    try {
      const result = await translationPromise;
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _processTranslationRequest(text, targetLanguage, cacheKey) {
    // 1. Chunking if necessary
    if (text.length > MAX_CHUNKS_CHAR) {
      console.log(`[i18n] Splitting large text (${text.length} chars) into chunks...`);
      return await this._translateInChunks(text, targetLanguage, cacheKey);
    }

    // 2. Queue for concurrency control
    return new Promise((resolve) => {
      this.queue.push({
        task: () => this._performTranslation(text, targetLanguage, cacheKey),
        resolve
      });
      console.log(`[i18n] Queue length: ${this.queue.length}`);
      this._processQueue();
    });
  }

  async _translateInChunks(text, targetLanguage, cacheKey) {
    const chunks = [];
    for (let i = 0; i < text.length; i += MAX_CHUNKS_CHAR) {
      chunks.push(text.slice(i, i + MAX_CHUNKS_CHAR));
    }

    // Process chunks sequentially to minimize TPM impact
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
      resolve(null); // Resolve with null on failure
    } finally {
      this.activeRequests--;
      // Small delay between requests to help with rate limits
      setTimeout(() => this._processQueue(), 200);
    }
  }

  async _performTranslation(text, targetLanguage, cacheKey) {
    console.log(`[i18n] Cache MISS: "${text.substring(0, 20)}..." (${text.length} chars)`);
    
    try {
      const langMap = {
        'hi': 'Hindi',
        'kn': 'Kannada',
        'ta': 'Tamil',
        'te': 'Telugu'
      };
      const langName = langMap[targetLanguage] || targetLanguage;

      console.log(`[i18n] Requesting Groq: ${text.length} chars -> ${langName}`);

      const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `Translate the following English text to ${langName}. 
            Return ONLY the translated text. No quotes, no explanations.
            Keep technical terms (Neo4j, RAG, LLM, API, etc.), URLs, IDs, and file names UNCHANGED.`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.1,
      });

      const translatedText = response.choices[0]?.message?.content?.trim() || text;
      
      // Log approximate tokens (chars / 4 is a common rough estimate)
      console.log(`[i18n] Groq Success: ~${Math.ceil(text.length / 4)} tokens sent`);

      this.cache[cacheKey] = translatedText;
      this._persistCache();

      return translatedText;
    } catch (error) {
      if (error?.status === 429) {
        console.error("[i18n] Rate limit (429) reached. Returning original text.");
      } else {
        console.error("[i18n] Groq Error:", error);
      }
      return text; // Fallback to original text
    }
  }

  _persistCache() {
    const keys = Object.keys(this.cache);
    if (keys.length > 3000) { // Increased cache capacity
      const keysToRemove = keys.slice(0, 500);
      keysToRemove.forEach(k => delete this.cache[k]);
    }
    try {
      localStorage.setItem("dynamic_translation_cache", JSON.stringify(this.cache));
    } catch (e) {
      console.warn("[i18n] Local storage full, clearing cache");
      this.cache = {};
      localStorage.removeItem("dynamic_translation_cache");
    }
  }
}

export default new TranslationService();
