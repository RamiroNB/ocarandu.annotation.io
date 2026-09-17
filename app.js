/* Página de anotação Ocarandu: estática, sem servidor. Estado no localStorage do navegador. */
(function () {
  const CFG = window.ANNOT_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const STOP = new Set(("para como mais pela pelo pelos pelas este esta esse essa isso aqui muito também sobre entre quando onde " +
    "porque então ainda apenas todos todas cada outro outra seus suas nosso nossa nossos nossas deputado deputada senhor senhora " +
    "presidente afirmou disse destacou defendeu ressaltou trecho trechos audiencia audiência").split(" "));
  let DATA = null, items = [], idx = 0, state = null, storageKey = null, shownAt = 0;

  document.title = CFG.TITLE || document.title;
  $("title").textContent = CFG.TITLE || $("title").textContent;

  fetch("data/items.json").then(r => r.json()).then(d => {
    DATA = d;
    const sel = $("model");
    d.models.forEach(m => { const o = document.createElement("option"); o.value = m.id; o.textContent = `${m.label} · ${m.n_items} itens`; sel.appendChild(o); });
    const last = safeGet("ocarandu-annot:last");
    if (last) { try { const l = JSON.parse(last); $("annotator").value = l.annotator || ""; sel.value = l.model || sel.value; $("highlight").checked = !!l.highlight; } catch (e) {} }
  }).catch(() => { $("screen-start").innerHTML = "<p>Não consegui carregar <code>data/items.json</code>. Se abriu o arquivo direto do disco, sirva a pasta por HTTP (ex.: <code>python -m http.server</code>) ou publique no GitHub Pages.</p>"; });

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function show(id) { ["screen-start", "screen-item", "screen-done"].forEach(s => $(s).classList.toggle("hidden", s !== id)); }

  $("btn-start").onclick = () => {
    const annotator = $("annotator").value.trim();
    if (!annotator) { alert("Escreva seu nome ou iniciais."); return; }
    const model = $("model").value;
    items = DATA.items.filter(it => it.model === model);
    storageKey = `ocarandu-annot:${model}:${annotator.toLowerCase()}`;
    state = JSON.parse(safeGet(storageKey) || "null") || { annotator, model, started: new Date().toISOString(), answers: {} };
    safeSet("ocarandu-annot:last", JSON.stringify({ annotator, model, highlight: $("highlight").checked }));
    idx = items.findIndex(it => !state.answers[it.id]); if (idx < 0) idx = 0;
    render();
  };
  $("btn-export-start").onclick = () => {
    const annotator = $("annotator").value.trim(); const model = $("model").value;
    const s = JSON.parse(safeGet(`ocarandu-annot:${model}:${annotator.toLowerCase()}`) || "null");
    if (!s || !Object.keys(s.answers).length) { alert("Nada salvo para esse nome e conjunto neste navegador."); return; }
    state = s; items = DATA.items.filter(it => it.model === model); download();
  };

  function words(t) { return (t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").match(/[a-z]{4,}/g) || []).filter(w => !STOP.has(w)); }
  function highlight(text, vocab) {
    if (!vocab) return escapeHtml(text);
    return escapeHtml(text).replace(/[A-Za-zÀ-ÿ]{4,}/g, w => vocab.has(w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")) ? `<mark>${w}</mark>` : w);
  }
  function escapeHtml(s) { return s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  function render() {
    if (idx >= items.length) { return done(); }
    const it = items[idx]; shownAt = Date.now();
    show("screen-item");
    const nDone = Object.keys(state.answers).length;
    $("progress").textContent = `${state.annotator} · ${nDone}/${items.length} respondidos · item ${idx + 1}`;
    $("participant").textContent = it.participant; $("cargo").textContent = it.cargo ? `· ${it.cargo}` : "";
    const vocab = $("highlight").checked ? new Set(words(it.opinion)) : null;
    $("opinion").innerHTML = highlight(it.opinion, vocab);
    $("nwin").textContent = `(${it.windows.length} trechos mais parecidos, de ${it.n_windows} janelas da fala dessa pessoa)`;
    $("windows").innerHTML = it.windows.map((w, i) => `<div class="win"><div class="k">trecho ${i + 1}</div>${highlight(w, vocab)}</div>`).join("");
    const a = state.answers[it.id] || {};
    document.querySelectorAll(".ans").forEach(b => b.classList.toggle("selected", b.dataset.support === a.support));
    $("form-issue").checked = !!a.form_issue; $("comment").value = a.comment || "";
    $("saved").textContent = a.support ? "salvo" : "";
    $("btn-prev").disabled = idx === 0;
    window.scrollTo(0, 0);
  }
  function save(partial) {
    const it = items[idx]; const prev = state.answers[it.id] || {};
    const support = partial.support !== undefined ? partial.support : prev.support;
    if (!support && !$("form-issue").checked && !$("comment").value.trim()) return;
    state.answers[it.id] = { support: support || "", form_issue: $("form-issue").checked ? 1 : 0, comment: $("comment").value.trim(),
      ts: new Date().toISOString(), seconds: Math.round(((prev.seconds || 0) * 1000 + (Date.now() - shownAt)) / 1000) };
    shownAt = Date.now();
    safeSet(storageKey, JSON.stringify(state)); $("saved").textContent = "salvo";
    document.querySelectorAll(".ans").forEach(b => b.classList.toggle("selected", b.dataset.support === support));
  }
  document.querySelectorAll(".ans").forEach(b => b.onclick = () => { save({ support: b.dataset.support }); setTimeout(next, 150); });
  $("form-issue").onchange = () => save({}); $("comment").onblur = () => save({});
  function next() { save({}); if (idx < items.length - 1) { idx++; render(); } else { done(); } }
  $("btn-next").onclick = next;
  $("btn-prev").onclick = () => { save({}); if (idx > 0) { idx--; render(); } };
  $("btn-home").onclick = () => { save({}); show("screen-start"); $("progress").textContent = ""; };
  $("btn-export").onclick = () => { save({}); download(); };
  document.addEventListener("keydown", e => {
    if ($("screen-item").classList.contains("hidden") || e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
    const map = { "1": "sustentada", "2": "nao_sustentada", "3": "nao_da_para_dizer" };
    if (map[e.key]) { save({ support: map[e.key] }); setTimeout(next, 150); }
    else if (e.key.toLowerCase() === "f") { $("form-issue").checked = !$("form-issue").checked; save({}); }
    else if (e.key === "ArrowRight") next(); else if (e.key === "ArrowLeft") $("btn-prev").click();
  });

  function csv() {
    const esc = v => `"${String(v === undefined || v === null ? "" : v).replace(/"/g, '""')}"`;
    const head = ["id", "model", "annotator", "support", "form_issue", "comment", "timestamp", "seconds"];
    const rows = items.filter(it => state.answers[it.id]).map(it => { const a = state.answers[it.id]; return [it.id, it.model, state.annotator, a.support, a.form_issue, a.comment, a.ts, a.seconds].map(esc).join(","); });
    return head.join(",") + "\n" + rows.join("\n") + "\n";
  }
  function fileName() { return `anotacao_${state.model}_${state.annotator.replace(/\W+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`; }
  function download() {
    const blob = new Blob(["﻿" + csv()], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fileName(); document.body.appendChild(a); a.click(); a.remove();
  }
  function done() {
    show("screen-done");
    const n = items.filter(it => (state.answers[it.id] || {}).support).length;
    $("done-summary").textContent = `${state.annotator}, você respondeu ${n} de ${items.length} itens do conjunto ${state.model}.`;
    $("progress").textContent = `${state.annotator} · ${n}/${items.length}`;
    const subject = encodeURIComponent(`[Ocarandu] anotação ${state.model} · ${state.annotator} · ${n} itens`);
    const body = encodeURIComponent(`Olá,\n\nsegue em anexo o arquivo ${fileName()} com ${n} itens anotados (conjunto ${state.model}).\n\n(Anexe o CSV que a página baixou.)\n`);
    $("btn-mail").href = `mailto:${CFG.EMAIL_TO || ""}?subject=${subject}&body=${body}`;
    $("btn-download-final").onclick = download;
    $("btn-copy").onclick = () => navigator.clipboard.writeText(csv()).then(() => { $("submit-status").textContent = "CSV copiado para a área de transferência."; });
    $("btn-review").onclick = () => { const i = items.findIndex(it => !(state.answers[it.id] || {}).support); if (i >= 0) { idx = i; render(); } };
    if (CFG.SUBMIT_URL) {
      $("submit-status").textContent = "Enviando as respostas automaticamente...";
      fetch(CFG.SUBMIT_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ annotator: state.annotator, model: state.model, n, csv: csv(), rows: items.filter(it => state.answers[it.id]).map(it => Object.assign({ id: it.id }, state.answers[it.id])) }) })
        .then(() => { $("submit-status").textContent = "Respostas enviadas automaticamente. Mesmo assim, baixe o CSV como cópia de segurança."; })
        .catch(() => { $("submit-status").textContent = "O envio automático falhou; use o CSV + e-mail."; });
    }
  }
})();
