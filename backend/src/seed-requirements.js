/**
 * Seed script for functional_requirements.
 * Run: node src/seed-requirements.js
 *
 * Uses the civiq_fr_structured.json data as the initial seed.
 * Wipes the table first, then inserts the full tree.
 */

import dotenv from 'dotenv';
dotenv.config();

import connectDB from './config/database.js';
import Requirement from './models/Requirement.js';

const DATA = {
  "functional_requirements": [
    {
      "id": "FR1",
      "title": "Agent Perception & Individual Q-Value Estimation",
      "description": "Each vehicle in the simulation operates as an independent learning agent. The agent must observe its local environment, encode temporal context across timesteps using a recurrent network, and produce per-action Q-values that represent the estimated utility of each available routing decision.",
      "weight": 10,
      "progress": 85,
      "sub_requirements": [
        {
          "id": "FR1.1",
          "title": "Local Observation Vector Construction",
          "description": "At each decision timestep, the agent must construct a 65-dimensional observation vector composed of three components: (1) 5 ego-state features encoding the vehicle's own speed, position, and routing state; (2) a 48-dimensional one-hot encoded vector representing the current edge the vehicle occupies within the road network; and (3) 12 local traffic context features capturing congestion and flow conditions in the agent's immediate vicinity.",
          "weight": 3,
          "progress": 100
        },
        {
          "id": "FR1.2",
          "title": "DRQN with GRU Hidden State",
          "description": "The agent network must be implemented as a Deep Recurrent Q-Network (DRQN) augmented with a Gated Recurrent Unit (GRU). The GRU hidden state must persist across timesteps within an episode, allowing the agent to retain temporal context and make informed routing decisions under partial observability.",
          "weight": 4,
          "progress": 90
        },
        {
          "id": "FR1.3",
          "title": "Per-Action Q-Value Output",
          "description": "The agent network must output a Q-value for each available routing action (candidate routes), producing a vector of shape (n_actions,) per agent per timestep.",
          "weight": 3,
          "progress": 90
        }
      ]
    },
    {
      "id": "FR2",
      "title": "Training Pipeline Stability",
      "description": "The training loop must be numerically stable and produce a converging loss curve across all training configurations.",
      "weight": 10,
      "progress": 62,
      "sub_requirements": [
        {
          "id": "FR2.1",
          "title": "Reward Normalization",
          "description": "Raw episode rewards in the SUMO traffic environment accumulate to magnitudes on the order of 300,000 per episode, which causes TD error scales that destabilize training.",
          "weight": 4,
          "progress": 65
        },
        {
          "id": "FR2.2",
          "title": "Gradient Norm Control",
          "description": "During training, gradient norms must remain within a controllable range.",
          "weight": 3,
          "progress": 55
        },
        {
          "id": "FR2.3",
          "title": "Target Network Update Schedule",
          "description": "The target network must update on a per-episode basis, not per gradient step.",
          "weight": 3,
          "progress": 100
        }
      ]
    },
    {
      "id": "FR3",
      "title": "Hierarchical Coordination via Two-Stage QMIX Mixing",
      "description": "The core architectural contribution of Civiq. QMIX's single mixing network is decomposed into two sequential mixing stages.",
      "weight": 45,
      "progress": 12,
      "sub_requirements": [
        {
          "id": "FR3.1",
          "title": "RSU Zone Manager",
          "description": "At every simulation timestep, each active vehicle must be assigned to exactly one RSU zone based on its geographic position in the road network.",
          "weight": 8,
          "progress": 30
        },
        {
          "id": "FR3.2",
          "title": "Local RSU Mixer (Level 2)",
          "description": "Each RSU hosts a Local Mixing Network that aggregates the individual Q-values of all vehicles currently assigned to its zone into a single scalar local Q_tot.",
          "weight": 12,
          "progress": 15
        },
        {
          "id": "FR3.3",
          "title": "Global Mixer (Level 3)",
          "description": "The Global Mixer aggregates the local Q_tot scalars from all active RSUs into a single global Q_tot.",
          "weight": 12,
          "progress": 15
        },
        {
          "id": "FR3.4",
          "title": "End-to-End Single-Loss Backpropagation",
          "description": "The entire three-level hierarchy must be trained jointly via a single scalar loss computed at the Global Mixer output.",
          "weight": 13,
          "progress": 0
        }
      ]
    },
    {
      "id": "FR4",
      "title": "Simulation Integration",
      "description": "The framework must interface bidirectionally with the SUMO traffic simulator via the TraCI API.",
      "weight": 8,
      "progress": 80,
      "sub_requirements": [
        {
          "id": "FR4.1",
          "title": "Vehicle State Retrieval via TraCI",
          "description": "At each decision timestep, the system must query SUMO via TraCI to retrieve the current state of all active vehicles.",
          "weight": 4,
          "progress": 90
        },
        {
          "id": "FR4.2",
          "title": "Routing Action Injection",
          "description": "Following the agents' action selection at each decision timestep, the selected route for each vehicle must be injected into the running SUMO simulation via TraCI's rerouting commands.",
          "weight": 4,
          "progress": 80
        }
      ]
    },
    {
      "id": "FR5",
      "title": "Traffic Scenario Generation",
      "description": "The system must support a structured set of experimental conditions covering three levels of traffic density (LOS A, C, E) across three road network maps.",
      "weight": 7,
      "progress": 50,
      "sub_requirements": [
        {
          "id": "FR5.1",
          "title": "LOS-Based Traffic Demand Generation",
          "description": "The system must generate traffic demand scenarios calibrated to three standard Level of Service (LOS) conditions.",
          "weight": 3,
          "progress": 70
        },
        {
          "id": "FR5.2",
          "title": "Per-Map RSU Configuration and Validation",
          "description": "Each of the three maps requires a dedicated RSU configuration file specifying RSU IDs, geographic positions, and coverage radii.",
          "weight": 4,
          "progress": 35
        }
      ]
    },
    {
      "id": "FR6",
      "title": "Comparative Evaluation Protocol",
      "description": "The system must produce statistically valid evaluation results comparing Civiq against two baselines.",
      "weight": 12,
      "progress": 25,
      "sub_requirements": [
        {
          "id": "FR6.1",
          "title": "Selfish Routing Baseline",
          "description": "The selfish routing baseline represents uncoordinated, individualistic driver behavior.",
          "weight": 2,
          "progress": 100
        },
        {
          "id": "FR6.2",
          "title": "Mono QMIX Baseline Training and Evaluation",
          "description": "The Mono QMIX baseline represents a centralized, non-hierarchical application of the QMIX algorithm to the full agent set.",
          "weight": 5,
          "progress": 10
        },
        {
          "id": "FR6.3",
          "title": "Civiq Hierarchical Training and Evaluation",
          "description": "Civiq must be trained and evaluated under the same conditions as the Mono QMIX baseline.",
          "weight": 4,
          "progress": 0
        },
        {
          "id": "FR6.4",
          "title": "Multi-Seed Aggregation and Statistical Reporting",
          "description": "All evaluation results must be aggregated across seeds to produce mean, standard deviation, and 95% confidence interval.",
          "weight": 1,
          "progress": 15
        }
      ]
    },
    {
      "id": "FR7",
      "title": "Data Visualization & Analysis Dashboard",
      "description": "The system must provide a web-based dashboard that presents simulation results in a format accessible to expert evaluators.",
      "weight": 8,
      "progress": 20,
      "sub_requirements": [
        {
          "id": "FR7.1",
          "title": "Routing Effectiveness KPI Display",
          "description": "The dashboard must display the primary routing effectiveness metrics for all evaluated policies side by side.",
          "weight": 3,
          "progress": 20
        },
        {
          "id": "FR7.2",
          "title": "Computational Performance Metrics Display",
          "description": "The dashboard must display system-level computational metrics relevant to the ISO/IEC 25010 Performance Efficiency quality characteristic.",
          "weight": 3,
          "progress": 15
        },
        {
          "id": "FR7.3",
          "title": "ISO/IEC 25010 Compliance Validation",
          "description": "The system and dashboard must be evaluated against ISO/IEC 25010 software quality standards across five quality characteristics.",
          "weight": 2,
          "progress": 5
        }
      ]
    }
  ]
};

async function seed() {
  await connectDB();

  console.log('Clearing existing requirements...');
  await Requirement.deleteAll();

  const insertNode = async (node, parentDbId, index) => {
    const row = await Requirement.create({
      frId:        node.id,
      title:       node.title,
      description: node.description || null,
      weight:      node.weight ?? 0,
      progress:    node.progress ?? 0,
      parentId:    parentDbId || null,
      orderIndex:  index
    });

    const children = node.sub_requirements || [];
    for (let i = 0; i < children.length; i++) {
      await insertNode(children[i], row.id, i);
    }
  };

  const frs = DATA.functional_requirements;
  for (let i = 0; i < frs.length; i++) {
    await insertNode(frs[i], null, i);
    console.log(`  Inserted ${frs[i].id}`);
  }

  console.log(`Done. Seeded ${frs.length} top-level FRs.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
