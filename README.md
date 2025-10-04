# Push'Agri Farm - Site Web Moderne

Un site web moderne et attractif pour Push'Agri Farm, développé avec React, Node.js et des animations fluides.

## 🚀 Fonctionnalités

- **Design moderne et responsive** avec Tailwind CSS
- **Animations fluides** avec Framer Motion
- **Interface utilisateur intuitive** et professionnelle
- **Formulaire de contact** fonctionnel
- **Optimisé pour tous les appareils** (mobile, tablette, desktop)
- **Performance optimisée** avec React et TypeScript

## 🛠️ Technologies utilisées

### Frontend
- React 18 avec TypeScript
- Framer Motion pour les animations
- Tailwind CSS pour le styling
- React Icons pour les icônes
- React Router pour la navigation

### Backend
- Node.js avec Express
- Nodemailer pour l'envoi d'emails
- CORS pour la gestion des requêtes
- Multer pour la gestion des fichiers

## 📦 Installation

### Prérequis
- Node.js (version 16 ou supérieure)
- npm ou yarn

### Installation des dépendances

1. **Installation des dépendances du serveur :**
```bash
npm install
```

2. **Installation des dépendances du client :**
```bash
cd client
npm install
```

### Configuration

1. **Créer un fichier `.env` à la racine du projet :**
```env
PORT=5000
EMAIL_USER=pushagrifarm@gmail.com
EMAIL_PASS=your-app-password
```

2. **Configurer l'email :**
   - Remplacer `your-app-password` par le mot de passe d'application Gmail
   - Ou configurer un autre service SMTP

## 🚀 Démarrage

### Mode développement
```bash
# Démarrer le serveur et le client en parallèle
npm run dev
```

### Mode production
```bash
# Construire le client
npm run build

# Démarrer le serveur
npm start
```

## 📁 Structure du projet

```
pushagri-farm/
├── client/                 # Application React
│   ├── src/
│   │   ├── components/    # Composants React
│   │   ├── App.tsx        # Composant principal
│   │   └── index.css      # Styles globaux
│   └── public/           # Fichiers statiques
├── server.js             # Serveur Node.js
├── package.json          # Dépendances du serveur
└── README.md            # Documentation
```

## 🎨 Composants principaux

- **Header** : Navigation avec menu mobile et animations
- **Hero** : Section d'accueil avec vidéo et statistiques
- **Services** : Présentation des services avec cartes animées
- **About** : À propos de l'entreprise et du fondateur
- **Contact** : Formulaire de contact avec validation
- **Footer** : Liens et informations de contact

## 🎭 Animations

Le site utilise Framer Motion pour des animations fluides :
- Animations d'entrée pour les éléments
- Effets de survol interactifs
- Transitions entre les sections
- Animations de chargement
- Effets de parallaxe

## 📱 Responsive Design

Le site est entièrement responsive et s'adapte à tous les écrans :
- Mobile (320px+)
- Tablette (768px+)
- Desktop (1024px+)
- Grands écrans (1440px+)

## 🔧 Personnalisation

### Couleurs
Les couleurs peuvent être modifiées dans `client/tailwind.config.js` :
- Primary : Orange (#f2760b)
- Secondary : Vert (#22c55e)

### Animations
Les animations sont configurables dans les composants avec Framer Motion.

### Contenu
Le contenu peut être modifié directement dans les composants React.

## 📧 Contact

Pour toute question ou support :
- Email : pushagrifarm@gmail.com
- Site web : [Push'Agri Farm](https://pushagrifarm.com)

## 📄 Licence

© 2024 par Push'Agri Farm. Créé par diaabaaly

---

**Push'Agri Farm** - Votre partenaire de confiance pour tous vos besoins agricoles.

