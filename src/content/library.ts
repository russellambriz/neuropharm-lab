import type { DiseaseId, DrugId } from '../model/types.ts'

export const DISCLAIMER =
  'Educational model only. Not medical advice, not a dosing guide, and not a substitute for clinical training. Parameters are qualitative.'

export interface Fact {
  k: string
  v: string
}

interface Common {
  name: string
  kicker: string
  group: string
  line: string
  chip: string
  chipKind: 'da' | 'ht' | 'gaba' | 'ach' | 'glu' | 'mix' | 'axon'
  mechanism: string
  inModel: string
  effects: string
  sideEffects: string
  facts: Fact[]
}

export interface DrugEntry extends Common {
  id: DrugId
  kind: 'drug'
  defaultDose: number
}

export interface DiseaseEntry extends Common {
  id: DiseaseId
  kind: 'disease'
  defaultSeverity: number
}

export const DRUGS: DrugEntry[] = [
  {
    id: 'ssri',
    kind: 'drug',
    name: 'Sertraline',
    kicker: 'SSRI',
    group: 'Monoamines',
    line: 'Blocks the serotonin transporter',
    chip: '5-HT',
    chipKind: 'ht',
    defaultDose: 0.85,
    mechanism:
      'Sertraline blocks SERT, the serotonin transporter. Serotonin stays in the cleft longer and postsynaptic receptors see more of it. A mild 5-HT1A autoreceptor on the terminal then eases further release, so the rise is not unlimited. The mood effect in people takes weeks of plasticity. This trace is only the acute cleft.',
    inModel:
      'The stage is a serotonergic terminal. Dose lowers SERT clearance (k_SERT × (1 − 0.85 d)) and turns on a modest autoreceptor. Vesicle fill does not rise. With depression in the other slot, synthesis stays low and cleft serotonin still recovers partway.',
    effects: 'More serotonin at the synapse. In people: less anxiety for some, and an antidepressant effect that this model does not time out over weeks.',
    sideEffects:
      'Nausea, sexual dysfunction, sleep disruption, and a discontinuation syndrome if stopped abruptly. Combined with an MAOI, serotonin syndrome is the danger. MAO in this drawing is only the enzyme inside the terminal.',
    facts: [
      { k: 'Prototype', v: 'Sertraline' },
      { k: 'Target', v: 'SERT (SLC6A4)' },
      { k: 'Transmitter', v: 'Serotonin' },
      { k: 'Does not', v: 'Refill vesicles' },
    ],
  },
  {
    id: 'cocaine',
    kind: 'drug',
    name: 'Cocaine',
    kicker: 'Monoamine reuptake blocker',
    group: 'Monoamines',
    line: 'Blocks DAT, NET, and SERT',
    chip: 'DA',
    chipKind: 'da',
    defaultDose: 0.9,
    mechanism:
      'Cocaine blocks the dopamine transporter, and also NET and SERT. Dopamine released by spikes lingers. At a high local concentration it also blocks voltage-gated sodium channels, which is why it is a local anesthetic.',
    inModel:
      'A dopaminergic terminal. Dose lowers DAT clearance. Release stays locked to spikes, and vesicles stay full. Above dose 0.75, sodium conductance falls and spikes shrink, then fail.',
    effects: 'A large, brief rise in cleft dopamine. The trace keeps its spike-locked shape until the sodium block arrives.',
    sideEffects: 'Euphoria, vasoconstriction, arrhythmia, seizures, and a strong dependence liability. This is not a therapeutic slider.',
    facts: [
      { k: 'Targets', v: 'DAT, NET, SERT' },
      { k: 'Also', v: 'Nav channels at high dose' },
      { k: 'Transmitter', v: 'Dopamine' },
      { k: 'Release', v: 'Still needs spikes' },
    ],
  },
  {
    id: 'amphetamine',
    kind: 'drug',
    name: 'Amphetamine',
    kicker: 'Releaser',
    group: 'Monoamines',
    line: 'Reverses DAT, empties vesicles',
    chip: 'DA',
    chipKind: 'da',
    defaultDose: 0.55,
    mechanism:
      'Amphetamine is a substrate of DAT and of the vesicular transporter. It collapses the vesicle pH gradient, so dopamine leaks into the cytosol and out through DAT in reverse. Release does not wait for an action potential. Over seconds the vesicles pale.',
    inModel:
      'Reverse transport runs between spikes, and a drain pulls vesicle fill down over a few seconds. Compare this with cocaine: cocaine needs spikes and leaves vesicles full.',
    effects: 'A tonic haze of dopamine in the cleft while the stored pool runs down.',
    sideEffects: 'Wakefulness, appetite loss, raised heart rate and blood pressure, and, at high or repeated doses, psychosis and toxicity.',
    facts: [
      { k: 'Targets', v: 'DAT and VMAT' },
      { k: 'Time course', v: 'Seconds, in this model' },
      { k: 'Transmitter', v: 'Dopamine' },
      { k: 'Contrast', v: 'Cocaine' },
    ],
  },
  {
    id: 'ldopa',
    kind: 'drug',
    name: 'L-DOPA',
    kicker: 'Dopamine precursor',
    group: 'Monoamines',
    line: 'Precursor that refills dopamine',
    chip: 'DA',
    chipKind: 'da',
    defaultDose: 0.42,
    mechanism:
      'Levodopa crosses the blood–brain barrier and is converted to dopamine by aromatic L-amino acid decarboxylase. Dopamine itself does not cross. It is usually given with carbidopa so less of that conversion happens outside the brain.',
    inModel:
      'On a healthy terminal the ceiling rises only modestly. On Parkinson’s, fill = σ + (1 − σ) (1 − e^(−1.4 d)). Severity 0.80 leaves σ near 0.22; dose 0.42 brings fill to about 0.57. DAT and MAO keep clearing dopamine, so the cleft sits a little under the fill.',
    effects: 'Partial return of cleft dopamine. Tremor, rigidity, and bradykinesia are described here and are not simulated as movement.',
    sideEffects: 'Nausea, hypotension, dyskinesia, and, with longer use, confusion or hallucinations. Wearing-off is a slow clinical pattern this acute model does not show.',
    facts: [
      { k: 'Prototype', v: 'Levodopa' },
      { k: 'Enzyme', v: 'AADC, then MAO' },
      { k: 'Pairs with', v: 'Parkinson’s' },
      { k: 'Does not', v: 'Block DAT' },
    ],
  },
  {
    id: 'benzo',
    kind: 'drug',
    name: 'Diazepam',
    kicker: 'Benzodiazepine',
    group: 'Amino-acid receptors',
    line: 'GABA-A modulator, not an agonist',
    chip: 'GABA',
    chipKind: 'gaba',
    defaultDose: 0.55,
    mechanism:
      'Diazepam binds the benzodiazepine site on GABA-A, between an alpha subunit and gamma-2. It does not open the chloride channel by itself. When GABA is also bound, the channel opens more often, chloride current grows, and the membrane sits further from threshold.',
    inModel:
      'A GABAergic synapse onto a cell with a steady excitatory drive. Release is unchanged. Efficacy scales as 1 + 1.6 d, about ×1.9 at dose 0.55. The trace loses spikes. Spike shape, carried by sodium and potassium, stays put. On epilepsy, the same boost works against the weakened inhibitory terminal.',
    effects: 'Sedation, less anxiety, muscle relaxation, and fewer seizures on this cell.',
    sideEffects:
      'Drowsiness, ataxia, anterograde amnesia, and dependence. Stopping suddenly can provoke seizures. Breathing can fail when alcohol or an opioid is added. This lab holds one drug at a time and says so in the copy instead of stacking them.',
    facts: [
      { k: 'Class', v: 'Benzodiazepine' },
      { k: 'Role', v: 'Positive allosteric modulator' },
      { k: 'Receptor', v: 'GABA-A, α–γ2 site' },
      { k: 'Ion', v: 'Chloride' },
      { k: 'Does not bind', v: 'The GABA site itself' },
    ],
  },
  {
    id: 'opioid',
    kind: 'drug',
    name: 'Morphine',
    kicker: 'Opioid',
    group: 'Amino-acid receptors',
    line: 'μ agonist; release falls',
    chip: 'Glu',
    chipKind: 'glu',
    defaultDose: 0.55,
    mechanism:
      'Morphine is an agonist at the μ-opioid receptor, a Gi-coupled receptor. On the terminal it closes calcium channels and opens potassium channels, so less transmitter is released. On the postsynaptic cell a potassium conductance hyperpolarizes the membrane.',
    inModel:
      'A glutamatergic terminal standing in for a pain pathway. Release probability falls as 1 − 0.8 d, and a potassium leak stands in for GIRK. The cleft empties and the cell stops following the afferent.',
    effects: 'Fewer spikes from this excitatory synapse. Analgesia in a person is a circuit result, not this one cell.',
    sideEffects: 'Respiratory depression, constipation, nausea, miosis, tolerance, and dependence. The overdose risk is breathing, not the drawing.',
    facts: [
      { k: 'Prototype', v: 'Morphine' },
      { k: 'Receptor', v: 'μ opioid, Gi/o' },
      { k: 'Synapse', v: 'Glutamatergic' },
      { k: 'Main lever', v: 'Release probability' },
    ],
  },
  {
    id: 'ketamine',
    kind: 'drug',
    name: 'Ketamine',
    kicker: 'NMDA channel blocker',
    group: 'Amino-acid receptors',
    line: 'Blocks the NMDA pore from inside',
    chip: 'NMDA',
    chipKind: 'glu',
    defaultDose: 0.55,
    mechanism:
      'Ketamine blocks the NMDA receptor from inside the pore, an uncompetitive block that prefers the open channel. AMPA receptors are spared. The antidepressant hypothesis — block on inhibitory interneurons, then a glutamate burst — is a circuit claim. This one cell does not show it.',
    inModel:
      'NMDA conductance scales as 1 − 0.92 d. AMPA is untouched. The slow NMDA share of the excitatory current shrinks, and firing falls. Use-dependence is named here and modeled as a dose scale, not a full Markov scheme.',
    effects: 'Less NMDA current. At a high dose the cell misses more of the afferent train. Dissociation and anesthesia are not separate states in the trace.',
    sideEffects: 'Dissociation, sedation, raised blood pressure and heart rate, and, with repeated use, bladder injury.',
    facts: [
      { k: 'Target', v: 'NMDA receptor pore' },
      { k: 'Spared', v: 'AMPA' },
      { k: 'Synapse', v: 'Glutamatergic' },
      { k: 'Not shown', v: 'Interneuron disinhibition' },
    ],
  },
  {
    id: 'alcohol',
    kind: 'drug',
    name: 'Ethanol',
    kicker: 'Alcohol',
    group: 'Amino-acid receptors',
    line: 'Boosts GABA-A and blocks NMDA',
    chip: 'GABA · NMDA',
    chipKind: 'mix',
    defaultDose: 0.5,
    mechanism:
      'Ethanol is a positive modulator at some GABA-A receptors and an inhibitor of NMDA receptors. It also touches other channels. Behavioral disinhibition is a circuit effect. On this cell the two receptor actions quiet firing.',
    inModel:
      'GABA-A efficacy rises as 1 + 0.9 d and NMDA falls as 1 − 0.75 d. A GABA terminal is drawn beside the glutamate terminal. Firing drops. Alcohol is not offered as a treatment when it is paired with epilepsy.',
    effects: 'Fewer spikes. Sedation and incoordination in a person follow from many such cells, plus circuits this lab does not build.',
    sideEffects:
      'Ataxia, respiratory depression, dependence, and withdrawal seizures. Stacked with a benzodiazepine or an opioid, breathing is the risk. This lab has one drug slot, so that stack is warned about in the copy rather than simulated as a second drug.',
    facts: [
      { k: 'Prototype', v: 'Ethanol' },
      { k: 'GABA-A', v: 'Positive modulator' },
      { k: 'NMDA', v: 'Inhibitor' },
      { k: 'Not a therapy', v: 'For seizures' },
    ],
  },
  {
    id: 'nicotine',
    kind: 'drug',
    name: 'Nicotine',
    kicker: 'Nicotinic agonist',
    group: 'Cholinergic and other',
    line: 'Opens nAChRs, then desensitizes them',
    chip: 'ACh',
    chipKind: 'ach',
    defaultDose: 0.35,
    mechanism:
      'Nicotine is an agonist at nicotinic acetylcholine receptors, which are cation channels. Low to moderate occupancy opens them. Higher occupancy desensitizes them, so the dose curve bends back down. Dependence also involves dopamine release in the ventral tegmental area, which this single cholinergic cell does not release.',
    inModel:
      'Agonist drive is d × (1 − desensitization), with desensitization d² / (d² + 0.35²). Firing rises at a moderate dose and falls back as the dose climbs. The curve is the point.',
    effects: 'A non-monotonic firing rate. At the top of the slider the cell is less excited than at the middle.',
    sideEffects: 'Nausea, tachycardia, and dependence. At toxic doses: fasciculations, then a depolarizing block.',
    facts: [
      { k: 'Receptor', v: 'nAChR' },
      { k: 'Ion', v: 'Cations' },
      { k: 'Curve', v: 'Rises, then falls' },
      { k: 'Not shown', v: 'VTA dopamine release' },
    ],
  },
  {
    id: 'caffeine',
    kind: 'drug',
    name: 'Caffeine',
    kicker: 'Adenosine antagonist',
    group: 'Cholinergic and other',
    line: 'Blocks adenosine A1 and A2A',
    chip: 'A1',
    chipKind: 'glu',
    defaultDose: 0.5,
    mechanism:
      'Caffeine blocks adenosine A1 and A2A receptors. A1 is an inhibitory brake on transmitter release and on the postsynaptic cell. Blocking it is disinhibition. Phosphodiesterase inhibition matters at higher doses than a cup of coffee and is not in this model.',
    inModel:
      'Release probability rises as 1 + 0.45 d, and a small extra inward drive stands in for the lost A1 potassium tone. Firing climbs modestly and then levels off.',
    effects: 'A faster trace. Wakefulness in a person is a network result of the same brake coming off.',
    sideEffects: 'Jitter, anxiety, insomnia, and a fast heart rate. Withdrawal is a headache this model does not show.',
    facts: [
      { k: 'Targets', v: 'A1 and A2A' },
      { k: 'Synapse', v: 'Glutamatergic' },
      { k: 'Direction', v: 'Disinhibition' },
      { k: 'Not modeled', v: 'Phosphodiesterase' },
    ],
  },
  {
    id: 'botox',
    kind: 'drug',
    name: 'Botulinum toxin',
    kicker: 'SNARE protease',
    group: 'Cholinergic and other',
    line: 'Cleaves SNAP-25; fusion stops',
    chip: 'ACh',
    chipKind: 'ach',
    defaultDose: 0.85,
    mechanism:
      'Botulinum toxin type A cleaves SNAP-25. Vesicles still sit on the membrane and do not fuse. Acetylcholine never reaches the cleft. The block is catalytic and lasts weeks in tissue. The slider here is a fraction of release left, so you can see the partial state.',
    inModel:
      'A neuromuscular junction. Release probability falls as (1 − d)^1.4. The endplate potential collapses. Compare with curare: there the cleft still fills, and the receptor is the thing that fails.',
    effects: 'A silent endplate. No muscle spike. Clinically, flaccid weakness in the injected muscle.',
    sideEffects: 'Spread of weakness, trouble swallowing, and respiratory paralysis if the toxin travels. This is not a dose to extrapolate.',
    facts: [
      { k: 'Prototype', v: 'BoNT/A' },
      { k: 'Target', v: 'SNAP-25' },
      { k: 'Synapse', v: 'Neuromuscular junction' },
      { k: 'Cleft', v: 'Stays empty' },
    ],
  },
  {
    id: 'curare',
    kind: 'drug',
    name: 'Curare',
    kicker: 'Neuromuscular blocker',
    group: 'Cholinergic and other',
    line: 'Competes with acetylcholine at nAChR',
    chip: 'ACh',
    chipKind: 'ach',
    defaultDose: 0.85,
    mechanism:
      'd-Tubocurarine competes with acetylcholine at the muscle nicotinic receptor. The nerve terminal still releases. The cleft still contains acetylcholine. The receptor is occupied by the antagonist, so the endplate does not reach threshold. Curare does not cross the blood–brain barrier. Someone paralyzed by it is awake unless another drug is added.',
    inModel:
      'Receptor availability falls as 1 − 0.95 d. Release and cleft acetylcholine stay. The instrument is labeled endplate potential, and it stops spiking.',
    effects: 'Flaccid paralysis with an intact nerve terminal. The drawing is the contrast with botulinum toxin.',
    sideEffects: 'Paralysis of the muscles of breathing. Historically an arrow poison. Not a central sedative.',
    facts: [
      { k: 'Prototype', v: 'd-Tubocurarine' },
      { k: 'Receptor', v: 'Muscle nAChR' },
      { k: 'Release', v: 'Intact' },
      { k: 'Does not', v: 'Enter the brain' },
    ],
  },
]

export const DISEASES: DiseaseEntry[] = [
  {
    id: 'parkinsons',
    kind: 'disease',
    name: 'Parkinson’s',
    kicker: 'Dopamine loss',
    group: 'Degeneration',
    line: 'Dopamine neurons lost; vesicles run low',
    chip: 'DA',
    chipKind: 'da',
    defaultSeverity: 0.8,
    mechanism:
      'Parkinson’s disease is the loss of dopamine neurons in the substantia nigra, so the striatum receives less dopamine. The motor picture is slowness, rigidity, a rest tremor, and later postural trouble. Lewy bodies and alpha-synuclein are the pathology. This lab shows only the depleted terminal.',
    inModel:
      'Synthesis falls as σ = 1 − 0.975 s, about 0.22 at severity 0.80. Vesicles empty. The postsynaptic trace is one cell with a standing excitatory drive, not the basal ganglia. L-DOPA in the drug slot refills the same terminal.',
    effects: 'A thin cleft and pale vesicles. Movement is described and not simulated.',
    sideEffects: 'The illness itself: falls, autonomic failure, and, in many people, cognitive change. Treatment side effects live on the L-DOPA page.',
    facts: [
      { k: 'What is lost', v: 'Nigral dopamine neurons' },
      { k: 'Synapse', v: 'Dopaminergic' },
      { k: 'Pairs with', v: 'L-DOPA' },
      { k: 'Not simulated', v: 'Bradykinesia as movement' },
    ],
  },
  {
    id: 'alzheimers',
    kind: 'disease',
    name: 'Alzheimer’s',
    kicker: 'Synapse loss',
    group: 'Degeneration',
    line: 'Cholinergic synapses weaken and drop out',
    chip: 'ACh',
    chipKind: 'ach',
    defaultSeverity: 0.7,
    mechanism:
      'Alzheimer’s disease accumulates amyloid plaques and tau tangles, and synapses disappear. Cholinergic neurons of the basal forebrain are among those lost. Memory fails early. Plaques are not drawn as particles here.',
    inModel:
      'On a cholinergic synapse the vesicle pool scales as 1 − 0.7 s and receptor density as 1 − 0.55 s. Release gets smaller and the end of the synapse responds less. Firing drops.',
    effects: 'A weaker cholinergic signal. Cholinesterase inhibitors, the usual symptomatic drugs, are not in this library.',
    sideEffects: 'The illness: memory loss, and later language, navigation, and behavior. Nothing on this slider is a treatment.',
    facts: [
      { k: 'Synapse', v: 'Cholinergic' },
      { k: 'Also lost', v: 'Synapses generally' },
      { k: 'Named, not included', v: 'AChE inhibitors' },
      { k: 'Not drawn', v: 'Plaques and tau' },
    ],
  },
  {
    id: 'ms',
    kind: 'disease',
    name: 'Multiple sclerosis',
    kicker: 'Demyelination',
    group: 'Degeneration',
    line: 'Myelin lost; conduction slows, then blocks',
    chip: 'Axon',
    chipKind: 'axon',
    defaultSeverity: 0.72,
    mechanism:
      'Multiple sclerosis is immune damage to central myelin. Conduction slows, becomes sensitive to heat, and then blocks. The synapse at the end of the axon can be otherwise ordinary.',
    inModel:
      'Myelin coverage is 1 − s. Delay and jitter rise with severity. Above about 0.55, spikes start to fail before they reach the bouton. This lesion stays on the axon no matter which drug you pair with it. No drug here remyelinates.',
    effects: 'A late, unreliable afferent. The sheath is drawn with gaps. Symptoms in a person depend on which tract was hit.',
    sideEffects: 'The illness: weakness, numbness, optic neuritis, and fatigue. Uhthoff’s phenomenon (worse conduction when warm) is real and not in the equations.',
    facts: [
      { k: 'Lesion', v: 'Central myelin' },
      { k: 'Composes with', v: 'Any synapse' },
      { k: 'Above ~0.55', v: 'Conduction block' },
      { k: 'Not in the library', v: 'A remyelinating drug' },
    ],
  },
  {
    id: 'epilepsy',
    kind: 'disease',
    name: 'Epilepsy',
    kicker: 'Hyperexcitability',
    group: 'Transmission',
    line: 'Inhibition down, persistent sodium up',
    chip: 'GABA',
    chipKind: 'glu',
    defaultSeverity: 0.72,
    mechanism:
      'Epilepsy is many diseases. This page is a teaching cell, not a syndrome: inhibition is weakened and a persistent sodium current keeps the membrane near threshold, so one afferent volley becomes a burst.',
    inModel:
      'GABA-A scales as 1 − 0.83 s (0.40 at severity 0.72). Persistent sodium is 0.40 s. The trace should break into bursts. A benzodiazepine raises GABA-A efficacy and can pull the rate back. Alcohol is not treated as a therapy.',
    effects: 'Bursts instead of a one-to-one response. Seizures in a person are a population event.',
    sideEffects: 'The illness: seizures, injury, and drug burden. This slider is not a diagnosis.',
    facts: [
      { k: 'Scene', v: 'Glutamate plus a GABA terminal' },
      { k: 'GABA-A', v: 'Reduced' },
      { k: 'Added', v: 'Persistent sodium' },
      { k: 'Pairs with', v: 'Diazepam' },
    ],
  },
  {
    id: 'myasthenia',
    kind: 'disease',
    name: 'Myasthenia gravis',
    kicker: 'Receptor antibodies',
    group: 'Transmission',
    line: 'Antibodies remove muscle ACh receptors',
    chip: 'ACh',
    chipKind: 'ach',
    defaultSeverity: 0.7,
    mechanism:
      'Myasthenia gravis is autoantibodies against the muscle nicotinic receptor, or less often against MuSK or LRP4. The nerve releases acetylcholine normally. Too few receptors remain, endplate potentials shrink, and transmission fails as a train goes on. People fatigue.',
    inModel:
      'Receptor density scales as 1 − 0.8 s. Release is normal. The afferent is a repetitive train, and a fatigue variable pulls the remaining receptors down within the train, then lets them recover. Curare or botulinum toxin on this junction is marked as worsening, not treatment. Acetylcholinesterase inhibitors help clinically and are not in this library.',
    effects: 'Endplate spikes drop out, especially late in a train.',
    sideEffects: 'The illness: fatigable weakness of eyes, face, limbs, and, in a crisis, breathing.',
    facts: [
      { k: 'Synapse', v: 'Neuromuscular junction' },
      { k: 'Release', v: 'Normal' },
      { k: 'Lost', v: 'nAChR' },
      { k: 'Named, not included', v: 'AChE inhibitors' },
    ],
  },
  {
    id: 'depression',
    kind: 'disease',
    name: 'Depression',
    kicker: 'Hypothesis model',
    group: 'Hypothesis models',
    line: 'Teaching model of low serotonergic tone',
    chip: '5-HT',
    chipKind: 'ht',
    defaultSeverity: 0.6,
    mechanism:
      'Depression is not a single synaptic lesion. The monoamine hypothesis says serotonergic and noradrenergic transmission run low. It is incomplete: stress, inflammation, and plasticity all matter. This page simulates only the serotonin piece, and it is labeled as a hypothesis.',
    inModel:
      'Serotonin synthesis scales as 1 − 0.65 s. Vesicles are partly empty. An SSRI does not fix synthesis. It slows reuptake, so the cleft can recover while each impulse still releases less. The clinical delay of weeks is not on this trace.',
    effects: 'A quieter serotonergic cleft. Mood is not an output of the cell.',
    sideEffects: 'The illness is suffering, not a side effect of the model. Do not read the slider as a measure of anyone’s depression.',
    facts: [
      { k: 'Frame', v: 'Monoamine hypothesis' },
      { k: 'Synapse', v: 'Serotonergic' },
      { k: 'Pairs with', v: 'Sertraline' },
      { k: 'Not the whole illness', v: 'Plasticity, stress, inflammation' },
    ],
  },
  {
    id: 'schizophrenia',
    kind: 'disease',
    name: 'Schizophrenia',
    kicker: 'Hypothesis model',
    group: 'Hypothesis models',
    line: 'Teaching model of excess mesolimbic dopamine',
    chip: 'DA',
    chipKind: 'da',
    defaultSeverity: 0.65,
    mechanism:
      'One hypothesis of schizophrenia is too much dopamine in mesolimbic circuits, alongside too little in prefrontal cortex. NMDA hypofunction is another. This page simulates only the mesolimbic excess, and says so.',
    inModel:
      'Release probability rises as 1 + 0.9 s, and a tonic leak adds dopamine between spikes. Cocaine or amphetamine pushes the cleft higher and is marked as worsening. Antipsychotics, mostly D2 antagonists, are the clinical class and are not in this library.',
    effects: 'A louder dopaminergic cleft. Positive symptoms are not spikes on this trace. The prefrontal deficit is not drawn.',
    sideEffects: 'The illness is not a drug side effect. The model will not invent an antipsychotic it does not contain.',
    facts: [
      { k: 'Frame', v: 'Mesolimbic dopamine hypothesis' },
      { k: 'Synapse', v: 'Dopaminergic' },
      { k: 'Worsened by', v: 'Cocaine, amphetamine' },
      { k: 'Named, not included', v: 'D2 antagonists' },
    ],
  },
]

export function drugById(id: DrugId): DrugEntry {
  return DRUGS.find((d) => d.id === id)!
}

export function diseaseById(id: DiseaseId): DiseaseEntry {
  return DISEASES.find((d) => d.id === id)!
}

export const DRUG_GROUPS = ['Monoamines', 'Amino-acid receptors', 'Cholinergic and other'] as const
export const DISEASE_GROUPS = ['Degeneration', 'Transmission', 'Hypothesis models'] as const
