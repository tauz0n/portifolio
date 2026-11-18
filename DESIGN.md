# DESIGN — Álbum de figurinhas

Cada trabalho é uma figurinha colada numa página de álbum. O final é o espaço vazio "07 — Sua marca aqui", que leva ao WhatsApp.

## Cores (assets/css/style.css :root)
| Token | Valor | Uso |
|---|---|---|
| --violeta | #5B2BE0 | fundo da página (com retícula) |
| --violeta-claro / --violeta-fundo | #6E40F0 / #4A1EC9 | pontos da retícula, profundidade |
| --tinta | #1A0B4B | texto escuro, número da figurinha, painel final |
| --laranja | #FF7A1A | faixa da figurinha, CTA, "SENA", marquee |
| --papel | #FFF4E2 | borda da figurinha, títulos |
| --lilas | #D9CCFF | texto secundário sobre violeta |

Não usar vermelho: a marca antiga era vermelha.

## Tipografia
Archivo variável (Google Fonts, eixos wdth 62–125 + itálico).
- Títulos: peso 900, itálico, caixa alta, font-stretch 68–75%.
- Texto corrido: Archivo 400–500 em largura normal.
- A capa passa do limite de display de propósito (até 14.5rem), para dar impacto.

## Componentes
- `.figurinha`: borda de papel, `.figurinha__faixa` laranja com título, `.figurinha__selo` opcional. As cartas não têm número. A rotação vem de `--r`.
- `.figurinha--carta`: a 00 da capa e os trabalhos (01–06) são cartas de jogador. Fundo tinta com moldura laranja dupla, `.carta__nota` no canto da foto (nota geral, posição = formato, escudo do canal opcional), `.carta__nome` e `dl.carta__stats` com seis atributos em duas colunas. Os tamanhos usam `cqi` (a carta é container), então funcionam na carta grande e nas pequenas. Em carta estreita, "After Effects" vira "After" (`.carta__longo`). A nota some quando o vídeo toca.
- `.brilho`: foil holográfico (color-dodge) que se intensifica com `--foil`.
- `.escudo`: brasão dos times.
- `.faixa`: marquee laranja inclinado com os estilos de vídeo editados (videoclipes, curta-metragem, gameplay, vlogs, shorts, TikTok).
- `.slot`: figurinha + `dl.ficha` (canal, formato).
- `.fim`: painel tinta com o slot tracejado vazio e o CTA. O painel inteiro inclina com o mouse (`data-tilt="5"`); o holográfico aparece só na carta 07 (`data-tilt-brilho=".slot--vazio"`).
- `.menu`: pílula tinta fixa embaixo, no centro. Entra ao abrir o site: sobe com mola, a pílula abre do centro e os ícones pulam em sequência (desligado com movimento reduzido). O item da seção atual vira pílula de papel e abre o nome (grid 0fr→1fr com desfoque); os outros ficam só com o ícone.
- Trabalhos: clicar na figurinha troca a capa por um player do YouTube (youtube-nocookie) ali dentro, endireita a figurinha e desliga o tilt. Só um vídeo toca por vez. Ctrl+clique abre no YouTube.
- `.botao`: pílula laranja com sombra sólida. Os botões `[data-whatsapp]` recebem o link via JS.

## Movimento
- Figurinhas "colam" ao entrar na tela: `.colar` → `.colada` → `.solta`, ease `cubic-bezier(.16,1,.3,1)`, escalonadas 0.12s por seção.
- Tilt e foil seguem o ponteiro só em mouse/trackpad (`[data-tilt]`).
- `prefers-reduced-motion` desliga tudo isso e o marquee.

## Layout
Largura máxima 1240px, gutter `clamp(16px, 4vw, 56px)`. Breakpoints: 900px (uma coluna) e 480px.
