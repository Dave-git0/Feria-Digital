function isCoffeeIntent(text, minHits = 1){
  if(!text) return false;
  const t = text.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g,''); // quita acentos
  const keywords = [
    'cafe','cafeto','cafes','tostad','tostado','tostado','arabica','robusta',
    'fertiliz','fertilizacion','fertilización','plaga','plagas','cosecha',
    'siembra','riego','sombra','beneficio','procesamiento','molienda','taza',
    'variedad','variedades','cultivo','cultivar','abono','suelo','poda'
  ];
  let hits = 0;
  for(const k of keywords) if(t.includes(k)) hits++;
  return hits >= minHits;
}
module.exports = { isCoffeeIntent };
