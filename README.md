# Maison des Pyrénées — Site Vitrine d'Exception & Panneau d'Administration

Site vitrine haut de gamme et personnalisable dédié à la présentation d'une marque de vestes artisanales d'exception inspirées des Pyrénées.

---

## 🌟 Fonctionnalités

- **Présentation Haute Couture** : Vue 360°, fiches détaillées, comparaison technique, lookbook et récit de terroir.
- **Panneau d'Administration Intégré** :
  - Modification en direct des styles et modèles de boutons (6 modèles d'exception).
  - Modification des formes de cartes, arrondis, surtitres et badges.
  - Réorganisation et masquage des sections par simple glisser/clic.
  - Personnalisation complète des vestes (photos, descriptifs, caractéristiques, prix, couleurs, tailles).
  - Gestion des adresses email : email de contact général, email de réception des commandes/réservations et email de récupération administrateur.
- **Authentification & Récupération de Mot de Passe** :
  - Connexion sécurisée par identifiant ou email.
  - Procédure de réinitialisation de mot de passe par code de sécurité à 6 chiffres.
- **Sauvegarde & Restauration** : Exportation et importation de la configuration complète du site au format JSON.

---

## 🚀 Guide d'Importation sur GitHub

### 1. Cloner ou initialiser votre dépôt local

Ouvrez votre terminal dans le dossier du projet :

```bash
# 1. Initialiser le dépôt git local
git init

# 2. Ajouter l'ensemble des fichiers
git add .

# 3. Créer le premier commit
git commit -m "Maison des Pyrénées - Version initiale"

# 4. Définir la branche principale
git branch -M main

# 5. Associer votre dépôt distant GitHub (remplacez par votre URL)
git remote add origin https://github.com/VOTRE_NOM_UTILISATEUR/votre-depot-pyrenees.git

# 6. Envoyer le code sur GitHub
git push -u origin main
```

---

## 🌐 Hébergement Gratuit en Ligne (100% Propriétaire)

### Option 1 : Déploiement sur Vercel (Recommandé - 1 Clic)
1. Rendez-vous sur [vercel.com](https://vercel.com) et connectez-vous avec votre compte **GitHub**.
2. Cliquez sur **"Add New Project"** > **"Import Git Repository"**.
3. Sélectionnez votre dépôt GitHub `votre-depot-pyrenees`.
4. Vercel détecte automatiquement le projet **Vite / React**.
5. Cliquez sur **"Deploy"**. Votre site est en ligne avec HTTPS gratuit en moins de 60 secondes !

### Option 2 : Déploiement sur Netlify
1. Rendez-vous sur [netlify.com](https://netlify.com) et connectez-vous avec **GitHub**.
2. Cliquez sur **"Add new site"** > **"Import an existing project"**.
3. Choisissez votre dépôt GitHub.
4. Paramètres de compilation :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`
5. Cliquez sur **"Deploy site"**.

---

## 💻 Développement Local

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Compiler pour la production
npm run build
```

---

## 🔐 Identifiants Administrateur par Défaut

- **Identifiant** : `admin`
- **Email associé** : `baheu.matthieu65@gmail.com`
- **Mot de passe par défaut** : `pyrenees2025`

Vous pouvez modifier ces identifiants et l'adresse de réception des réservations à tout moment dans le **Panneau d'Administration** (Onglet *Sécurité & Compte* et *Identité & Emails*).
