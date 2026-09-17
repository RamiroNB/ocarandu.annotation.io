# Página de anotação (GitHub Pages)

Site estático: um item por vez, respostas salvas no navegador, CSV no final.
Sem servidor, sem chave no site. A pasta inteira é publicável.

## O que tem aqui
- `index.html`, `app.js`, `style.css` — a página.
- `config.js` — **edite**: `EMAIL_TO` (quem recebe o CSV) e, opcional, `SUBMIT_URL`.
- `data/items.json` — itens públicos: id opaco, participante, cargo, opinião, os 3
  trechos mais parecidos da fala dessa pessoa. **Não contém a condição** (baseline
  ou steered). Gerado por `scripts/build_annotation_web_items.py`.
- A chave `id → condição` fica em `data/publichearingbr/annotation/web/key.csv`
  (gitignorado). Nunca copie para esta pasta.

## Publicar
1. Crie um repositório público (ex.: `ocarandu-anotacao`) e copie o conteúdo desta
   pasta para a raiz dele (ou para `docs/`).
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `/ (root)` (ou `/docs`).
3. A URL sai como `https://<usuario>.github.io/ocarandu-anotacao/`. Testar local:
   `python -m http.server 8000` dentro da pasta e abrir `http://localhost:8000`.

## Como as respostas chegam
GitHub Pages não envia e-mail. Duas rotas, a primeira sempre funciona:
1. **CSV + e-mail** (padrão): no fim, a página baixa o CSV e abre o e-mail do
   anotador com destinatário e assunto prontos; ele anexa o arquivo e envia.
2. **Envio automático** (opcional): defina `SUBMIT_URL` com um Web App do Google
   Apps Script (grátis, sem limite prático), que grava numa planilha e manda o
   e-mail. Código do Apps Script (Publicar → Implantar como app da web → acesso
   "Qualquer pessoa"):

```js
function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  var sh = SpreadsheetApp.openById("ID_DA_PLANILHA").getSheets()[0];
  d.rows.forEach(function (r) { sh.appendRow([new Date(), d.annotator, d.model, r.id, r.support, r.form_issue, r.comment, r.ts, r.seconds]); });
  MailApp.sendEmail("SEU_EMAIL", "[Ocarandu] anotação " + d.model + " · " + d.annotator, d.csv);
  return ContentService.createTextOutput("ok");
}
```

## Protocolo
Pergunta única por item, a mesma do dataset PublicHearingBR: a opinião é
sustentada pelos trechos do que essa pessoa disse? Respostas: sustentada /
não sustentada / não dá para dizer, mais uma flag opcional de forma (1ª pessoa,
cópia literal, não é opinião) e comentário. Cega quanto à condição; itens em
ordem embaralhada fixa; dois anotadores por conjunto no mínimo.

## Juntar e pontuar
Junte os CSVs recebidos com a chave e rode as estatísticas (script a criar:
`scripts/annotation_web_results.py`): taxa de "não sustentada" por condição,
McNemar pareado por participante, κ entre anotadores, e comparação com o
referee lexical (`referee_best_containment` na chave).
