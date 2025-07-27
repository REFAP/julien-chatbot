// 🔥 CHAT RE-FAP CLAUDE ONLY - VERSION MÉCANO MILITANT 🔥
console.log('🔧 CLAUDE ONLY RE-FAP ACTIVÉ - FINI LE DUAL BRAIN! 🔧');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { message, conversationHistory = [], userData = {} } = req.body;

    // === SYSTÈME CTA RE-FAP ===
    class SystemeCTARefap {
      constructor() {
        this.motsClesRefap = {
          fap: ['fap', 'filtre à particules', 'filtre particules', 'antipollution', 'particules'],
          symptomes: ['voyant', 'puissance', 'perte', 'fumée', 'encrassé', 'bouché', 'colmaté'],
          orientation: ['où', 'aller', 'garage', 'solution', 'réparer', 'faire', 'emmener']
        };
        
        this.ctaRefap = {
          garage_partenaire: {
            emoji: '🔍',
            titre: 'Diagnostic + Garage Partenaire',
            description: 'Diagnostic pro + nettoyage complet',
            lien: 'https://re-fap.fr/trouver_garage_partenaire/',
            prix: 'Selon diagnostic'
          },
          carter_cash: {
            emoji: '🏪',
            titre: 'Carter-Cash Équipé',
            description: 'Pour bricoleurs - Machine Re-Fap',
            lien: 'https://auto.re-fap.fr/carter-cash_machine_re-fap/',
            prix: '99-149€'
          },
          service_postal: {
            emoji: '📦',
            titre: 'Service Postal Re-Fap',
            description: 'Envoi clé en main - 48h',
            lien: 'https://auto.re-fap.fr/',
            prix: 'Selon modèle'
          }
        };
      }

      // 🎯 Détection Profil Utilisateur
      detecterProfil(message, historique) {
        const msgLower = message.toLowerCase();
        
        // Profil Bricoleur
        if (msgLower.includes('bricoleur') || 
            msgLower.includes('démonter') || 
            msgLower.includes('moi-même') ||
            msgLower.includes('carter') ||
            msgLower.includes('je peux le faire')) {
          return 'bricoleur';
        }
        
        // Profil Particulier Standard
        return 'particulier';
      }

      // 🔍 Analyse Contexte FAP
      analyserContexteFap(message, historique) {
        const msgLower = message.toLowerCase();
        const contexte = {
          probleme_fap: false,
          demande_orientation: false,
          profil: this.detecterProfil(message, historique)
        };

        // Détection problème FAP
        for (const motCle of this.motsClesRefap.fap) {
          if (msgLower.includes(motCle)) {
            contexte.probleme_fap = true;
            break;
          }
        }

        // Détection demande d'orientation
        for (const motCle of this.motsClesRefap.orientation) {
          if (msgLower.includes(motCle)) {
            contexte.demande_orientation = true;
            break;
          }
        }

        return contexte;
      }

      // 🎯 Génération CTA Selon Contexte
      genererCTA(contexte, email_fourni = false) {
        let cta = [];

        if (contexte.probleme_fap || contexte.demande_orientation) {
          if (contexte.profil === 'bricoleur') {
            cta.push(this.ctaRefap.carter_cash);
            cta.push(this.ctaRefap.service_postal);
          } else {
            cta.push(this.ctaRefap.garage_partenaire);
            cta.push(this.ctaRefap.carter_cash);
            cta.push(this.ctaRefap.service_postal);
          }
        }

        return cta;
      }
    }

    // === INIT SYSTÈME CTA ===
    const systemeCTA = new SystemeCTARefap();
    const contexte = systemeCTA.analyserContexteFap(message, conversationHistory);
    
    // 🔍 Vérification Email
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const emailDetecte = message.match(emailPattern);
    const aDejaEmail = userData.email || conversationHistory.some(msg => 
      emailPattern.test(msg.content)
    );

    // === APPEL VRAI CLAUDE SONNET ===
    const claudeMessages = [];
    
    // Ajouter l'historique de conversation (6 derniers messages)
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.slice(-6).forEach(msg => {
        claudeMessages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // Ajouter le message actuel avec contexte
    claudeMessages.push({
      role: 'user',
      content: `Tu es Julien, mécano expert Re-Fap depuis 20 ans. Mécano authentique, direct, militant anti-arnaque.

MESSAGE: ${message}

CONTEXTE:
- Email fourni: ${aDejaEmail ? 'OUI' : 'NON'}
- Profil: ${contexte.profil}
- Problème FAP: ${contexte.probleme_fap ? 'OUI' : 'NON'}
- Demande orientation: ${contexte.demande_orientation ? 'OUI' : 'NON'}

MISSION:
- "voyant fap" → Solution nettoyage 99-149€ vs 2000€
- "je vais où?" → Carter-Cash/Garage partenaire selon profil
- Email fourni → Confirmation, pas redemander

Réponds comme Julien : direct, technique, anti-arnaque, 150 mots max !`
    });

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 600,
        messages: claudeMessages
      })
    });

    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    let reponse = claudeData.content[0].text;

    // === GESTION EMAIL ===
    let emailCapture = '';
    if (emailDetecte && !aDejaEmail) {
      const email = emailDetecte[0];
      emailCapture = `\n\n🎉 Merci ${email.split('@')[0]} ! 📧\n✅ Email confirmé → Accompagnement Re-Fap personnalisé\n\n📋 Tu vas recevoir :\n• Guide nettoyage FAP vs remplacement\n• Réseau garages partenaires Re-Fap\n• Conseils techniques anti-arnaque`;
    } else if (!aDejaEmail && (contexte.probleme_fap || contexte.demande_orientation)) {
      emailCapture = `\n\n💡 **Accompagnement Re-Fap personnalisé :**\n📧 Laisse ton email pour :\n• Guide complet nettoyage FAP\n• Réseau garages partenaires\n• Conseils techniques anti-arnaque\n\n*Exemple : prenom.nom@gmail.com*`;
    }

    // === GÉNÉRATION CTA ===
    const cta = systemeCTA.genererCTA(contexte, aDejaEmail);
    let ctaHtml = '';
    
    if (cta.length > 0) {
      ctaHtml = '\n\n🎯 **Solutions Re-Fap :**\n';
      cta.forEach(option => {
        ctaHtml += `\n**${option.emoji} ${option.titre}** (${option.prix})\n• ${option.description}\n`;
      });
    }

    // === RÉPONSE FINALE ===
    const reponsefinale = reponse + emailCapture + ctaHtml;

    return res.status(200).json({
      response: reponsefinale,
      cta: cta,
      userData: {
        email: emailDetecte ? emailDetecte[0] : userData.email,
        niveau: emailDetecte || aDejaEmail ? 1 : 0,
        profil: contexte.profil
      },
      debug: {
        contexte: contexte,
        cta_generes: cta.length,
        email_detecte: !!emailDetecte
      }
    });

  } catch (error) {
    console.error('Erreur Chat Re-Fap:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      response: "Désolé, un problème technique. Julien revient dans 2 minutes ! En attendant, pour un FAP bouché : nettoyage Re-Fap 99-149€ vs remplacement 2000€. Économie garantie !"
    });
  }
}
