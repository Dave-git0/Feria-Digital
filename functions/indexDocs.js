// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { isCoffeeIntent, getEmbedding, cosine } = require('./embeddings');
const { OpenAIApi, Configuration } = require('openai');

admin.initializeApp();
const db = admin.firestore();

const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

const SYSTEM_PROMPT = `Eres un asistente especializado. Solo respondes preguntas relacionadas con café y cultivo de café...`;

async function callLLMWithSystemPrompt(question){
  const messages = [{role:'system', content: SYSTEM_PROMPT}, {role:'user', content: question}];
  const resp = await openai.createChatCompletion({ model: 'gpt-4o-mini', messages, max_tokens: 500 });
  return resp.data.choices[0].message.content.trim();
}

exports.handleQuery = functions.https.onRequest(async (req, res) => {
  try {
    const q = (req.body.question || '').trim();
    if(!q) return res.status(400).json({ error: 'Pregunta vacía' });

    if(!isCoffeeIntent(q)){
      await db.collection('rejected').add({ question: q, reason: 'intent', ts: Date.now() });
      return res.json({ reply: 'Lo siento, solo puedo ayudar con temas sobre café y cultivo.' });
    }

    const qEmb = await getEmbedding(q);
    const snap = await db.collection('coffeeEmbeddings').get();
    let maxSim = 0;
    snap.forEach(doc => { const emb = doc.data().embedding; maxSim = Math.max(maxSim, cosine(qEmb, emb)); });

    if(maxSim < 0.65){
      await db.collection('rejected').add({ question: q, reason: 'low_similarity', score: maxSim, ts: Date.now() });
      return res.json({ reply: 'No tengo información suficiente en mi base sobre ese tema; solo temas de café.' });
    }

    const reply = await callLLMWithSystemPrompt(q);
    if(!isCoffeeIntent(reply)){
      await db.collection('rejected').add({ question: q, reply, reason: 'llm_out_of_domain', ts: Date.now() });
      return res.json({ reply: 'Lo siento, solo puedo ayudar con temas sobre café y cultivo.' });
    }

    await db.collection('logs').add({ question: q, reply, score: maxSim, ts: Date.now() });
    return res.json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno' });
  }
});
