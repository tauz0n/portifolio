/* =========================================================
   Pacote 3D (carta final)
   Troca o pacote de CSS por um modelo 3D de verdade (Three.js),
   mantendo o zíper, a dica e a lógica de abrir do main.js.
   Só carrega quando o Contato chega perto da tela; até lá
   (ou se algo falhar) fica o pacote de CSS.

   Modelo: "Trading Card Pack" por goonmize1 (Sketchfab), CC-BY-4.0
   https://sketchfab.com/3d-models/trading-card-pack-26d1a87e47814d0ea3a710d169e3a671
   ========================================================= */

const pacote = document.querySelector('.pacote');
const slot = pacote && pacote.closest('.slot--vazio');

const CORES = {
    laranja: '#FF7A1A',
    laranjaEscuro: '#E86400',
    violeta: '#5B2BE0',
    tinta: '#1A0B4B',
    papel: '#FFF4E2',
};

const PERSPECTIVA = 900;   // igual ao perspective(900px) do CSS
const LINHA = 0.14;        // altura do zíper (fração do pacote, a partir do topo)
const PROPORCAO = 1.3176 / 2.5111; // largura / altura do modelo

const temWebGL = () => {
    try {
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch (e) {
        return false;
    }
};

if (pacote && slot && temWebGL()) {
    const alvo = document.getElementById('contato') || slot;
    const io = new IntersectionObserver((entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return;
        io.disconnect();
        iniciar().catch((erro) => console.warn('Pacote 3D não carregou, fica o de CSS.', erro));
    }, { rootMargin: '800px 0px' });
    io.observe(alvo);
}

/* ---------- arte do pacote, desenhada em canvas no espaço do pacote ---------- */
async function desenharArte(L, A) {
    try {
        await Promise.all([
            document.fonts.load('italic 900 extra-condensed 100px Archivo'),
            document.fonts.load('800 40px Archivo'),
            document.fonts.load('700 40px Archivo'),
        ]);
    } catch (e) { /* usa a fonte que tiver */ }

    const c = document.createElement('canvas');
    c.width = L;
    c.height = A;
    const g = c.getContext('2d');
    const linha = A * LINHA;

    /* corpo laranja com listras diagonais violeta */
    g.fillStyle = CORES.laranja;
    g.fillRect(0, 0, L, A);
    g.save();
    g.translate(L / 2, A / 2);
    g.rotate(-35 * Math.PI / 180);
    g.fillStyle = 'rgba(91, 43, 224, .14)';
    const passo = L * 0.11;
    for (let x = -A * 1.5; x < A * 1.5; x += passo * 2) g.fillRect(x, -A * 1.5, passo, A * 3);
    g.restore();

    /* aba de cima (acima do zíper), laranja mais escuro */
    g.fillStyle = CORES.laranjaEscuro;
    g.fillRect(0, 0, L, linha);

    /* lacres prensados em cima e embaixo */
    const lacre = A * 0.085;
    for (const y0 of [0, A - lacre]) {
        const grad = g.createLinearGradient(0, y0, 0, y0 + lacre);
        grad.addColorStop(0, '#c95500');
        grad.addColorStop(0.5, '#f2861f');
        grad.addColorStop(1, '#c95500');
        g.fillStyle = grad;
        g.fillRect(0, y0, L, lacre);
        g.fillStyle = 'rgba(26, 11, 75, .22)';
        for (let x = 0; x < L; x += L * 0.022) g.fillRect(x, y0, L * 0.008, lacre);
    }

    /* sombra da fenda do zíper */
    const fenda = g.createLinearGradient(0, linha - A * 0.012, 0, linha + A * 0.02);
    fenda.addColorStop(0, 'rgba(26, 11, 75, 0)');
    fenda.addColorStop(0.45, 'rgba(26, 11, 75, .45)');
    fenda.addColorStop(1, 'rgba(26, 11, 75, 0)');
    g.fillStyle = fenda;
    g.fillRect(0, linha - A * 0.012, L, A * 0.032);

    g.textAlign = 'center';
    g.textBaseline = 'middle';

    const meio = L / 2;
    const centro = linha + (A - lacre - linha) * 0.47;

    /* TAUAN SENA */
    g.fillStyle = CORES.tinta;
    g.font = `800 ${Math.round(L * 0.052)}px Archivo, system-ui, sans-serif`;
    if ('letterSpacing' in g) g.letterSpacing = `${Math.round(L * 0.012)}px`;
    g.fillText('TAUAN SENA', meio, centro - A * 0.17);

    /* EDIÇÃO / ESPECIAL em relevo */
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    let tam = Math.round(L * 0.27);
    g.font = `italic 900 extra-condensed ${tam}px Archivo, system-ui, sans-serif`;
    const larguraMax = L * 0.84;
    const maior = g.measureText('ESPECIAL').width;
    if (maior > larguraMax) {
        tam = Math.floor(tam * larguraMax / maior);
        g.font = `italic 900 extra-condensed ${tam}px Archivo, system-ui, sans-serif`;
    }
    const linhas = ['EDIÇÃO', 'ESPECIAL'];
    linhas.forEach((t, i) => {
        const y = centro - tam * 0.45 + i * tam * 0.88;
        for (let k = 6; k >= 1; k--) {
            g.fillStyle = k > 3 ? CORES.tinta : '#2b1673';
            g.fillText(t, meio + k * L * 0.0025, y + k * L * 0.0035);
        }
        g.fillStyle = CORES.violeta;
        g.fillText(t, meio, y);
        g.fillStyle = 'rgba(255, 255, 255, .22)';
        g.fillText(t, meio - L * 0.002, y - L * 0.003);
        g.fillStyle = CORES.violeta;
        g.fillText(t, meio, y + L * 0.0015);
    });

    /* pílula 1 CARTA INÉDITA */
    g.font = `700 ${Math.round(L * 0.05)}px Archivo, system-ui, sans-serif`;
    if ('letterSpacing' in g) g.letterSpacing = `${Math.round(L * 0.005)}px`;
    const texto = '1 CARTA INÉDITA';
    const lp = g.measureText(texto).width + L * 0.1;
    const ap = L * 0.1;
    const yp = centro - tam * 0.45 + tam * 0.88 + tam * 0.5 + ap * 0.9;
    g.fillStyle = CORES.tinta;
    g.beginPath();
    g.roundRect(meio - lp / 2, yp - ap / 2, lp, ap, ap / 2);
    g.fill();
    g.fillStyle = CORES.papel;
    g.fillText(texto, meio, yp + L * 0.003);

    return c;
}

async function iniciar() {
    const THREE = await import('three');
    const [{ GLTFLoader }, { RoomEnvironment }] = await Promise.all([
        import('three/addons/loaders/GLTFLoader.js'),
        import('three/addons/environments/RoomEnvironment.js'),
    ]);

    const [gltf, arte] = await Promise.all([
        new GLTFLoader().loadAsync('modelos/pacote/scene.gltf'),
        desenharArte(1024, Math.round(1024 / PROPORCAO)),
    ]);

    /* ---------- malha: deixa o pacote em pé, centrado, 1 unidade = 1px ---------- */
    gltf.scene.updateMatrixWorld(true);
    let malhaOriginal;
    gltf.scene.traverse((o) => { if (o.isMesh && !malhaOriginal) malhaOriginal = o; });
    const geo = malhaOriginal.geometry.clone().applyMatrix4(malhaOriginal.matrixWorld);
    // no arquivo: comprimento em X, espessura em Y, largura em Z → X vira altura, Z vira largura, Y aponta pra câmera
    geo.applyMatrix4(new THREE.Matrix4().set(
        0, 0, 1, 0,
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 0, 1,
    ));
    geo.computeBoundingBox();
    const caixa = geo.boundingBox;
    const c = caixa.getCenter(new THREE.Vector3());
    geo.translate(-c.x, -c.y, -c.z);
    const alturaModelo = caixa.max.y - caixa.min.y;

    /* ---------- textura: a arte vai na região UV da frente (de cabeça pra baixo, como no original) ---------- */
    const uv = geo.attributes.uv;
    let u0 = 1, u1 = 0, v0 = 1, v1 = 0;
    for (let i = 0; i < uv.count; i++) {
        const u = uv.getX(i), v = uv.getY(i);
        if (u < u0) u0 = u; if (u > u1) u1 = u;
        if (v < v0) v0 = v; if (v > v1) v1 = v;
    }
    const TAM = 2048;
    const tela = document.createElement('canvas');
    tela.width = tela.height = TAM;
    const tg = tela.getContext('2d');
    tg.fillStyle = CORES.laranja;
    tg.fillRect(0, 0, TAM, TAM);
    tg.save();
    tg.translate(u0 * TAM, v1 * TAM);
    tg.scale(1, -1);
    tg.drawImage(arte, 0, 0, (u1 - u0) * TAM, (v1 - v0) * TAM);
    tg.restore();

    const mapa = new THREE.CanvasTexture(tela);
    mapa.flipY = false;
    mapa.colorSpace = THREE.SRGBColorSpace;
    mapa.anisotropy = 8;

    const matOriginal = malhaOriginal.material;
    const material = new THREE.MeshPhysicalMaterial({
        map: mapa,
        normalMap: matOriginal.normalMap || null,
        normalScale: matOriginal.normalScale ? matOriginal.normalScale.clone().multiplyScalar(1.6) : undefined,
        metalness: 0.55,
        roughness: 0.24,
        clearcoat: 1,
        clearcoatRoughness: 0.18,
        iridescence: 0.85,
        iridescenceIOR: 1.35,
        iridescenceThicknessRange: [180, 620],
        side: THREE.DoubleSide,
        transparent: true,
    });

    /* ---------- cena ---------- */
    const canvas = document.createElement('canvas');
    canvas.className = 'pacote-3d';
    canvas.setAttribute('aria-hidden', 'true');
    slot.insertBefore(canvas, pacote);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.localClippingEnabled = true;

    const cena = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    cena.environmentIntensity = 1.15;
    pmrem.dispose();

    const luz = new THREE.DirectionalLight(0xffffff, 1.6);
    cena.add(luz);
    cena.add(new THREE.AmbientLight(0xffffff, 0.35));

    const camera = new THREE.PerspectiveCamera(30, 1, 10, 4000);
    camera.position.set(0, 0, PERSPECTIVA);

    /* pivô (inclinação) → deslocamento da tremida → duas metades cortadas na linha do zíper */
    const pivo = new THREE.Group();
    const tremida = new THREE.Group();
    pivo.add(tremida);
    cena.add(pivo);

    const corteLocal = alturaModelo / 2 - alturaModelo * LINHA; // y do zíper no modelo
    const planoTopo = new THREE.Plane(new THREE.Vector3(0, 1, 0), -corteLocal);   // mantém y > corte
    const planoCorpo = new THREE.Plane(new THREE.Vector3(0, -1, 0), corteLocal);  // mantém y < corte

    const fazerMetade = (plano) => {
        const mat = material.clone();
        const planoMundo = plano.clone();
        mat.clippingPlanes = [planoMundo];
        mat.clipShadows = true;
        const grupo = new THREE.Group();
        const m = new THREE.Mesh(geo, mat);
        grupo.add(m);
        return { grupo, malha: m, mat, plano, planoMundo };
    };
    const topo = fazerMetade(planoTopo);
    const corpo = fazerMetade(planoCorpo);
    // a aba gira em torno do canto direito da linha do zíper (como no CSS)
    const larguraModelo = caixa.max.x - caixa.min.x;
    topo.grupo.position.set(larguraModelo / 2, corteLocal, 0);
    topo.malha.position.set(-larguraModelo / 2, -corteLocal, 0);
    tremida.add(topo.grupo, corpo.grupo);

    /* ---------- tamanho: o modelo ocupa exatamente a caixa do .pacote ---------- */
    let escala = 1;
    const medir = () => {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.fov = 2 * Math.atan((h / 2) / PERSPECTIVA) * 180 / Math.PI;
        camera.updateProjectionMatrix();
        escala = pacote.offsetHeight / alturaModelo;
        pivo.scale.setScalar(escala);
    };

    pacote.classList.add('is-3d');
    pacote.style.setProperty('--linha', `${LINHA * 100}%`);
    new ResizeObserver(medir).observe(canvas);
    medir();

    /* ---------- leitura das variáveis do CSS (tilt do painel, balanço, tremida, brilho) ---------- */
    const num = (v, padrao = 0) => {
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : padrao;
    };
    const RAD = Math.PI / 180;
    const atual = { rx: 0, ry: 0, vel: 0, mx: 50, my: 50, abre: 0 };
    let visivel = true;
    let abertura = null; // momento em que abriu

    new IntersectionObserver((e) => { visivel = e[0].isIntersecting; if (visivel) pedir(); }).observe(slot);

    new MutationObserver(() => {
        if (pacote.classList.contains('is-aberto') && abertura === null) {
            abertura = performance.now();
            pedir();
        }
    }).observe(pacote, { attributes: true, attributeFilter: ['class'] });

    const suave = (a, b, k) => a + (b - a) * k;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const easeIn = (t) => t * t * t;

    let pedido = 0;
    let anterior = performance.now();
    const pedir = () => { if (!pedido) pedido = requestAnimationFrame(quadro); };

    function quadro(agora) {
        pedido = 0;
        const dt = Math.min((agora - anterior) / 1000, 0.05);
        anterior = agora;

        const cs = getComputedStyle(pacote);
        const k = 1 - Math.exp(-dt * 9);
        atual.rx = suave(atual.rx, num(cs.getPropertyValue('--rx')), k);
        atual.ry = suave(atual.ry, num(cs.getPropertyValue('--ry')), k);
        const balanco = num(cs.getPropertyValue('--balanco'));
        atual.vel = num(cs.getPropertyValue('--vel'));
        atual.mx = suave(atual.mx, num(cs.getPropertyValue('--mx'), 50), k);
        atual.my = suave(atual.my, num(cs.getPropertyValue('--my'), 50), k);
        atual.abre = num(cs.getPropertyValue('--abre'));

        const ax = atual.rx * 2.4;                 // graus, como no CSS
        const ay = atual.ry * 2.8 + balanco;
        const az = atual.vel * 3;
        const tx = atual.vel * 4;

        /* o .pacote (zíper e dica) recebe exatamente a mesma transformação da malha */
        pacote.style.transform =
            `perspective(${PERSPECTIVA}px) rotateX(${ax}deg) rotateY(${ay}deg) rotate(${az}deg) translateX(${tx}px)`;

        pivo.rotation.set(-ax * RAD, ay * RAD, -az * RAD, 'XYZ');
        tremida.position.x = tx / escala;

        /* aba levanta pela esquerda conforme o zíper abre */
        topo.grupo.rotation.z = (atual.abre * 5 + atual.vel * 4) * RAD;
        topo.grupo.position.y = corteLocal + (atual.abre * 6) / escala;

        /* luz principal segue o ponteiro */
        luz.position.set((atual.mx / 100 - 0.5) * 1600, (0.5 - atual.my / 100) * 1600, 900);

        /* abrindo: a aba voa pra cima, o corpo cai */
        let animando = false;
        if (abertura !== null) {
            const t = (agora - abertura) / 1000;
            const tt = Math.min(t / 0.7, 1);
            const e1 = easeOut(tt);
            topo.grupo.position.x = larguraModelo / 2 - e1 * larguraModelo * 0.35;
            topo.grupo.position.y = corteLocal + e1 * alturaModelo * 0.55;
            topo.grupo.rotation.set(e1 * 0.9, -e1 * 0.5, (atual.abre * 5 + e1 * 22) * RAD);
            topo.mat.opacity = 1 - Math.min(Math.max((t - 0.15) / 0.45, 0), 1);

            const t2 = Math.min(Math.max((t - 0.12) / 0.8, 0), 1);
            const e2 = easeIn(t2);
            corpo.grupo.position.y = -e2 * alturaModelo * 1.2;
            corpo.grupo.rotation.set(-e2 * 0.6, e2 * 0.4, -e2 * 5 * RAD);
            corpo.mat.opacity = 1 - Math.min(Math.max((t - 0.3) / 0.5, 0), 1);

            if (t > 1.15) {
                canvas.remove();
                renderer.dispose();
                return;
            }
            animando = true;
        }

        /* cortes acompanham cada metade */
        cena.updateMatrixWorld(true);
        topo.planoMundo.copy(topo.plano).applyMatrix4(topo.malha.matrixWorld);
        corpo.planoMundo.copy(corpo.plano).applyMatrix4(corpo.malha.matrixWorld);

        renderer.render(cena, camera);
        if (visivel || animando) pedir();
    }

    pedir();
}
