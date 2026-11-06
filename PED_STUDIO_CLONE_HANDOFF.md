# PRIMO PED — Handoff per la clonazione di PED Studio

**Destinazione (nuova repository):** https://github.com/vixpace-jpg/primo-ped  
**Sorgente (sola lettura):** https://github.com/vixpace-jpg/ped-studio  
**Applicazione sorgente:** https://ped-studio.vercel.app/  
**Versione di riferimento:** PED Studio V3.0 (denominazione di lavoro, non versione tecnica garantita)  
**Data handoff:** 6 novembre 2026

## 1. Obiettivo

Creare **PRIMO PED**, un clone **indipendente** di PED Studio, nella repository `vixpace-jpg/primo-ped`.

**Vincolo fondamentale:** il clone deve partire **senza temi e senza Content predefiniti**. La libreria di 20 temi / 160 Content Erreics ETS **non deve essere trasferita**. Nessuna informazione Erreics deve restare nel frontend, negli esempi precaricati, nei messaggi di errore o nella logica di generazione.

La repository `vixpace-jpg/ped-studio` è **sorgente di riferimento e non va modificata**. Ogni modifica deve riguardare esclusivamente `vixpace-jpg/primo-ped`.

## 2. Stato alla consegna

- La nuova repository `vixpace-jpg/primo-ped` era **vuota** al controllo iniziale.
- Il codice da clonare è nella repository sorgente.
- Questo documento è un **handoff**, non significa che il clone sia già implementato.
- Il nuovo account ChatGPT dovrà ottenere accesso GitHub in lettura al repository sorgente e scrittura a quello nuovo; non deve presumere che i suoi connettori siano già autorizzati.
- Non copiare i dati locali del browser, né segreti, token, password, variabili di ambiente o configurazioni Vercel sensibili.

## 3. Funzionalità da preservare

### Editor
- Creazione, eliminazione e modifica di **Content** mensili, senza limite fisso di 8.
- I Content salvati non devono andare persi a causa di aggiornamenti dell'interfaccia.
- Selettori di formato **Post**, **Storia** e **Carosello**; Post e Storia possono essere entrambi attivi, Carosello è esclusivo.
- Headline obbligatoria prima della consegna; titolo, subhead, corpo, altre info, caption e reference facoltativi.
- Carosello: 3 slide iniziali, aggiunta/rimozione, per slide **Headline, Subhead, Corpo**. Riducendo a una sola slide, conversione a **Post statico** e toast di 4 secondi.
- Date modificabili; editor rich text per body, other e caption; allegati/references dove supportati.
- Pulsante **Aggiungi Content** dentro il pannello con l'elenco.
- Pulsante **Reset mese** elimina solo Content, tema e allegati del mese scelto dopo conferma.

### Planning / consegna
- Calendario mensile lunedì–domenica con drag-and-drop ove supportato.
- DOCX iniziale con calendario mensile; per ogni Content titolo bold, data, formato, blocco Testo su immagine e slide numerate per caroselli.
- Consegna ZIP contenente DOCX e allegati.
- Esportazione/importazione backup progetto ZIP con dati locali, mantenendo la compatibilità dei dati.

### AI Theme Builder
- **Crea tema** apre un popup di istruzioni.
- Guida Markdown disponibile per download.
- Link ChatGPT, Claude, Gemini e Copilot; aprono le rispettive chat, ma **non è possibile allegare automaticamente** il Markdown nei servizi esterni con un semplice link.
- **Carica tema** importa un JSON con schema `ped-studio-theme-v1`, tema e Content, con avviso prima di sostituire i Content del mese.
- Il Markdown sorgente si trova in `PED_Studio_AI_Theme_Builder.md` nella repository originale; **copiarlo** nel clone perché non contiene temi predefiniti.
- Non attivare integrazioni API AI se non richiesto. Gemini era stato disabilitato nel progetto sorgente.

## 4. Modifiche obbligatorie per il clone VUOTO

1. Copiare il codice sorgente nella **nuova** repository, evitando di trasportare dati personali, segreti e contenuti editoriali Erreics.
2. In `index.html`, individuare `const offlineLibrary=[...];` e **rimuovere integralmente i 20 temi e i 160 Content**, sostituendo la libreria con un array vuoto (o rimuovendo del tutto la funzionalità offline). Fare attenzione: si tratta di un'enorme dichiarazione inline, non di un file esterno.
3. Eliminare l'inserimento automatico dei temi: `for(const entry of offlineLibrary){...state.themes.push(...)}`.
4. Il primo avvio deve avere uno stato pulito: `{themes:[], months:{}, selectedMonth:currentMonth}`.
5. **Importantissimo:** evitare di riciclare il localStorage del progetto originale su un eventuale stesso dominio. Usare, per il clone, chiavi dedicate per lo stato (es. `primo-ped-v1`) e l'archivio locale degli allegati (es. `primo-ped-refs`). Se si aggiornano le chiavi, aggiornare **tutti** i riferimenti a lettura, scrittura e import/export, non soltanto alcuni.
6. Attualmente `#generate` cerca sempre un tema nella `offlineLibrary`, quindi con `offlineLibrary=[]` **il pulsante “Genera PED mensile” non funzionerebbe**. Non lasciare un comando inattivo. Occorre **rimuoverlo oppure modificarne semanticamente la funzione** (ad esempio aprire “Crea tema” o proporre il caricamento JSON), dopo aver verificato con l'utente la UX desiderata.
7. Mantenere **Aggiungi Content** operativo anche con **zero temi**, per permettere di lavorare da zero. Se richiesto, creare tema manualmente e associarlo al mese.
8. Rimuovere testi, riferimenti, messaggi ed esempi specifici di Erreics nel frontend, in particolare messaggi “20 temi Erreics” e “tema senza PED predisposto”; ricontrollare anche i riferimenti “post” da rinominare “Content” dove visibili.
9. L'identità visiva, il naming esatto e i colori **non sono ancora stati specificati** per PRIMO PED: chiedere all'utente gli elementi di brand prima di inventarli. Usare temporaneamente la UI ereditata, senza introdurre un brand non autorizzato.
10. Non importare il backup dei mesi o dei Content già salvati nel browser originale: il clone parte **vuoto**.

## 5. Architettura e punti noti

- L'app è principalmente in `index.html` (markup, CSS e JavaScript inline).
- `package.json` descrive il progetto Node e lo script di test.
- `vercel.json` configura header e una function server, attualmente con porzioni di legacy AI.
- `api/generate.js` nel sorgente restituisce **HTTP 503** perché Gemini è sospeso: il clone non deve dipendere da questa funzione.
- `lib/auth.js` e gli endpoint di impostazioni/login/logout sono legati a funzionalità server precedenti; verificare se siano necessari. Non copiare o attivare segreti dell'originale.
- Le references file usano IndexedDB; i contenuti editoriali vengono salvati nel browser.
- Le date di calendario e i mesi passati sono gestiti dal codice esistente; non modificare regole senza necessità.
- L'esportazione backup usa ancora il formato `ped-studio-v2`; **non confondere il formato backup progetto con quello di importazione temi**, `ped-studio-theme-v1`.

## 6. Schema JSON importabile

```json
{
  "format": "ped-studio-theme-v1",
  "theme": "Nome del tema",
  "contents": [
    {
      "title": "Titolo interno",
      "formats": ["post", "story"],
      "headline": "Headline richiesta",
      "subhead": "",
      "body": "",
      "other": "",
      "caption": "",
      "slides": []
    }
  ]
}
```

Per Carosello: `formats:["carousel"]` e `slides` di 2–40 elementi con stringhe `headline` (non vuota), `subhead`, `body`. Tutti i Content richiedono la headline. L'importatore supporta 1–100 Content, file JSON massimo 2 MB e `theme` di massimo 120 caratteri.

## 7. Workflow per il nuovo ChatGPT

1. Confermare accesso in lettura alla sorgente e scrittura alla destinazione.
2. Esaminare struttura repository, test, istruzioni di deploy e nomi dei file. Non basarsi soltanto sul presente documento.
3. Copiare il codice e tutte le dipendenze tecniche necessarie nella nuova repository.
4. Applicare le modifiche per libreria e stato iniziale vuoti **nella nuova repository**.
5. Controllare i comandi che dipendono dalla libreria offline e renderli operativi o disabilitarli in maniera chiara.
6. Preservare flussi: creare Content senza temi, scegliere Post/Storia, creare carosello, aggiungere e cancellare slide, reset mese, calendario, DOCX, backup, import JSON.
7. Aggiornare testi visibili e README; non inventare palette o contenuti.
8. Preparare deploy Vercel autonomo. **Non riutilizzare lo stesso progetto Vercel** dell'originale. Collegare la nuova repository a un nuovo progetto Vercel.
9. Eseguire test di sintassi e, se possibile, test funzionali in browser. Non dichiarare test effettuati se non sono stati eseguiti.
10. Riferire all'utente URL e commit finali, modifiche introdotte, test e punti ancora aperti.

## 8. Criteri di accettazione

- [ ] Repository originale non modificata.
- [ ] Nuova repository indipendente con codice completo e struttura eseguibile.
- [ ] Primo avvio senza **alcun tema** precaricato.
- [ ] Primo avvio senza **alcun Content** precaricato.
- [ ] Nessun testo o esempio Erreics rimasto nell'app.
- [ ] Aggiungi Content funziona anche senza tema.
- [ ] Post + Storia, Carosello e conversione a Post funzionano.
- [ ] Import JSON, calendario, DOCX e backup funzionano.
- [ ] Chiavi di storage e progetto Vercel indipendenti.
- [ ] Nessuna credenziale copiata.
- [ ] Il nuovo account ChatGPT ha accesso soltanto ai repository necessari.

## 9. Prompt da incollare nel nuovo account ChatGPT

> Voglio creare **PRIMO PED**, clone indipendente di PED Studio. Leggi `PED_STUDIO_CLONE_HANDOFF.md` nella repository **vixpace-jpg/primo-ped**. Il codice di partenza è su **vixpace-jpg/ped-studio**, repository da usare **solo in lettura**. La destinazione è **vixpace-jpg/primo-ped**. Devi mantenere tutte le funzionalità editoriali, ma l'app deve avviarsi **senza temi e Content predefiniti**, senza contenuti Erreics. Non modificare il repository originale e non inventare un nuovo branding. Verifica e implementa la clonazione nella nuova repository, testando sintassi, UI e flussi principali. Prima di apportare modifiche irreversibili o pubblicare connettori/server sensibili, comunicami eventuali vincoli reali. Usa le istruzioni e i criteri di accettazione contenuti nel Markdown.
