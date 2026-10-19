/* =========================================================
   FiLM-CAM project page
   ========================================================= */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const COLORS = {
    blue: '#2a78d6',
    orange: '#eb6834',
    gray: '#a3a29c',
    surface: '#ffffff',
    ink2: '#4b4e57',
    muted: '#7d8089',
};

// ---------------------------------------------------------
// Data (from the paper)
// ---------------------------------------------------------

// Table 1: [bit acc, PSNR, SSIM, LPIPS] per dataset.
const SOTA = [
    { m: 'TrustMark-Q', p: '100', v: [[0.99, 41.9, 0.9910, 0.0017], [0.99, 40.9, 0.9939, 0.0026], [0.99, 41.3, 0.9946, 0.0028]] },
    { m: 'InvisMark', p: '100', v: [[0.99, 48.0, 0.9974, 0.0011], [0.99, 46.5, 0.9964, 0.0025], [0.99, 46.2, 0.9961, 0.0027]] },
    { m: 'PixelSeal', p: '256', v: [[0.99, 45.8, 0.9948, 0.0020], [0.99, 46.0, 0.9959, 0.0011], [0.99, 46.5, 0.9966, 0.0012]] },
    { m: 'RoSteALS', p: '100', v: [[0.99, 30.0, 0.9462, 0.0475], [0.98, 28.2, 0.9484, 0.0527], [0.99, 28.6, 0.9537, 0.0521]] },
    { m: 'SSL', p: '100', v: [[0.99, 40.0, 0.9788, 0.0351], [0.99, 40.0, 0.9733, 0.0611], [0.99, 40.0, 0.9770, 0.0350]] },
    { m: 'MBRS', p: '256', v: [[0.99, 43.2, 0.9729, 0.0041], [0.99, 42.2, 0.9774, 0.0043], [0.99, 42.5, 0.9755, 0.0047]] },
    { m: 'Key-based FNNS', p: '1 bpp', v: [[0.99, 40.4, 0.9800, null], [0.99, 33.9, 0.9600, null], [null, null, null, null]] },
    { m: 'FiLM-CAM', key: 'ok', p: '100†', sep: true, v: [[0.99, 48.2, 0.9986, 0.0010], [0.99, 46.7, 0.9975, 0.0020], [0.99, 46.6, 0.9974, 0.0020]] },
    { m: 'FiLM-CAM', key: 'no', p: '100†', v: [[0.53, null, null, null], [0.54, null, null, null], [0.53, null, null, null]] },
    { m: 'FiLM-CAM (noise)', key: 'ok', p: '100†', v: [[0.99, 40.2, 0.9959, 0.0031], [0.99, 40.1, 0.9953, 0.0054], [0.99, 40.1, 0.9953, 0.0053]] },
    { m: 'FiLM-CAM (noise)', key: 'no', p: '100†', v: [[0.55, null, null, null], [0.55, null, null, null], [0.55, null, null, null]] },
];

// Table 3: [removal PSNR, post-removal acc, PSNR gain] per dataset, + time (ms).
const REMOVAL = [
    { m: 'TrustMark-RM (Q)', short: 'TrustMark-RM', g: 'base', t: '35.9', v: [[41.7, 0.66, -0.2], [40.8, 0.74, -0.2], [41.08, 0.72, -0.2]] },
    { m: 'CtrlRegen+', short: 'CtrlRegen+', g: 'base', t: '1976', v: [[21.1, 0.50, -27.1], [20.0, 0.51, -26.7], [20.0, 0.50, -26.6]] },
    { m: 'Diffusion Attack', short: 'Diffusion', g: 'base', t: '255.63', v: [[21.0, 0.50, -27.2], [22.4, 0.51, -24.3], [22.0, 0.50, -24.6]] },
    { m: 'VAE-Bmshj2018', short: 'VAE-Bmshj2018', g: 'base', t: '4.00', v: [[30.0, 0.50, -18.2], [25.3, 0.51, -21.4], [25.5, 0.50, -21.1]] },
    { m: 'VAE-Cheng2020', short: 'VAE-Cheng2020', g: 'base', t: '14.46', v: [[31.4, 0.50, -16.8], [26.4, 0.51, -20.3], [26.6, 0.50, -20.0]] },
    { m: 'FiLM-CAM (noise)', short: 'FiLM-CAM ✓ key', g: 'ok', t: '5.06', v: [[57.9, 0.57, 17.7], [54.0, 0.58, 13.9], [54.0, 0.58, 13.9]] },
    { m: 'FiLM-CAM (noise)', short: 'FiLM-CAM ✗ key', g: 'no', t: '5.06', v: [[48.0, 0.81, 7.8], [46.6, 0.79, 6.5], [46.7, 0.78, 6.6]] },
];

// Appendix table: robustness on DIV2K (bit accuracy, %).
const ROBUST = {
    methods: ['TrustMark-Q', 'InvisMark', 'PixelSeal', 'RoSteALS', 'SSL', 'MBRS', 'FiLM-CAM'],
    rows: [
        ['Crop', 60.8, 75.1, 83.2, 50.4, 74.1, 50.0, 83.2],
        ['Flip', 99.9, 100.0, 99.6, 48.7, 99.9, 50.0, 100.0],
        ['Sharpness', 99.8, 100.0, 99.5, 98.9, 99.7, 100.0, 100.0],
        ['Motion blur', 99.8, 100.0, 99.6, 98.7, 84.5, 82.2, 96.9],
        ['Gaussian noise', 99.6, 81.5, 95.5, 95.2, 62.7, 82.3, 90.2],
        ['Colour jiggle', 99.7, 100.0, 99.4, 98.8, 99.6, 99.8, 99.0],
        ['Brightness', 99.1, 99.8, 99.1, 98.3, 99.4, 99.1, 99.5],
        ['RGB shift', 99.5, 100.0, 99.4, 98.8, 98.8, 99.9, 99.9],
        ['Gamma', 98.7, 99.7, 98.9, 98.1, 99.0, 99.0, 99.4],
        ['Saturation', 99.8, 100.0, 99.6, 99.0, 99.9, 100.0, 100.0],
        ['Hue', 99.8, 100.0, 99.5, 99.0, 99.9, 100.0, 100.0],
        ['Contrast', 99.0, 99.9, 99.1, 98.6, 99.3, 99.6, 99.8],
        ['Posterize', 93.6, 95.9, 93.4, 93.4, 73.0, 96.0, 96.0],
        ['Gaussian blur', 99.8, 100.0, 99.6, 98.8, 99.6, 86.5, 99.0],
        ['Resize', 99.8, 100.0, 99.6, 99.0, 99.8, 97.9, 99.9],
        ['Rotate', 64.6, 78.9, 99.0, 58.1, 99.1, 52.0, 96.0],
        ['Box blur', 99.8, 100.0, 99.5, 98.2, 93.3, 47.3, 97.6],
        ['Median blur', 99.8, 100.0, 99.6, 98.9, 99.5, 97.0, 99.9],
        ['Grayscale', 97.0, 53.4, 99.6, 95.8, 94.9, 100.0, 75.7],
        ['JPEG', 99.8, 100.0, 99.5, 98.6, 97.4, 100.0, 85.1],
        ['Perspective', 51.2, 63.8, 96.0, 49.7, 82.4, 50.1, 90.2],
    ],
    mean: ['Mean', 93.4, 92.8, 98.0, 89.2, 93.1, 85.2, 96.0],
};

// FiLM-CAM inference outputs on COCO: [width, height] of images/scenes/NN_*.webp.
const SCENES = [
    [586, 640], [640, 480], [375, 500], [621, 640], [640, 426], [640, 483], [428, 640],
    [640, 425], [424, 640], [640, 427], [640, 427], [375, 500], [640, 512], [640, 315],
    [320, 240], [612, 612], [640, 480], [427, 640],
];

const LAYER_NAMES = {
    cover: 'Cover',
    wm: 'Watermarked',
    rec: 'Watermark removed',
    res: 'Embedding residual ×10',
    remres: 'Removal residual ×10',
    abs: '|Residual| ×10',
};

// ---------------------------------------------------------
// Utilities
// ---------------------------------------------------------

function mulberry32(seed) {
    return function () {
        seed |= 0;
        seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const scale = (d0, d1, r0, r1) => v => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);

function onResize(el, fn) {
    let w = 0;
    new ResizeObserver(entries => {
        const nw = Math.round(entries[0].contentRect.width);
        if (nw && nw !== w) { w = nw; fn(nw); }
    }).observe(el);
}

const tip = $('#tooltip');

function showTip(html, pageX, pageY) {
    tip.innerHTML = html;
    tip.classList.add('show');
    const r = tip.getBoundingClientRect();
    let x = pageX + 14;
    let y = pageY - r.height - 12;
    if (x + r.width > window.scrollX + document.documentElement.clientWidth - 8) x = pageX - r.width - 14;
    if (y < window.scrollY + 8) y = pageY + 16;
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
}

function hideTip() { tip.classList.remove('show'); }

const tipRow = (c, k, v) => `<div class="r"><span>${c ? `<i style="--c:${c}"></i>` : ''}${k}</span><b>${v}</b></div>`;

const fmt = (v, d) => (v === null || v === undefined ? '–' : v.toFixed(d));

// ---------------------------------------------------------
// Hero bit field
// ---------------------------------------------------------

function initBitfield() {
    const canvas = $('#bitfield');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rand = mulberry32(7);
    const CELL = 20;
    let cols = 0, rows = 0, bits = [], alpha = [], w = 0, h = 0, dpr = 1;
    let visible = true, last = 0, scan = 0;

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cols = Math.ceil(w / CELL);
        rows = Math.ceil(h / CELL);
        bits = Array.from({ length: cols * rows }, () => (rand() < 0.5 ? 0 : 1));
        alpha = Array.from({ length: cols * rows }, () => 0.15 + rand() * 0.35);
        draw();
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        ctx.font = '500 12px "JetBrains Mono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const band = scan * (cols + 20) - 10;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const i = r * cols + c;
                const d = Math.abs(c - band);
                const glow = d < 6 ? 1 - d / 6 : 0;
                const a = alpha[i] * (0.35 + glow * 0.9);
                ctx.fillStyle = glow > 0.2
                    ? `rgba(120, 175, 245, ${Math.min(a * 1.4, 0.9)})`
                    : `rgba(200, 212, 230, ${a * 0.55})`;
                ctx.fillText(bits[i], c * CELL + CELL / 2, r * CELL + CELL / 2);
            }
        }
    }

    function tick(t) {
        if (visible && t - last > 80) {
            last = t;
            const n = Math.ceil(bits.length * 0.012);
            for (let k = 0; k < n; k++) {
                const i = Math.floor(rand() * bits.length);
                bits[i] ^= 1;
                alpha[i] = 0.15 + rand() * 0.35;
            }
            scan = (scan + 0.006) % 1;
            draw();
        }
        requestAnimationFrame(tick);
    }

    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    window.addEventListener('resize', resize);
    resize();
    if (document.fonts) document.fonts.ready.then(draw);
    if (!reduceMotion) requestAnimationFrame(tick);
}

// ---------------------------------------------------------
// Nav, reveal, lightbox, KaTeX, copy
// ---------------------------------------------------------

function initNav() {
    const nav = $('#nav');
    const links = $$('.nav-links a');
    const sections = links.map(a => $(a.getAttribute('href')));

    function update() {
        nav.classList.toggle('stuck', nav.getBoundingClientRect().top <= 0);
        const y = window.innerHeight * 0.35;
        let active = -1;
        sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < y) active = i; });
        links.forEach((a, i) => a.classList.toggle('active', i === active));
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
}

function initReveal() {
    const els = $$('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
        els.forEach(e => e.classList.add('in'));
        return;
    }
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(e => io.observe(e));
}

function initLightbox() {
    const dlg = $('#lightbox');
    const img = $('img', dlg);
    $$('img[data-zoom]').forEach(el => {
        el.addEventListener('click', () => {
            img.src = el.currentSrc || el.src;
            img.alt = el.alt;
            dlg.showModal();
        });
    });
    dlg.addEventListener('click', () => dlg.close());
}

function initMath() {
    if (!window.renderMathInElement) return;
    window.renderMathInElement(document.body, {
        delimiters: [
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false },
        ],
        throwOnError: false,
    });
}

function initCopy() {
    const btn = $('#copyBib');
    const label = $('span', btn);
    btn.hidden = !$('#bibText').textContent.trim();
    btn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText($('#bibText').textContent);
            label.textContent = 'Copied';
        } catch {
            label.textContent = 'Select & copy';
        }
        setTimeout(() => { label.textContent = 'Copy'; }, 1800);
    });
}

// ---------------------------------------------------------
// Tabs
// ---------------------------------------------------------

function tabs(root, onChange) {
    const btns = $$('button', root);
    btns.forEach(b => b.addEventListener('click', () => {
        btns.forEach(o => o.setAttribute('aria-selected', String(o === b)));
        onChange(Number(b.dataset.i));
    }));
    onChange(0);
}

// ---------------------------------------------------------
// SOTA table
// ---------------------------------------------------------

function initSota() {
    const body = $('#sotaTable tbody');
    tabs($('#sotaTabs'), d => {
        const valid = SOTA.filter(r => r.key !== 'no').map(r => r.v[d]);
        const best = [
            null,
            Math.max(...valid.map(v => v[1] ?? -Infinity)),
            Math.max(...valid.map(v => v[2] ?? -Infinity)),
            Math.min(...valid.map(v => v[3] ?? Infinity)),
        ];
        body.innerHTML = SOTA.map(r => {
            const v = r.v[d];
            const tag = r.key === 'ok' ? '<span class="tag ok">✓ key</span>' : r.key === 'no' ? '<span class="tag no">✗ key</span>' : '';
            const cell = (i, digits) => {
                const isBest = r.key !== 'no' && v[i] !== null && v[i] === best[i];
                return `<td class="${isBest ? 'best' : v[i] === null ? 'dim' : ''}">${fmt(v[i], digits)}</td>`;
            };
            return `<tr class="${r.key ? 'ours' : ''} ${r.sep ? 'sep' : ''}">
                <td>${r.m}${tag}</td><td>${r.p}</td>
                <td class="${v[0] === null ? 'dim' : ''}">${fmt(v[0], 2)}</td>
                ${cell(1, 1)}${cell(2, 4)}${cell(3, 4)}
            </tr>`;
        }).join('');
    });
}

// ---------------------------------------------------------
// Comparison viewer
// ---------------------------------------------------------

function initViewer() {
    const box = $('#compare');
    const base = $('#cmpBase');
    const top = $('#cmpTop');
    const handle = $('#cmpHandle');
    let scene = 1, left = 'cover', right = 'wm', pos = 50;

    const src = (i, l) => `images/scenes/${String(i).padStart(2, '0')}_${l}.webp`;

    function setPos(p) {
        pos = Math.max(0, Math.min(100, p));
        box.style.setProperty('--pos', `${pos}%`);
        handle.setAttribute('aria-valuenow', Math.round(pos));
    }

    function load() {
        const [w, h] = SCENES[scene - 1];
        box.style.aspectRatio = `${w} / ${h}`;
        box.style.maxWidth = `calc(72vh * ${(w / h).toFixed(4)})`;
        top.src = src(scene, left);
        base.src = src(scene, right);
        top.alt = `${LAYER_NAMES[left]}, image ${scene}`;
        base.alt = `${LAYER_NAMES[right]}, image ${scene}`;
        $('#tagL').textContent = LAYER_NAMES[left];
        $('#tagR').textContent = LAYER_NAMES[right];
        // Warm the cache for the other layers of this scene.
        Object.keys(LAYER_NAMES).forEach(l => { new Image().src = src(scene, l); });
    }

    const thumbs = $('#thumbs');
    SCENES.forEach((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-pressed', String(i === 0));
        b.setAttribute('aria-label', `Image ${i + 1}`);
        b.innerHTML = `<img src="${src(i + 1, 'thumb')}" alt="" loading="lazy">`;
        b.addEventListener('click', () => {
            scene = i + 1;
            $$('button', thumbs).forEach(o => o.setAttribute('aria-pressed', String(o === b)));
            load();
        });
        thumbs.appendChild(b);
    });

    $$('#viewerPresets .chip').forEach(c => c.addEventListener('click', () => {
        left = c.dataset.l;
        right = c.dataset.r;
        $$('#viewerPresets .chip').forEach(o => o.setAttribute('aria-pressed', String(o === c)));
        load();
    }));

    let dragging = false;
    const fromEvent = e => {
        const r = box.getBoundingClientRect();
        setPos(((e.clientX - r.left) / r.width) * 100);
    };
    box.addEventListener('pointerdown', e => {
        dragging = true;
        box.setPointerCapture(e.pointerId);
        fromEvent(e);
    });
    box.addEventListener('pointermove', e => { if (dragging) fromEvent(e); });
    box.addEventListener('pointerup', () => { dragging = false; });
    box.addEventListener('pointercancel', () => { dragging = false; });

    handle.addEventListener('keydown', e => {
        const step = e.shiftKey ? 10 : 2;
        const keys = { ArrowLeft: pos - step, ArrowRight: pos + step, Home: 0, End: 100 };
        if (e.key in keys) { e.preventDefault(); setPos(keys[e.key]); }
    });

    setPos(50);
    load();
}

// ---------------------------------------------------------
// Removal scatter + table
// ---------------------------------------------------------

function initRemoval() {
    const el = $('#remChart');
    const body = $('#remTable tbody');
    const colorOf = g => (g === 'ok' ? COLORS.blue : g === 'no' ? COLORS.orange : COLORS.gray);
    let d = 0;
    let width = 0;

    function renderTable() {
        body.innerHTML = REMOVAL.map((r, i) => {
            const v = r.v[d];
            const ours = r.g !== 'base';
            const tag = r.g === 'ok' ? '<span class="tag ok">✓ key</span>' : r.g === 'no' ? '<span class="tag no">✗ key</span>' : '';
            const time = r.t;
            return `<tr class="${ours ? 'ours' : ''} ${r.g === 'ok' && i ? 'sep' : ''}">
                <td>${r.m}${tag}</td><td>${v[0].toFixed(1)}</td><td>${v[1].toFixed(2)}</td>
                <td>${v[2] > 0 ? '+' : ''}${v[2].toFixed(1)}</td><td>${time}</td>
            </tr>`;
        }).join('');
    }

    function renderChart() {
        if (!width) return;
        const narrow = width < 560;
        const h = narrow ? 300 : 360;
        const m = { t: 16, r: 20, b: 44, l: 46 };
        const x = scale(0.45, 0.85, m.l, width - m.r);
        const y = scale(10, 62, h - m.b, m.t);

        const pts = REMOVAL.map(r => ({ r, px: x(r.v[d][1]), py: y(r.v[d][0]) }));

        // Labels sit right of their dot (left near the right edge); nudge apart vertically when they collide.
        const labels = pts.map(p => ({ p, side: p.px > width - 150 ? -1 : 1, ly: p.py }));
        [-1, 1].forEach(side => {
            const group = labels.filter(l => l.side === side).sort((a, b) => a.ly - b.ly);
            for (let i = 1; i < group.length; i++) {
                const prev = group[i - 1], cur = group[i];
                if (Math.abs(cur.p.px - prev.p.px) < 60 && cur.ly - prev.ly < 15) cur.ly = prev.ly + 15;
            }
        });

        let s = `<svg viewBox="0 0 ${width} ${h}" height="${h}" role="img" aria-label="Scatter plot of removal PSNR versus post-removal bit accuracy">`;
        s += '<g class="grid">';
        for (let v = 20; v <= 60; v += 10) s += `<line x1="${m.l}" x2="${width - m.r}" y1="${y(v)}" y2="${y(v)}"/>`;
        s += '</g><g class="tick">';
        for (let v = 10; v <= 60; v += 10) s += `<text x="${m.l - 8}" y="${y(v)}" text-anchor="end" dominant-baseline="middle">${v}</text>`;
        for (let v = 0.5; v <= 0.851; v += narrow ? 0.1 : 0.05) s += `<text x="${x(v)}" y="${h - m.b + 18}" text-anchor="middle">${v.toFixed(2)}</text>`;
        s += '</g>';
        s += `<line class="baseline" x1="${m.l}" x2="${width - m.r}" y1="${h - m.b}" y2="${h - m.b}"/>`;
        s += `<line x1="${x(0.5)}" x2="${x(0.5)}" y1="${m.t}" y2="${h - m.b}" stroke="#d6d3ca"/>`;
        s += `<text x="${x(0.5) + 6}" y="${h - m.b - 7}" style="fill:${COLORS.muted};font-size:11.5px">chance</text>`;
        s += `<text class="axis-title" x="${(m.l + width - m.r) / 2}" y="${h - 4}" text-anchor="middle">Post-removal bit accuracy (0.50 = watermark erased)</text>`;
        s += `<text class="axis-title" transform="translate(12 ${(m.t + h - m.b) / 2}) rotate(-90)" text-anchor="middle">Removal PSNR (dB)</text>`;
        s += `<text x="${width - m.r}" y="${m.t + 4}" text-anchor="end" style="fill:${COLORS.muted};font-size:11.5px">→ watermark survives</text>`;

        labels.forEach(l => {
            const tx = l.p.px + l.side * 11;
            if (Math.abs(l.ly - l.p.py) > 3) {
                s += `<line class="leader" x1="${l.p.px + l.side * 6}" y1="${l.p.py}" x2="${tx - l.side * 2}" y2="${l.ly}"/>`;
            }
            s += `<text class="point-label ${l.p.r.g !== 'base' ? 'strong' : ''}" x="${tx}" y="${l.ly}" dominant-baseline="middle" text-anchor="${l.side > 0 ? 'start' : 'end'}">${l.p.r.short}</text>`;
        });
        pts.forEach((p, i) => {
            s += `<circle cx="${p.px}" cy="${p.py}" r="${p.r.g === 'base' ? 5 : 7}" fill="${colorOf(p.r.g)}" stroke="#fff" stroke-width="2"/>`;
            s += `<circle cx="${p.px}" cy="${p.py}" r="14" fill="transparent" data-i="${i}" style="cursor:default"/>`;
        });
        s += '</svg>';
        el.innerHTML = s;

        $$('circle[data-i]', el).forEach(c => {
            const r = REMOVAL[Number(c.dataset.i)];
            const v = r.v[d];
            const show = e => showTip(
                `<div class="t">${r.m}${r.g === 'ok' ? ', correct key' : r.g === 'no' ? ', wrong key' : ''}</div>` +
                tipRow(colorOf(r.g), 'Removal PSNR', `${v[0].toFixed(1)} dB`) +
                tipRow('', 'Post-removal acc.', v[1].toFixed(2)) +
                tipRow('', 'Time', `${r.t} ms`), e.pageX, e.pageY);
            c.addEventListener('pointerenter', show);
            c.addEventListener('pointermove', show);
            c.addEventListener('pointerleave', hideTip);
        });
    }

    onResize(el, w => { width = w; renderChart(); });
    tabs($('#remTabs'), i => { d = i; renderTable(); renderChart(); });
}

// ---------------------------------------------------------
// Robustness heatmap
// ---------------------------------------------------------

const RAMP = [
    [0, [247, 250, 254]],
    [0.3, [205, 226, 251]],
    [0.55, [158, 197, 244]],
    [0.75, [109, 167, 236]],
    [0.9, [57, 135, 229]],
    [1, [37, 106, 191]],
];

function rampColor(v) {
    const t = Math.max(0, Math.min(1, (v - 50) / 50));
    for (let i = 1; i < RAMP.length; i++) {
        if (t <= RAMP[i][0]) {
            const [t0, c0] = RAMP[i - 1];
            const [t1, c1] = RAMP[i];
            const k = (t - t0) / (t1 - t0);
            return { rgb: `rgb(${c0.map((c, j) => Math.round(c + (c1[j] - c) * k)).join(',')})`, dark: t > 0.8 };
        }
    }
    return { rgb: 'rgb(37,106,191)', dark: true };
}

function initHeatmap() {
    const table = $('#heatTable');
    const last = ROBUST.methods.length - 1;
    const head = `<thead><tr><th>Attack</th>${ROBUST.methods.map((m, i) => `<th class="${i === last ? 'ours' : ''}" style="text-align:center">${m}</th>`).join('')}</tr></thead>`;
    const row = (r, cls = '') => `<tr class="${cls}"><td>${r[0]}</td>${r.slice(1).map((v, i) => {
        const c = rampColor(v);
        return `<td class="cell" data-c="${i}" data-a="${r[0]}" style="background:${c.rgb};color:${c.dark ? '#fff' : '#0f1115'}">${v.toFixed(1)}</td>`;
    }).join('')}</tr>`;
    table.innerHTML = `${head}<tbody>${ROBUST.rows.map(r => row(r)).join('')}${row(ROBUST.mean, 'mean')}</tbody>`;

    $('#heatScale').style.background = `linear-gradient(to right, ${RAMP.map(([t, c]) => `rgb(${c.join(',')}) ${t * 100}%`).join(', ')})`;

    const ths = $$('thead th', table);
    $$('td.cell', table).forEach(td => {
        td.addEventListener('pointerenter', e => {
            const c = Number(td.dataset.c);
            td.classList.add('hl');
            ths[c + 1].classList.add('hl');
            td.parentElement.firstElementChild.style.fontWeight = '600';
            showTip(`<div class="t">${ROBUST.methods[c]}</div>${tipRow('', td.dataset.a, td.textContent + '%')}`, e.pageX, e.pageY);
        });
        td.addEventListener('pointerleave', () => {
            td.classList.remove('hl');
            ths.forEach(t => t.classList.remove('hl'));
            td.parentElement.firstElementChild.style.fontWeight = '';
            hideTip();
        });
    });
}

// ---------------------------------------------------------

initMath();
initBitfield();
initNav();
initReveal();
initLightbox();
initCopy();
initSota();
initViewer();
initRemoval();
initHeatmap();
