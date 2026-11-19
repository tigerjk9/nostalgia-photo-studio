/*
 * era-gallery.js — 시대 갤러리 (three.js 0.169.0, import map의 "three"를 지연 로드)
 *
 * 사용법: EraGallery.mount({ grid, title, onOpen }) → { sync(items), reset() }
 *   items = [{ name, status: 'loading' | 'completed' | 'failed', src }]  (시간 순서)
 * WebGL2가 없거나 three.js를 10초 안에 못 받으면 아무것도 바꾸지 않아 기존 격자 화면이 그대로 남는다.
 */
(() => {
    'use strict';

    const LOAD_TIMEOUT_MS = 10000;
    const CARD_W = 2.05, CARD_H = 2.56, SPACING = 3.4, SIDE = 1.25;
    const TEX_W = 820, TEX_H = 1024;
    const PHOTO = { x: 40, y: 40, w: 740, h: 820 };
    const BG = 0x26231f;
    const CAPTION_FONT = '"Nanum Myeongjo", serif';

    const CSS = `
.eg[hidden],.eg [hidden]{display:none!important}
.eg{margin:-0.5rem 0 2rem}
.eg-bar{display:flex;justify-content:center;gap:4px;padding:4px;margin:0 auto 1rem;width:max-content;max-width:100%;background:rgba(0,0,0,.28);border:1px solid #4a443f;border-radius:999px}
.eg-tab{min-height:44px;min-width:112px;padding:0 20px;border:0;border-radius:999px;background:transparent;color:#a39a8c;font:600 15px/1 Pretendard,sans-serif;cursor:pointer;transition:background-color .2s,color .2s}
.eg-tab[aria-pressed="true"]{background:#e3d9c6;color:#2c2a29}
.eg-tab:focus-visible,.eg-step:focus-visible,.eg-act:focus-visible,.eg-canvas:focus-visible{outline:2px solid #e3d9c6;outline-offset:2px}
.eg-stage{position:relative;height:clamp(360px,58vh,640px);height:clamp(360px,58svh,640px);border:1px solid #3d3834;border-radius:12px;overflow:hidden;background:#26231f}
.eg-stage::after{content:"";position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 90px rgba(0,0,0,.6)}
.eg-canvas{display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab;-webkit-tap-highlight-color:transparent}
.eg-canvas:active{cursor:grabbing}
.eg-nav{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px}
.eg-step{flex:none;width:48px;height:48px;display:grid;place-items:center;border:1px solid #4a443f;border-radius:999px;background:rgba(0,0,0,.28);color:#e3d9c6;cursor:pointer;transition:background-color .2s,opacity .2s}
.eg-step:hover:not(:disabled){background:rgba(227,217,198,.14)}
.eg-step:disabled{opacity:.3;cursor:default}
.eg-info{flex:1;min-width:0;text-align:center}
.eg-name{display:block;font:700 20px/1.3 "Nanum Myeongjo",serif;color:#e3d9c6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.eg-count{display:block;margin-top:2px;font:500 13px/1.4 Pretendard,sans-serif;color:#9d948a}
.eg-bars{display:flex;justify-content:center;gap:5px;margin-top:8px}
.eg-bars i{width:100%;max-width:26px;height:4px;border-radius:2px;background:#4a443f;transition:background-color .25s,transform .25s}
.eg-bars i.is-done{background:#8a6e50}
.eg-bars i.is-now{background:#e3d9c6;transform:scaleY(1.6)}
.eg-actions{display:flex;gap:10px;margin-top:14px}
.eg-act{flex:1;min-height:48px;border:0;border-radius:8px;font:600 16px/1 Pretendard,sans-serif;color:#fff;cursor:pointer;transition:background-color .2s,opacity .2s}
.eg-act[data-act="open"]{background:#8a6e50}
.eg-act[data-act="open"]:hover:not(:disabled){background:#a18666}
.eg-act[data-act="save"]{background:rgba(55,65,81,.8)}
.eg-act[data-act="save"]:hover:not(:disabled){background:#4b5563}
.eg-act:disabled{background:#1f1d1b;color:#6b645c;cursor:default}
.eg-hint{margin:12px 0 0;text-align:center;font:400 13px/1.5 Pretendard,sans-serif;color:#8b8378}
@media (prefers-reduced-motion:reduce){.eg *{transition:none!important}}`;

    const STEP_ICON = (d) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const lerp = (a, b, t) => a + (b - a) * t;

    function mount({ grid, title, onOpen }) {
        const style = document.createElement('style');
        style.textContent = CSS;
        document.head.appendChild(style);

        const root = document.createElement('section');
        root.className = 'eg';
        root.hidden = true;
        root.setAttribute('aria-label', title);
        root.innerHTML = `
            <div class="eg-bar" role="group" aria-label="보기 방식">
                <button type="button" class="eg-tab" data-view="3d" aria-pressed="true">3D 보기</button>
                <button type="button" class="eg-tab" data-view="grid" aria-pressed="false">격자 보기</button>
            </div>
            <div class="eg-panel">
                <div class="eg-stage"><canvas class="eg-canvas" tabindex="0" role="group" aria-roledescription="3D 갤러리" aria-label="${title}. 왼쪽·오른쪽 방향키로 넘기고 엔터로 크게 봅니다."></canvas></div>
                <div class="eg-nav">
                    <button type="button" class="eg-step" data-step="-1" aria-label="이전 카드">${STEP_ICON('M15 18l-6-6 6-6')}</button>
                    <div class="eg-info" aria-live="polite"><strong class="eg-name"></strong><span class="eg-count"></span><div class="eg-bars"></div></div>
                    <button type="button" class="eg-step" data-step="1" aria-label="다음 카드">${STEP_ICON('M9 18l6-6-6-6')}</button>
                </div>
                <div class="eg-actions">
                    <button type="button" class="eg-act" data-act="open">크게 보기</button>
                    <button type="button" class="eg-act" data-act="save">저장하기</button>
                </div>
                <p class="eg-hint">좌우로 밀거나 끌어서 시대를 넘기고, 카드를 누르면 크게 볼 수 있어요.</p>
            </div>`;
        grid.parentNode.insertBefore(root, grid);

        const $ = (sel) => root.querySelector(sel);
        const panel = $('.eg-panel'), stage = $('.eg-stage'), canvas = $('.eg-canvas');
        const nameEl = $('.eg-name'), countEl = $('.eg-count'), barsEl = $('.eg-bars');
        const prevBtn = $('[data-step="-1"]'), nextBtn = $('[data-step="1"]');
        const openBtn = $('[data-act="open"]'), saveBtn = $('[data-act="save"]');
        const tabs = [...root.querySelectorAll('.eg-tab')];

        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        let reduced = motionQuery.matches;

        let state = 'idle'; // idle | boot | ready | failed
        let view = '3d';
        let items = [];
        let T = null; // three 모듈
        let renderer, scene, camera, raycaster, shimmerTex, shimmerMat, cardGeo, shimmerGeo;
        let slots = [];
        let anchors = []; // 카메라 위치(카드마다)
        let focus = []; // 시선이 향하는 카드 중심
        let pos = 0, target = 0, time = 0;
        let touched = false, generating = false, visible = true;
        let raf = 0, last = 0, hudKey = '';
        let pointer = null;
        let unitPx = 200;
        let sized = { w: 0, h: 0, dpr: 0 };
        let introduced = false;

        // ---------- 화면 전환 ----------
        const applyView = () => {
            const live = state === 'ready' && items.length > 0;
            const show3d = live && view === '3d';
            root.hidden = !live;
            panel.hidden = !show3d;
            grid.style.display = show3d ? 'none' : '';
            tabs.forEach((tab) => tab.setAttribute('aria-pressed', String(tab.dataset.view === view)));
            if (show3d) {
                if (!introduced) { // 결과 머리말이 길어 갤러리가 화면 아래에 있으므로 한 번만 끌어올린다
                    introduced = true;
                    root.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
                }
                resize();
                schedule();
            }
        };

        const fail = () => {
            if (state === 'failed') return;
            state = 'failed';
            cancelAnimationFrame(raf);
            raf = 0;
            slots.forEach(disposeSlot);
            slots = [];
            if (renderer) renderer.dispose();
            root.hidden = true;
            grid.style.display = '';
        };

        // ---------- 카드 그리기 (2D 캔버스 → 텍스처, 긴 변 1024px) ----------
        const paintCard = (label, kind, img) => {
            const c = document.createElement('canvas');
            c.width = TEX_W;
            c.height = TEX_H;
            const g = c.getContext('2d');
            g.fillStyle = '#e8dfcc';
            g.fillRect(0, 0, TEX_W, TEX_H);
            g.fillStyle = '#171514';
            g.fillRect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
            if (kind === 'ok') {
                const scale = Math.max(PHOTO.w / img.naturalWidth, PHOTO.h / img.naturalHeight);
                const sw = PHOTO.w / scale, sh = PHOTO.h / scale;
                g.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
            } else {
                g.fillStyle = kind === 'failed' ? '#c47b73' : '#8a7f70';
                g.font = `700 72px ${CAPTION_FONT}`;
                g.textAlign = 'center';
                g.textBaseline = 'middle';
                g.fillText(kind === 'failed' ? '생성 실패' : '생성 중', TEX_W / 2, PHOTO.y + PHOTO.h / 2);
            }
            g.fillStyle = '#2c2a29';
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            let size = 70;
            g.font = `700 ${size}px ${CAPTION_FONT}`;
            while (g.measureText(label).width > PHOTO.w - 20 && size > 40) {
                size -= 2;
                g.font = `700 ${size}px ${CAPTION_FONT}`;
            }
            g.fillText(label, TEX_W / 2, PHOTO.y + PHOTO.h + (TEX_H - PHOTO.y - PHOTO.h) / 2);

            const tex = new T.CanvasTexture(c);
            tex.colorSpace = T.SRGBColorSpace;
            tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
            tex.onUpdate = () => { c.width = c.height = 0; tex.onUpdate = null; }; // 업로드 후 캔버스 메모리 반환
            return tex;
        };

        const disposeSlot = (slot) => {
            slot.mat.map.dispose();
            slot.mat.dispose();
            scene.remove(slot.mesh);
        };

        const setCardTexture = (slot, tex) => {
            const old = slot.mat.map;
            slot.mat.map = tex;
            slot.mat.needsUpdate = true;
            if (old) old.dispose();
        };

        // ---------- 슬롯(카드) 관리 ----------
        const layout = () => {
            const n = slots.length;
            anchors = [];
            focus = [];
            const th = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
            const dist = Math.max((CARD_H * 1.18) / 2 / th, (CARD_W * 1.22) / 2 / (th * camera.aspect));
            scene.fog.near = dist + 1;
            scene.fog.far = dist + SPACING * 3.4;
            for (let i = 0; i < n; i++) {
                const cx = Math.sin(i * 0.55) * 1.7, cy = i * 0.12, cz = -i * SPACING;
                const c = new T.Vector3(cx + (i % 2 ? SIDE : -SIDE), cy, cz);
                const a = new T.Vector3(cx, cy + 0.1, cz + dist);
                focus.push(c);
                anchors.push(a);
                const mesh = slots[i].mesh;
                mesh.position.copy(c);
                mesh.lookAt(a);
                mesh.rotateY((i % 2 ? 1 : -1) * 0.12);
            }
        };

        const buildSlots = () => {
            slots.forEach(disposeSlot);
            slots = items.map((item, index) => {
                const mat = new T.MeshBasicMaterial({ map: paintCard(item.name, 'loading') });
                const mesh = new T.Mesh(cardGeo, mat);
                mesh.userData.index = index;
                const shimmer = new T.Mesh(shimmerGeo, shimmerMat);
                shimmer.position.set(0, ((TEX_H / 2 - (PHOTO.y + PHOTO.h / 2)) / TEX_H) * CARD_H, 0.01);
                mesh.add(shimmer);
                scene.add(mesh);
                return { mesh, mat, shimmer, src: null, status: 'loading', pop: 0 };
            });
            layout();
        };

        const loadImage = async (slot, item) => {
            const img = new Image();
            img.src = item.src;
            let ok = true;
            try { await img.decode(); } catch { ok = false; }
            if (slot.src !== item.src || state !== 'ready') return; // 그 사이 다시 생성·초기화됨
            setCardTexture(slot, paintCard(item.name, ok ? 'ok' : 'failed', img));
            slot.pop = reduced ? 0 : 1;
            schedule();
        };

        const applyItems = () => {
            if (slots.length !== items.length) buildSlots();
            items.forEach((item, i) => {
                const slot = slots[i];
                if (item.status === 'completed') {
                    if (slot.src !== item.src) {
                        slot.src = item.src;
                        slot.status = 'completed';
                        slot.shimmer.visible = false;
                        loadImage(slot, item);
                    }
                } else if (item.status === 'failed' && slot.status !== 'failed') {
                    slot.src = null;
                    slot.status = 'failed';
                    slot.shimmer.visible = false;
                    setCardTexture(slot, paintCard(item.name, 'failed'));
                } else if (item.status === 'loading' && slot.status !== 'loading') {
                    slot.src = null;
                    slot.status = 'loading';
                    slot.shimmer.visible = true;
                    setCardTexture(slot, paintCard(item.name, 'loading'));
                }
            });
            const wasGenerating = generating;
            generating = items.some((item) => item.status === 'loading');
            if (!wasGenerating && generating) time = 0;
            if (wasGenerating && !generating && !touched) target = 0;
            if (reduced) pos = target = clamp(target, 0, Math.max(0, slots.length - 1));
            updateHud();
            schedule();
        };

        // ---------- HUD (DOM, 선명한 글자) ----------
        const focusIndex = () => clamp(Math.round(pos), 0, Math.max(0, items.length - 1));
        const drifting = () => generating && !touched && !reduced && items.length > 1;

        const updateHud = () => {
            const n = items.length;
            if (!n) return;
            const i = focusIndex();
            const done = items.filter((it) => it.status !== 'loading').length;
            const key = `${n}|${drifting() ? 'g' + done : i}|${items.map((it) => it.status[0]).join('')}`;
            if (key === hudKey) return;
            hudKey = key;
            if (drifting()) {
                nameEl.textContent = '시간 터널을 지나는 중';
                countEl.textContent = `${done} / ${n} 완성`;
            } else {
                nameEl.textContent = items[i].name;
                countEl.textContent = `${i + 1} / ${n}`;
            }
            if (barsEl.childElementCount !== n) barsEl.innerHTML = '<i></i>'.repeat(n);
            [...barsEl.children].forEach((bar, k) => {
                bar.className = k === i && !drifting() ? 'is-now' : items[k].status === 'completed' ? 'is-done' : '';
            });
            prevBtn.disabled = i <= 0;
            nextBtn.disabled = i >= n - 1;
            const ready = items[i].status === 'completed';
            openBtn.disabled = !ready;
            saveBtn.disabled = !ready;
        };

        // ---------- 렌더 루프: 움직일 때만 돈다 ----------
        const schedule = () => {
            if (raf || state !== 'ready' || !slots.length || view !== '3d' || !visible || document.hidden) return;
            last = 0;
            raf = requestAnimationFrame(tick);
        };

        const tick = (now) => {
            raf = 0;
            const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
            last = now;
            const n = slots.length;
            let busy = false;

            if (drifting()) {
                time += dt;
                const mid = (n - 1) / 2;
                pos = target = mid * (1 - Math.cos(time * 0.35));
                busy = true;
            } else if (!pointer || pointer.mode !== 'x') {
                if (reduced) pos = target;
                else {
                    pos += (target - pos) * (1 - Math.exp(-dt * 7));
                    if (Math.abs(target - pos) < 0.0005) pos = target;
                    else busy = true;
                }
            }

            if (!reduced && generating) {
                shimmerTex.offset.y -= dt * 0.45;
                busy = true;
            }

            const i0 = clamp(Math.floor(pos), 0, n - 1), i1 = Math.min(i0 + 1, n - 1), f = clamp(pos - i0, 0, 1);
            camera.position.lerpVectors(anchors[i0], anchors[i1], f);
            const look = focus[i0].clone().lerp(focus[i1], f);
            camera.lookAt(look);

            slots.forEach((slot, i) => {
                slot.mat.color.setScalar(1 - 0.19 * Math.min(Math.abs(i - pos), 2));
                if (slot.pop > 0) {
                    slot.pop = Math.max(0, slot.pop - dt / 0.45);
                    slot.mesh.scale.setScalar(1 - 0.12 * slot.pop * slot.pop);
                    busy = true;
                }
            });

            renderer.render(scene, camera);
            updateHud();
            if (busy) schedule();
        };

        // ---------- 크기 ----------
        const resize = () => {
            if (state !== 'ready') return;
            const w = stage.clientWidth, h = stage.clientHeight;
            if (!w || !h) return;
            const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 500 ? 1.5 : 2);
            if (w === sized.w && h === sized.h && dpr === sized.dpr) return;
            sized = { w, h, dpr };
            renderer.setPixelRatio(dpr);
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            unitPx = w * 0.7;
            if (slots.length) layout();
            schedule();
        };

        // ---------- 입력 ----------
        const go = (index) => {
            touched = true;
            target = clamp(index, 0, Math.max(0, items.length - 1));
            hudKey = '';
            updateHud();
            schedule();
        };
        const step = (k) => go(Math.round(target) + k);

        const hitIndex = (clientX, clientY) => {
            const r = canvas.getBoundingClientRect();
            raycaster.setFromCamera({ x: ((clientX - r.left) / r.width) * 2 - 1, y: -((clientY - r.top) / r.height) * 2 + 1 }, camera);
            const hit = raycaster.intersectObjects(slots.map((s) => s.mesh), false)[0];
            return hit ? hit.object.userData.index : -1;
        };

        canvas.addEventListener('pointerdown', (e) => {
            if (e.button > 0 || state !== 'ready') return;
            pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), start: pos, mode: null, v: 0, lx: e.clientX, lt: performance.now(), lp: pos };
        });
        canvas.addEventListener('pointermove', (e) => {
            if (!pointer || e.pointerId !== pointer.id) return;
            const dx = e.clientX - pointer.x, dy = e.clientY - pointer.y;
            if (!pointer.mode) {
                if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.6) {
                    pointer.mode = 'x';
                    touched = true;
                    canvas.setPointerCapture(e.pointerId);
                } else {
                    if (Math.abs(dy) > 10) pointer.mode = 'y';
                    return;
                }
            }
            if (pointer.mode !== 'x') return;
            const p = clamp(pointer.start - dx / unitPx, 0, items.length - 1);
            const now = performance.now();
            if (now - pointer.lt > 16) {
                pointer.v = (p - pointer.lp) / ((now - pointer.lt) / 1000);
                pointer.lp = p;
                pointer.lt = now;
            }
            pos = target = p;
            hudKey = '';
            schedule();
        });
        const endPointer = (e, cancelled) => {
            if (!pointer || e.pointerId !== pointer.id) return;
            const p = pointer;
            pointer = null;
            if (p.mode === 'x') {
                target = clamp(Math.round(pos + (cancelled ? 0 : clamp(p.v * 0.1, -0.5, 0.5))), 0, items.length - 1);
                hudKey = '';
                schedule();
            } else if (!p.mode && !cancelled && performance.now() - p.t < 600) {
                const idx = hitIndex(e.clientX, e.clientY);
                if (idx < 0) return;
                if (idx !== focusIndex()) go(idx);
                else if (items[idx].status === 'completed') onOpen(idx);
            }
        };
        canvas.addEventListener('pointerup', (e) => endPointer(e, false));
        canvas.addEventListener('pointercancel', (e) => endPointer(e, true));
        canvas.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') step(-1);
            else if (e.key === 'ArrowRight') step(1);
            else if (e.key === 'Home') go(0);
            else if (e.key === 'End') go(items.length - 1);
            else if ((e.key === 'Enter' || e.key === ' ') && items[focusIndex()]?.status === 'completed') onOpen(focusIndex());
            else return;
            e.preventDefault();
        });

        prevBtn.addEventListener('click', () => step(-1));
        nextBtn.addEventListener('click', () => step(1));
        openBtn.addEventListener('click', () => onOpen(focusIndex()));
        saveBtn.addEventListener('click', () => grid.querySelector(`.download-button[data-index="${focusIndex()}"]`)?.click());
        tabs.forEach((tab) => tab.addEventListener('click', () => {
            view = tab.dataset.view;
            applyView();
        }));

        new IntersectionObserver((entries) => {
            visible = entries[entries.length - 1].isIntersecting;
            if (visible) schedule();
        }).observe(stage);
        new ResizeObserver(resize).observe(stage);
        document.addEventListener('visibilitychange', schedule);
        motionQuery.addEventListener('change', () => {
            reduced = motionQuery.matches;
            hudKey = '';
            schedule();
        });

        // ---------- 장면 (three.js를 받은 뒤에 한 번만) ----------
        const initScene = () => {
            const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, stencil: false });
            renderer = new T.WebGLRenderer({ canvas, context: gl });
            renderer.setClearColor(BG);
            canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); fail(); });

            scene = new T.Scene();
            scene.fog = new T.Fog(BG, 8, 20);
            camera = new T.PerspectiveCamera(45, 1, 0.1, 60);
            raycaster = new T.Raycaster();
            cardGeo = new T.PlaneGeometry(CARD_W, CARD_H);
            shimmerGeo = new T.PlaneGeometry((PHOTO.w / TEX_W) * CARD_W, (PHOTO.h / TEX_H) * CARD_H);

            const sc = document.createElement('canvas');
            sc.width = 4;
            sc.height = 128;
            const sg = sc.getContext('2d');
            const grad = sg.createLinearGradient(0, 0, 0, 128);
            grad.addColorStop(0, 'rgba(255,255,255,0)');
            grad.addColorStop(0.5, 'rgba(255,236,200,.55)');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            sg.fillStyle = grad;
            sg.fillRect(0, 0, 4, 128);
            shimmerTex = new T.CanvasTexture(sc);
            shimmerTex.wrapT = T.RepeatWrapping;
            shimmerMat = new T.MeshBasicMaterial({ map: shimmerTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false, opacity: 0.6 });

            // 시간 터널: 복도를 따라 놓인 고리와 먼지
            const ringPts = [];
            for (let k = 0; k < 64; k++) {
                const a = (k / 64) * Math.PI * 2;
                ringPts.push(new T.Vector3(Math.cos(a) * 4.2, Math.sin(a) * 4.2, 0));
            }
            const ringGeo = new T.BufferGeometry().setFromPoints(ringPts);
            const ringMat = new T.LineBasicMaterial({ color: 0x8a6e50, transparent: true, opacity: 0.4 });
            for (let k = -4; k < 22; k++) {
                const s = k * 0.55;
                const ring = new T.LineLoop(ringGeo, ringMat);
                ring.position.set(Math.sin(s * 0.55) * 1.7, s * 0.12, -s * SPACING);
                scene.add(ring);
            }
            const dust = [];
            for (let k = 0; k < 260; k++) {
                const s = Math.random() * 12 - 2, a = Math.random() * Math.PI * 2, r = 1.2 + Math.random() * 3.2;
                dust.push(Math.sin(s * 0.55) * 1.7 + Math.cos(a) * r, s * 0.12 + Math.sin(a) * r, -s * SPACING);
            }
            const dustGeo = new T.BufferGeometry();
            dustGeo.setAttribute('position', new T.Float32BufferAttribute(dust, 3));
            scene.add(new T.Points(dustGeo, new T.PointsMaterial({ color: 0xe3d9c6, size: 0.04, transparent: true, opacity: 0.55 })));
        };

        const boot = async () => {
            state = 'boot';
            if (!canvas.getContext('webgl2', { antialias: true, alpha: false, stencil: false })) return fail();
            let timer;
            try {
                T = await Promise.race([
                    import('three'),
                    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), LOAD_TIMEOUT_MS); }),
                ]);
                clearTimeout(timer);
                if (state !== 'boot') return;
                try { await Promise.race([document.fonts.load(`700 48px ${CAPTION_FONT}`), new Promise((r) => setTimeout(r, 1500))]); } catch { /* 글꼴이 없으면 기본 serif */ }
                initScene();
            } catch {
                clearTimeout(timer);
                return fail();
            }
            state = 'ready';
            if (items.length) applyItems();
            applyView();
        };

        return {
            sync(list) {
                items = list.map(({ name, status, src }) => ({ name, status, src }));
                hudKey = '';
                if (state === 'idle') boot();
                else if (state === 'ready') {
                    applyItems();
                    applyView();
                }
            },
            reset() {
                items = [];
                touched = false;
                introduced = false;
                generating = false;
                pos = target = 0;
                hudKey = '';
                if (state === 'ready') {
                    slots.forEach(disposeSlot);
                    slots = [];
                    cancelAnimationFrame(raf);
                    raf = 0;
                    applyView();
                }
            },
        };
    }

    window.EraGallery = { mount };
})();
