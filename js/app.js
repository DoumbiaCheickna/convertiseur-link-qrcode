const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const NAV = [
    { title: "Générer", items: [
        { id: "url", icon: "fa-link", label: "Lien URL" },
        { id: "text", icon: "fa-font", label: "Texte" },
        { id: "wifi", icon: "fa-wifi", label: "Wi-Fi" },
        { id: "email", icon: "fa-envelope", label: "Email" },
        { id: "phone", icon: "fa-phone", label: "Téléphone & SMS" },
        { id: "vcard", icon: "fa-id-card", label: "Carte de visite" },
        { id: "geo", icon: "fa-location-dot", label: "Localisation" }
    ]},
    { title: "Décoder", items: [
        { id: "scanner", icon: "fa-camera", label: "Scanner un QR" }
    ]},
    { title: "Gestion", items: [
        { id: "bulk", icon: "fa-layer-group", label: "Conversion en masse" },
        { id: "history", icon: "fa-clock-rotate-left", label: "Historique" }
    ]}
];

const TOOL_META = {
    url: { title: "Lien URL", sub: "Convertissez une adresse web en QR code" },
    text: { title: "Texte", sub: "Transformez n'importe quel texte en QR code" },
    wifi: { title: "Wi-Fi", sub: "Partagez votre réseau en un scan" },
    email: { title: "Email", sub: "Créez un QR code qui prépare un email" },
    phone: { title: "Téléphone & SMS", sub: "Appelez ou envoyez un SMS en un scan" },
    vcard: { title: "Carte de visite", sub: "Vos coordonnées prêtes à être scannées" },
    geo: { title: "Localisation", sub: "Ouvrez une position sur la carte" },
    scanner: { title: "Scanner un QR", sub: "Décodez un QR code à partir d'une image ou de la caméra" },
    bulk: { title: "Conversion en masse", sub: "Générez jusqu'à 300 QR codes en un clic" },
    history: { title: "Historique", sub: "Retrouvez vos conversions récentes" }
};

const TYPE_ICON = {
    url: "fa-link",
    text: "fa-font",
    wifi: "fa-wifi",
    email: "fa-envelope",
    phone: "fa-phone",
    sms: "fa-comment-dots",
    vcard: "fa-id-card",
    geo: "fa-location-dot",
    event: "fa-calendar",
    other: "fa-tag"
};

const TYPE_LABEL = {
    url: "Lien web",
    text: "Texte",
    wifi: "Réseau Wi-Fi",
    email: "Email",
    phone: "Téléphone",
    sms: "SMS",
    vcard: "Carte de visite",
    geo: "Localisation",
    event: "Événement",
    other: "Données"
};

const PRESETS = ["#0f172a", "#6366f1", "#7c3aed", "#dc2626", "#16a34a", "#ea580c", "#0d9488", "#e11d48"];

const state = {
    tool: "url",
    theme: localStorage.getItem("ci-theme") || "light",
    dark: "#0f172a",
    light: "#ffffff",
    ec: "H",
    exportSize: 512,
    preview: null,
    history: JSON.parse(localStorage.getItem("ci-history") || "[]"),
    lastScan: null,
    raf: 0,
    cameraActive: false,
    bulkData: []
};

const FORMS = {
    url: `
        <div class="form-body">
            <div class="field">
                <label for="url-input">Adresse web</label>
                <div class="input-icon">
                    <i class="fa-solid fa-link"></i>
                    <input id="url-input" type="text" placeholder="exemple.com ou https://exemple.com/page" autocomplete="off">
                </div>
                <p class="hint">Le « https:// » est ajouté automatiquement si besoin</p>
            </div>
            <div class="chips">
                <button type="button" class="chip" data-url="https://www.linkedin.com/school/iibs">LinkedIn</button>
                <button type="button" class="chip" data-url="https://wa.me/221774435752">WhatsApp</button>
                <button type="button" class="chip" data-url="https://www.youtube.com">YouTube</button>
                <button type="button" class="chip" data-url="https://maps.google.com">Google Maps</button>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-primary btn-block" id="gen-url"><i class="fa-solid fa-wand-magic-sparkles"></i> Générer le QR code</button>
            </div>
        </div>`,
    text: `
        <div class="form-body">
            <div class="field">
                <label for="text-input">Texte à convertir</label>
                <textarea id="text-input" rows="6" placeholder="Écrivez votre texte, un message, une note…"></textarea>
                <p class="hint" id="text-count">0 caractère</p>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-primary btn-block" id="gen-text"><i class="fa-solid fa-wand-magic-sparkles"></i> Générer le QR code</button>
            </div>
        </div>`,
    wifi: `
        <div class="form-body">
            <div class="field">
                <label for="wifi-ssid">Nom du réseau (SSID)</label>
                <div class="input-icon">
                    <i class="fa-solid fa-wifi"></i>
                    <input id="wifi-ssid" type="text" placeholder="Ex. Freebox-5G-ABCD">
                </div>
            </div>
            <div class="form-grid">
                <div class="field">
                    <label for="wifi-type">Sécurité</label>
                    <select id="wifi-type">
                        <option value="WPA">WPA / WPA2</option>
                        <option value="WEP">WEP</option>
                        <option value="OPEN">Aucune (ouverte)</option>
                    </select>
                </div>
                <div class="field">
                    <label for="wifi-pass">Mot de passe</label>
                    <input id="wifi-pass" type="text" placeholder="••••••••">
                </div>
            </div>
            <label class="check"><input type="checkbox" id="wifi-hidden"><span class="check-box"></span>Réseau caché</label>
            <div class="form-actions">
                <button type="button" class="btn btn-primary btn-block" id="gen-wifi"><i class="fa-solid fa-wand-magic-sparkles"></i> Générer le QR code</button>
            </div>
        </div>`,
    email: `
        <div class="form-body">
            <div class="field">
                <label for="email-to">Destinataire</label>
                <div class="input-icon">
                    <i class="fa-solid fa-envelope"></i>
                    <input id="email-to" type="email" placeholder="contact@exemple.com">
                </div>
            </div>
            <div class="field">
                <label for="email-subject">Objet</label>
                <input id="email-subject" type="text" placeholder="Objet du message">
            </div>
            <div class="field">
                <label for="email-body">Message</label>
                <textarea id="email-body" rows="4" placeholder="Votre message (optionnel)"></textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-primary btn-block" id="gen-email"><i class="fa-solid fa-wand-magic-sparkles"></i> Générer le QR code</button>
            </div>
        </div>`,
    phone: `
        <div class="form-body">
            <div class="field">
                <label>Type de conversion</label>
                <div class="segmented" id="phone-mode">
                    <button type="button" class="seg-btn active" data-mode="call"><i class="fa-solid fa-phone"></i> Appel</button>
                    <button type="button" class="seg-btn" data-mode="sms"><i class="fa-solid fa-comment-dots"></i> SMS</button>
                </div>
            </div>
            <div class="field">
                <label for="phone-number">Numéro</label>
                <div class="input-icon">
                    <i class="fa-solid fa-phone"></i>
                    <input id="phone-number" type="text" placeholder="+221 77 123 45 67">
                </div>
            </div>
            <div class="field" id="phone-msg-group" style="display:none">
                <label for="phone-message">Message SMS</label>
                <textarea id="phone-message" rows="3" placeholder="Votre message (optionnel)"></textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-primary btn-block" id="gen-phone"><i class="fa-solid fa-wand-magic-sparkles"></i> Générer le QR code</button>
            </div>
        </div>`,
    vcard: `
        <div class="form-body">
            <div class="form-grid">
                <div class="field">
                    <label for="vcard-last">Nom</label>
                    <input id="vcard-last" type="text" placeholder="Diop">
                </div>
                <div class="field">
                    <label for="vcard-first">Prénom</label>
                    <input id="vcard-first" type="text" placeholder="Cheikh">
                </div>
            </div>
            <div class="form-grid">
                <div class="field">
                    <label for="vcard-phone">Téléphone</label>
                    <input id="vcard-phone" type="text" placeholder="+221 77 123 45 67">
                </div>
                <div class="field">
                    <label for="vcard-email">Email</label>
                    <input id="vcard-email" type="email" placeholder="cheikh@exemple.com">
                </div>
            </div>
            <div class="form-grid">
                <div class="field">
                    <label for="vcard-org">Entreprise</label>
                    <input id="vcard-org" type="text" placeholder="SoftMali">
                </div>
                <div class="field">
                    <label for="vcard-title">Poste</label>
                    <input id="vcard-title" type="text" placeholder="Directeur">
                </div>
            </div>
            <div class="field">
                <label for="vcard-url">Site web</label>
                <input id="vcard-url" type="text" placeholder="https://exemple.com">
            </div>
            <div class="field">
                <label for="vcard-addr">Adresse</label>
                <input id="vcard-addr" type="text" placeholder="Dakar, Sénégal">
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-primary btn-block" id="gen-vcard"><i class="fa-solid fa-wand-magic-sparkles"></i> Générer le QR code</button>
            </div>
        </div>`,
    geo: `
        <div class="form-body">
            <div class="form-grid">
                <div class="field">
                    <label for="geo-lat">Latitude</label>
                    <input id="geo-lat" type="number" step="any" placeholder="14.7167">
                </div>
                <div class="field">
                    <label for="geo-lng">Longitude</label>
                    <input id="geo-lng" type="number" step="any" placeholder="-17.4677">
                </div>
            </div>
            <div class="field">
                <label for="geo-zoom">Zoom (optionnel)</label>
                <input id="geo-zoom" type="number" min="0" max="20" placeholder="15">
            </div>
            <p class="hint">Format compatible Google Maps et Apple Plans</p>
            <div class="form-actions">
                <button type="button" class="btn btn-primary btn-block" id="gen-geo"><i class="fa-solid fa-wand-magic-sparkles"></i> Générer le QR code</button>
            </div>
        </div>`
};

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function slug(s) {
    return String(s).toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "qr";
}

function fmtDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) +
        " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function toast(msg, type = "info") {
    const icon = type === "success" ? "fa-circle-check" : type === "error" ? "fa-circle-exclamation" : "fa-circle-info";
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fa-solid ${icon}"></i><span>${escapeHtml(msg)}</span>`;
    $("#toastWrap").appendChild(el);
    setTimeout(() => {
        el.classList.add("out");
        setTimeout(() => el.remove(), 350);
    }, 3200);
}

function downloadBlob(blob, name) {
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 1500);
}

function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).then(
            () => toast("Contenu copié dans le presse-papier", "success"),
            () => fallbackCopy(text)
        );
    }
    fallbackCopy(text);
    return Promise.resolve();
}

function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand("copy");
        toast("Contenu copié dans le presse-papier", "success");
    } catch {
        toast("Impossible de copier", "error");
    }
    ta.remove();
}

function debounce(fn, ms) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

function detectType(data) {
    if (/^https?:\/\//i.test(data)) return { type: "url", label: "Lien web" };
    if (/^WIFI:/i.test(data)) return { type: "wifi", label: "Réseau Wi-Fi" };
    if (/^mailto:/i.test(data)) return { type: "email", label: "Email" };
    if (/^tel:/i.test(data)) return { type: "phone", label: "Téléphone" };
    if (/^sms(to)?:/i.test(data)) return { type: "sms", label: "SMS" };
    if (/^geo:/i.test(data)) return { type: "geo", label: "Localisation" };
    if (/^MECARD:/i.test(data)) return { type: "vcard", label: "Carte de visite" };
    if (/^BEGIN:VCARD/i.test(data)) return { type: "vcard", label: "Carte de visite" };
    if (/^BEGIN:VEVENT/i.test(data)) return { type: "event", label: "Événement" };
    return { type: "text", label: "Texte" };
}

/* --- Theme --- */
function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    state.theme = theme;
    localStorage.setItem("ci-theme", theme);
    $("#themeBtn i").className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
}

/* --- Sidebar / navigation --- */
function renderNav() {
    $("#sidebarNav").innerHTML = NAV.map(g => `
        <div class="nav-group">${g.title}</div>
        ${g.items.map(it => `
            <button class="nav-item" data-tool="${it.id}">
                <i class="fa-solid ${it.icon}"></i>
                <span>${it.label}</span>
            </button>`).join("")}
    `).join("");
    $$("#sidebarNav .nav-item").forEach(btn => {
        btn.addEventListener("click", () => applyTool(btn.dataset.tool));
    });
}

function closeSidebar() {
    $("#sidebar").classList.remove("open");
    $("#sidebarBackdrop").classList.remove("show");
}

function applyTool(id) {
    state.tool = id;
    $$("#sidebarNav .nav-item").forEach(b => b.classList.toggle("active", b.dataset.tool === id));
    $("#topTitle").textContent = TOOL_META[id].title;
    $("#topSubtitle").textContent = TOOL_META[id].sub;
    document.title = `${TOOL_META[id].title} — ConvertIQ`;

    const genIds = NAV[0].items.map(i => i.id);
    const isGen = genIds.includes(id);

    $("#genLayout").style.display = isGen ? "grid" : "none";
    $("#tool-scanner").style.display = id === "scanner" ? "block" : "none";
    $("#tool-bulk").style.display = id === "bulk" ? "block" : "none";
    $("#tool-history").style.display = id === "history" ? "block" : "none";

    closeSidebar();

    if (id === "history") {
        renderHistory();
    }
    if (isGen) {
        setPreviewEmpty();
        renderForm(id);
    }

    const panel = isGen ? $("#genLayout") : $("#tool-" + id);
    panel.classList.remove("anim");
    void panel.offsetWidth;
    panel.classList.add("anim");
}

function setPreviewEmpty() {
    state.preview = null;
    $("#previewBody").style.display = "none";
    $("#previewEmpty").style.display = "flex";
    $("#previewType").style.display = "none";
}

/* --- Forms --- */
function renderForm(tool) {
    $("#formCard").innerHTML = FORMS[tool];
    wireForm(tool);
}

function wireForm(tool) {
    const genBtn = $("#gen-" + tool);
    if (genBtn) genBtn.addEventListener("click", () => tryGenerate(false));

    if (tool === "url") {
        $$(".chip").forEach(c => c.addEventListener("click", () => {
            $("#url-input").value = c.dataset.url;
            tryGenerate(false);
        }));
    }

    if (tool === "text") {
        $("#text-input").addEventListener("input", e => {
            const n = e.target.value.length;
            $("#text-count").textContent = n + (n > 1 ? " caractères" : " caractère");
        });
    }

    if (tool === "phone") {
        $$("#phone-mode .seg-btn").forEach(b => b.addEventListener("click", () => {
            $$("#phone-mode .seg-btn").forEach(x => x.classList.remove("active"));
            b.classList.add("active");
            $("#phone-msg-group").style.display = b.dataset.mode === "sms" ? "block" : "none";
            tryGenerate(true);
        }));
    }

    $$("#formCard input, #formCard select, #formCard textarea").forEach(el => {
        el.addEventListener("input", liveGenerate);
    });
}

const liveGenerate = debounce(() => tryGenerate(true), 350);

function tryGenerate(silent) {
    try {
        const p = buildPayload(state.tool);
        renderPreview(p);
        if (!silent) {
            addHistory({ tool: state.tool, type: p.type, label: p.label, data: p.data, snippet: p.snippet });
        }
    } catch (err) {
        if (!silent) toast(err.message, "error");
    }
}

/* --- Payload builders --- */
function buildPayload(tool) {
    switch (tool) {
        case "url": return buildUrl();
        case "text": return buildText();
        case "wifi": return buildWifi();
        case "email": return buildEmail();
        case "phone": return buildPhone();
        case "vcard": return buildVcard();
        case "geo": return buildGeo();
        default: throw new Error("Outil inconnu");
    }
}

function buildUrl() {
    let raw = $("#url-input").value.trim();
    if (!raw) throw new Error("Entrez une adresse web");
    let url = raw;
    if (!/^https?:\/\//i.test(url)) {
        if (/\s/.test(url)) throw new Error("Cette adresse semble invalide");
        url = "https://" + url;
        toast("https:// ajouté automatiquement", "info");
    }
    try {
        new URL(url);
    } catch {
        throw new Error("Adresse web invalide");
    }
    return { data: url, type: "url", label: "Lien URL", snippet: url };
}

function buildText() {
    const text = $("#text-input").value.trim();
    if (!text) throw new Error("Écrivez un texte à convertir");
    return { data: text, type: "text", label: "Texte", snippet: text.length > 80 ? text.slice(0, 80) + "…" : text };
}

function buildWifi() {
    const ssid = $("#wifi-ssid").value.trim();
    if (!ssid) throw new Error("Entrez le nom du réseau (SSID)");
    const type = $("#wifi-type").value;
    const pass = $("#wifi-pass").value;
    const hidden = $("#wifi-hidden").checked;
    let data = "WIFI:T:" + type + ";S:" + ssid + ";";
    if (type !== "OPEN") data += "P:" + pass + ";";
    if (hidden) data += "H:true;";
    data += ";";
    return { data: data, type: "wifi", label: "Réseau Wi-Fi", snippet: ssid };
}

function buildEmail() {
    const to = $("#email-to").value.trim();
    if (!to) throw new Error("Entrez l'adresse du destinataire");
    const subject = $("#email-subject").value.trim();
    const body = $("#email-body").value.trim();
    let data = "mailto:" + to;
    const params = [];
    if (subject) params.push("subject=" + encodeURIComponent(subject));
    if (body) params.push("body=" + encodeURIComponent(body));
    if (params.length) data += "?" + params.join("&");
    return { data: data, type: "email", label: "Email", snippet: to };
}

function buildPhone() {
    const mode = $(".seg-btn.active", $("#phone-mode")).dataset.mode;
    const num = $("#phone-number").value.trim().replace(/\s/g, "");
    if (!num) throw new Error("Entrez un numéro de téléphone");
    if (!/^\+?\d[\d()-]*$/.test(num)) throw new Error("Numéro de téléphone invalide");
    if (mode === "sms") {
        const msg = $("#phone-message").value.trim();
        return { data: "smsto:" + num + ":" + msg, type: "sms", label: "SMS", snippet: num };
    }
    return { data: "tel:" + num, type: "phone", label: "Téléphone", snippet: num };
}

function buildVcard() {
    const last = $("#vcard-last").value.trim();
    const first = $("#vcard-first").value.trim();
    const fields = [];
    if (last || first) {
        fields.push("N:" + last + "," + first);
    } else {
        throw new Error("Entrez au moins le nom ou le prénom");
    }
    const org = $("#vcard-org").value.trim();
    if (org) fields.push("ORG:" + org);
    const title = $("#vcard-title").value.trim();
    if (title) fields.push("TITLE:" + title);
    const tel = $("#vcard-phone").value.trim().replace(/\s/g, "");
    if (tel) fields.push("TEL:" + tel);
    const email = $("#vcard-email").value.trim();
    if (email) fields.push("EMAIL:" + email);
    const url = $("#vcard-url").value.trim();
    if (url) fields.push("URL:" + url);
    const addr = $("#vcard-addr").value.trim();
    if (addr) fields.push("ADR:" + addr);
    const data = "MECARD:" + fields.join(";") + ";;";
    return { data: data, type: "vcard", label: "Carte de visite", snippet: (first || "") + " " + (last || "") };
}

function buildGeo() {
    const lat = parseFloat($("#geo-lat").value);
    const lng = parseFloat($("#geo-lng").value);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error("Coordonnées invalides (lat : -90 à 90, lng : -180 à 180)");
    }
    let data = "geo:" + lat + "," + lng;
    const zoom = parseInt($("#geo-zoom").value, 10);
    if (!isNaN(zoom) && zoom >= 0 && zoom <= 20) data += "?z=" + zoom;
    return { data: data, type: "geo", label: "Localisation", snippet: lat + ", " + lng };
}

/* --- Preview --- */
function drawQR(canvas, text, size, cb) {
    QRCode.toCanvas(canvas, text, {
        width: size,
        margin: 1,
        errorCorrectionLevel: state.ec,
        color: { dark: state.dark, light: state.light }
    }, cb);
}

function renderPreview(p) {
    state.preview = p;
    $("#previewEmpty").style.display = "none";
    $("#previewBody").style.display = "flex";
    const typeBadge = $("#previewType");
    const t = detectType(p.data);
    typeBadge.style.display = "inline-flex";
    typeBadge.innerHTML = `<i class="fa-solid ${TYPE_ICON[t.type]}"></i> ${TYPE_LABEL[t.type]}`;

    const frame = $("#qrFrame");
    frame.classList.remove("gen");
    void frame.offsetWidth;
    frame.classList.add("gen");

    $("#previewMeta").innerHTML = `<strong>${escapeHtml(p.label)}</strong><span>${escapeHtml(p.snippet)}</span>`;
    drawQR($("#qrCanvas"), p.data, 480, err => {
        if (err) toast("Erreur lors de la génération", "error");
    });
}

function requirePreview() {
    if (!state.preview) {
        toast("Générez d'abord un QR code", "error");
        return null;
    }
    return state.preview;
}

function exportPNG() {
    const p = requirePreview();
    if (!p) return;
    const c = document.createElement("canvas");
    QRCode.toCanvas(c, p.data, {
        width: state.exportSize,
        margin: 2,
        errorCorrectionLevel: state.ec,
        color: { dark: state.dark, light: state.light }
    }, err => {
        if (err) return toast("Erreur d'export", "error");
        const a = document.createElement("a");
        a.download = slug(p.label) + "-qr.png";
        a.href = c.toDataURL("image/png");
        a.click();
        toast("Image PNG téléchargée", "success");
    });
}

function exportSVG() {
    const p = requirePreview();
    if (!p) return;
    QRCode.toString(p.data, {
        type: "svg",
        width: state.exportSize,
        margin: 2,
        errorCorrectionLevel: state.ec,
        color: { dark: state.dark, light: state.light }
    }, (err, svg) => {
        if (err) return toast("Erreur d'export", "error");
        downloadBlob(new Blob([svg], { type: "image/svg+xml" }), slug(p.label) + "-qr.svg");
        toast("Image SVG téléchargée", "success");
    });
}

function copyQR() {
    const p = requirePreview();
    if (!p) return;
    const c = document.createElement("canvas");
    QRCode.toCanvas(c, p.data, {
        width: 512,
        margin: 1,
        errorCorrectionLevel: state.ec,
        color: { dark: state.dark, light: state.light }
    }, err => {
        if (err) return toast("Erreur lors de la copie", "error");
        c.toBlob(blob => {
            if (navigator.clipboard && navigator.clipboard.write && blob) {
                navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
                    .then(() => toast("QR code copié en image", "success"))
                    .catch(() => copyText(p.data));
            } else {
                copyText(p.data);
            }
        });
    });
}

async function shareQR() {
    const p = requirePreview();
    if (!p) return;
    try {
        const c = document.createElement("canvas");
        QRCode.toCanvas(c, p.data, {
            width: 1024,
            margin: 1,
            errorCorrectionLevel: state.ec,
            color: { dark: state.dark, light: state.light }
        }, err => {
            if (err) return toast("Erreur lors du partage", "error");
            c.toBlob(async blob => {
                try {
                    const file = new File([blob], "qrcode.png", { type: "image/png" });
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({ files: [file], title: p.label, text: p.snippet });
                    } else {
                        await navigator.share({ title: p.label, text: p.snippet });
                    }
                } catch (e) {
                    if (e.name !== "AbortError") toast("Partage indisponible sur ce navigateur", "error");
                }
            });
        });
    } catch (e) {
        if (e.name !== "AbortError") toast("Partage indisponible", "error");
    }
}

/* --- History --- */
function saveHistory() {
    localStorage.setItem("ci-history", JSON.stringify(state.history));
}

function addHistory(entry) {
    state.history.unshift({
        ...entry,
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        date: Date.now()
    });
    if (state.history.length > 60) state.history.length = 60;
    saveHistory();
}

function renderHistory() {
    const list = $("#historyList");
    const empty = $("#historyEmpty");
    const clear = $("#historyClear");
    if (!state.history.length) {
        list.innerHTML = "";
        empty.style.display = "block";
        clear.style.display = "none";
        return;
    }
    empty.style.display = "none";
    clear.style.display = "inline-flex";
    list.innerHTML = state.history.map(h => `
        <div class="history-item">
            <div class="history-icon"><i class="fa-solid ${TYPE_ICON[h.type] || "fa-tag"}"></i></div>
            <div class="history-body">
                <h4>${escapeHtml(h.label)}
                    <span class="history-date">${fmtDate(h.date)}</span>
                </h4>
                <p>${escapeHtml(h.snippet)}</p>
            </div>
            <div class="history-actions">
                <button class="btn btn-ghost btn-sm" data-open="${h.id}"><i class="fa-solid fa-eye"></i></button>
                <button class="btn btn-danger-ghost btn-sm" data-del="${h.id}"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        </div>`).join("");
    $$(".history-item [data-open]", list).forEach(b => b.addEventListener("click", () => {
        openHistoryItem(state.history.find(h => h.id === b.dataset.open));
    }));
    $$(".history-item [data-del]", list).forEach(b => b.addEventListener("click", () => {
        deleteHistory(b.dataset.del);
    }));
}

function deleteHistory(id) {
    state.history = state.history.filter(h => h.id !== id);
    saveHistory();
    renderHistory();
}

let clearArmed = false;
function clearHistory() {
    if (!clearArmed) {
        clearArmed = true;
        const btn = $("#historyClear");
        btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Confirmer l\'effacement ?';
        setTimeout(() => {
            clearArmed = false;
            btn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Tout effacer';
        }, 3000);
        return;
    }
    clearArmed = false;
    state.history = [];
    saveHistory();
    renderHistory();
    toast("Historique effacé", "success");
}

function openHistoryItem(h) {
    if (!h) return;
    const t = detectType(h.data);
    const reusable = ["url", "text"].includes(h.type);
    const modalBody = $("#modalBody");
    modalBody.innerHTML = `
        <div class="modal-type-row">
            <span class="badge-pill"><i class="fa-solid ${TYPE_ICON[h.type] || "fa-tag"}"></i> ${TYPE_LABEL[h.type] || "Données"}</span>
            <span class="history-date">${fmtDate(h.date)}</span>
        </div>
        <h3 class="modal-title">${escapeHtml(h.label)}</h3>
        <div class="qr-frame modal-qr"><canvas width="440" height="440"></canvas></div>
        <div class="modal-data"><pre>${escapeHtml(h.data)}</pre></div>
        <div class="modal-actions">
            <button class="btn btn-ghost btn-sm" id="mCopy"><i class="fa-solid fa-copy"></i> Copier</button>
            ${reusable ? '<button class="btn btn-ghost btn-sm" id="mUse"><i class="fa-solid fa-arrow-right-arrow-left"></i> Réutiliser</button>' : ""}
            <button class="btn btn-primary btn-sm" id="mPng"><i class="fa-solid fa-download"></i> PNG</button>
            <button class="btn btn-danger-ghost btn-sm" id="mDel"><i class="fa-solid fa-trash-can"></i> Supprimer</button>
        </div>`;
    openModal();
    drawQR($(".modal-qr canvas", modalBody), h.data, 440, () => {});
    $("#mCopy").addEventListener("click", () => copyText(h.data));
    $("#mPng").addEventListener("click", () => {
        const c = document.createElement("canvas");
        QRCode.toCanvas(c, h.data, {
            width: 1024,
            margin: 2,
            errorCorrectionLevel: "H",
            color: { dark: state.dark, light: state.light }
        }, err => {
            if (err) return toast("Erreur d'export", "error");
            const a = document.createElement("a");
            a.download = slug(h.label) + "-qr.png";
            a.href = c.toDataURL("image/png");
            a.click();
            toast("Image PNG téléchargée", "success");
        });
    });
    const use = $("#mUse");
    if (use) use.addEventListener("click", () => { closeModal(); reuseData(h); });
    $("#mDel").addEventListener("click", () => {
        deleteHistory(h.id);
        closeModal();
        toast("Conversion supprimée", "info");
    });
}

function reuseData(entry) {
    const t = detectType(entry.data);
    if (t.type === "url" || entry.type === "url") {
        applyTool("url");
        $("#url-input").value = entry.data;
        tryGenerate(false);
    } else if (entry.type === "text" || t.type === "text") {
        applyTool("text");
        $("#text-input").value = entry.data;
        tryGenerate(false);
    }
}

/* --- Modal --- */
function openModal() {
    $("#modalBackdrop").classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeModal() {
    $("#modalBackdrop").classList.remove("open");
    document.body.style.overflow = "";
}

/* --- Scanner --- */
let scanBuffer = null;
function ensureBuffer() {
    if (!scanBuffer) {
        scanBuffer = document.createElement("canvas");
        scanBuffer.style.display = "none";
        document.body.appendChild(scanBuffer);
    }
    return scanBuffer;
}

function switchScanTab(mode) {
    $$("#scanTabs .tab").forEach(t => t.classList.toggle("active", t.dataset.mode === mode));
    $("#camZone").style.display = mode === "camera" ? "block" : "none";
    $("#imgZone").style.display = mode === "camera" ? "none" : "block";
    if (mode !== "camera") stopCamera();
}

function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } })
        .then(stream => {
            const video = $("#camVideo");
            video.srcObject = stream;
            state.cameraActive = true;
            video.play();
            $("#camStart").disabled = true;
            scanLoop();
            toast("Caméra active — scannez votre QR code", "info");
        })
        .catch(() => toast("Caméra indisponible. Utilisez le mode Image.", "error"));
}

function stopCamera() {
    state.cameraActive = false;
    cancelAnimationFrame(state.raf);
    const video = $("#camVideo");
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(t => t.stop());
    }
    video.srcObject = null;
    $("#camStart").disabled = false;
}

function scanLoop() {
    if (!state.cameraActive) return;
    const video = $("#camVideo");
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = ensureBuffer();
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(video, 0, 0);
        try {
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
            if (code && code.data) {
                stopCamera();
                fillScanResult(code.data);
                return;
            }
        } catch (e) {}
    }
    state.raf = requestAnimationFrame(scanLoop);
}

function decodeImageData(imgData) {
    try {
        return jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: "attemptBoth" });
    } catch (e) {
        return null;
    }
}

function decodeFile(file) {
    const drop = $("#scanDrop");
    const orig = drop.innerHTML;
    drop.style.pointerEvents = "none";
    drop.innerHTML = `<i class="fa-solid fa-magnifying-glass spin" style="animation:spin 1s linear infinite"></i><p><strong>Analyse de l'image…</strong></p><span>Détection du QR code en cours</span>`;
    const img = new Image();
    img.onload = () => {
        const max = 1440;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = ensureBuffer();
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = decodeImageData(imgData);
        if (code && code.data) {
            fillScanResult(code.data);
            toast("QR code détecté", "success");
        } else {
            toast("Aucun QR code détecté dans cette image", "error");
        }
        drop.innerHTML = orig;
        drop.style.pointerEvents = "";
    };
    img.onerror = () => {
        drop.innerHTML = orig;
        drop.style.pointerEvents = "";
        toast("Impossible de lire cette image", "error");
    };
    img.src = URL.createObjectURL(file);
}

function fillScanResult(data) {
    const m = detectType(data);
    $("#scanData").textContent = data;
    $("#scanType").innerHTML = `<i class="fa-solid ${TYPE_ICON[m.type]}"></i> ${m.label}`;
    $("#scanDate").textContent = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    $("#scanOpen").style.display = m.type === "url" ? "inline-flex" : "none";
    $("#scanUse").style.display = ["url", "text"].includes(m.type) ? "inline-flex" : "none";
    $("#scanResult").classList.add("show");
    state.lastScan = { data: data, type: m.type, label: m.label };
    $("#scanResult").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function handlePaste(e) {
    const items = (e.clipboardData && e.clipboardData.items) || [];
    for (const item of items) {
        if (item.type && item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
                switchScanTab("image");
                decodeFile(file);
                break;
            }
        }
    }
}

/* --- Bulk --- */
function runBulk() {
    const raw = $("#bulkText").value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (!raw.length) return toast("Ajoutez au moins un lien", "error");
    if (raw.length > 300) return toast("Maximum 300 éléments par lot", "error");
    const scheme = $("#bulkScheme").checked;
    const items = raw.map(r => (!scheme || /^https?:\/\//i.test(r)) ? r : "https://" + r);

    state.bulkData = [];
    const progress = $("#bulkProgress");
    const results = $("#bulkResults");
    results.innerHTML = "";
    progress.style.display = "flex";
    progress.innerHTML = `<i class="fa-solid fa-gear spin"></i> Génération en cours…`;

    let done = 0;
    items.forEach((d, i) => {
        QRCode.toDataURL(d, {
            width: 320,
            margin: 1,
            errorCorrectionLevel: "M",
            color: { dark: "#0f172a", light: "#ffffff" }
        }, (err, url) => {
            if (err) {
                state.bulkData[i] = null;
            } else {
                state.bulkData[i] = url;
                appendBulkItem(i, d, url);
            }
            done++;
            progress.innerHTML = `<i class="fa-solid fa-gear spin"></i> Générés : ${done}/${items.length}`;
            if (done === items.length) {
                progress.style.display = "none";
                $("#bulkZipWrap").style.display = state.bulkData.some(Boolean) ? "flex" : "none";
                toast(`${items.length} QR codes générés`, "success");
            }
        });
    });
}

function appendBulkItem(i, data, dataURL) {
    const item = document.createElement("div");
    item.className = "bulk-item";
    item.innerHTML = `
        <img src="${dataURL}" alt="QR code ${i + 1}">
        <p title="${escapeHtml(data)}">${escapeHtml(data)}</p>
        <a class="btn btn-ghost btn-sm" href="${dataURL}" download="qr-${i + 1}.png"><i class="fa-solid fa-download"></i> PNG</a>`;
    $("#bulkResults").appendChild(item);
}

function zipBulk() {
    const items = state.bulkData.filter(Boolean);
    if (!items.length) return toast("Aucun QR code à télécharger", "error");
    const zip = new JSZip();
    items.forEach((u, i) => {
        zip.file(`qr-${i + 1}.png`, u.split(",")[1], { base64: true });
    });
    zip.generateAsync({ type: "blob" }).then(blob => {
        downloadBlob(blob, "qrcodes-" + Date.now() + ".zip");
        toast("Archive ZIP téléchargée", "success");
    });
}

/* --- Appearance wiring --- */
function renderPresets() {
    $("#presets").innerHTML = PRESETS.map(c => `
        <div class="preset-swatch" data-c="${c}" style="background:${c}"></div>`).join("");
    $$("#presets .preset-swatch").forEach(s => {
        s.classList.toggle("active", s.dataset.c.toLowerCase() === state.dark.toLowerCase());
        s.addEventListener("click", () => {
            state.dark = s.dataset.c;
            $("#appear-dark").value = state.dark;
            $$("#presets .preset-swatch").forEach(x => x.classList.toggle("active", x === s));
            if (state.preview) renderPreview(state.preview);
        });
    });
}

/* --- Init --- */
function init() {
    applyTheme(state.theme);
    renderNav();
    renderPresets();
    renderHistory();
    applyTool("url");

    $("#menuBtn").addEventListener("click", () => {
        $("#sidebar").classList.add("open");
        $("#sidebarBackdrop").classList.add("show");
    });
    $("#sidebarBackdrop").addEventListener("click", closeSidebar);
    $("#themeBtn").addEventListener("click", () => applyTheme(state.theme === "dark" ? "light" : "dark"));

    $("#appear-size").addEventListener("change", e => {
        state.exportSize = parseInt(e.target.value, 10);
        if (state.preview) renderPreview(state.preview);
    });
    $("#appear-ec").addEventListener("change", e => {
        state.ec = e.target.value;
        if (state.preview) renderPreview(state.preview);
    });
    $("#appear-dark").addEventListener("change", e => {
        state.dark = e.target.value;
        $$("#presets .preset-swatch").forEach(x => x.classList.toggle("active", x.dataset.c.toLowerCase() === state.dark.toLowerCase()));
        if (state.preview) renderPreview(state.preview);
    });
    $("#appear-light").addEventListener("change", e => {
        state.light = e.target.value;
        if (state.preview) renderPreview(state.preview);
    });

    $("#btnPng").addEventListener("click", exportPNG);
    $("#btnSvg").addEventListener("click", exportSVG);
    $("#btnCopy").addEventListener("click", copyQR);
    $("#btnShare").addEventListener("click", shareQR);

    $("#historyClear").addEventListener("click", clearHistory);

    $$("#scanTabs .tab").forEach(t => t.addEventListener("click", () => switchScanTab(t.dataset.mode)));
    $("#camStart").addEventListener("click", startCamera);
    $("#camStop").addEventListener("click", () => {
        stopCamera();
        toast("Caméra arrêtée", "info");
    });
    const drop = $("#scanDrop");
    drop.addEventListener("click", () => $("#scanFile").click());
    $("#scanFile").addEventListener("change", e => {
        if (e.target.files.length) decodeFile(e.target.files[0]);
        e.target.value = "";
    });
    drop.addEventListener("dragover", e => {
        e.preventDefault();
        drop.classList.add("drag");
    });
    drop.addEventListener("dragleave", () => drop.classList.remove("drag"));
    drop.addEventListener("drop", e => {
        e.preventDefault();
        drop.classList.remove("drag");
        if (e.dataTransfer.files.length) decodeFile(e.dataTransfer.files[0]);
    });
    $("#scanCopy").addEventListener("click", () => {
        if (state.lastScan) copyText(state.lastScan.data);
    });
    $("#scanOpen").addEventListener("click", () => {
        if (state.lastScan && state.lastScan.type === "url") {
            window.open(state.lastScan.data, "_blank", "noopener,noreferrer");
        }
    });
    $("#scanUse").addEventListener("click", () => {
        if (state.lastScan) reuseData(state.lastScan);
    });
    $("#scanSave").addEventListener("click", () => {
        if (!state.lastScan) return toast("Scannez d'abord un QR code", "error");
        addHistory({
            tool: "scanner",
            type: state.lastScan.type,
            label: TYPE_LABEL[state.lastScan.type] || "Données",
            data: state.lastScan.data,
            snippet: state.lastScan.data.length > 80 ? state.lastScan.data.slice(0, 80) + "…" : state.lastScan.data
        });
        toast("Ajouté à l'historique", "success");
    });

    $("#bulkFileBtn").addEventListener("click", () => $("#bulkFile").click());
    $("#bulkFile").addEventListener("change", e => {
        const f = e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
            $("#bulkText").value = reader.result;
            toast("Fichier importé", "success");
        };
        reader.readAsText(f);
        e.target.value = "";
    });
    $("#bulkRun").addEventListener("click", runBulk);
    $("#bulkZip").addEventListener("click", zipBulk);

    $("#modalClose").addEventListener("click", closeModal);
    $("#modalBackdrop").addEventListener("click", e => {
        if (e.target === $("#modalBackdrop")) closeModal();
    });
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            closeModal();
            closeSidebar();
        }
    });
    document.addEventListener("paste", handlePaste);

    $("#url-input").value = "https://soft-mali-ml.onrender.com";
    tryGenerate(true);
}

document.addEventListener("DOMContentLoaded", init);
