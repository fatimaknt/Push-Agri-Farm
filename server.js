const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

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
