'use strict';

// DDA AI — real pedagogical assistant adapter (mandat §DDA-AI). Server-only:
// the Anthropic API key never reaches the browser, and this file is the one
// place that holds the system prompt enforcing the product's non-negotiable
// guardrails (no market signal, no personalized financial advice, no
// guaranteed-return claim, no portfolio management). The route handler in
// app.js never constructs this adapter when ANTHROPIC_API_KEY is absent —
// `/v1/ai/ask` then answers 503 `ai_not_configured`, the same honest
// fail-closed pattern already used for Chariow billing and the broker
// registry: nothing here ever claims to be active when it is not.

const SYSTEM_PROMPT = `Tu es DDA AI, l'assistant pédagogique de Darius Digital Academy (DDA), une académie en ligne d'apprentissage des marchés financiers pour l'Afrique francophone.

Ton rôle est strictement pédagogique : expliquer des notions, clarifier une leçon DDA, aider à préparer un exercice ou reformuler une explication pour qu'elle soit plus claire.

Règles absolues, sans aucune exception :
- Tu ne donnes jamais de signal de trading, jamais de prédiction sur la direction d'un marché ou d'un instrument, et jamais de recommandation personnalisée d'achat ou de vente.
- Tu ne garantis jamais un gain, un rendement ou un résultat financier.
- Tu ne remplaces jamais un conseiller financier agréé et tu le rappelles si la question s'y prête.
- Tu ne donnes aucune cotation ou donnée de marché en temps réel — tu n'y as pas accès et tu ne dois jamais en inventer.
- Si une question te demande un signal, une prédiction, un conseil personnalisé d'investissement ou une promesse de gain, tu refuses poliment et tu recentres la réponse sur la pédagogie (comprendre le concept, le risque, la méthode).
- Tu réponds en français, de façon claire et concise, au niveau d'un apprenant qui découvre les marchés.`;

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_TURNS = 6;

function validateAskRequest(body) {
  if (!body || typeof body.message !== 'string') return { error: 'message is required.' };
  const message = body.message.trim();
  if (!message) return { error: 'message cannot be empty.' };
  if (message.length > MAX_MESSAGE_LENGTH) return { error: `message must be at most ${MAX_MESSAGE_LENGTH} characters.` };
  const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY_TURNS) : [];
  const cleanHistory = [];
  for (const turn of history) {
    if (!turn || (turn.role !== 'user' && turn.role !== 'assistant') || typeof turn.content !== 'string') continue;
    cleanHistory.push({ role: turn.role, content: turn.content.slice(0, MAX_MESSAGE_LENGTH) });
  }
  return { message, history: cleanHistory };
}

class AnthropicAiAssistant {
  constructor({ apiKey, model = 'claude-haiku-5-5', fetchImpl = fetch, logger = () => {} }) {
    if (!apiKey) throw new Error('AnthropicAiAssistant requires an API key');
    this.apiKey = apiKey;
    this.model = model;
    this.fetch = fetchImpl;
    this.logger = logger;
  }

  async ask(message, { history = [] } = {}) {
    const response = await this.fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: [...history, { role: 'user', content: message }]
      })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      this.logger('ai_provider_error', { status: response.status, detail: detail.slice(0, 300) });
      throw new Error(`ai_provider_error_${response.status}`);
    }
    const body = await response.json();
    const reply = Array.isArray(body.content) ? body.content.filter(block => block.type === 'text').map(block => block.text).join('\n').trim() : '';
    if (!reply) throw new Error('ai_provider_empty_reply');
    return { reply };
  }
}

function aiAssistantFromEnv(env = process.env, extra = {}) {
  const apiKey = String(env.ANTHROPIC_API_KEY || '').trim();
  if (!apiKey) return null;
  const model = String(env.ANTHROPIC_MODEL || '').trim() || 'claude-haiku-5-5';
  return new AnthropicAiAssistant({ apiKey, model, ...extra });
}

module.exports = { AnthropicAiAssistant, aiAssistantFromEnv, validateAskRequest, SYSTEM_PROMPT, MAX_MESSAGE_LENGTH };
