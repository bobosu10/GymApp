(function () {
    // ── Estado inicial ──────────────────────────────────────────────
    let treinos = [
        { id: 1, nome: 'TREINO A', desc: 'Peito · Tríceps · Ombro', cor: '#C0392B' },
        { id: 2, nome: 'TREINO B', desc: 'Costas · Bíceps · Abdômen', cor: '#2980B9' },
        { id: 3, nome: 'TREINO C', desc: 'Pernas · Glúteos · Panturrilha', cor: '#27AE60' },
        { id: 4, nome: 'TREINO D', desc: 'Full Body · Funcional', cor: '#8E44AD' },
    ];
 
    let currentIndex = 0;
    let selectedColor = '#C0392B';
    let isAnimating = false;
 
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const indicator = document.getElementById('carouselIndicator');
    const addBtn = document.getElementById('addTreinoBtn');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalCancel = document.getElementById('modalCancel');
    const modalSave = document.getElementById('modalSave');
    const colorPicker = document.getElementById('colorPicker');
 
    // ── Renderizar carrossel ────────────────────────────────────────
    function getPosition(i) {
        const total = treinos.length;
        const rel = ((i - currentIndex) % total + total) % total;
        // rel: 0=center, 1=right, total-1=left, outros=hidden
        if (rel === 0) return 'pos-center';
        if (rel === 1) return 'pos-right';
        if (rel === total - 1) return 'pos-left';
        if (rel > total / 2) return 'pos-hidden-left';
        return 'pos-hidden-right';
    }
 
    // ── Mapa de card DOM nodes (id → element) ──────────────────────
    const cardNodes = new Map();

    function createCard(t, i) {
        const card = document.createElement('div');
        card.className = 'treino-card';
        card.dataset.id = t.id;

        if (t.wallpaper) {
            card.style.background = `linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 60%, transparent 100%), url(${t.wallpaper}) center/cover`;
        } else {
            card.style.background = `linear-gradient(145deg, ${lighten(t.cor, 20)}, ${t.cor})`;
        }

        card.innerHTML = `
            <div class="card-shine"></div>
            <span class="card-number">${String(i + 1).padStart(2, '0')}</span>
            <button class="card-delete" data-id="${t.id}" title="Remover treino">✕</button>
            <label class="card-wallpaper-btn" title="Alterar wallpaper" data-id="${t.id}">
                <span>🖼</span>
                <input type="file" accept="image/*" class="card-wallpaper-input" style="display:none" data-id="${t.id}">
            </label>
            <div class="card-label">${t.nome}</div>
            <div class="card-desc">${t.desc}</div>
        `;

        card.querySelector('.card-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            removeCard(Number(e.currentTarget.dataset.id));
        });

        card.querySelector('.card-wallpaper-input').addEventListener('change', (e) => {
            e.stopPropagation();
            const file = e.target.files[0];
            if (!file) return;
            const id = Number(e.currentTarget.dataset.id);
            const reader = new FileReader();
            reader.onload = (ev) => {
                const tidx = treinos.findIndex(x => x.id === id);
                if (tidx !== -1) { treinos[tidx].wallpaper = ev.target.result; fullRebuild(); }
            };
            reader.readAsDataURL(file);
        });

        return card;
    }

    // Reconstrói tudo do zero (usado só em add/remove)
    function fullRebuild() {
        cardNodes.forEach(node => node.remove());
        cardNodes.clear();
        treinos.forEach((t, i) => {
            const pos = getPosition(i);
            const card = createCard(t, i);
            card.classList.add(pos);
            attachSideClick(card, pos);
            track.appendChild(card);
            cardNodes.set(t.id, card);
        });
        renderDots();
    }

    function attachSideClick(card, pos) {
        // Remove previous listeners by cloning — simpler approach: use dataset flag
        card._clickHandler && card.removeEventListener('click', card._clickHandler);
        if (pos === 'pos-left') {
            card._clickHandler = () => navigate(-1);
            card.addEventListener('click', card._clickHandler);
        } else if (pos === 'pos-right') {
            card._clickHandler = () => navigate(1);
            card.addEventListener('click', card._clickHandler);
        } else {
            card._clickHandler = null;
        }
    }

    // Atualiza só as classes de posição (mantém os nós vivos → CSS transition roda)
    function render() {
        // Se os nós não existem ainda, ou o conjunto mudou, faz rebuild
        const idsInDom = new Set([...cardNodes.keys()]);
        const idsInData = new Set(treinos.map(t => t.id));
        const needsRebuild = idsInDom.size !== idsInData.size ||
            [...idsInData].some(id => !idsInDom.has(id));

        if (needsRebuild) { fullRebuild(); return; }

        treinos.forEach((t, i) => {
            const card = cardNodes.get(t.id);
            const newPos = getPosition(i);
            // Swap position classes
            card.className = `treino-card ${newPos}`;
            attachSideClick(card, newPos);
        });
        renderDots();
    }
 
    function renderDots() {
        indicator.innerHTML = '';
        treinos.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.className = 'dot' + (i === currentIndex ? ' active' : '');
            dot.addEventListener('click', () => goTo(i));
            indicator.appendChild(dot);
        });
    }
 
    // ── Navegação ───────────────────────────────────────────────────
    function navigate(dir) {
        if (isAnimating || treinos.length < 2) return;
        isAnimating = true;
        currentIndex = ((currentIndex + dir) % treinos.length + treinos.length) % treinos.length;
        render();
        setTimeout(() => { isAnimating = false; }, 480);
    }
 
    function goTo(i) {
        if (isAnimating || i === currentIndex) return;
        const dir = ((i - currentIndex + treinos.length) % treinos.length <= treinos.length / 2) ? 1 : -1;
        function step() {
            if (currentIndex === i) return;
            navigate(dir);
            setTimeout(step, 200);
        }
        step();
    }
 
    prevBtn.addEventListener('click', () => navigate(-1));
    nextBtn.addEventListener('click', () => navigate(1));
 
    // Teclado
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') navigate(-1);
        if (e.key === 'ArrowRight') navigate(1);
    });
 
    // ── Remover treino ──────────────────────────────────────────────
    function removeCard(id) {
        if (treinos.length <= 1) return;
        const idx = treinos.findIndex(t => t.id === id);
        treinos.splice(idx, 1);
        if (currentIndex >= treinos.length) currentIndex = treinos.length - 1;
        fullRebuild();
    }
 
    // ── Modal adicionar ─────────────────────────────────────────────
    addBtn.addEventListener('click', () => {
        document.getElementById('inputNome').value = '';
        document.getElementById('inputDesc').value = '';
        modalOverlay.classList.add('open');
    });
 
    modalCancel.addEventListener('click', () => modalOverlay.classList.remove('open'));
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) modalOverlay.classList.remove('open');
    });
 
    // Color picker
    colorPicker.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            colorPicker.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
            dot.classList.add('selected');
            selectedColor = dot.dataset.color;
        });
    });
 
    modalSave.addEventListener('click', () => {
        const nome = document.getElementById('inputNome').value.trim().toUpperCase();
        const desc = document.getElementById('inputDesc').value.trim();
        if (!nome) {
            document.getElementById('inputNome').focus();
            return;
        }
        const newId = Date.now();
        treinos.push({ id: newId, nome, desc: desc || 'Sem descrição', cor: selectedColor });
        currentIndex = treinos.length - 1;
        fullRebuild();
        modalOverlay.classList.remove('open');
    });
 
    // ── Utilitário de cor ───────────────────────────────────────────
    function lighten(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, (num >> 16) + amount);
        const g = Math.min(255, ((num >> 8) & 0xFF) + amount);
        const b = Math.min(255, (num & 0xFF) + amount);
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
 
    // ── Sugestão slideshow ──────────────────────────────────────────
    let sugestaoIndex = 0;
    let sugestaoAuto = null;
    let sugestaoSelected = false;
    let sugestaoDir = 1; // direction of auto-advance

    // Sugestão image data keyed by nome (used when adding to carousel)
    const sugestaoImages = {
        'FREAKY SEASON': '../assets/FreakySeason.png',
        'DINO': '../assets/Dino.png',
        'ALL DAY': '../assets/AllDay.png',
    };

    const slides = document.querySelectorAll('.sugestao-slide');
    const sugestaoDots = document.querySelectorAll('.sugestao-dot');

    function setSugestaoSlide(newIdx, direction) {
        const current = slides[sugestaoIndex];
        const next = slides[newIdx];

        // Carousel-style: slide out current, slide in next
        const outClass = direction > 0 ? 'exit-left' : 'exit-right';
        const inClass  = direction > 0 ? 'enter-right' : 'enter-left';

        current.classList.remove('active', 'selected');
        current.classList.add(outClass);

        next.classList.add(inClass);
        // Force reflow so the enter class is painted before removing it
        next.getBoundingClientRect();
        next.classList.remove(inClass);
        next.classList.add('active');

        setTimeout(() => { current.classList.remove(outClass); }, 550);

        sugestaoDots[sugestaoIndex].classList.remove('active');
        sugestaoIndex = newIdx;
        sugestaoDots[sugestaoIndex].classList.add('active');
        sugestaoSelected = false;
    }

    function goSugestao(idx, direction) {
        if (idx === sugestaoIndex) return;
        setSugestaoSlide(idx, direction);
    }

    function advanceAuto() {
        const next = (sugestaoIndex + 1) % slides.length;
        goSugestao(next, 1);
    }

    function selectSugestao(idx) {
        // If already selected — deselect and resume autoplay
        if (sugestaoSelected && sugestaoIndex === idx) {
            slides[idx].classList.remove('selected');
            sugestaoSelected = false;
            startAutoSlide();
            return;
        }
        // Navigate to that slide if not already there
        if (sugestaoIndex !== idx) {
            const dir = idx > sugestaoIndex ? 1 : -1;
            setSugestaoSlide(idx, dir);
        }
        stopAutoSlide();
        slides[idx].classList.add('selected');
        sugestaoSelected = true;
    }

    function startAutoSlide() {
        stopAutoSlide();
        sugestaoAuto = setInterval(advanceAuto, 3500);
    }

    function stopAutoSlide() {
        clearInterval(sugestaoAuto);
        sugestaoAuto = null;
    }

    slides.forEach((slide, idx) => {
        slide.addEventListener('click', () => selectSugestao(idx));
    });

    sugestaoDots.forEach((dot, idx) => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            const dir = idx > sugestaoIndex ? 1 : -1;
            slides[sugestaoIndex].classList.remove('selected');
            sugestaoSelected = false;
            goSugestao(idx, dir);
            startAutoSlide();
        });
    });

    document.querySelectorAll('.sugestao-add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const nome = btn.dataset.nome;
            const desc = btn.dataset.desc;
            const cor  = btn.dataset.cor;
            const imgSrc = sugestaoImages[nome] || null;

            const already = treinos.find(t => t.nome === nome);
            if (already) {
                btn.textContent = '✓ JÁ ADICIONADO';
                setTimeout(() => { btn.textContent = '+ ADICIONAR AO CARROSSEL'; }, 2000);
                return;
            }

            treinos.push({ id: Date.now(), nome, desc, cor, wallpaper: imgSrc });
            currentIndex = treinos.length - 1;
            fullRebuild();

            // Deselect slide and resume autoplay
            slides[sugestaoIndex].classList.remove('selected');
            sugestaoSelected = false;
            startAutoSlide();

            btn.textContent = '✓ ADICIONADO!';
            setTimeout(() => { btn.textContent = '+ ADICIONAR AO CARROSSEL'; }, 2000);
        });
    });

    startAutoSlide();

    // ── Init ────────────────────────────────────────────────────────
    fullRebuild();
})();

