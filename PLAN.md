# NeuroPharm Lab — plan for review

A static teaching lab for one computer-engineering student learning neuroscience and pharmacology. It shows a single synapse under a chosen drug, disease, or both, and drives a membrane trace from a small biophysical model. It is an educational model, not a clinical tool.

The name is **NeuroPharm Lab**. The mockups in `design/mockups/` are the proposed UI. Nothing in this repo is the application yet.

## Stack

- Vite, React, TypeScript. Static `vite build`, no server, no accounts, no database.
- Canvas 2D for the neuron and the voltage trace, drawn at `devicePixelRatio` so lines stay sharp. One cell and a few dozen particles do not need WebGL.
- Plain CSS. No component library. The chrome is custom.
- React context for the selection, dose, severity, and compare flag. Copy and parameter patches live in typed modules.

## Layout

One app, four views, one header. The header always holds the disease slot, the drug slot, the compare switch, and the words “Not medical advice”.

**Lab.** Three columns. Left: search, Drugs / Diseases, the list, and the severity and dose sliders. Center: the neuron and synapse, then the membrane trace with a few readouts (firing rate, rest, vesicle fill, cleft level) and the equation that is actually integrated. Right: a short dossier — mechanism, what the model changes, effects, side effects, disclaimer.

**Library.** Drugs and diseases in two columns, grouped (monoamines, amino-acid receptors, cholinergic; degeneration, transmission, hypothesis models). A footer composer shows both sliders and whether the pair shares a synapse. “Open in the lab” returns to the stage with that pair loaded.

**Monograph.** The same dossier, opened up. A narrow fact column (class, receptor, ion, clean pairs), a reading column, and an instrument column (miniature synapse, the parameters that moved, the trace). This is the info panel with room to read.

**Compare.** Two panels, baseline and the active condition, same afferent rate. A footer states the window and the deltas (firing, the conductance that moved, cleft transmitter, anything else the condition touched).

Below 1180px the stage stacks above the trace, and the library and monograph become full-height panels. Below 800px the library is a sheet. Sliders stay labeled. Reduced motion freezes vesicles and transmitter dots and keeps the trace.

## Visual style

Dark warm ground (`#0e0f0c`), ivory text, hairline borders, and a brass accent for selection, sliders, and the kicker above a title. The only “live” color on the trace is a pale green. Transmitter color stays on the molecules: dopamine amber, serotonin lilac, GABA blue, acetylcholine green, glutamate coral. Glass is limited to the header, the dossier, and the trace card (a light blur and a translucent fill). The stage itself is open, not a card.

Type is Newsreader for titles and readout numbers, Outfit for the UI. Labels on the drawing are small, tracked, and placed off the membrane with a hairline leader. The caption on the stage says the bouton is enlarged and the drawing is not to scale.

## Simulation

A single-compartment Hodgkin–Huxley cell, textbook sodium, potassium, and leak, voltages shifted so rest sits near −65 mV. Gates use the usual α/β forms. Synaptic current is added:

```
C dV/dt = −gNa m³h (V − ENa) − gK n⁴ (V − EK) − gL (V − EL) + Isyn
```

`Isyn` is whichever of AMPA, NMDA, GABA-A, nicotinic, and a slow modulatory term the scene uses. NMDA keeps the standard magnesium block. Integration is fixed-step (0.02 ms), exponential Euler on the gates, forward Euler on V, sampled to the canvas at 60 fps. The afferent train is regular, so the trace is readable; a later toggle can switch it to Poisson. The default sweep is 400 ms.

The cleft is a separate small system, not a painted animation:

- Vesicle fill `v` recovers toward a synthesis ceiling and is spent by release.
- Release on each afferent spike that actually arrives: `P_rel * v * quanta`.
- `dN/dt = release + reverse_transport − (k_uptake + k_enzyme + k_leak) N`.
- Receptor current follows cleft transmitter, times efficacy, times receptor availability.

Order of operations: start from the synapse’s baseline, apply the disease (severity 0–1), then the drug (dose 0–1), then clamp. Dose and severity use a smooth curve, not a hard step. The sliders are unitless on purpose. They are not milligrams.

Scenes that are a neuromuscular junction (curare, botulinum toxin, myasthenia gravis) relabel the instrument “Endplate potential”. The trace fails to spike when the endplate potential stays below threshold. Central scenes keep “Postsynaptic membrane”. Dopamine and serotonin modulate a cell that already has a steady excitatory drive. The trace is that one cell, not the basal ganglia and not a mood circuit. The dossier says so.

Amphetamine is the one effect that plays out over a few seconds: vesicles pale while dopamine appears in the cleft between spikes. Other conditions settle quickly so the sweep is stable.

Compare integrates baseline and condition side by side.

### When two selections disagree

They compose when they share a transmitter. Depression and an SSRI share serotonin. Parkinson’s and L-DOPA share dopamine. Epilepsy and a benzodiazepine share GABA-A. Alcohol stacks onto GABA-A and onto NMDA, and the UI flags alcohol with a benzodiazepine or an opioid instead of treating that stack as routine.

Multiple sclerosis is the exception that always composes: myelin is on the axon, upstream of whichever synapse is open.

A mismatch (Parkinson’s plus an SSRI, epilepsy plus L-DOPA) does not invent a cell that does both. The lab says which synapse each one needs. Curare or botulinum toxin on myasthenia gravis is allowed and marked as worsening, not as treatment. Cocaine or amphetamine on the schizophrenia model is allowed and marked the same way.

Botulinum toxin and curare are meant to be compared with each other. One stops fusion and the cleft goes empty. The other leaves release intact and blocks the receptor. Both silence the endplate.

## Drugs

Each entry is the class, taught through one prototype. The dose slider is on for all of them.

| Entry | Prototype | Synapse | What the model changes |
| --- | --- | --- | --- |
| SSRI | Sertraline | Serotonin | SERT clearance falls with dose (`k_SERT *= 1 − 0.85 d`). Cleft serotonin rises. A mild 5-HT1A autoreceptor lowers release as the cleft rises, so high dose does not scale forever. The dossier says the clinical delay is plasticity this acute trace does not show. |
| Benzodiazepine | Diazepam | GABA | GABA-A efficacy `*= 1 + 1.6 d` (about ×1.9 at dose 0.55). Release is untouched. If the cleft has no GABA, the drug current is zero. Firing falls (the mockup’s target is 12 Hz → 5 Hz). Spike shape stays. |
| Opioid | Morphine | Glutamate | `P_rel *= 1 − 0.8 d`. A small postsynaptic potassium leak stands in for GIRK. Firing falls. |
| Caffeine | Caffeine | Glutamate, adenosine tone | Blocking A1 removes a tonic brake: `P_rel *= 1 + 0.45 d`, and a small potassium leak shrinks. The rate rises modestly and saturates. |
| Nicotine | Nicotine | Acetylcholine | Nicotinic conductance opens with dose and desensitizes as dose climbs, so firing is non-monotonic. The copy separates this curve from addiction via ventral-tegmental dopamine release. |
| Cocaine | Cocaine | Dopamine | `k_DAT *= 1 − 0.9 d`. Cleft dopamine rises and the slow modulatory current rises. Release stays locked to spikes. Above dose 0.75, `gNa` falls (the local-anesthetic action) and spikes shrink. |
| Amphetamine | Amphetamine | Dopamine | Reverse transport through DAT, and vesicle fill drains over a few seconds (`τ` shortens as dose rises). Cleft dopamine is high between spikes. This is the visual opposite of cocaine. |
| L-DOPA | Levodopa | Dopamine | Raises the synthesis ceiling. On a healthy terminal the rise is modest. On Parkinson’s, fill `= σ + (1 − σ) (1 − e^(−1.4 d))`. At severity 0.80, `σ ≈ 0.22`; dose 0.42 brings fill to about 0.57. DAT and MAO stay active, so the cleft sits a little under the fill. |
| Ketamine | Ketamine | Glutamate | NMDA conductance `*= 1 − 0.92 d`. AMPA is unchanged. The slow plateau shrinks; at high dose the rate falls. Use-dependence is described in the copy. The disinhibition hypothesis (block on interneurons) is named and is not what this one cell shows. |
| Alcohol | Ethanol | GABA and glutamate | GABA-A efficacy `*= 1 + 0.9 d` and NMDA `*= 1 − 0.75 d`. The cell fires less. The copy says behavioral disinhibition is a circuit effect, not “this neuron speeds up”. |
| Botulinum toxin | BoNT/A | Neuromuscular junction | `P_rel` falls toward zero. Vesicles stay docked and do not fuse. The endplate goes quiet. |
| Curare | d-Tubocurarine | Neuromuscular junction | Receptor availability `*= 1 − 0.95 d`. Release and cleft acetylcholine stay. The endplate goes quiet anyway. The copy notes that it does not cross the blood–brain barrier. |

## Diseases

Diseases use a severity slider, not a dose.

| Entry | Synapse | What the model changes |
| --- | --- | --- |
| Parkinson’s disease | Dopamine | Synthesis `σ = 1 − 0.975 s` (about 0.22 at severity 0.80). Vesicles empty out. The modulatory current follows the cleft. Movement is described, not simulated. Pairs with L-DOPA. |
| Alzheimer’s disease | Acetylcholine | Vesicle-pool maximum `*= 1 − 0.7 s` and postsynaptic receptor density `*= 1 − 0.55 s`. Plaques and tau are explained and not drawn. Cholinesterase inhibitors are named and are not in this library. |
| Epilepsy | Glutamate, with a weakened GABA terminal | `g_GABA *= 1 − 0.83 s` (0.40 at severity 0.72) and a persistent sodium conductance `g_NaP = 0.40 s` (0.29 at 0.72). The trace breaks into bursts; the mockup’s target is about 12 Hz regular versus about 30 Hz in bursts. Cleft glutamate rises because more spikes release it. Pairs with a benzodiazepine. This is a teaching hyperexcitability, not a named syndrome. |
| Depression | Serotonin | Synthesis `*= 1 − 0.65 s`. Labeled on screen as a hypothesis model. Pairs with an SSRI: cleft serotonin can recover while each impulse still releases less. The copy says this is not a complete account of the illness. |
| Myasthenia gravis | Neuromuscular junction | Nicotinic receptor density `*= 1 − 0.8 s`. Release stays normal. A repetitive train shows a decremental endplate potential that recovers between trains. Curare and botulinum toxin worsen it. An acetylcholinesterase inhibitor is named and is not in this library. |
| Multiple sclerosis | The axon of whatever synapse is open | Myelin coverage `= 1 − s`. Conduction delay and jitter rise. Above severity about 0.55, spikes start to fail before they reach the bouton. The sheath is drawn with gaps. No drug here remyelinates. |
| Schizophrenia | Dopamine | `P_rel *= 1 + 0.9 s` plus a small tonic leak. Labeled as the mesolimbic hypothesis. Prefrontal under-activity and the NMDA hypothesis are named and not simulated. Cocaine and amphetamine worsen the trace. Antipsychotics are named and are not in this library. |

## Copy

Short, concrete, and willing to say what is simplified. Every dossier has mechanism, the receptor or transporter, what the running model actually changes, effects, and side effects. A standing disclaimer: educational model only, not medical advice, not a dosing guide, not a substitute for clinical training. Parameters are qualitative.

Enzymes are drawn where they sit. Acetylcholinesterase is in the cleft. MAO is inside the terminal. Transporters are on the membrane. A glial leaflet appears for glutamate and GABA uptake.

## Out of scope

No login, no saved classes, no backend. No network model of the basal ganglia, cortex, or spinal cord. No plasma-concentration curve. No drugs beyond the twelve above. No 3D neuron.

## Mockups

Static HTML in `design/mockups/`, generated by `build_pages.py`. They are previews, not the app.

- Lab: Parkinson’s at severity 0.80 with L-DOPA at dose 0.42.
- Library: depression with sertraline, and the rule for pairing.
- Monograph: diazepam at dose 0.55.
- Compare: baseline against epilepsy at severity 0.72, drug slot empty.

## After approval

Build the lab to match this plan and these mockups. Every drug and disease above has to move the running model, including the pairs called out (Parkinson’s with L-DOPA, depression with an SSRI, epilepsy with a benzodiazepine) and the contrasts (botulinum toxin against curare, cocaine against amphetamine). Then build, run, and check the UI visually.
