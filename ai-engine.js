/**
 * FIFA 2026 ArenaOps Command Center - AI Engine
 * Handles local heuristic AI simulation and live Gemini API calls.
 */

const DEFAULT_SYSTEM_PROMPT = `You are the FIFA World Cup 2026 ArenaOps Command Center AI Co-Pilot. 
Your role is to act as an expert stadium operations consultant, real-time safety dispatcher, and multilingual communicator.
You will receive reports of incidents occurring in or around the stadium (e.g., MetLife Stadium re-branded as New York New Jersey Stadium).
You must analyze the incident and return a structured JSON response containing:
1. category: One of "Medical", "Security", "Crowd Control", "Transport", "Weather", "Infrastructure".
2. severity: One of "Low", "Medium", "High", "Critical".
3. summary: A concise, executive summary of the issue.
4. actionPlan: A list of 3-5 immediate, actionable, step-by-step instructions for volunteers, venue staff, and security.
5. volunteerAllocation: Recommendation for dispatching or moving volunteer squads (e.g., "Re-route 5 volunteers from Gate A to Section 214").
6. paAnnouncement: Public Address (PA) announcements to be broadcasted to fans in three languages: English ('en'), Spanish ('es'), and French ('fr').
7. metricsImpact: Estimated operational impacts, specifically safetyChange (number between -30 and 10) and queueTimeChange (number in minutes, between -20 and 45).

Respond ONLY with valid JSON. Do not include markdown code blocks or additional conversational text outside the JSON structure.`;

class ArenaOpsAIEngine {
  constructor() {
    this.liveMode = false;
    this.apiKey = '';
    this.systemPrompt = DEFAULT_SYSTEM_PROMPT;
  }

  setLiveMode(enabled, key) {
    this.liveMode = enabled;
    if (key) this.apiKey = key.trim();
  }

  setSystemPrompt(prompt) {
    if (prompt && prompt.trim()) {
      this.systemPrompt = prompt.trim();
    }
  }

  /**
   * Analyze incident report using local rules or live Gemini API
   * @param {string} incidentText 
   * @returns {Promise<object>} JSON analysis output
   */
  async analyzeIncident(incidentText) {
    if (this.liveMode && this.apiKey) {
      try {
        return await this.callGeminiAPI(incidentText);
      } catch (error) {
        console.error("Gemini API call failed, falling back to local engine:", error);
        return this.analyzeLocally(incidentText + " (Fallback: Gemini API unavailable)");
      }
    } else {
      // Simulate network delay for realistic experience
      await new Promise(resolve => setTimeout(resolve, 800));
      return this.analyzeLocally(incidentText);
    }
  }

  /**
   * Call the live Gemini API
   */
  async callGeminiAPI(incidentText) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
    
    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: `Analyze the following incident: "${incidentText}"` }]
        }
      ],
      systemInstruction: {
        parts: [{ text: this.systemPrompt }]
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            category: { type: "STRING" },
            severity: { type: "STRING", enum: ["Low", "Medium", "High", "Critical"] },
            summary: { type: "STRING" },
            actionPlan: {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            volunteerAllocation: { type: "STRING" },
            paAnnouncement: {
              type: "OBJECT",
              properties: {
                en: { type: "STRING" },
                es: { type: "STRING" },
                fr: { type: "STRING" }
              },
              required: ["en", "es", "fr"]
            },
            metricsImpact: {
              type: "OBJECT",
              properties: {
                safetyChange: { type: "NUMBER" },
                queueTimeChange: { type: "NUMBER" }
              },
              required: ["safetyChange", "queueTimeChange"]
            }
          },
          required: ["category", "severity", "summary", "actionPlan", "volunteerAllocation", "paAnnouncement", "metricsImpact"]
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      const responseText = data.candidates[0].content.parts[0].text;
      return JSON.parse(responseText);
    } else {
      throw new Error("Invalid response structure from Gemini API");
    }
  }

  /**
   * Local rule-based AI simulation
   */
  analyzeLocally(text) {
    const lower = text.toLowerCase();
    
    // Scenario 1: Rain/Storm/Lightning
    if (lower.includes("rain") || lower.includes("storm") || lower.includes("weather") || lower.includes("lightning") || lower.includes("thunderstorm")) {
      return {
        category: "Weather",
        severity: "High",
        summary: "Severe thunderstorm and lightning cells detected within 5 miles of the stadium. Immediate safety protocols required.",
        actionPlan: [
          "Activate 'Concourse Sheltering' protocol. Direct fans in exposed upper deck seats to inner concourses.",
          "Suspend all outdoor activities and operations in the Fan Zone and outer plazas.",
          "Instruct logistics to cover electrical installations at Gate A and Gate D.",
          "Coordinate with transit partners to extend shuttle service schedules in anticipation of match delays."
        ],
        volunteerAllocation: "Re-route 15 volunteers from external parking plazas to assist with crowd management and wayfinding inside the concourses.",
        paAnnouncement: {
          en: "Attention fans: A severe weather warning is in effect. If your seats are in exposed areas, please proceed calmly to the sheltered concourses. The match kickoff is temporarily delayed.",
          es: "Atención aficionados: Se ha emitido una advertencia de clima severo. Si sus asientos están en áreas expuestas, diríjanse con calma a los pasillos cubiertos. El inicio del partido se retrasa temporalmente.",
          fr: "Attention supporters: Une alerte météo majeure est en cours. Si vos places sont dans des zones exposées, veuillez vous diriger calmement vers les coursives abritées. Le coup d'envoi est temporairement retardé."
        },
        metricsImpact: {
          safetyChange: -15,
          queueTimeChange: 20
        }
      };
    }

    // Scenario 2: Ticket Scanner/Gate C Failure
    if (lower.includes("ticket") || lower.includes("scanner") || lower.includes("gate c") || lower.includes("reader") || lower.includes("blackout")) {
      return {
        category: "Infrastructure",
        severity: "High",
        summary: "Network switch failure at Gate C has knocked out 80% of ticket scanning terminals, causing severe ingress bottlenecks.",
        actionPlan: [
          "Dispatch on-site IT Systems team to Gate C server room with a replacement router/switch.",
          "Instruct Gate C security supervisors to transition to offline manual ticket scanning and validation via mobile handhelds.",
          "Deploy mobile queue-management teams to split lines and redirect surplus fans toward Gate B.",
          "Update external LED displays and transit hub bulletins indicating longer wait times at Gate C."
        ],
        volunteerAllocation: "Deploy 8 bilingual volunteers from the Gate A info desk to Gate C to guide fans to Gate B or assist in managing queue lines.",
        paAnnouncement: {
          en: "Operational notice: Gate C is experiencing entry delay due to technical issues. For faster entry, please proceed to Gate B located to your left.",
          es: "Aviso operativo: La Puerta C presenta demoras debido a problemas técnicos. Para un ingreso más rápido, diríjase a la Puerta B, a su izquierda.",
          fr: "Avis opérationnel: La porte C subit des ralentissements en raison d'un problème technique. Pour un accès plus rapide, rendez-vous à la porte B sur votre gauche."
        },
        metricsImpact: {
          safetyChange: -5,
          queueTimeChange: 35
        }
      };
    }

    // Scenario 3: VIP convoy / motorcade
    if (lower.includes("vip") || lower.includes("convoy") || lower.includes("motorcade") || lower.includes("arrival")) {
      return {
        category: "Transport",
        severity: "Medium",
        summary: "Official VIP motorcade arriving in 15 minutes. Roadway security closures will affect the South Transit Hub operations.",
        actionPlan: [
          "Establish temporary security perimeter around VIP Gate (South Stand entrance).",
          "Temporarily halt incoming public shuttle bus arrivals at Loop 1 (reroute to Loop 2).",
          "Coordinate with local police escorts to clear the main access road.",
          "Alert South Stand volunteer leads to monitor VIP arrivals and assist with credentials check."
        ],
        volunteerAllocation: "Move 4 safety volunteers from the inner corridors of East Stand to VIP Gate access checkpoints.",
        paAnnouncement: {
          en: "Notice: Temporary road closures are in place near the South plaza. Transit shuttles are arriving at the North plaza loop. We appreciate your patience.",
          es: "Aviso: Cierres temporales de vías cerca de la plaza Sur. Los traslados en autobús llegarán al circuito de la plaza Norte. Agradecemos su paciencia.",
          fr: "Avis: Des fermetures temporaires de routes sont en cours près de l'esplanade Sud. Les navettes arrivent à l'esplanade Nord. Merci de votre patience."
        },
        metricsImpact: {
          safetyChange: 2,
          queueTimeChange: 10
        }
      };
    }

    // Scenario 4: Medical / Heat / Faint
    if (lower.includes("medical") || lower.includes("heart") || lower.includes("faint") || lower.includes("injury") || lower.includes("heat stroke")) {
      return {
        category: "Medical",
        severity: "High",
        summary: "Fan collapsed due to suspected heat exhaustion in Sector 112 (Lower East Stand). Emergency response initiated.",
        actionPlan: [
          "Dispatch East First Aid Mobile Unit 2 to Sector 112, Row 15.",
          "Instruct nearest volunteer to clear the stairs and walkway for medical responders.",
          "Provide cold water and ice packs from the concession zone immediately to the casualty.",
          "Monitor high-temperature sectors and request water stations to remain open and fully stocked."
        ],
        volunteerAllocation: "Assign 2 volunteers in Sector 112 to meet the medical team at the section entryway and lead them directly to the fan's location.",
        paAnnouncement: {
          en: "Safety tip: Keep hydrated! Water stations are located near all major concession stands. Please report any medical emergencies immediately to a nearby steward.",
          es: "Consejo de seguridad: ¡Manténgase hidratado! Hay estaciones de agua cerca de los puestos de comida. Reporte cualquier emergencia médica al personal de inmediato.",
          fr: "Conseil de sécurité: Restez hydratés! Des points d'eau sont situés près de tous les stands de concession. Signalez toute urgence médicale à un agent."
        },
        metricsImpact: {
          safetyChange: -8,
          queueTimeChange: 0
        }
      };
    }

    // Scenario 5: Security / Fight / Flare
    if (lower.includes("fight") || lower.includes("flare") || lower.includes("smoke") || lower.includes("security") || lower.includes("confrontation")) {
      return {
        category: "Security",
        severity: "Critical",
        summary: "Unapproved smoke flares activated by fans in Sector 204 (Upper West Stand). Physical confrontation breaking out.",
        actionPlan: [
          "Deploy Security Response Squad 3 to Sector 204, Row 10.",
          "Activate local CCTV tracking cameras on Sector 204 for incident recording.",
          "Ensure fire marshal teams are on standby near Sector 204 with extinguishers.",
          "Isolate the active confrontation zone to prevent other fans from getting involved."
        ],
        volunteerAllocation: "Direct 6 safety stewards to establish a barrier at the Sector 204 access tunnel to control the crowd flow and allow security personnel entry.",
        paAnnouncement: {
          en: "Safety alert: Setting off flares and smoke devices is strictly prohibited inside the stadium. Violators will be removed and face immediate legal action.",
          es: "Alerta de seguridad: Está prohibido encender bengalas y dispositivos de humo. Los infractores serán desalojados y procesados de inmediato.",
          fr: "Alerte de sécurité: L'utilisation de fumigènes et de feux d'artifice est interdite dans le stade. Les contrevenants seront expulsés et poursuivis."
        },
        metricsImpact: {
          safetyChange: -25,
          queueTimeChange: 5
        }
      };
    }

    // Scenario 6: Concessions / Food Stall Queue / Power
    if (lower.includes("concession") || lower.includes("food") || lower.includes("stall") || lower.includes("queue") || lower.includes("power failure")) {
      return {
        category: "Infrastructure",
        severity: "Medium",
        summary: "Partial power outage affecting concessions in North Concourse, causing cash registers and food prep units to reset.",
        actionPlan: [
          "Dispatch facility electricians to subpanel panel NC-3 in the North Concourse.",
          "Direct concession operations to transition to cash-only transactions or card-only via battery-powered backups.",
          "Update central digital stadium board directing fans to East and West Concourse food zones.",
          "Ensure backup emergency lighting remains active in the affected corridors."
        ],
        volunteerAllocation: "Assign 5 volunteers to walk the North Concourse, advising fans of the outage and directing them to nearby functioning concession stands.",
        paAnnouncement: {
          en: "Customer service update: Concessions in the North Concourse are experiencing temporary electrical delays. Nearby food stalls in the East Stand remain fully open.",
          es: "Aviso de servicio: Los puestos de comida de la plaza Norte presentan cortes de energía temporales. Los puestos en la tribuna Este están operando normalmente.",
          fr: "Mise à jour service client: Les concessions de la coursive Nord subissent une coupure d'électricité. Les stands de la tribune Est restent ouverts."
        },
        metricsImpact: {
          safetyChange: -2,
          queueTimeChange: 15
        }
      };
    }

    // Scenario 7: Accessibility / Wheelchair / Ramp
    if (lower.includes("accessibility") || lower.includes("wheelchair") || lower.includes("ramp") || lower.includes("elevator") || lower.includes("sensory")) {
      return {
        category: "Crowd Control",
        severity: "Low",
        summary: "High volume of wheelchair users and accessibility requests at Sector 102. Elevators are backing up.",
        actionPlan: [
          "Designate Elevator 3 as 'Accessibility Priority Only' and staff it with a dedicated operator.",
          "Dispatch accessibility ambassadors to Sector 102 entry point to coordinate helpers.",
          "Deploy wheelchair golf carts to assist with ground transit from Gate D parking.",
          "Verify sensory room access is clear of obstructions."
        ],
        volunteerAllocation: "Assign 4 volunteers from the central operations pool to assist fans with mobility impairments in Sector 102 and the accessibility ramp.",
        paAnnouncement: {
          en: "Stadium service: Priority elevators are reserved for fans with accessibility needs and families. We request your co-operation in keeping ramps clear.",
          es: "Servicio del estadio: Los ascensores prioritarios están reservados para personas con movilidad reducida y familias. Agradecemos su colaboración.",
          fr: "Service du stade: Les ascenseurs prioritaires sont réservés aux personnes à mobilité réduite et aux familles. Merci de ne pas encombrer les rampes."
        },
        metricsImpact: {
          safetyChange: 5,
          queueTimeChange: 8
        }
      };
    }

    // Default Fallback Response
    return {
      category: "Crowd Control",
      severity: "Medium",
      summary: `Standard operational incident reported: "${text.substring(0, 80)}${text.length > 80 ? '...' : ''}"`,
      actionPlan: [
        "Assess the exact location of the report and dispatch local supervisors to confirm details.",
        "Inform security control room and volunteers in the vicinity to monitor closely.",
        "Maintain standard crowd flows and keep exits clear.",
        "Log incident updates into the Central ArenaOps system every 5 minutes."
      ],
      volunteerAllocation: "Alert 2 nearby safety volunteers to assess the situation and report back to the command desk.",
      paAnnouncement: {
        en: "Stadium notice: Operations are running smoothly. Please follow instructions from safety stewards and enjoy the match.",
        es: "Aviso del estadio: Las operaciones se desarrollan con normality. Siga las instrucciones de los coordinadores de seguridad.",
        fr: "Avis du stade: Les opérations se déroulent normalement. Veuillez suivre les instructions des stadiers de sécurité."
      },
      metricsImpact: {
        safetyChange: 0,
        queueTimeChange: 2
      }
    };
  }
}

// Attach to window so it is accessible globally in client scripts
window.ArenaOpsAIEngine = ArenaOpsAIEngine;
