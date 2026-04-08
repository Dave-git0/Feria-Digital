const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Configuration, OpenAIApi } = require('openai');
const { isCoffeeIntent } = require('./embeddings');

admin.initializeApp();
const db = admin.firestore();

const OPENAI_KEY = functions.config().openai?.key || process.env.OPENAI_API_KEY;
const openai = new OpenAIApi(new Configuration({ apiKey: OPENAI_KEY }));

const SYSTEM_PROMPT = `Eres un asistente especializado. Solo respondes preguntas relacionadas con café y cultivo de café (cultivo, variedades, manejo, fertilización, plagas, cosecha, procesamiento, tostado básico). Si la pregunta no es sobre estos temas, responde exactamente: "Lo siento, solo puedo ayudar con temas sobre café y cultivo."`;

async function callLLMWithSystemPrompt(question){
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: question }
  ];
  const resp = await openai.createChatCompletion({
    model: 'gpt-4o-mini', // o el modelo que uses
    messages,
    max_tokens: 400
  });
  return resp.data.choices?.[0]?.message?.content?.trim() || '';
}

exports.handleQuery = functions.https.onRequest(async (req, res) => {
  try {
    const q = (req.body?.question || '').trim();
    console.log('Pregunta recibida:', q);

    if (!q) return res.status(400).json({ error: 'Pregunta vacía' });

    // 1) filtro de intención (pregunta)
    if (!isCoffeeIntent(q, 1)) {
      await db.collection('rejected').add({ question: q, reason: 'intent', ts: Date.now() });
      console.log('Rechazada por intent:', q);
      return res.json({ reply: 'Lo siento, solo puedo ayudar con temas sobre café y cultivo.' });
    }

    // 2) llamada al LLM
    const reply = await callLLMWithSystemPrompt(q);
    console.log('Respuesta LLM:', reply);

    // 3) post-filtro: si la respuesta no contiene términos del dominio, la descartamos
    if (!isCoffeeIntent(reply, 1)) {
      await db.collection('rejected').add({ question: q, reply, reason: 'llm_out_of_domain', ts: Date.now() });
      console.log('Rechazada por llm_out_of_domain:', reply);
      return res.json({ reply: 'Lo siento, solo puedo ayudar con temas sobre café y cultivo.' });
    }

    // 4) todo OK: guardar y devolver
    await db.collection('logs').add({ question: q, reply, ts: Date.now() });
    return res.json({ reply });
  } catch (err) {
    console.error('handleQuery error:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});
