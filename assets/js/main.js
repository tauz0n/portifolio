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
            el.addEventListener('pointermove', (ev) => {
                if (el.classList.contains('is-tocando')) return;
                const r = el.getBoundingClientRect();
                const x = (ev.clientX - r.left) / r.width;
                const y = (ev.clientY - r.top) / r.height;
                el.style.setProperty('--ry', ((x - 0.5) * 14).toFixed(2) + 'deg');
                el.style.setProperty('--rx', ((0.5 - y) * 14).toFixed(2) + 'deg');
                el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
                el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
                el.style.setProperty('--foil', '1');
            });
            el.addEventListener('pointerleave', () => {
                el.style.setProperty('--rx', '0deg');
                el.style.setProperty('--ry', '0deg');
                el.style.setProperty('--foil', '0');
            });
        });
    }

    /* Menu flutuante: aparece depois da capa e marca a seção atual */
    const menu = document.querySelector('.menu');
    if (menu && 'IntersectionObserver' in window) {
        const links = new Map();
        menu.querySelectorAll('a').forEach((a) => links.set(a.getAttribute('href').slice(1), a));

        const capa = document.querySelector('.capa');
        menu.classList.add('is-escondido');
        new IntersectionObserver(([e]) => {
            menu.classList.toggle('is-escondido', e.isIntersecting);
        }, { rootMargin: '0px 0px -40% 0px' }).observe(capa);

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
        card.setAttribute('aria-label', 'Assistir aqui: ' + card.querySelector('.figurinha__faixa strong').textContent);
        card.addEventListener('click', (ev) => {
            /* Ctrl/Cmd+clique continua abrindo no YouTube */
            if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
            ev.preventDefault();
            if (card.classList.contains('is-tocando')) return;

            document.querySelectorAll('#trabalhos .figurinha.is-tocando').forEach(fecharTrabalho);
            document.querySelectorAll('video.short').forEach((v) => v.pause());

            const iframe = document.createElement('iframe');
            iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1';
            iframe.title = card.querySelector('.figurinha__faixa strong').textContent;
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
