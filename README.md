# NeuroPharm Lab

NeuroPharm Lab is a teaching lab for one synapse. Pick a drug, a disease, or both, and watch the bouton, the cleft, and a membrane trace that comes from a small biophysical model.

It is an educational model. It is not medical advice, not a dosing guide, and not a substitute for clinical training. The sliders are unitless on purpose.

## Run it

```bash
npm install
npm run dev
```

The lab is served at [http://127.0.0.1:4317](http://127.0.0.1:4317).

```bash
npm run build
npm run preview
npm run check:sim
```

`check:sim` integrates every drug and disease for a few seconds and checks the teaching contrasts: Parkinson’s against L-DOPA, a benzodiazepine against epilepsy, botulinum toxin against curare, cocaine against amphetamine, and the rest of the library.

## What is on screen

One header, four views.

- **Lab.** The neuron and synapse, the membrane or endplate trace, dose and severity, and a short dossier.
- **Library.** All twelve drugs and seven diseases, and whether the pair shares a synapse.
- **Monograph.** The same dossier, opened up, with the parameters that moved.
- **Compare.** Baseline beside the active condition, same afferent train.

Multiple sclerosis always stays on the axon. A drug and a disease that do not share a transmitter are named, and the drug is left out of the integrator.

## The model

A single-compartment Hodgkin–Huxley cell, voltages shifted so rest sits near −65 mV, plus a cleft:

- Vesicle fill recovers toward a synthesis ceiling and, for amphetamine, drains over a few seconds.
- Release on each afferent spike that arrives: probability × fill × quanta.
- Clearance is reuptake, enzyme, and leak. Receptor current follows the cleft.

Disease is applied first, then the drug. The equation under the trace is the one being integrated. Neuromuscular scenes (curare, botulinum toxin, myasthenia gravis) label the instrument “Endplate potential.”

The afferent train is regular so the sweep stays readable. Dopamine and serotonin modulate a cell that already has a steady drive. That cell is not the basal ganglia and not a mood circuit. The dossier says so.
