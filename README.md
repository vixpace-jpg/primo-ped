# PRIMO PED

Clone autonomo dell'editor PED Studio, con avvio **vuoto**: nessun tema, nessun Content e nessuna libreria editoriale precaricata.

## Funzionalità

- Content mensili senza limite fisso di 8, formati Post, Storia e Carosello.
- Editor rich text, slide, date, calendario e riprogrammazione drag-and-drop.
- Temi creati manualmente o importati con il formato JSON `ped-studio-theme-v1`.
- AI Theme Builder tramite guida Markdown e chat esterne, **senza API AI integrate**.
- Consegna ZIP con DOCX e allegati; backup ZIP importabile/esportabile nel formato compatibile `ped-studio-v2`.
- Salvataggio esclusivamente locale su `localStorage` (`primo-ped-v1`) e IndexedDB (`primo-ped-refs`).

## Avvio

Applicazione statica: aprire `index.html` da un server HTTP locale o pubblicare questa repository in un **nuovo progetto Vercel**. Non collegare al progetto Vercel di PED Studio. `vercel.json` configura soltanto header generici: non ci sono variabili di ambiente richieste o integrazioni AI attive.

## Utilizzo iniziale

Scegliere il mese, premere **Aggiungi Content** anche senza creare un tema; oppure creare un tema manualmente. **Crea tema** guida all'uso di una chat AI esterna; **Carica tema** importa il JSON dopo conferma, se sostituisce Content esistenti. Il pulsante **Crea tema con AI** apre la stessa guida e non genera contenuti localmente. Nessuna demo viene caricata tramite parametri URL.

## Verifiche

`npm test` esegue i controlli statici in `test/clone.test.mjs`. Verificare inoltre i flussi in browser: nuova scheda senza contenuti, aggiunta Content senza tema, formati Post/Storia/Carosello, conversione da una slide, reset mese, import JSON, calendario, generazione DOCX e import/export backup ZIP.

La UI mantiene temporaneamente stile e colori dell'app sorgente; nessun nuovo branding è stato definito. Gli endpoint legacy di autenticazione/impostazioni e Gemini non sono distribuiti perché disattivati o non necessari ai flussi editoriali; il clone è intenzionalmente client-side.

**Repository sorgente, sola lettura:** `vixpace-jpg/ped-studio`. **Repository destinazione:** `vixpace-jpg/primo-ped`.
