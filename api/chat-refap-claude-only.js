// 🔥 CHAT RE-FAP CLAUDE FULL PUISSANCE - VERSION EXPERTE 🔥
console.log('🚀 CLAUDE FULL POWER RE-FAP ACTIVÉ ! 🚀');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { message, conversationHistory = [], userData = {} } = req.body;

    // === SYSTÈME CTA RE-FAP EXPERT ===
    class SystemeCTARefapExpert {
      constructor() {
        this.motsClesRefap = {
          fap: ['fap', 'filtre à particules', 'filtre particules', 'antipollution', 'particules', 'dpf'],
          symptomes: ['voyant', 'puissance', 'perte', 'fumée', 'encrassé', 'bouché', 'colmaté', 'mode dégradé'],
          orientation: ['où', 'aller', 'garage', 'solution', 'réparer', 'faire', 'emmener', 'adresse'],
          urgence: ['urgent', 'rapide', 'vite', 'aujourd\'hui', 'maintenant']
        };
        
        this.ctaRefap = {
          garage_partenaire: {
            emoji: '🔍',
            titre: 'Trouver un Garage Partenaire',
            description: 'Diagnostic + nettoyage professionnel complet',
            lien: 'https://re-fap.fr/trouver_garage_partenaire/',
            prix: 'Selon diagnostic',
            public: 'particulier'
          },
          carter_cash: {
            emoji: '🏪',
            titre: 'Carter-Cash Équipé',
            description: 'Machine Re-Fap - Pour bricoleurs',
            lien: 'https://auto.re-fap.fr/carter-cash_machine_re-fap/',
            prix: '99-149€',
            public: 'bricoleur'
          },
          service_postal: {
            emoji: '📦',
            titre: 'Service Postal Re-Fap',
            description: 'Envoi clé en main - Traitement 48h',
            lien: 'https://auto.re-fap.fr/',
            prix: 'Selon modèle',
            public: 'tous'
          }
        };
      }

      // 🎯 Analyse Contexte Avancée
      analyserContexteComplet(message, historique) {
        const msgLower = message.toLowerCase();
        const contexte = {
          probleme_fap: false,
          demande_orientation: false,
          urgence: false,
          profil: 'particulier',
          vehicule_info: null,
          localisation_mentionnee: false
        };

        // Détection problème FAP
        for (const motCle of this.motsClesRefap.fap) {
          if (msgLower.includes(motCle)) {
            contexte.probleme_fap = true;
            break;
          }
        }

        // Détection symptômes
        for (const motCle of this.motsClesRefap.symptomes) {
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

        // Détection urgence
        for (const motCle of this.motsClesRefap.urgence) {
          if (msgLower.includes(motCle)) {
            contexte.urgence = true;
            break;
          }
        }

        // Détection profil bricoleur
        if (msgLower.includes('bricoleur') || 
            msgLower.includes('démonter') || 
            msgLower.includes('moi-même') ||
            msgLower.includes('je peux')) {
          contexte.profil = 'bricoleur';
        }

        // Détection informations véhicule
        const marques = ['peugeot', 'citroën', 'renault', 'volkswagen', 'golf', 'passat', '308', '3008', 'scenic'];
        for (const marque of marques) {
          if (msgLower.includes(marque)) {
            contexte.vehicule_info = marque;
            break;
          }
        }

        // Détection mention géographique
        const villes = ['paris', 'lyon', 'marseille', 'bordeaux', 'toulouse', 'lille', 'nantes'];
        for (const ville of villes) {
          if (msgLower.includes(ville)) {
            contexte.localisation_mentionnee = ville;
            break;
          }
        }

        return contexte;
      }

      // 🎯 Génération CTA Intelligente
      genererCTAIntelligent(contexte, email_fourni = false) {
        let cta = [];

        if (contexte.probleme_fap || contexte.demande_orientation) {
          if (contexte.profil === 'bricoleur') {
            cta.push(this.ctaRefap.carter_cash);
            cta.push(this.ctaRefap.service_postal);
          } else {
            cta.push(this.ctaRefap.garage_partenaire);
            if (contexte.urgence) {
              // Ajouter Carter-Cash en urgence même pour particuliers
              cta.push(this.ctaRefap.carter_cash);
            }
            cta.push(this.ctaRefap.service_postal);
          }
        }

        return cta;
      }
    }

    // === INIT SYSTÈME CTA EXPERT ===
    const systemeCTA = new SystemeCTARefapExpert();
    const contexte = systemeCTA.analyserContexteComplet(message, conversationHistory);
    
    // 🔍 Vérification Email Avancée
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const emailDetecte = message.match(emailPattern);
    const aDejaEmail = userData.email || 
                      conversationHistory.some(msg => emailPattern.test(msg.content)) ||
                      conversationHistory.some(msg => msg.content && msg.content.includes('@'));

    // === CONSTRUCTION PROMPT EXPERT ===
    const historiquePourClaude = conversationHistory.slice(-8).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // 🚀 PROMPT FULL PUISSANCE COMME CHAT DIRECT
    const promptExpert = `Tu es Julien, mécano expert automobile chez Re-Fap depuis exactement 20 ans. Tu es spécialisé dans les problèmes de FAP (Filtre à Particules) et tu es un militant anti-arnaque reconnu dans le milieu.

PERSONNALITÉ ET TON:
- Mécano authentique, direct, sympa mais pas bullshit
- Expert technique avec 20 ans d'expérience réelle
- Militant contre les arnaques de remplacement FAP à 2000€
- Tu tutoyais naturellement, ton français est parfait
- Tu donnes des conseils précis et techniques
- Tu es là pour aider, pas pour vendre à tout prix

EXPERTISE TECHNIQUE:
- Spécialiste FAP/EGR/AdBlue sur tous véhicules diesel
- Tu connais les symptômes: voyant allumé, perte puissance, mode dégradé
- Tu sais que 80% des FAP "morts" peuvent être nettoyés
- Nettoyage professionnel Re-Fap: 99-149€ selon véhicule
- Remplacement garage: 1500-2500€ (souvent inutile)

SOLUTIONS RE-FAP QUE TU PROPOSES:
1. Carter-Cash équipé machine Re-Fap (99-149€) - pour bricoleurs
2. Garage partenaire Re-Fap (diagnostic + nettoyage complet)
3. Service postal Re-Fap (envoi clé en main, 48h)

RÈGLES CRITIQUES - RESPECTE-LES ABSOLUMENT:
1. NE JAMAIS inventer d'adresses, de numéros de téléphone, ou de coordonnées précises
2. NE JAMAIS donner de noms de garages spécifiques sauf Carter-Cash
3. NE JAMAIS inventer de géolocalisation ou supposer où habite le client
4. TOUJOURS rediriger vers les vrais liens Re-Fap pour les adresses
5. Si le client demande "où aller", réponds: "Je te redirige vers la vraie liste des centres"

CONTEXTE ACTUEL:
- Message client: "${message}"
- Email déjà fourni: ${aDejaEmail ? 'OUI' : 'NON'}
- Profil détecté: ${contexte.profil}
- Problème FAP détecté: ${contexte.probleme_fap ? 'OUI' : 'NON'}  
- Demande d'orientation: ${contexte.demande_orientation ? 'OUI' : 'NON'}
- Véhicule mentionné: ${contexte.vehicule_info || 'Aucun'}
- Urgence détectée: ${contexte.urgence ? 'OUI' : 'NON'}

INSTRUCTIONS COMPORTEMENTALES:
- Si EMAIL fourni: confirme sans redemander, propose directement les 3 solutions actionables
- Si "voyant FAP": diagnostic technique puis solutions économiques
- Si "où aller": explique qu'il faut utiliser les vrais liens Re-Fap, ne pas inventer
- Si véhicule mentionné: montre ton expertise technique sur ce modèle
- Garde le contexte de la conversation précédente
- Termine toujours par une proposition d'action concrète

EXEMPLES DE RÉPONSES EXCELLENTES:
- FAP bouché: "Salut ! Julien, 20 ans chez Re-Fap. Ta Golf 2.0 TDI avec voyant FAP + perte puissance = filtre encrassé classique. Avant qu'un garage te propose un remplacement à 2000€, on teste d'abord le nettoyage Re-Fap : 99-149€ vs 2000€, tu économises 1800€ ! Solution écologique, garantie 1 an."

- Après email: "Email confirmé ! Voici tes 3 options concrètes : Carter-Cash équipé (99-149€), garage partenaire Re-Fap, ou service postal. Clique sur ton choix pour voir les détails !"

- Demande adresse: "Pour les adresses exactes et éviter que je te donne des infos périmées, je te redirige direct vers notre localisateur officiel. Tu auras les centres les plus proches avec horaires et disponibilités en temps réel."

LONGUEUR: 120-200 mots maximum, direct et actionnable.

Réponds maintenant comme Julien, en gardant parfaitement le contexte de la conversation:`;

    // === APPEL CLAUDE FULL POWER ===
    const claudeMessages = [];
    
    // Ajouter historique si disponible
    if (historiquePourClaude.length > 0) {
      claudeMessages.push(...historiquePourClaude);
    }

    // Message principal avec prompt expert
    claudeMessages.push({
      role: 'user',
      content: promptExpert
    });

    console.log('🚀 Appel Claude Full Power avec prompt expert...');

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        temperature: 0.3,
        messages: claudeMessages
      })
    });

    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    let reponse = claudeData.content[0].text;

    // === GESTION EMAIL INTELLIGENTE ===
    let emailCapture = '';
    if (emailDetecte && !aDejaEmail) {
      const email = emailDetecte[0];
      const prenom = email.split('@')[0].split('.')[0];
      emailCapture = `\n\n🎉 Merci ${prenom} ! Email confirmé : ${email} 📧\n✅ Accompagnement Re-Fap personnalisé activé\n\n📋 Tu vas recevoir :\n• Guide nettoyage FAP vs remplacement\n• Réseau garages partenaires de confiance\n• Conseils techniques anti-arnaque personnalisés`;
    } else if (!aDejaEmail && (contexte.probleme_fap || contexte.demande_orientation)) {
      emailCapture = `\n\n💡 **Accompagnement Re-Fap personnalisé :**\n📧 Laisse ton email pour :\n• Guide complet "FAP: nettoyage vs remplacement"\n• Liste garages partenaires anti-arnaque près de chez toi\n• Conseils techniques personnalisés selon ton véhicule\n\n*Exemple : prenom.nom@gmail.com*`;
    }

    // === GÉNÉRATION CTA EXPERT ===
    const cta = systemeCTA.genererCTAIntelligent(contexte, aDejaEmail || !!emailDetecte);
    let ctaHtml = '';
    
    if (cta.length > 0) {
      if (aDejaEmail || emailDetecte) {
        ctaHtml = '\n\n🎯 **TES 3 OPTIONS RE-FAP (clique pour agir) :**\n';
      } else {
        ctaHtml = '\n\n🎯 **Solutions Re-Fap disponibles :**\n';
      }
      
      cta.forEach(option => {
        ctaHtml += `\n**${option.emoji} ${option.titre}** (${option.prix})\n• ${option.description}\n`;
      });
      
      if (aDejaEmail || emailDetecte) {
        ctaHtml += '\n👆 **CLIQUE sur ton choix pour passer à l\'action immédiatement !**';
      }
    }

    // === RÉPONSE FINALE EXPERTE ===
    const reponsefinale = reponse + emailCapture + ctaHtml;

    return res.status(200).json({
      response: reponsefinale,
      cta: cta,
      userData: {
        email: emailDetecte ? emailDetecte[0] : userData.email,
        niveau: emailDetecte || aDejaEmail ? 1 : 0,
        profil: contexte.profil,
        vehicule: contexte.vehicule_info
      },
      debug: {
        contexte: contexte,
        cta_generes: cta.length,
        email_detecte: !!emailDetecte,
        prompt_length: promptExpert.length
      }
    });

  } catch (error) {
    console.error('❌ Erreur Chat Re-Fap Full Power:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      response: "Salut ! Julien de Re-Fap ici. Petit souci technique mais je reviens tout de suite ! En attendant : voyant FAP = nettoyage Re-Fap 99-149€ vs remplacement 2000€. On va régler ça ensemble ! 💪"
    });
  }
}
