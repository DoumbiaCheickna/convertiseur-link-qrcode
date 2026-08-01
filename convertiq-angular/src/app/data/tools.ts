import { QrBuildResult, ToolConfig, ToolGroup } from '../models/tool.model';

function buildUrl(v: Record<string, unknown>): QrBuildResult {
  let raw = String(v['input'] ?? '').trim();
  if (!raw) throw new Error('Entrez une adresse web');
  let url = raw;
  let notice: string | undefined;
  if (!/^https?:\/\//i.test(url)) {
    if (/\s/.test(url)) throw new Error('Cette adresse semble invalide');
    url = 'https://' + url;
    notice = 'https:// ajouté automatiquement';
  }
  try {
    new URL(url);
  } catch {
    throw new Error('Adresse web invalide');
  }
  return { data: url, label: 'Lien URL', snippet: url, notice };
}

function buildText(v: Record<string, unknown>): QrBuildResult {
  const text = String(v['input'] ?? '').trim();
  if (!text) throw new Error('Écrivez un texte à convertir');
  const snippet = text.length > 80 ? text.slice(0, 80) + '…' : text;
  return { data: text, label: 'Texte', snippet };
}

function buildWifi(v: Record<string, unknown>): QrBuildResult {
  const ssid = String(v['ssid'] ?? '').trim();
  if (!ssid) throw new Error('Entrez le nom du réseau (SSID)');
  const type = String(v['type'] ?? 'WPA');
  const pass = String(v['pass'] ?? '');
  const hidden = Boolean(v['hidden']);
  let data = `WIFI:T:${type};S:${ssid};`;
  if (type !== 'OPEN') data += `P:${pass};`;
  if (hidden) data += 'H:true;';
  data += ';';
  return { data, label: 'Réseau Wi-Fi', snippet: ssid };
}

function buildEmail(v: Record<string, unknown>): QrBuildResult {
  const to = String(v['to'] ?? '').trim();
  if (!to) throw new Error("Entrez l'adresse du destinataire");
  const subject = String(v['subject'] ?? '').trim();
  const body = String(v['body'] ?? '').trim();
  let data = 'mailto:' + to;
  const params: string[] = [];
  if (subject) params.push('subject=' + encodeURIComponent(subject));
  if (body) params.push('body=' + encodeURIComponent(body));
  if (params.length) data += '?' + params.join('&');
  return { data, label: 'Email', snippet: to };
}

function buildPhone(v: Record<string, unknown>): QrBuildResult {
  const mode = String(v['mode'] ?? 'call');
  const num = String(v['number'] ?? '').trim().replace(/\s/g, '');
  if (!num) throw new Error('Entrez un numéro de téléphone');
  if (!/^\+?\d[\d()-]*$/.test(num)) throw new Error('Numéro de téléphone invalide');
  if (mode === 'sms') {
    const msg = String(v['message'] ?? '').trim();
    return { data: `smsto:${num}:${msg}`, label: 'SMS', snippet: num };
  }
  return { data: `tel:${num}`, label: 'Téléphone', snippet: num };
}

function buildVcard(v: Record<string, unknown>): QrBuildResult {
  const last = String(v['last'] ?? '').trim();
  const first = String(v['first'] ?? '').trim();
  if (!last && !first) throw new Error('Entrez au moins le nom ou le prénom');
  const fields: string[] = [`N:${last},${first}`];
  const org = String(v['org'] ?? '').trim();
  if (org) fields.push(`ORG:${org}`);
  const title = String(v['title'] ?? '').trim();
  if (title) fields.push(`TITLE:${title}`);
  const tel = String(v['phone'] ?? '').trim().replace(/\s/g, '');
  if (tel) fields.push(`TEL:${tel}`);
  const email = String(v['email'] ?? '').trim();
  if (email) fields.push(`EMAIL:${email}`);
  const url = String(v['url'] ?? '').trim();
  if (url) fields.push(`URL:${url}`);
  const addr = String(v['addr'] ?? '').trim();
  if (addr) fields.push(`ADR:${addr}`);
  return { data: `MECARD:${fields.join(';')};;`, label: 'Carte de visite', snippet: `${first} ${last}`.trim() };
}

function buildGeo(v: Record<string, unknown>): QrBuildResult {
  const lat = Number(v['lat']);
  const lng = Number(v['lng']);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error('Coordonnées invalides (lat : -90 à 90, lng : -180 à 180)');
  }
  let data = `geo:${lat},${lng}`;
  const zoom = Number(v['zoom']);
  if (Number.isFinite(zoom) && zoom >= 0 && zoom <= 20) data += `?z=${zoom}`;
  return { data, label: 'Localisation', snippet: `${lat}, ${lng}` };
}

export const TOOLS: Record<string, ToolConfig> = {
  url: {
    id: 'url',
    title: 'Lien URL',
    sub: 'Convertissez une adresse web en QR code',
    icon: 'fa-link',
    fields: [
      {
        key: 'input',
        type: 'text',
        label: 'Adresse web',
        icon: 'fa-link',
        placeholder: 'exemple.com ou https://exemple.com/page',
        hint: 'Le « https:// » est ajouté automatiquement si besoin',
      },
      {
        key: 'chips',
        type: 'chips',
        options: [
          { value: 'https://www.linkedin.com/school/iibs', label: 'LinkedIn' },
          { value: 'https://wa.me/221774435752', label: 'WhatsApp' },
          { value: 'https://www.youtube.com', label: 'YouTube' },
          { value: 'https://maps.google.com', label: 'Google Maps' },
        ],
      },
    ],
    build: buildUrl,
  },
  text: {
    id: 'text',
    title: 'Texte',
    sub: "Transformez n'importe quel texte en QR code",
    icon: 'fa-font',
    fields: [
      {
        key: 'input',
        type: 'textarea',
        label: 'Texte à convertir',
        rows: 6,
        placeholder: 'Écrivez votre texte, un message, une note…',
        counter: true,
      },
    ],
    build: buildText,
  },
  wifi: {
    id: 'wifi',
    title: 'Wi-Fi',
    sub: 'Partagez votre réseau en un scan',
    icon: 'fa-wifi',
    fields: [
      { key: 'ssid', type: 'text', label: 'Nom du réseau (SSID)', icon: 'fa-wifi', placeholder: 'Ex. Freebox-5G-ABCD' },
      {
        key: 'type',
        type: 'select',
        label: 'Sécurité',
        defaultValue: 'WPA',
        options: [
          { value: 'WPA', label: 'WPA / WPA2' },
          { value: 'WEP', label: 'WEP' },
          { value: 'OPEN', label: 'Aucune (ouverte)' },
        ],
      },
      { key: 'pass', type: 'text', label: 'Mot de passe', placeholder: '••••••••' },
      { key: 'hidden', type: 'checkbox', label: 'Réseau caché', defaultValue: false },
    ],
    build: buildWifi,
  },
  email: {
    id: 'email',
    title: 'Email',
    sub: 'Créez un QR code qui prépare un email',
    icon: 'fa-envelope',
    fields: [
      { key: 'to', type: 'text', label: 'Destinataire', icon: 'fa-envelope', placeholder: 'contact@exemple.com' },
      { key: 'subject', type: 'text', label: 'Objet', placeholder: 'Objet du message' },
      { key: 'body', type: 'textarea', label: 'Message', rows: 4, placeholder: 'Votre message (optionnel)' },
    ],
    build: buildEmail,
  },
  phone: {
    id: 'phone',
    title: 'Téléphone & SMS',
    sub: 'Appelez ou envoyez un SMS en un scan',
    icon: 'fa-phone',
    fields: [
      {
        key: 'mode',
        type: 'segmented',
        label: 'Type de conversion',
        defaultValue: 'call',
        options: [
          { value: 'call', label: 'Appel', icon: 'fa-phone' },
          { value: 'sms', label: 'SMS', icon: 'fa-comment-dots' },
        ],
      },
      { key: 'number', type: 'text', label: 'Numéro', icon: 'fa-phone', placeholder: '+221 77 123 45 67' },
      {
        key: 'message',
        type: 'textarea',
        label: 'Message SMS',
        rows: 3,
        placeholder: 'Votre message (optionnel)',
        visible: values => values['mode'] === 'sms',
      },
    ],
    build: buildPhone,
  },
  vcard: {
    id: 'vcard',
    title: 'Carte de visite',
    sub: 'Vos coordonnées prêtes à être scannées',
    icon: 'fa-id-card',
    fields: [
      { key: 'last', type: 'text', label: 'Nom', placeholder: 'Diop' },
      { key: 'first', type: 'text', label: 'Prénom', placeholder: 'Cheikh' },
      { key: 'phone', type: 'text', label: 'Téléphone', placeholder: '+221 77 123 45 67' },
      { key: 'email', type: 'text', label: 'Email', placeholder: 'cheikh@exemple.com' },
      { key: 'org', type: 'text', label: 'Entreprise', placeholder: 'SoftMali' },
      { key: 'title', type: 'text', label: 'Poste', placeholder: 'Directeur' },
      { key: 'url', type: 'text', label: 'Site web', placeholder: 'https://exemple.com' },
      { key: 'addr', type: 'text', label: 'Adresse', placeholder: 'Dakar, Sénégal' },
    ],
    build: buildVcard,
  },
  geo: {
    id: 'geo',
    title: 'Localisation',
    sub: 'Ouvrez une position sur la carte',
    icon: 'fa-location-dot',
    fields: [
      { key: 'lat', type: 'number', label: 'Latitude', placeholder: '14.7167' },
      { key: 'lng', type: 'number', label: 'Longitude', placeholder: '-17.4677' },
      { key: 'zoom', type: 'number', label: 'Zoom (optionnel)', placeholder: '15' },
    ],
    build: buildGeo,
  },
};

export const TOOL_GROUPS: ToolGroup[] = [
  {
    title: 'Générer',
    items: [
      { id: 'url', icon: 'fa-link', label: 'Lien URL' },
      { id: 'text', icon: 'fa-font', label: 'Texte' },
      { id: 'wifi', icon: 'fa-wifi', label: 'Wi-Fi' },
      { id: 'email', icon: 'fa-envelope', label: 'Email' },
      { id: 'phone', icon: 'fa-phone', label: 'Téléphone & SMS' },
      { id: 'vcard', icon: 'fa-id-card', label: 'Carte de visite' },
      { id: 'geo', icon: 'fa-location-dot', label: 'Localisation' },
    ],
  },
  {
    title: 'Décoder',
    items: [{ id: 'scanner', icon: 'fa-camera', label: 'Scanner un QR' }],
  },
  {
    title: 'Gestion',
    items: [
      { id: 'bulk', icon: 'fa-layer-group', label: 'Conversion en masse' },
      { id: 'history', icon: 'fa-clock-rotate-left', label: 'Historique' },
    ],
  },
];
