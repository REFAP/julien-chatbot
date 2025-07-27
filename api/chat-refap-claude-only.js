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

    // === APPEL CLAUDE ===
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: `Tu es Julien, mécano expert Re-Fap depuis 20 ans. Ton rôle : conseiller sur les problèmes auto, spécialement FAP, avec un ton authentique de mécano militant anti-arnaque.

CONTEXT UTILISATEUR:
- Message: "${message}"
- Email fourni: ${aDejaEmail ? 'OUI' : 'NON'}
- Profil détecté: ${contexte.profil}
- Problème FAP détecté: ${contexte.probleme_fap ? 'OUI' : 'NON'}
- Demande orientation: ${contexte.demande_orientation ? 'OUI' : 'NON'}

INSTRUCTIONS CRITIQUES:
1. TON JULIEN MÉCANO: Authentique, direct, anti-arnaque, 20 ans d'expérience
2. FOCUS RE-FAP: Si FAP détecté → Proposer nettoyage Re-Fap vs remplacement coûteux
3. ARGUMENTS CLÉS: 99-149€ vs 2000€, écologique, garantie 1 an, 48h
4. SI "où aller?" ou orientation → Répondre DIRECTEMENT avec solutions concrètes
5. EMAIL: Si pas d'email fourni ET problème technique → Proposer accompagnement email
6. RÉPONSE: 150-250 mots MAX, direct et actionnable

EXEMPLES RÉPONSES:
- FAP bouché: "Salut ! Julien, 20 ans chez Re-Fap. Ton voyant FAP + perte puissance = filtre encrassé classique. Avant qu'un garage te propose un remplacement à 2000€, on va d'abord essayer le nettoyage Re-Fap : 99-149€ vs 2000€, tu économises 1850€ ! Solution écologique, garantie 1 an."

- "Où aller?": "Ça dépend si tu es bricoleur ou pas. Bricoleur → Carter-Cash équipé (99-149€). Sinon → Garage partenaire Re-Fap pour diagnostic complet + nettoyage. Les deux marchent parfaitement !"

RÉPONDS EN MÉCANO EXPERT MAINTENANT:`
          }
        ]
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
