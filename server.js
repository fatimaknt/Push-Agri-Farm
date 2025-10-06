const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Base de données SQLite
const db = new sqlite3.Database('./users.db');

// Créer la table des utilisateurs
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        firstName TEXT,
        lastName TEXT,
        phone TEXT,
        address TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
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
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Erreur serveur' });
            }

            if (user) {
                return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
            }

            // Hasher le mot de passe
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insérer le nouvel utilisateur
            db.run(
                'INSERT INTO users (email, password, firstName, lastName, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
                [email, hashedPassword, firstName, lastName, phone, address],
                function (err) {
                    if (err) {
                        return res.status(500).json({ success: false, message: 'Erreur lors de la création du compte' });
                    }

                    // Générer un token JWT
                    const token = jwt.sign(
                        { userId: this.lastID, email },
                        process.env.JWT_SECRET || 'your-secret-key',
                        { expiresIn: '7d' }
                    );

                    res.json({
                        success: true,
                        message: 'Compte créé avec succès',
                        token,
                        user: { id: this.lastID, email, firstName, lastName }
                    });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Erreur serveur' });
            }

            if (!user) {
                return res.status(400).json({ success: false, message: 'Email ou mot de passe incorrect' });
            }

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
        });
    } catch (error) {
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
                    return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du profil' });
                }

                res.json({
                    success: true,
                    message: 'Profil mis à jour avec succès'
                });
            }
        );
    } catch (error) {
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

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
