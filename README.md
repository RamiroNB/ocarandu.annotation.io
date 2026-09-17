# Anotação de fidelidade — Ocarandu

Página para anotar, uma opinião por vez, se um resumo automático de audiência
pública da Câmara dos Deputados é fiel ao que o participante realmente disse.

Site: https://ramironb.github.io/ocarandu.annotation.io/

## O que está sendo anotado

Pegamos transcrições de audiências públicas (dataset PublicHearingBR) e pedimos
a modelos de linguagem abertos que listassem as opiniões de cada participante a
partir das falas dele. Cada item da página mostra:

- o nome e o cargo do participante;
- uma opinião que o sistema atribuiu a ele;
- os trechos da fala dele que mais se parecem com a opinião (três de início;
  "ver mais trechos" mostra outros).

A pergunta é sempre a mesma: **a opinião é sustentada por esses trechos?**

- *Sustentada*: os trechos confirmam o que a opinião afirma, mesmo com outras palavras.
- *Não sustentada*: a opinião afirma algo que não está nos trechos, contradiz
  ou distorce o que foi dito (inclusive números e posições inventados).
- *Não dá para dizer*: os trechos não tratam do assunto da opinião.

Há ainda uma marcação opcional para problemas de forma (frase em primeira
pessoa, cópia literal da fala, algo que não é uma opinião) e um campo de
comentário.

Os itens vêm de duas versões de cada modelo, misturadas e sem identificação.
Quem anota não sabe de qual versão veio cada opinião, e isso é de propósito.

## Como funciona

1. Escreva seu nome e escolha o seu conjunto. São quatro conjuntos de 100
   itens, um por pessoa do grupo: conjuntos 1 e 2 com o Llama-3.1-8B,
   3 e 4 com o Qwen3-4B. Vinte itens aparecem em todos os conjuntos,
   para medirmos a concordância entre anotadores, e alguns itens vêm de outros
   sistemas, para comparação.
2. Responda item a item. Teclas 1, 2 e 3 escolhem a resposta; F marca problema
   de forma; as setas navegam.
3. O progresso fica salvo no navegador. Dá para fechar e continuar depois, no
   mesmo navegador.
4. No fim, a página baixa um CSV e abre seu e-mail com destinatário e assunto
   preenchidos. Anexe o CSV e envie.

## Arquivos

- `index.html`, `app.js`, `style.css`: a página. Não há servidor; tudo roda no navegador.
- `config.js`: e-mail que recebe os resultados e, se quiser, uma URL para envio automático.
- `data/items.json`: os itens. Não contém a informação de qual versão gerou cada opinião;
  essa chave fica fora deste repositório.

Os itens são gerados no repositório principal do projeto por
`scripts/build_annotation_web_items.py`.
