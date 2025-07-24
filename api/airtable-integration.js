// api/airtable-integration.js
// Intégration Airtable pour Julien Chatbot - VERSION CORRIGÉE

export default async function handler(request, response) {
    // Autoriser CORS
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    try {
        // Configuration Airtable
        const AIRTABLE_TOKEN = 'patf3ZGIrQfnBsg8a.ab3b4eb79a58c1fbc413fe1ed37948fce5faaa1297a760fbaadf99ebca9341b2';
        const BASE_ID = 'appKdP1OPj7KiSmS0';
        
        // IDs des tables (tes vrais IDs Airtable)
        const TABLES = {
            LEADS: 'tblmdV7eYHqgFaKaX',
            DIAGNOSTICS: 'tbl4SZykL14O1rJ3I', 
            KNOWLEDGE_BASE: 'tblgByZxuT7vp4wW8',
            VEHICULES_SENSIBLES: 'tbldQxCTDVbjSc8iO'
        };

        const { action, data, query } = request.body;

        // Headers Airtable
        const airtableHeaders = {
            'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
            'Content-Type': 'application/json'
        };

        console.log(`🗄️ Airtable ${action}:`, data);

        switch (action) {
            case 'CREATE_LEAD':
                // Créer un nouveau lead
                const leadData = {
                    fields: {
                        'Nom': data.nom,
                        'Telephone': data.telephone,
                        'Email': data.email || '',
                        'Session_ID': data.sessionId,
                        'Date_Contact': new Date().toISOString(),
                        'Probleme_Initial': data.probleme || '',
                        'Vehicule': data.vehicule || '',
                        'Statut_Lead': 'Nouveau',
                        'Source_Lead': data.source || 'Chatbot',
                        'Notes_Suivi': ''
                    }
                };

                const createResponse = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLES.LEADS}`, {
                    method: 'POST',
                    headers: airtableHeaders,
                    body: JSON.stringify(leadData)
                });

                if (!createResponse.ok) {
                    const error = await createResponse.text();
                    console.error('❌ Erreur création lead:', error);
                    return response.status(400).json({ success: false, error });
                }

                const leadResult = await createResponse.json();
                console.log('✅ Lead créé:', leadResult.id);

                return response.status(200).json({
                    success: true,
                    leadId: leadResult.id,
                    message: 'Lead créé avec succès'
                });

            case 'CREATE_DIAGNOSTIC':
                // Créer un diagnostic
                const diagnosticData = {
                    fields: {
                        'Symptomes': data.symptomes,
                        'Marque_Vehicule': data.marque || '',
                        'Annee_Vehicule': data.annee || null,
                        'Codes_Erreur': data.codes || '',
                        'Diagnostic_Julien': data.diagnostic,
                        'Solution_Proposee': data.solution,
                        'Resultat': data.resultat,
                        'Photo_URL': data.photoUrl || ''
                    }
                };

                const diagResponse = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLES.DIAGNOSTICS}`, {
                    method: 'POST',
                    headers: airtableHeaders,
                    body: JSON.stringify(diagnosticData)
                });

                if (!diagResponse.ok) {
                    const error = await diagResponse.text();
                    console.error('❌ Erreur création diagnostic:', error);
                    return response.status(400).json({ success: false, error });
                }

                const diagResult = await diagResponse.json();
                console.log('✅ Diagnostic créé:', diagResult.id);

                return response.status(200).json({
                    success: true,
                    diagnosticId: diagResult.id,
                    message: 'Diagnostic enregistré'
                });

            case 'GET_KNOWLEDGE':
                // 🔧 CORRIGÉ : Récupérer la base de connaissances avec bon format
                console.log('📚 Récupération Knowledge Base...');
                
                const knowledgeResponse = await fetch(
                    `https://api.airtable.com/v0/${BASE_ID}/${TABLES.KNOWLEDGE_BASE}?maxRecords=100`,
                    { headers: airtableHeaders }
                );

                if (!knowledgeResponse.ok) {
                    const error = await knowledgeResponse.text();
                    console.error('❌ Erreur lecture knowledge:', error);
                    return response.status(400).json({ success: false, error });
                }

                const knowledgeResult = await knowledgeResponse.json();
                console.log('📚 Knowledge brute récupérée:', knowledgeResult.records.length, 'entrées');

                // 🔧 FORMAT CORRIGÉ pour correspondre au frontend
                const formattedKnowledge = knowledgeResult.records.map(record => {
                    console.log('🔍 Record brut:', record.fields);
                    
                    return {
                        id: record.id,
                        categorie: record.fields.Categorie || 'Autre',
                        symptomes: record.fields.Symptomes_Cles || '',
                        marques: Array.isArray(record.fields.Marques_Concernees) 
                            ? record.fields.Marques_Concernees.join(', ') 
                            : (record.fields.Marques_Concernees || ''),
                        reponse: record.fields.Reponse_Type || '',
                        arguments: record.fields.Arguments_Commercial || '',
                        cta: record.fields.CTA_Recommande || 'Commander nettoyage Re-Fap',
                        utilisation: record.fields.Utilisation_Count || 0
                    };
                });

                console.log('✅ Knowledge formatée:', formattedKnowledge);

                return response.status(200).json({
                    success: true,
                    knowledge: formattedKnowledge
                });

            case 'GET_VEHICULE_INFO':
                // Récupérer infos véhicule spécifique
                const { marque, modele } = query;
                const vehiculeResponse = await fetch(
                    `https://api.airtable.com/v0/${BASE_ID}/${TABLES.VEHICULES_SENSIBLES}?filterByFormula=AND({Marque}='${marque}',{Modele}='${modele}')`,
                    { headers: airtableHeaders }
                );

                if (!vehiculeResponse.ok) {
                    return response.status(400).json({ success: false, error: 'Erreur lecture véhicule' });
                }

                const vehiculeResult = await vehiculeResponse.json();
                
                if (vehiculeResult.records.length === 0) {
                    return response.status(200).json({
                        success: true,
                        vehiculeInfo: null,
                        message: 'Véhicule non trouvé dans la base'
                    });
                }

                const vehicule = vehiculeResult.records[0].fields;
                
                return response.status(200).json({
                    success: true,
                    vehiculeInfo: {
                        marque: vehicule.Marque,
                        modele: vehicule.Modele,
                        anneeDebut: vehicule.Annee_Debut,
                        anneeFin: vehicule.Annee_Fin,
                        problemes: vehicule.Problemes_Frequents,
                        solutions: vehicule.Solutions_Recommandees,
                        codes: vehicule.Codes_Erreur_Typiques
                    }
                });

            case 'UPDATE_KNOWLEDGE_USAGE':
                // Incrémenter compteur utilisation knowledge
                const { knowledgeId } = data;
                
                // D'abord récupérer l'entrée actuelle
                const currentRecord = await fetch(
                    `https://api.airtable.com/v0/${BASE_ID}/${TABLES.KNOWLEDGE_BASE}/${knowledgeId}`,
                    { headers: airtableHeaders }
                );

                if (currentRecord.ok) {
                    const record = await currentRecord.json();
                    const currentCount = record.fields.Utilisation_Count || 0;

                    // Mettre à jour le compteur
                    const updateResponse = await fetch(
                        `https://api.airtable.com/v0/${BASE_ID}/${TABLES.KNOWLEDGE_BASE}/${knowledgeId}`,
                        {
                            method: 'PATCH',
                            headers: airtableHeaders,
                            body: JSON.stringify({
                                fields: {
                                    'Utilisation_Count': currentCount + 1
                                }
                            })
                        }
                    );

                    if (updateResponse.ok) {
                        console.log('📈 Compteur knowledge mis à jour');
                    }
                }

                return response.status(200).json({ success: true });

            case 'GET_ANALYTICS':
                // 🆕 NOUVEAU : Récupérer analytics
                try {
                    const [leadsResponse, diagnosticsResponse] = await Promise.all([
                        fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLES.LEADS}?maxRecords=100`, { headers: airtableHeaders }),
                        fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLES.DIAGNOSTICS}?maxRecords=100`, { headers: airtableHeaders })
                    ]);

                    if (leadsResponse.ok && diagnosticsResponse.ok) {
                        const leadsData = await leadsResponse.json();
                        const diagnosticsData = await diagnosticsResponse.json();

                        const analytics = {
                            totalLeads: leadsData.records.length,
                            totalDiagnostics: diagnosticsData.records.length,
                            knowledgeEntries: formattedKnowledge ? formattedKnowledge.length : 0,
                            lastUpdate: new Date().toISOString()
                        };

                        return response.status(200).json({
                            success: true,
                            analytics
                        });
                    }
                } catch (error) {
                    console.warn('⚠️ Erreur analytics:', error.message);
                }

                return response.status(200).json({
                    success: true,
                    analytics: { error: 'Données non disponibles' }
                });

            default:
                return response.status(400).json({
                    success: false,
                    error: 'Action non reconnue'
                });
        }

    } catch (error) {
        console.error('💥 Erreur Airtable:', error);
        return response.status(500).json({
            success: false,
            error: 'Erreur serveur Airtable',
            details: error.message
        });
    }
}
