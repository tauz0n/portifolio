(function () {
    const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ponteiroFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* WhatsApp: todos os botões usam o número definido no index.html */
    const numero = String(window.WHATSAPP_NUMERO || '').replace(/\D/g, '');
    const texto = encodeURIComponent('Oi Tauan! Vi seu portfólio e quero conversar sobre uma edição.');
    document.querySelectorAll('[data-whatsapp]').forEach((el) => {
        el.href = 'https://wa.me/' + numero + '?text=' + texto;
        el.target = '_blank';
        el.rel = 'noopener';
    });

    /* Figurinhas colando no álbum ao rolar */
    if (!reduz && 'IntersectionObserver' in window) {
        document.documentElement.classList.add('js');
        const alvos = document.querySelectorAll('main .figurinha, .escudo');
        const grupos = new Map();
        alvos.forEach((el) => {
            const pagina = el.closest('section');
            const i = grupos.get(pagina) || 0;
            grupos.set(pagina, i + 1);
            el.style.setProperty('--delay', (i * 0.12) + 's');
            el.classList.add('colar');
        });

        const obs = new IntersectionObserver((entradas) => {
            entradas.forEach((e) => {
                if (!e.isIntersecting) return;
                const el = e.target;
                el.classList.add('colada');
                obs.unobserve(el);
                /* depois de colar, libera a transição curta do tilt */
                el.addEventListener('transitionend', function fim(ev) {
                    if (ev.propertyName !== 'transform') return;
                    el.classList.add('solta');
                    el.removeEventListener('transitionend', fim);
                });
            });
        }, { threshold: 0.25 });
        alvos.forEach((el) => obs.observe(el));
    }

    /* Tilt + brilho holográfico seguindo o ponteiro */
    if (ponteiroFino && !reduz) {
        document.querySelectorAll('[data-tilt]').forEach((el) => {
            /* data-tilt="5" deixa a inclinação mais suave; data-tilt-brilho aponta onde fica o holográfico */
            const forca = parseFloat(el.dataset.tilt) || 14;
            const brilho = (el.dataset.tiltBrilho && el.querySelector(el.dataset.tiltBrilho)) || el;
            el.addEventListener('pointermove', (ev) => {
                if (el.classList.contains('is-tocando')) return;
                const r = el.getBoundingClientRect();
                const x = (ev.clientX - r.left) / r.width;
                const y = (ev.clientY - r.top) / r.height;
                el.style.setProperty('--ry', ((x - 0.5) * forca).toFixed(2) + 'deg');
                el.style.setProperty('--rx', ((0.5 - y) * forca).toFixed(2) + 'deg');
                const b = brilho === el ? r : brilho.getBoundingClientRect();
                const bx = Math.min(1, Math.max(0, (ev.clientX - b.left) / b.width));
                const by = Math.min(1, Math.max(0, (ev.clientY - b.top) / b.height));
                brilho.style.setProperty('--mx', (bx * 100).toFixed(1) + '%');
                brilho.style.setProperty('--my', (by * 100).toFixed(1) + '%');
                brilho.style.setProperty('--foil', '1');
            });
            el.addEventListener('pointerleave', () => {
                el.style.setProperty('--rx', '0deg');
                el.style.setProperty('--ry', '0deg');
                brilho.style.setProperty('--foil', '0');
            });
        });
    }

    /* Menu flutuante: entra com animação ao abrir (CSS) e marca a seção atual */
    const menu = document.querySelector('.menu');
    if (menu) {
        const links = new Map();
        menu.querySelectorAll('a').forEach((a) => links.set(a.getAttribute('href').slice(1), a));

        const marcar = (id) => {
            links.forEach((a, chave) => {
                const ativo = chave === id;
                a.classList.toggle('is-ativo', ativo);
                if (ativo) a.setAttribute('aria-current', 'true');
                else a.removeAttribute('aria-current');
            });
        };
        const secoes = [...links.keys()].map((id) => document.getElementById(id)).filter(Boolean);
        let pendente = false;
        const atualizar = () => {
            pendente = false;
            const linha = innerHeight * 0.5;
            let atual = null;
            secoes.forEach((sec) => {
                if (sec.getBoundingClientRect().top <= linha) atual = sec.id;
            });
            /* no fim da página, o contato fica marcado */
            if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) atual = secoes[secoes.length - 1].id;
            marcar(atual);
        };
        addEventListener('scroll', () => {
            if (!pendente) { pendente = true; requestAnimationFrame(atualizar); }
        }, { passive: true });
        addEventListener('resize', atualizar);
        atualizar();
    }

    /* Trabalhos: o vídeo do YouTube toca dentro da própria figurinha */
    const idYoutube = (url) => {
        const m = String(url).match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/);
        return m ? m[1] : null;
    };
    const fecharTrabalho = (card) => {
        const iframe = card.querySelector('.figurinha__foto iframe');
        if (iframe) iframe.remove();
        card.classList.remove('is-tocando');
    };
    document.querySelectorAll('#trabalhos a.figurinha').forEach((card) => {
        const id = idYoutube(card.href);
        if (!id) return;
        card.setAttribute('aria-label', 'Assistir aqui: ' + card.querySelector('.carta__nome strong, .figurinha__faixa strong').textContent);
        card.addEventListener('click', (ev) => {
            /* Ctrl/Cmd+clique continua abrindo no YouTube */
            if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
            ev.preventDefault();
            if (card.classList.contains('is-tocando')) return;

            document.querySelectorAll('#trabalhos .figurinha.is-tocando').forEach(fecharTrabalho);
            document.querySelectorAll('video.short').forEach((v) => v.pause());

            const iframe = document.createElement('iframe');
            iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1';
            iframe.title = card.querySelector('.carta__nome strong, .figurinha__faixa strong').textContent;
            iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
            iframe.allowFullscreen = true;
            card.querySelector('.figurinha__foto').appendChild(iframe);

            /* endireita a figurinha para assistir */
            card.style.setProperty('--rx', '0deg');
            card.style.setProperty('--ry', '0deg');
            card.style.setProperty('--foil', '0');
            card.classList.add('is-tocando');
        });
    });

    /* Carta final: pacote fechado, abre puxando o zíper para a direita */
    const pacote = document.querySelector('.pacote');
    if (pacote) {
        const slot = pacote.closest('.slot--vazio');
        const ziper = pacote.querySelector('.ziper');
        const puxador = pacote.querySelector('.ziper__puxador');
        let inicio = null;
        let base = 0;
        let abre = 0;
        let moveu = false;
        let ultimoX = 0;
        let vel = 0;
        let mola = 0;

        pacote.hidden = false;

        /* tremida: o pacote e o puxador balançam conforme a velocidade do puxão e voltam como mola */
        const balancar = () => {
            vel *= 0.82;
            pacote.style.setProperty('--vel', vel.toFixed(3));
            mola = Math.abs(vel) > 0.005 ? requestAnimationFrame(balancar) : 0;
            if (!mola) pacote.style.setProperty('--vel', '0');
        };
        const empurrar = (dx) => {
            if (reduz) return;
            vel = Math.max(-1, Math.min(1, vel + dx / 14));
            if (!mola) mola = requestAnimationFrame(balancar);
        };
        /* durante o puxão o cursor some: o puxador vira a mão */
        const cursor = (sumir) => document.documentElement.classList.toggle('puxando-ziper', sumir);
        slot.classList.add('tem-pacote');

        const marcar = (v) => {
            abre = Math.max(0, Math.min(1, v));
            pacote.style.setProperty('--abre', abre.toFixed(3));
        };
        const abrir = () => {
            if (pacote.classList.contains('is-aberto')) return;
            inicio = null;
            marcar(1);
            pacote.classList.remove('is-arrastando');
            pacote.classList.add('is-aberto', 'foi-tocado');
            slot.classList.add('is-revelado');
            cursor(true);
            setTimeout(() => cursor(false), reduz ? 0 : 1500);
            /* o foco não pode sumir junto com o puxador */
            if (document.activeElement === puxador) {
                const legenda = slot.querySelector('.slot__legenda');
                legenda.tabIndex = -1;
                legenda.focus({ preventScroll: true });
            }
            setTimeout(() => { pacote.hidden = true; }, reduz ? 50 : 1100);
        };

        puxador.addEventListener('pointerdown', (ev) => {
            if (ev.button !== 0) return;
            ev.preventDefault();
            try { puxador.setPointerCapture(ev.pointerId); } catch (e) { /* segue pelo window */ }
            inicio = ev.clientX;
            base = abre;
            moveu = false;
            ultimoX = ev.clientX;
            pacote.classList.add('is-arrastando', 'foi-tocado');
            cursor(true);
        });
        addEventListener('pointermove', (ev) => {
            if (inicio === null) return;
            const curso = ziper.clientWidth - puxador.offsetWidth;
            if (Math.abs(ev.clientX - inicio) > 3) moveu = true;
            empurrar(ev.clientX - ultimoX);
            ultimoX = ev.clientX;
            marcar(base + (ev.clientX - inicio) / curso);
            if (abre >= 0.98) abrir();
        });
        const soltar = () => {
            if (inicio === null) return;
            inicio = null;
            pacote.classList.remove('is-arrastando');
            if (abre > 0.75) { abrir(); return; }
            cursor(false);
            empurrar(-abre * 20);
            marcar(0);
        };
        /* no window: o arraste continua mesmo se o dedo/mouse sair do puxador */
        addEventListener('pointerup', soltar);
        addEventListener('pointercancel', soltar);

        puxador.addEventListener('click', (ev) => {
            /* teclado (Enter/Espaço) abre direto; clique sem arrastar só dá uma puxadinha de dica */
            if (ev.detail === 0) { abrir(); return; }
            if (moveu || pacote.classList.contains('is-aberto')) return;
            marcar(0.18);
            setTimeout(() => { if (inicio === null && !pacote.classList.contains('is-aberto')) marcar(0); }, 260);
        });
        puxador.addEventListener('keydown', (ev) => {
            if (ev.key !== 'ArrowRight') return;
            ev.preventDefault();
            pacote.classList.add('foi-tocado');
            marcar(abre + 0.25);
            if (abre >= 1) abrir();
        });
    }

    /* Shorts: toque para tocar com som, pausa os outros */
    const shorts = document.querySelectorAll('video.short');
    shorts.forEach((video) => {
        const card = video.closest('.figurinha');
        const botao = card.querySelector('.short__play');
        const tocar = () => {
            shorts.forEach((v) => { if (v !== video) v.pause(); });
            document.querySelectorAll('#trabalhos .figurinha.is-tocando').forEach(fecharTrabalho);
            video.controls = true;
            video.play();
        };
        botao.addEventListener('click', tocar);
        video.addEventListener('play', () => card.classList.add('is-playing'));
        video.addEventListener('pause', () => card.classList.remove('is-playing'));
        video.addEventListener('ended', () => { video.controls = false; });
    });
})();
