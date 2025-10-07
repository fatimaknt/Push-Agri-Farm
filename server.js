const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Base de données PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/pushagri',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Créer la table des utilisateurs
pool.query(`
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        "firstName" VARCHAR(255),
        "lastName" VARCHAR(255),
        phone VARCHAR(255),
        address TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) console.error('Erreur création table:', err);
    else console.log('Table utilisateurs créée/connectée');
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// Configuration email
const transporter = nodemailer.createTransporter({
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
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
        }
        
        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insérer le nouvel utilisateur
        const result = await pool.query(
            'INSERT INTO users (email, password, "firstName", "lastName", phone, address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [email, hashedPassword, firstName, lastName, phone, address]
        );
        
        const userId = result.rows[0].id;
        
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
    } catch (error) {
        console.error('Erreur inscription:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Email ou mot de passe incorrect' });
        }
        
        const user = result.rows[0];
        
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

// Route pour mettre à jour le profil
app.put('/api/profile', async (req, res) => {
    try {
        const { userId, firstName, lastName, phone, address, city } = req.body;
        
        await pool.query(
            'UPDATE users SET "firstName" = $1, "lastName" = $2, phone = $3, address = $4 WHERE id = $5',
            [firstName, lastName, phone, address, userId]
        );
        
        res.json({
            success: true,
            message: 'Profil mis à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
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