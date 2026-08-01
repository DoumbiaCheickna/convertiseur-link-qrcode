# ConvertIQ — Convertisseur URL ↔ QR Code

Application web professionnelle de conversion. Générez et décodez des QR codes pour tous vos besoins.

## Fonctionnalités

**Générer un QR code**
- Lien URL
- Texte libre
- Réseau Wi-Fi (WPA/WPA2, WEP, ouvert, réseau caché)
- Email (destinataire, objet, message)
- Téléphone & SMS
- Carte de visite (vCard / MECARD)
- Localisation (Google Maps / Apple Plans)

**Décoder**
- Scanner par caméra (détection automatique)
- Scanner par image (glisser-déposer, parcourir ou coller Ctrl+V)
- Détection automatique du type de contenu

**Outils**
- Conversion en masse (jusqu'à 300 liens → export ZIP)
- Historique des conversions (stocké localement)
- Export PNG et SVG, copie en image, partage
- Thème clair / sombre

## Démarrage

Ouvrez simplement `index.html` dans un navigateur. Aucune installation requise.

## Stack

- HTML / CSS / JavaScript natif
- [qrcode](https://github.com/soldair/node-qrcode) pour la génération
- [jsQR](https://github.com/cozmo/jsQR) pour le décodage
- [JSZip](https://github.com/Stuk/jszip) pour l'export ZIP
