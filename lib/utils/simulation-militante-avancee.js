// Simulation militante avancée avec vraie base de connaissances

export class SimulationMilitanteAvancee {
  constructor() {
    this.baseConnaissances = this.initBaseConnaissances();
    this.compteurAide = 0;
  }

  // 🧠 BASE DE CONNAISSANCES MILITANTE
  initBaseConnaissances() {
    return {
      // 🌪️ PROBLÈMES FAP/EGR
      fap: {
        symptomes: {
          'voyant_antipollution': {
            diagnostic: "Voyant antipollution = FAP colmaté dans 80% des cas",
            solution_economique: "Nettoyage FAP 200€ vs remplacement 2000€",
            test_gratuit: "Roulage autoroutier 30min à 3000tr/min d'abord",
            arnaque_classique: "Garage qui refuse catégoriquement le nettoyage",
            conseil_militant: "FAP se nettoie dans 90% des cas, ne te laisse pas avoir !"
          },
          'perte_puissance_ville': {
            diagnostic: "Perte puissance en ville = FAP bouché + régénération impossible",
            solution_economique: "Nettoyage FAP Re-Fap garanti 2 ans",
            test_gratuit: "Test capteur pression différentielle (souvent HS, 50€)",
            arnaque_classique: "Vente FAP neuf sans test de nettoyage",
            conseil_militant: "Ville = ennemi du FAP, mais ça se soigne !"
          },
          'fumee_noire': {
            diagnostic: "Fumée noire = soit FAP, soit injecteurs, soit turbo",
            solution_economique: "Diagnostic précis d'abord (60€ max)",
            test_gratuit: "Vérifier niveau AdBlue + qualité gasoil",
            arnaque_classique: "Diagnostic à 150€ + réparation à l'aveugle",
            conseil_militant: "Une fumée = plein de causes possibles, pas de panique !"
          }
        },
        
        codes_erreur: {
          'P2002': {
            signification: "Efficacité FAP sous seuil",
            vraie_solution: "Nettoyage chimique ou pyrolyse - 200€ max",
            fausse_solution: "Remplacement FAP - 2000€ (arnaque dans 90% des cas)",
            conseil_militant: "P2002 = ton FAP crie à l'aide, écoute-le !"
          },
          'P2463': {
            signification: "Accumulation suies FAP",
            vraie_solution: "Régénération forcée puis nettoyage si nécessaire",
            fausse_solution: "Changement FAP immédiat",
            conseil_militant: "P2463 = FAP saturé mais récupérable !"
          }
        }
      },

      // 🚗 PROBLÈMES FREINAGE
      freinage: {
        bruits: {
          'grincement_leger': {
            diagnostic: "Grincement léger = plaquettes en fin de vie",
            solution_economique: "Plaquettes seules 80-120€ (pas les disques)",
            test_gratuit: "Inspection visuelle épaisseur (>3mm = OK)",
            arnaque_classique: "Changement disques systématique",
            conseil_militant: "Grincement ≠ danger immédiat, tu as le temps !"
          },
          'couinement_aigu': {
            diagnostic: "Couinement aigu = témoin d'usure plaquettes",
            solution_economique: "Plaquettes 100€ + main d'œuvre 50€ max",
            test_gratuit: "Test freinage parking (douceur/efficacité)",
            arnaque_classique: "Pack freinage complet 600€",
            conseil_militant: "Couinement = signal normal, pas d'urgence !"
          },
          'bruit_metallique': {
            diagnostic: "Métal sur métal = plaquettes mortes, urgence relative",
            solution_economique: "Plaquettes + surfaçage disques 180€",
            test_gratuit: "ARRÊT immédiat si freinage moins efficace",
            arnaque_classique: "Changement complet système freinage",
            conseil_militant: "Métal/métal = pas bon mais pas la mort non plus !"
          }
        }
      },

      // ⚠️ VOYANTS MOTEUR
      voyant: {
        couleurs: {
          'orange_fixe': {
            diagnostic: "Orange fixe = pollution/émissions, pas d'urgence moteur",
            solution_economique: "Diagnostic OBD 60€ → solution ciblée",
            test_gratuit: "Vérifier bouchon réservoir bien serré",
            arnaque_classique: "Grosse révision moteur sans diagnostic",
            conseil_militant: "Orange fixe = ton moteur va bien, c'est juste la dépollution !"
          },
          'orange_clignotant': {
            diagnostic: "Orange clignotant = allumage/injection, rouler doucement",
            solution_economique: "Souvent bougies/bobines 100-200€",
            test_gratuit: "Noter si ça clignote à chaud/froid/accélération",
            arnaque_classique: "Refection moteur complète",
            conseil_militant: "Orange clignotant = signal d'alarme mais réparable !"
          },
          'rouge': {
            diagnostic: "Rouge = urgence vraie (huile/température)",
            solution_economique: "ARRÊT immédiat puis diagnostic",
            test_gratuit: "Vérifier niveaux huile/liquide refroidissement",
            arnaque_classique: "Moteur mort, il faut changer",
            conseil_militant: "Rouge = stop mais souvent ça se répare !"
          }
        }
      },

      // 💰 ARNAQUES CLASSIQUES
      arnaques: {
        'diagnostic_cher': {
          description: "Diagnostic facturé >100€",
          vraie_valeur: "Diagnostic OBD = 30min = 60€ max",
          comment_eviter: "Demander tarif diagnostic avant",
          response_type: "anti_arnaque"
        },
        'pack_securite': {
          description: "Pack sécurité/confort vendu d'office",
          vraie_valeur: "Souvent 50% de marge = tu paies 2x le prix",
          comment_eviter: "Demander devis détaillé pièce par pièce",
          response_type: "anti_arnaque"
        },
        'urgence_artificielle': {
          description: "Pression temporelle (avant ce soir/semaine)",
          vraie_valeur: "Panne mécanique ≠ urgence commerciale",
          comment_eviter: "Prendre temps de réflexion + second avis",
          response_type: "anti_arnaque"
        }
      }
    };
  }

  // 🎯 ANALYSE MILITANTE INTELLIGENTE
  analyserProbleme(message, userLevel = 0) {
    const lowerMessage = message.toLowerCase();
    this.compteurAide++;
    
    // Détection type de problème
    const problemeDetecte = this.detecterTypeProbleme(lowerMessage);
    const contexteArnaque = this.detecterContexteArnaque(lowerMessage);
    
    // Génération réponse selon contexte
    if (contexteArnaque) {
      return this.genererReponseAntiArnaque(contexteArnaque, problemeDetecte, userLevel);
    } else {
      return this.genererReponseProbleme(problemeDetecte, lowerMessage, userLevel);
    }
  }

  // 🔍 DÉTECTION TYPE PROBLÈME
  detecterTypeProbleme(message) {
    const patterns = {
      fap: /fap|filtre.*particul|antipollution|egr|adblue|p2002|p2463/,
      freinage: /frein|brake|plaquette|disque|grinc|couin|bruit.*frein/,
      voyant: /voyant|temoin|orange|rouge|cligno|p0|dtc/,
      puissance: /puissance|perf|acceler|mou|faible|turbo/,
      fumee: /fumee|fumée|échapp|noir|blanc|bleu/,
      bruit: /bruit|son|vibr|siffl|grinc|couin/,
      demarrage: /démarr|start|cale|ralenti|regim/
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(message)) {
        return type;
      }
    }
    return 'general';
  }

  // 🚨 DÉTECTION CONTEXTE ARNAQUE
  detecterContexteArnaque(message) {
    const signauxArnaque = {
      diagnostic_cher: /diagnostic.*150|diagnostic.*200|diagnostic.*cher/,
      pack_force: /pack|forfait.*complet|tout.*chang|pack.*securit/,
      urgence_force: /aujourd.*hui|ce.*soir|avant.*demain|urgent.*repar/,
      prix_gonfle: /2000.*eur|1500.*eur|cher|prix.*elev/,
      refus_nettoyage: /refuse.*nettoy|impossible.*nettoy|faut.*chang/
    };

    for (const [type, pattern] of Object.entries(signauxArnaque)) {
      if (pattern.test(message)) {
        return type;
      }
    }
    return null;
  }

  // 🤝 GÉNÉRATION RÉPONSE ANTI-ARNAQUE
  genererReponseAntiArnaque(typeArnaque, probleme, userLevel) {
    const baseResponse = `🚨 **ALERTE ARNAQUE DÉTECTÉE !** 🚨\n\n`;
    
    const responses = {
      diagnostic_cher: `Tu me parles d'un diagnostic cher ? **STOP !**

🎯 **La vérité :**
• Diagnostic OBD = 30 minutes max
• Prix normal = 60-80€ maximum
• Au-delà = ils te prennent pour un pigeon

💡 **Mon conseil militant :**
Dis-leur "60€ max ou je vais ailleurs" et tu verras leur tête ! 😏`,

      pack_force: `On te propose un "pack complet" ? **MÉFIANCE TOTALE !**

🎯 **L'arnaque classique :**
• Pack = marge de 50% minimum
• Tu paies 2x le prix des pièces
• Souvent pas tout nécessaire

💡 **Ma technique anti-arnaque :**
"Devis détaillé pièce par pièce SVP" → 90% des packs s'effondrent !`,

      prix_gonfle: `Prix à 1500-2000€ ? **ON SE MOQUE DE TOI !**

🎯 **Réalité des coûts :**
• Nettoyage FAP : 200€ max
• Plaquettes : 120€ max  
• Diagnostic : 60€ max

💡 **Ma contre-attaque :**
"Pourquoi vous refusez le nettoyage ?" → Question qui tue !`,

      refus_nettoyage: `Ils refusent le nettoyage ? **FUIS IMMÉDIATEMENT !**

🎯 **Pourquoi ils refusent :**
• Nettoyage = 200€ (petite marge)
• Remplacement = 2000€ (grosse marge)
• Tout est dit...

💡 **Solution militante :**
Garage Re-Fap qui accepte le nettoyage garanti !`,

      urgence_force: `"Urgent avant ce soir" ? **TECHNIQUE DE VENTE POURRIE !**

🎯 **La vérité :**
• Panne mécanique ≠ urgence commerciale
• Ils veulent t'empêcher de comparer
• Pression temporelle = signe d'arnaque

💡 **Ma réponse type :**
"Je réfléchis, merci" → Tu verras leur panique ! 😂`
    };

    let response = baseResponse + (responses[typeArnaque] || responses.prix_gonfle);

    // Ajout conseil selon niveau
    if (userLevel === 0) {
      response += `\n\n🤝 **Besoin d'aide personnalisée contre cette arnaque ?**\nLaisse ton email, je t'envoie le guide anti-arnaque complet !`;
    } else {
      response += `\n\n✅ **Plan d'action anti-arnaque personnalisé dans ton guide !**`;
    }

    return {
      content: response,
      type: 'anti_arnaque',
      confidence: 0.95,
      economic_value: 500 // Économie potentielle
    };
  }

  // 🔧 GÉNÉRATION RÉPONSE PROBLÈME
  genererReponseProbleme(type, message, userLevel) {
    const baseKnowledge = this.baseConnaissances[type];
    
    if (!baseKnowledge) {
      return this.genererReponseGenerale(message, userLevel);
    }

    // Détection symptôme spécifique
    const symptomeDetecte = this.detecterSymptome(message, baseKnowledge);
    
    if (symptomeDetecte) {
      return this.genererReponseSymptome(symptomeDetecte, type, userLevel);
    } else {
      return this.genererReponseTypeGenerale(type, userLevel);
    }
  }

  // 🎯 DÉTECTION SYMPTÔME SPÉCIFIQUE
  detecterSymptome(message, baseKnowledge) {
    if (baseKnowledge.symptomes) {
      for (const [symptome, data] of Object.entries(baseKnowledge.symptomes)) {
        const keywords = symptome.split('_');
        if (keywords.every(keyword => message.includes(keyword))) {
          return { symptome, data };
        }
      }
    }
    
    if (baseKnowledge.bruits) {
      for (const [bruit, data] of Object.entries(baseKnowledge.bruits)) {
        const keywords = bruit.split('_');
        if (keywords.some(keyword => message.includes(keyword))) {
          return { symptome: bruit, data };
        }
      }
    }
    
    return null;
  }

  // 💪 GÉNÉRATION RÉPONSE SYMPTÔME PRÉCIS
  genererReponseSymptome(symptomeInfo, type, userLevel) {
    const { symptome, data } = symptomeInfo;
    
    let response = `🔧 **Diagnostic Militant ${type.toUpperCase()}** 🛠️\n\n`;
    response += `**Mon diagnostic :** ${data.diagnostic}\n\n`;
    
    response += `**💰 Solution économique :**\n${data.solution_economique}\n\n`;
    
    response += `**🆓 À tester d'abord (gratuit) :**\n${data.test_gratuit}\n\n`;
    
    response += `**🚨 Méfie-toi de :** ${data.arnaque_classique}\n\n`;
    
    response += `**💡 Mon conseil militant :** ${data.conseil_militant}`;

    // Ajout selon niveau utilisateur
    if (userLevel === 0) {
      response += `\n\n🤝 **Pour le guide complet anti-arnaque :**\nLaisse ton email → astuces + garages de confiance près de chez toi !`;
    } else {
      response += `\n\n✅ **Guide personnalisé avec plan d'action dans ton email !**`;
    }

    return {
      content: response,
      type: type,
      confidence: 0.9,
      economic_value: this.calculerEconomie(data.solution_economique)
    };
  }

  // 🔨 GÉNÉRATION RÉPONSE GÉNÉRALE PAR TYPE
  genererReponseTypeGenerale(type, userLevel) {
    const responses = {
      fap: `🌪️ **Diagnostic FAP Militant** 🌪️\n\nTon FAP qui déconne ? Je connais ça par cœur !\n\n**La vérité sur le FAP :**\n• 90% se sauvent avec nettoyage 200€\n• Remplacement 2000€ = arnaque dans la plupart des cas\n• Régénération impossible en ville = normal\n\n**À tester d'abord :**\n1. Roulage autoroutier 30min\n2. Vérifier AdBlue et capteurs\n3. Diagnostic OBD précis\n\n💡 **Mon conseil :** Ne laisse personne te dire qu'il faut changer sans avoir testé le nettoyage !`,
      
      freinage: `🚗 **Diagnostic Freinage Militant** 🚗\n\nProblème de freins ? Sécurité importante mais pas de panique !\n\n**Vrais coûts freinage :**\n• Plaquettes : 80-120€ max\n• Disques : 150-250€ si vraiment nécessaire\n• Main d'œuvre : 1h maximum\n\n**Tests gratuits :**\n1. Inspection visuelle épaisseur\n2. Test efficacité parking\n3. Vérification liquide frein\n\n💡 **Anti-arnaque :** Si on te parle de "pack freinage 600€", fuis !`,
      
      voyant: `⚠️ **Diagnostic Voyant Militant** ⚠️\n\nVoyant allumé ? Pas de panique, 90% c'est simple !\n\n**Code couleur :**\n• Orange = pollution/émissions, pas d'urgence\n• Rouge = arrêt immédiat mais souvent réparable\n\n**Procédure honest :**\n1. Diagnostic OBD 60€ max\n2. Réparation ciblée selon code\n3. Pas de "grosse révision" à l'aveugle\n\n💡 **Anti-arnaque :** Diagnostic >100€ = arnaque !`
    };

    let response = responses[type] || this.genererReponseGenerale("", userLevel);
    
    if (userLevel === 0) {
      response += `\n\n🤝 **Guide complet gratuit :**\nTon email → diagnostic approfondi + astuces anti-arnaque !`;
    }

    return {
      content: response,
      type: type,
      confidence: 0.8,
      economic_value: 200
    };
  }

  // 🛠️ RÉPONSE GÉNÉRALE MILITANTE
  genererReponseGenerale(message, userLevel) {
    const response = `🤝 **Julien le Mécano Militant** 🛠️\n\nSalut ! Je vais t'aider avec ton problème auto !\n\n**Ma philosophie :**\n• Je suis du côté de ceux qui galèrent\n• Solutions économiques prioritaires\n• Anti-arnaque systématique\n\n**Pour mieux t'aider, dis-moi :**\n• Symptômes exacts ?\n• Depuis quand ?\n• Marque/modèle ?\n• Voyants allumés ?\n\n💪 **Ma promesse :** Je vais te faire économiser le maximum !`;

    return {
      content: response,
      type: 'general',
      confidence: 0.7,
      economic_value: 100
    };
  }

  // 💰 CALCUL ÉCONOMIE POTENTIELLE
  calculerEconomie(solutionText) {
    const montants = solutionText.match(/(\d+)€/g);
    if (montants) {
      const prix = parseInt(montants[0].replace('€', ''));
      return Math.min(prix * 3, 1000); // Économie = 3x le prix de la solution économique, max 1000€
    }
    return 200; // Défaut
  }

  // 📊 STATISTIQUES D'AIDE
  getStats() {
    return {
      aide_fournie: this.compteurAide,
      specialite: "Militant anti-arnaque",
      economie_moyenne: 350,
      satisfaction: "95% des automobilistes aidés"
    };
  }
}

// Export pour utilisation
export default SimulationMilitanteAvancee;
