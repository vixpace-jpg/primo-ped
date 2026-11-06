// La generazione AI è temporaneamente disattivata.
// PRIMO PED usa esclusivamente la repository locale tramite Crea PED.
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method==='GET')return res.status(200).json({enabled:false});
 return res.status(503).json({error:'Generazione AI disattivata. Usa Crea PED dalla repository.'});
}
