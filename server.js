const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createServer } = require('http');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Fonction pour trouver un port disponible
function findAvailablePort(startPort, maxAttempts = 10) {
    return new Promise((resolve, reject) => {
        let currentPort = startPort;
        let attempts = 0;

        const tryPort = () => {
            if (attempts >= maxAttempts) {
                reject(new Error(`Aucun port disponible trouvé après ${maxAttempts} tentatives`));
                return;
            }

            const server = createServer();

            server.listen(currentPort, (err) => {
                if (err) {
                    attempts++;
                    currentPort++;
                    tryPort();
                } else {
                    server.close(() => {
                        resolve(currentPort);
                    });
                }
            });

            server.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    attempts++;
                    currentPort++;
                    tryPort();
                } else {
                    reject(err);
                }
            });
        };

        tryPort();
    });
}

// Base de données SQLite
const db = new sqlite3.Database('./users.db');

// Créer la table des utilisateurs
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        firstName TEXT,
        lastName TEXT,
        phone TEXT,
        address TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) console.error('Erreur création table:', err);
    else console.log('Table utilisateurs créée/connectée');
});

// Créer la table des commandes
db.run(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        orderData TEXT,
        totalPrice REAL,
        totalItems INTEGER,
        status TEXT DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
    )
`, (err) => {
    if (err) console.error('Erreur création table orders:', err);
    else console.log('Table commandes créée/connectée');
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// Configuration email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'pushagrifarm@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Routes d'authentification
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, address } = req.body;

        // Vérifier si l'utilisateur existe déjà
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, existingUser) => {
            if (err) {
                console.error('Erreur vérification utilisateur:', err);
                return res.status(500).json({ success: false, message: 'Erreur serveur' });
            }

            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
            }

            try {
                // Hasher le mot de passe
                const hashedPassword = await bcrypt.hash(password, 10);

                // Insérer le nouvel utilisateur
                db.run(
                    'INSERT INTO users (email, password, firstName, lastName, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
                    [email, hashedPassword, firstName, lastName, phone, address],
                    function (err) {
                        if (err) {
                            console.error('Erreur insertion utilisateur:', err);
                            return res.status(500).json({ success: false, message: 'Erreur serveur' });
                        }

                        const userId = this.lastID;

                        // Générer un token JWT
                        const token = jwt.sign(
                            { userId, email },
                            process.env.JWT_SECRET || 'your-secret-key',
                            { expiresIn: '7d' }
                        );

                        res.json({
                            success: true,
                            message: 'Compte créé avec succès',
                            token,
                            user: { id: userId, email, firstName, lastName }
                        });
                    }
                );
            } catch (error) {
                console.error('Erreur inscription:', error);
                res.status(500).json({ success: false, message: 'Erreur serveur' });
            }
        });
    } catch (error) {
        console.error('Erreur inscription:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                console.error('Erreur connexion:', err);
                return res.status(500).json({ success: false, message: 'Erreur serveur' });
            }

            if (!user) {
                return res.status(400).json({ success: false, message: 'Email ou mot de passe incorrect' });
            }

            try {
                // Vérifier le mot de passe
                const isValidPassword = await bcrypt.compare(password, user.password);
                if (!isValidPassword) {
                    return res.status(400).json({ success: false, message: 'Email ou mot de passe incorrect' });
                }

                // Générer un token JWT
                const token = jwt.sign(
                    { userId: user.id, email: user.email },
                    process.env.JWT_SECRET || 'your-secret-key',
                    { expiresIn: '7d' }
                );

                res.json({
                    success: true,
                    message: 'Connexion réussie',
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName
                    }
                });
            } catch (error) {
                console.error('Erreur connexion:', error);
                res.status(500).json({ success: false, message: 'Erreur serveur' });
            }
        });
    } catch (error) {
        console.error('Erreur connexion:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

// Route pour mettre à jour le profil
app.put('/api/profile', async (req, res) => {
    try {
        const { userId, firstName, lastName, phone, address, city } = req.body;

        db.run(
            'UPDATE users SET firstName = ?, lastName = ?, phone = ?, address = ? WHERE id = ?',
            [firstName, lastName, phone, address, userId],
            function (err) {
                if (err) {
                    console.error('Erreur mise à jour profil:', err);
                    return res.status(500).json({ success: false, message: 'Erreur serveur' });
                }

                res.json({
                    success: true,
                    message: 'Profil mis à jour avec succès'
                });
            }
        );
    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

// Route pour sauvegarder une commande
app.post('/api/orders', async (req, res) => {
    try {
        const { userId, orderData, totalPrice, totalItems } = req.body;

        db.run(
            'INSERT INTO orders (userId, orderData, totalPrice, totalItems) VALUES (?, ?, ?, ?)',
            [userId, JSON.stringify(orderData), totalPrice, totalItems],
            function (err) {
                if (err) {
                    console.error('Erreur sauvegarde commande:', err);
                    return res.status(500).json({ success: false, message: 'Erreur serveur' });
                }

                res.json({
                    success: true,
                    message: 'Commande sauvegardée avec succès',
                    orderId: this.lastID
                });
            }
        );
    } catch (error) {
        console.error('Erreur sauvegarde commande:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

// Route pour récupérer l'historique des commandes d'un utilisateur
app.get('/api/orders/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        db.all(
            'SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC',
            [userId],
            (err, orders) => {
                if (err) {
                    console.error('Erreur récupération commandes:', err);
                    return res.status(500).json({ success: false, message: 'Erreur serveur' });
                }

                res.json({
                    success: true,
                    orders: orders
                });
            }
        );
    } catch (error) {
        console.error('Erreur récupération commandes:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});


// Routes API
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        // Envoi de l'email
        const mailOptions = {
            from: process.env.EMAIL_USER || 'pushagrifarm@gmail.com',
            to: process.env.EMAIL_TO || 'pushagrifarm@gmail.com',
            subject: `Nouveau message de contact - ${name}`,
            html: `
                <h2>Nouveau message de contact reçu</h2>
                <p><strong>Nom:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Téléphone:</strong> ${phone}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
                <hr>
                <p><em>Message envoyé depuis le site Push'Agri Farm</em></p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Email envoyé avec succès à:', process.env.EMAIL_TO || 'pushagrifarm@gmail.com');

        res.json({ success: true, message: 'Message envoyé avec succès!' });
    } catch (error) {
        console.error('Erreur envoi email:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi du message' });
    }
});

// Route pour servir l'application React
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Démarrage du serveur avec recherche automatique de port disponible
async function startServer() {
    try {
        const availablePort = await findAvailablePort(PORT);

        app.listen(availablePort, () => {
            console.log(`🚀 Serveur démarré avec succès sur le port ${availablePort}`);
            if (availablePort !== PORT) {
                console.log(`⚠️  Le port ${PORT} était occupé, utilisation du port ${availablePort} à la place`);
            }
        });
    } catch (error) {
        console.error('❌ Erreur lors du démarrage du serveur:', error.message);
        process.exit(1);
    }
}

// Démarrer le serveur
startServer();