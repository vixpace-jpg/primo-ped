# PRIMO PED

Planner editoriale odontoiatrico su Vercel, con editor locale per Content Post, Story e Carosello, calendario, consegna DOCX/ZIP e repository di 60 temi in 12 categorie.

## Repository come knowledge base

La repository in `content-library.json` è un **riferimento editoriale**, non un catalogo da copiare. In **Crea PED** selezioni una **categoria** (ed eventualmente un tema come focus) e il backend consulta i riferimenti della stessa categoria per creare un **nuovo PED** con titoli, headline, body, caption e slide originali. L'AI riceve istruzioni esplicite per non copiare i contenuti di riferimento e per evitare claim sanitari non supportati.

La knowledge base resta statica e versionata su GitHub; non c'è apprendimento permanente del modello né fine-tuning. Quando aggiorniamo il JSON, il prossimo deploy userà i nuovi contenuti.

## Generazione con OpenRouter (gratuito)

`POST /api/generate-ped` (Vercel Node.js) chiama la **Responses API di OpenRouter** usando esclusivamente il modello-router `openrouter/free`, con schema JSON rigido. Il browser riceve esclusivamente i Content generati; la chiave **non viene mai inviata al frontend**. I risultati vengono inseriti nell'editor locale, senza cancellare i Content precedenti, e devono essere revisionati da una persona prima della pubblicazione.

`GET /api/generate-ped` restituisce `{ "enabled": false }` finché non sono configurati tutti i segreti: l'endpoint **non chiama OpenRouter** in assenza di protezioni.

### Variabili d'ambiente Vercel

Configurare in **Project → Settings → Environment Variables** per Production:

| Nome | Funzione |
| --- | --- |
| `OPENROUTER_API_KEY` | Chiave API OpenRouter (https://openrouter.ai/keys); usare tipo Sensitive/Encrypted, **mai NEXT_PUBLIC_** |
| `PED_AI_ACCESS_CODE` | Codice forte, distinto dalla chiave API, da condividere con gli operatori autorizzati |
| `UPSTASH_REDIS_REST_URL` | URL REST di un database Upstash Redis, per rate limiting centralizzato |
| `UPSTASH_REDIS_REST_TOKEN` | Token REST Redis; conservare come secret |
| `PED_ALLOWED_ORIGIN` | Opzionale: origine del dominio personalizzato, ad esempio `https://ped.example.it` |

Dopo aver salvato le variabili, **ridistribuire** il progetto. Non incollare le chiavi in chat, nel codice sorgente o in issue GitHub. Per il codice di accesso usare una stringa casuale lunga, non la password del proprio account.

**Modello gratuito:** `openrouter/free`. Il router usa solo modelli gratuiti idonei, senza fallback a pagamento. Il piano gratuito ha limiti, generalmente 50 richieste/giorno per account senza crediti acquistati; i tentativi falliti possono contare nella quota. La qualità delle caption e la compatibilità JSON variano in base al modello scelto. OpenRouter e i fornitori dei modelli possono trattare il contenuto dei prompt secondo le rispettive condizioni: usare esclusivamente materiali editoriali non riservati, mai dati di pazienti.

Sicurezza: controllo di origine, autenticazione tramite codice e confronto in tempo costante, input validato, limiti centralizzati (10 richieste/ora per IP e 80/giorno globali), timeout; il limiter blocca le chiamate in caso di indisponibilità. Il codice di accesso viene tenuto soltanto nel campo password e cancellato dopo la generazione riuscita; non viene salvato nel localStorage.

Queste misure riducono il rischio di abuso di un endpoint pubblico, ma il **codice condiviso** non equivale a un sistema di account e permessi individuali. Per una distribuzione aziendale più ampia, integrare accesso nominativo/SSO, logging controllato e limiti di spesa direttamente in OpenRouter e Vercel.

### Test

Eseguire `npm test`. Una volta configurati i segreti, testare da browser 4 e 8 Content su categorie diverse: generazione, rendering nel calendario, modifiche alle caption, salvataggio, DOCX e backup. Il deploy può riuscire anche senza credenziali, ma **la generazione effettiva non può essere provata senza un account OpenRouter configurato**.

## Funzioni editoriali

- Primo avvio: mesi vuoti, Content illimitati; la knowledge base esiste separatamente e non riempie il mese automaticamente.
- Ricerca incrementale dei temi, filtro e categoria. Anteprima contenuti su `repository.html`.
- Caricamento di un tema JSON compatibile `ped-studio-theme-v1`.
- Editor rich text, slide, Post/Storia/Carosello, calendario, reset mese e consegna DOCX/ZIP.
- Salvataggio locale `primo-ped-v1`; backup `ped-studio-v2`.
- La funzione esterna AI Theme Builder resta accessibile da **Crea tema**; **Crea PED** usa OpenRouter gratuito, se configurato.

Sito: https://primo-ped.vercel.app
