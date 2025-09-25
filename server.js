// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration CORS pour Bolt + Production
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000', 
    'https://your-frontend-domain.com'
  ],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// Route santé pour vérifier le serveur
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Vision Analyzer Backend',
    timestamp: new Date().toISOString()
  });
});

// Route proxy pour Replicate
app.post('/api/replicate', async (req, res) => {
  try {
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    
    console.log('🔥 Requête reçue sur /api/replicate');
    
    if (!REPLICATE_API_TOKEN) {
      console.error('❌ Token Replicate manquant');
      return res.status(401).json({ error: 'Token Replicate manquant' });
    }

    const { input } = req.body;
    console.log('📝 Input reçu:', JSON.stringify(input, null, 2));

    console.log('🔄 Appel vers Replicate nano-banana...');
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        model: "google/nano-banana",
        input: input
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur Replicate:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Replicate Error: ${response.status} - ${errorText}` 
      });
    }

    const data = await response.json();
    console.log('✅ Prédiction créée:', data.id);
    
    res.json(data);

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour vérifier le status des prédictions
app.get('/api/replicate/:id', async (req, res) => {
  try {
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    const { id } = req.params;

    console.log('🔍 Vérification status:', id);

    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur status:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Status Error: ${response.status} - ${errorText}` 
      });
    }

    const data = await response.json();
    console.log(`📊 Status ${id}: ${data.status}`);
    
    res.json(data);

  } catch (error) {
    console.error('❌ Erreur status check:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`🚀 Serveur Express démarré sur ${url}`);
  console.log(`🏥 Health check disponible sur ${url}/health`);
});
