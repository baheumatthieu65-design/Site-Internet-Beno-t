# Maison des Pyrénées — Site Vitrine & Administration

Site vitrine haut de gamme dédié à la présentation d'une marque de vestes artisanales inspirées des Pyrénées.

---

## 🌟 Fonctionnalités

### Site vitrine

- Présentation haut de gamme des modèles.
- Fiches détaillées des vestes.
- Galerie photos et lookbook.
- Tableau comparatif des modèles.
- Présentation de l'histoire et du savoir-faire de la marque.
- Système de demande de commande et de réservation.
- Personnalisation des couleurs, tailles et options disponibles.

### Panneau d'administration

- Connexion administrateur sécurisée.
- Gestion des produits.
- Modification des photos et informations des vestes.
- Modification des prix, couleurs et tailles.
- Gestion des caractéristiques techniques.
- Personnalisation du thème graphique.
- Modification des styles de boutons et cartes.
- Réorganisation des sections de la page.
- Masquage ou affichage des sections.
- Personnalisation des textes et labels.
- Gestion des commandes et réservations.
- Gestion des paramètres de sécurité.

### Sauvegarde et données

- Sauvegarde de la configuration du site.
- Stockage des produits.
- Stockage des commandes.
- Utilisation d'Upstash Redis lorsque configuré.
- Mode local de secours pour le développement.

### Emails

Le système peut envoyer automatiquement une notification par email lors d'une nouvelle commande ou réservation grâce à l'API Resend.

---

## 🛠️ Technologies

Le projet utilise notamment :

- React
- TypeScript
- Vite
- Tailwind CSS
- Express
- Upstash Redis
- Resend
- Lucide React
- Motion

---

## 📁 Structure du projet

```text
.
├── api/
│   ├── admin/
│   ├── orders/
│   ├── products/
│   ├── _helper/
│   └── _initialProducts/
│
├── assets/
│
├── src/
│   ├── components/
│   ├── data/
│   ├── utils/
│   ├── App.tsx
│   └── types.ts
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vercel.json
└── vite.config.ts