const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000; // ✅ Port Render par défaut

app.use(cors({
  origin: '*',
  credentials: false
}));

app.use(express.json({ limit: '50mb' }));

// Route santé
app.get('/', (req, res) => {
  res.json({ 
    status: 'Vision Analyzer Backend is running!',
    service: 'nano-banana proxy',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Vision Analyzer Backend' });
});

// Route proxy pour Replicate
app.post('/api/replicate', async (req, res) => {
  try {
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    
    console.log('🔥 Requête reçue sur /api/replicate');
    
    if (!REPLICATE_API_TOKEN) {
      console.error('❌ Token Replicate manquant');
      return res.status(401).json({ error: 'Token Replicate manquant dans les variables d\'environnement' });
    }

    const { input } = req.body;
    console.log('📝 Input reçu pour nano-banana');

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        version: "google/nano-banana",
        input: input
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur Replicate:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Replicate Error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    console.log('✅ Réponse Replicate reçue:', data.id);
    res.json(data);

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour vérifier le statut d'une prédiction
app.get('/api/replicate/:id', async (req, res) => {
  try {
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    const { id } = req.params;

    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Status Error: ${response.status}` 
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur Express démarré sur port ${PORT}`);
  console.log(`🏥 Health check disponible sur /health`);
});
