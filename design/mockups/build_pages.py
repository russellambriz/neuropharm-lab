#!/usr/bin/env python3
"""Render static HTML mockups of NeuroPharm Lab. Not the application."""

from __future__ import annotations

import math
from pathlib import Path

OUT = Path(__file__).resolve().parent

INK = "#e7e0d4"
MEM = "#e7e0d4"
DA = "#e4a45c"
GLU = "#e3947c"
GABA = "#a9c6de"
SIGNAL = "#dff6b0"
SOFT = "rgba(231,224,212,0.45)"


def kernel(dt: float) -> float:
    if dt < 0 or dt > 12:
        return 0.0
    if dt < 0.35:
        return 100 * (dt / 0.35)
    if dt < 1.3:
        a = (dt - 0.35) / 0.95
        return 100 + (-14 - 100) * a
    if dt < 6.5:
        a = (dt - 1.3) / 5.2
        return -14 * (1 - a)
    return 0.0


def series(spikes, rest=-65.0, t1=400.0, step=0.4, ripple=0.55):
    pts = []
    n = int(round(t1 / step)) + 1
    for i in range(n):
        t = i * step
        delta = sum(kernel(t - s) for s in spikes)
        v = rest + delta + ripple * math.sin(t / 19.0) + 0.28 * math.sin(t / 7.0)
        pts.append((t, max(-90.0, min(45.0, v))))
    return pts


def poly(pts, W, H, left, top, right, bottom, t1=400.0) -> str:
    span = H - top - bottom
    width = W - left - right
    bits = []
    for t, v in pts:
        x = left + (t / t1) * width
        y = top + (40 - v) / 130 * span
        bits.append(f"{x:.1f},{y:.1f}")
    return " ".join(bits)


BASE = series([24, 108, 192, 276, 360])
PARK = series([28, 140, 252, 364], ripple=0.4)
EPI_SPIKES = []
for origin in (18, 112, 206, 300):
    EPI_SPIKES += [origin, origin + 7, origin + 14]
EPI = series(EPI_SPIKES, rest=-60.5, ripple=0.9)
DIAZ = series([50, 230], rest=-70, ripple=0.35)

P_PARK = poly(PARK, 860, 188, 46, 14, 12, 22)
P_BASE = poly(BASE, 720, 168, 36, 10, 8, 18)
P_EPI = poly(EPI, 720, 168, 36, 10, 8, 18)
P_DIAZ = poly(DIAZ, 480, 132, 28, 8, 8, 14)


def page(title: str, tone: str, body: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>{title}</title>
  <link rel="stylesheet" href="studio.css" />
</head>
<body>
  <div class="screen {tone}">
{body}
  </div>
</body>
</html>
"""


def brand() -> str:
    return """
    <div class="brand">
      <span class="brand-mark">NeuroPharm Lab</span>
    </div>"""


def switch(on: bool) -> str:
    cls = "switch on" if on else "switch"
    return f'<div class="{cls}"><i></i>Compare</div>'


def slot(k: str, v: str, dose: str | None = None, ghost: bool = False) -> str:
    dose_html = f'<span class="dose">{dose}</span>' if dose else ""
    cls = "slot ghost" if ghost else "slot"
    return f'<div class="{cls}"><span class="k">{k}</span><span class="v">{v}</span>{dose_html}</div>'


def top(center: str, right: str) -> str:
    return f"""
    <header class="top">
      {brand()}
      <div class="top-center">{center}</div>
      <div class="top-right">{right}<div class="top-note">Not medical advice</div></div>
    </header>"""


def vesicle(cx, cy, kind, color):
    if kind == "full":
        return (
            f'<g>'
            f'<circle cx="{cx}" cy="{cy}" r="7.2" fill="{color}" fill-opacity="0.88" stroke="{color}" stroke-width="0.6"/>'
            f'<path d="M{cx-3} {cy-2} a3.2 3.2 0 0 1 3.4-2.2" fill="none" stroke="#fff" stroke-opacity="0.45" stroke-width="0.8"/>'
            f'</g>'
        )
    if kind == "empty":
        return f'<circle cx="{cx}" cy="{cy}" r="7.2" fill="none" stroke="{INK}" stroke-opacity="0.28" stroke-width="1"/>'
    return ""


def gpcr(x, y, color):
    return f'''<g transform="translate({x} {y})">
      <rect x="0" y="-10" width="15" height="20" rx="4" fill="#12140f" stroke="{color}" stroke-width="1.15"/>
      <path d="M7.5 10 v8" fill="none" stroke="{color}" stroke-width="1"/>
      <circle cx="7.5" cy="20.5" r="2.1" fill="{color}"/>
    </g>'''


def lgic(x, y, color, blocked=False, hot=False):
    if blocked:
        pore = f'<path d="M3 -5 L12 5 M12 -5 L3 5" stroke="{color}" stroke-width="1.1" fill="none"/>'
    else:
        op = "0.95" if hot else "0.55"
        pore = f'<circle cx="7.5" cy="0" r="2.3" fill="{color}" opacity="{op}"/>'
    return f'''<g transform="translate({x} {y})">
      <rect x="0" y="-12" width="15" height="24" rx="3.5" fill="#12140f" stroke="{color}" stroke-width="1.15"/>
      {pore}
    </g>'''


def myelin(x, y, w=56, h=22):
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h/2}" fill="#171910" stroke="#c9c1b3" stroke-width="1"/>'
        f'<rect x="{x+7}" y="{y+4}" width="{w-14}" height="{h-8}" rx="{(h-8)/2}" fill="none" stroke="#3e4036" stroke-width="0.8"/>'
    )


def label(x, y, text, anchor="start"):
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-size="11" letter-spacing="1.6">{text}</text>'


def leader(x1, y1, x2, y2):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{SOFT}" stroke-width="0.7"/>'


NEURON = f'''<svg viewBox="0 0 900 430" class="lab-svg">
  <ellipse cx="690" cy="214" rx="46" ry="78" fill="{DA}" opacity="0.08"/>
  <g fill="none" stroke="{MEM}" stroke-width="1.15" stroke-linecap="round">
    <path d="M74 176 C46 154 34 118 22 78"/>
    <path d="M42 132 C26 112 30 92 14 74"/>
    <path d="M64 198 C28 194 12 176 2 140"/>
    <path d="M70 236 C36 258 26 302 12 344"/>
    <path d="M98 250 C90 292 114 334 82 382"/>
    <path d="M108 168 C100 132 122 100 104 64"/>
    <path d="M92 96 C78 84 70 70 62 48"/>
  </g>
  <path d="M108 214 H430" stroke="{MEM}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
  {myelin(176, 203)}
  {myelin(246, 203)}
  {myelin(316, 203)}
  {myelin(386, 203)}
  <circle cx="108" cy="214" r="46" fill="#12130f" stroke="{MEM}" stroke-width="1.35"/>
  <circle cx="108" cy="214" r="14" fill="none" stroke="#4a4c42" stroke-width="1"/>
  <path d="M432 214
           C452 162 508 136 562 150
           C618 164 642 198 636 230
           C630 268 592 298 540 292
           C488 286 452 258 432 214 Z"
        fill="#14160f" stroke="{MEM}" stroke-width="1.3"/>
  {"".join(vesicle(x, y, "full", DA) for x, y in [
      (470, 190), (494, 176), (518, 190), (546, 178),
      (484, 214), (510, 214), (538, 208),
  ])}
  {"".join(vesicle(x, y, "empty", DA) for x, y in [
      (566, 196), (588, 186), (572, 222), (596, 236), (548, 238),
  ])}
  <path d="M612 202 C612 194 628 194 632 206 C636 218 626 226 616 222"
        fill="{DA}" fill-opacity="0.22" stroke="{DA}" stroke-width="1.15"/>
  <g fill="{DA}">
    <circle cx="652" cy="198" r="2.4"/>
    <circle cx="664" cy="212" r="2.2" opacity="0.9"/>
    <circle cx="654" cy="226" r="2"/>
    <circle cx="672" cy="230" r="1.7" opacity="0.75"/>
    <circle cx="646" cy="214" r="1.6" opacity="0.7"/>
  </g>
  <g transform="translate(568 150) rotate(-16)">
    <rect x="0" y="0" width="26" height="12" rx="3" fill="#14160f" stroke="{DA}" stroke-width="1"/>
    <path d="M8 12 v7 M5 16 l3 4 3-4" fill="none" stroke="{DA}" stroke-width="1"/>
  </g>
  <g transform="translate(496 252)">
    <polygon points="9,0 18,5 18,15 9,20 0,15 0,5" fill="none" stroke="{DA}" stroke-width="1"/>
  </g>
  <path d="M724 108 C706 168 706 262 726 328" fill="none" stroke="{MEM}" stroke-width="2.5" stroke-linecap="round"/>
  {"".join(gpcr(712, y, DA) for y in (156, 196, 236, 276))}
  {leader(154, 250, 188, 378)}
  {label(196, 390, "SOMA")}
  {leader(274, 186, 274, 202)}
  {label(284, 180, "MYELIN")}
  {leader(239, 226, 239, 252)}
  {label(248, 266, "NODE")}
  {leader(530, 118, 530, 136)}
  {label(530, 110, "BOUTON", "middle")}
  {leader(500, 292, 456, 332)}
  {label(430, 346, "VESICLES")}
  {leader(676, 108, 676, 168)}
  {label(656, 100, "CLEFT")}
  {leader(598, 156, 642, 132)}
  {label(648, 128, "DAT")}
  {leader(514, 272, 608, 356)}
  {label(600, 368, "MAO")}
  {leader(734, 216, 778, 216)}
  {label(786, 220, "D2")}
</svg>'''


def closeup(mode: str) -> str:
    weak = mode == "epi"
    gaba_op = "0.32" if weak else "1"
    glu_dots = [
        (392, 150), (406, 166), (398, 182), (414, 196),
    ]
    if weak:
        glu_dots += [(424, 158), (418, 176), (430, 188), (408, 206), (436, 172)]
    vesicles = [(300, 156), (324, 148), (348, 160), (316, 176), (342, 182), (328, 198), (354, 196)]
    dots = "".join(
        f'<circle cx="{x}" cy="{y}" r="2.3" fill="{GLU}" opacity="0.9"/>' for x, y in glu_dots
    )
    gaba_ves = "".join(
        vesicle(x, y, "full", GABA) for x, y in [(214, 62), (232, 54), (228, 74)]
    )
    return f'''<svg viewBox="0 0 640 300" class="lab-svg">
  <g opacity="{gaba_op}">
    <path d="M250 86 C236 48 196 40 176 58 C156 76 168 104 196 104 C214 104 236 96 250 86 Z"
          fill="#14160f" stroke="{GABA}" stroke-width="1.15"/>
    {gaba_ves}
    <circle cx="262" cy="78" r="2" fill="{GABA}"/>
    <circle cx="272" cy="90" r="1.8" fill="{GABA}" opacity="0.8"/>
    {lgic(286, 78, GABA, hot=not weak)}
  </g>
  <path d="M16 176 H250" stroke="{MEM}" stroke-width="1.5" fill="none"/>
  {myelin(48, 165, 52, 22)}
  {myelin(118, 165, 52, 22)}
  <path d="M248 176
           C262 132 312 112 360 124
           C408 136 428 164 422 190
           C416 220 384 244 338 240
           C292 236 260 214 248 176 Z"
        fill="#14160f" stroke="{MEM}" stroke-width="1.25"/>
  {"".join(vesicle(x, y, "full", GLU) for x, y in vesicles)}
  <path d="M400 162 C404 154 418 154 420 166 C422 176 412 182 404 178"
        fill="{GLU}" fill-opacity="0.2" stroke="{GLU}" stroke-width="1.1"/>
  {dots}
  <path d="M520 78 C500 130 500 230 522 286" fill="none" stroke="{MEM}" stroke-width="2.4" stroke-linecap="round"/>
  {"".join(lgic(498, y, GLU, hot=weak) for y in (132, 168, 204, 240))}
  <path d="M430 250 C470 268 500 292 548 300" fill="none" stroke="{INK}" stroke-opacity="0.35" stroke-width="1.2"/>
  <rect x="548" y="292" width="22" height="11" rx="3" fill="#12140f" stroke="{INK}" stroke-opacity="0.55"/>
  {label(300, 68, "GLUTAMATE", "middle")}
  {label(448, 78, "CLEFT")}
  {label(548, 64, "AMPA")}
  {label(560, 236, "EAAT")}
  {leader(118, 46, 176, 62)}
  {label(16, 42, "GABA · REDUCED" if weak else "GABA", "start")}
</svg>'''


def sweep(points, W, H, left, thr, zero_y, low_y, color=SIGNAL):
    width_end = W - 10
    return f'''<svg viewBox="0 0 {W} {H}" class="lab-svg">
  <line x1="{left}" y1="{zero_y}" x2="{width_end}" y2="{zero_y}" stroke="rgba(231,224,212,0.08)"/>
  <line x1="{left}" y1="{thr}" x2="{width_end}" y2="{thr}" stroke="rgba(231,224,212,0.28)" stroke-dasharray="2.5 3.5"/>
  <text x="4" y="{zero_y+3}" font-size="10" letter-spacing="0.4">0</text>
  <text x="4" y="{low_y}" font-size="10" letter-spacing="0.4">−80</text>
  <text x="{width_end-52}" y="{thr-4}" font-size="10" letter-spacing="1.2">THRESHOLD</text>
  <polyline points="{points}" fill="none" stroke="{color}" stroke-width="6" stroke-opacity="0.16" stroke-linejoin="round" stroke-linecap="round"/>
  <polyline points="{points}" fill="none" stroke="{color}" stroke-width="1.55" stroke-linejoin="round" stroke-linecap="round"/>
  <text x="{left}" y="{H-4}" font-size="10" letter-spacing="0.6">0</text>
  <text x="{(left+width_end)/2}" y="{H-4}" font-size="10" letter-spacing="0.6" text-anchor="middle">200 ms</text>
  <text x="{width_end}" y="{H-4}" font-size="10" letter-spacing="0.6" text-anchor="end">400 ms</text>
</svg>'''


def y_of(v, H, top, bottom):
    return top + (40 - v) / 130 * (H - top - bottom)


MAIN_SWEEP = sweep(P_PARK, 860, 188, 46, y_of(-55, 188, 14, 22), y_of(0, 188, 14, 22), y_of(-80, 188, 14, 22))
BASE_SWEEP = sweep(P_BASE, 720, 168, 36, y_of(-55, 168, 10, 18), y_of(0, 168, 10, 18), y_of(-80, 168, 10, 18))
EPI_SWEEP = sweep(P_EPI, 720, 168, 36, y_of(-55, 168, 10, 18), y_of(0, 168, 10, 18), y_of(-80, 168, 10, 18))
DIAZ_SWEEP = sweep(P_DIAZ, 480, 132, 28, y_of(-55, 132, 8, 14), y_of(0, 132, 8, 14), y_of(-80, 132, 8, 14))


def slider(title: str, value: str, pct: int, hint: str) -> str:
    return f'''
    <div class="tune">
      <div class="tune-top"><span>{title}</span><b>{value}</b></div>
      <div class="track"><div class="fill" style="width:{pct}%"></div><div class="thumb" style="left:{pct}%"></div></div>
      <p class="hint">{hint}</p>
    </div>'''


SEARCH = '''<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="6" cy="6" r="4.1" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M9.2 9.2 L12.2 12.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>'''


def chip(text: str, kind: str) -> str:
    return f'<span class="chip"><i class="dot {kind}"></i>{text}</span>'


def entry(name, line, kind, label, on=False) -> str:
    cls = "entry on" if on else "entry"
    return f'<div class="{cls}"><div class="name">{name}</div><div class="line">{line}</div>{chip(label, kind)}</div>'


def main_page() -> str:
    items = [
        ("Parkinson’s", "DA", True),
        ("Alzheimer’s", "ACh", False),
        ("Epilepsy", "GABA", False),
        ("Depression", "5-HT", False),
        ("Myasthenia gravis", "ACh", False),
        ("Multiple sclerosis", "Axon", False),
        ("Schizophrenia", "DA", False),
    ]
    rows = []
    for name, meta, on in items:
        cls = "item on" if on else "item"
        rows.append(
            f'<div class="{cls}"><span class="name">{name}</span><span class="meta">{meta}</span></div>'
        )
    body = f'''
    {top(
        slot("Disease", "Parkinson’s", "0.80") + slot("Drug", "L-DOPA", "0.42"),
        switch(False),
    )}
    <div class="workspace">
      <aside class="rail">
        <div class="search">{SEARCH} Search the library</div>
        <div class="tabs"><div class="tab">Drugs</div><div class="tab on">Diseases</div></div>
        <div class="list">{''.join(rows)}</div>
        <div class="paired">
          <div class="paired-label">Paired on this synapse</div>
          {slider("Severity · Parkinson’s", "0.80", 80, "Synthesis left near 22% of a healthy terminal.")}
          {slider("Dose · L-DOPA", "0.42", 42, "Vesicle fill climbs back to about 0.57.")}
        </div>
      </aside>
      <section class="stage-col">
        <div class="stage">
          {NEURON}
          <div class="stage-caption">Schematic · bouton enlarged · not to scale</div>
          <div class="legend">
            <span><i class="pip fill"></i>Dopamine in a vesicle</span>
            <span><i class="pip empty"></i>Empty vesicle</span>
            <span><i class="pip cleft"></i>In the cleft</span>
          </div>
        </div>
        <div class="trace-card">
          <div class="trace-head">
            <h2>Postsynaptic membrane</h2>
            <p>Hodgkin–Huxley teaching cell · dopaminergic modulation</p>
          </div>
          <div class="meters">
            <div class="meter"><b>9</b><span>Hz firing</span></div>
            <div class="meter"><b>−65</b><span>mV rest</span></div>
            <div class="meter"><b>0.57</b><span>Vesicle fill</span></div>
            <div class="meter"><b>0.54</b><span>Cleft dopamine</span></div>
          </div>
          {MAIN_SWEEP}
          <p class="eq">C dV/dt = −gNa m³h (V−ENa) − gK n⁴ (V−EK) − gL (V−EL) + Isyn</p>
        </div>
      </section>
      <aside class="dossier">
        <p class="kicker">Dopamine precursor</p>
        <h1>L-DOPA</h1>
        <p class="subhead">With Parkinson’s disease · levodopa on a depleted dopaminergic terminal.</p>
        <div class="block">
          <h3>Mechanism</h3>
          <p>Levodopa crosses the blood–brain barrier and is converted to dopamine by aromatic L-amino acid decarboxylase. Dopamine itself does not cross. It is usually paired with carbidopa, which limits that conversion outside the brain.</p>
        </div>
        <div class="block">
          <h3>In this model</h3>
          <p>Severity 0.80 leaves synthesis near 22%. Dose 0.42 restores vesicle fill to about 0.57. DAT on the membrane and MAO inside the terminal still clear dopamine. The trace is one postsynaptic cell with a steady excitatory drive, not a basal-ganglia network.</p>
        </div>
        <div class="block">
          <h3>Effects</h3>
          <p>Cleft dopamine and the slow modulatory current partly return. Tremor, rigidity, and bradykinesia are described here; movement is not simulated.</p>
        </div>
        <div class="block">
          <h3>Side effects</h3>
          <p>Nausea, hypotension, dyskinesia, and, with longer use, confusion or hallucinations. Wearing-off is a clinical time course this acute model does not show.</p>
        </div>
        <p class="disclaimer">Educational model only. Not medical advice, not a dosing guide, and not a substitute for clinical training. Parameters are qualitative.</p>
      </aside>
    </div>'''
    return page("NeuroPharm Lab — lab", "tone-da", body)


DRUGS = [
    ("Monoamines", [
        ("Sertraline", "Blocks the serotonin transporter", "ht", "5-HT", True),
        ("Cocaine", "Blocks DAT, NET, and SERT", "da", "DA", False),
        ("Amphetamine", "Reverses DAT, empties vesicles", "da", "DA", False),
        ("L-DOPA", "Precursor that refills dopamine", "da", "DA", False),
    ]),
    ("Amino-acid receptors", [
        ("Diazepam", "GABA-A modulator, not an agonist", "gaba", "GABA", False),
        ("Morphine", "μ agonist; calcium-dependent release falls", "glu", "Glu", False),
        ("Ketamine", "Blocks the NMDA pore from inside", "glu", "NMDA", False),
        ("Ethanol", "Boosts GABA-A and blocks NMDA", "mix", "GABA · NMDA", False),
    ]),
    ("Cholinergic and other", [
        ("Nicotine", "Opens nAChRs, then desensitizes them", "ach", "ACh", False),
        ("Caffeine", "Blocks adenosine A1 and A2A", "ach", "A1", False),
        ("Botulinum toxin", "Cleaves SNAP-25; fusion stops", "ach", "ACh", False),
        ("Curare", "Competes with acetylcholine at nAChR", "ach", "ACh", False),
    ]),
]

DISEASES = [
    ("Degeneration", [
        ("Parkinson’s", "Dopamine neurons lost; vesicles run low", "da", "DA", False),
        ("Alzheimer’s", "Cholinergic synapses weaken and drop out", "ach", "ACh", False),
        ("Multiple sclerosis", "Myelin lost; conduction slows, then blocks", "axon", "Axon", False),
    ]),
    ("Transmission", [
        ("Epilepsy", "Inhibition down, persistent sodium up", "glu", "GABA", False),
        ("Myasthenia gravis", "Antibodies remove muscle ACh receptors", "ach", "ACh", False),
    ]),
    ("Hypothesis models", [
        ("Depression", "Teaching model of low serotonergic tone", "ht", "5-HT", True),
        ("Schizophrenia", "Teaching model of excess mesolimbic dopamine", "da", "DA", False),
    ]),
]


def grouped(groups) -> str:
    html = []
    for title, rows in groups:
        html.append(f'<div class="group">{title}</div>')
        for name, line, kind, lab, on in rows:
            html.append(entry(name, line, kind, lab, on))
    return "".join(html)


def library_page() -> str:
    body = f'''
    {top(
        slot("Disease", "Depression", "0.60") + slot("Drug", "Sertraline", "0.50"),
        '<div class="linkish">Open in the lab</div>',
    )}
    <div class="lib-wrap">
      <div class="library">
        <section class="pane">
          <div class="pane-head"><h2>Drugs</h2><span>12</span></div>
          <div class="search">{SEARCH} Search drugs</div>
          {grouped(DRUGS)}
        </section>
        <section class="pane">
          <div class="pane-head"><h2>Diseases</h2><span>7</span></div>
          <div class="search">{SEARCH} Search diseases</div>
          {grouped(DISEASES)}
          <div class="note-card">
            <strong>How pairing works</strong>
            <p>A drug and a disease share one synapse when they share a transmitter. Multiple sclerosis stays on the axon whichever synapse you open. A mismatched pair explains itself instead of inventing a cell that does both.</p>
          </div>
        </section>
      </div>
      <div class="composer">
        {slider("Dose · sertraline", "0.50", 50, "SERT clearance falls. A mild autoreceptor keeps release from rising in step.")}
        {slider("Severity · depression", "0.60", 60, "Serotonin synthesis falls. One hypothesis, not the whole illness.")}
        <div class="note-card">
          <strong>These two compose</strong>
          <p>Cleft serotonin can recover while each impulse still releases less. The acute trace is not the weeks-long clinical response.</p>
        </div>
      </div>
    </div>'''
    return page("NeuroPharm Lab — library", "tone-ht", body)


MINI_GABA = f'''<svg viewBox="0 0 480 230" class="lab-svg">
  <path d="M20 120 H150" stroke="{MEM}" stroke-width="1.4" fill="none"/>
  {myelin(36, 109, 40, 22)}
  {myelin(88, 109, 40, 22)}
  <path d="M148 120 C162 78 210 62 252 74 C296 86 314 112 308 136 C302 164 270 184 230 180 C190 176 162 154 148 120 Z"
        fill="#14160f" stroke="{MEM}" stroke-width="1.2"/>
  {"".join(vesicle(x, y, "full", GABA) for x, y in [(190, 108), (214, 100), (236, 112), (206, 128), (230, 136)])}
  <path d="M286 112 C292 104 306 106 306 118 C306 128 294 132 286 126" fill="{GABA}" fill-opacity="0.2" stroke="{GABA}" stroke-width="1"/>
  <g fill="{GABA}">
    <circle cx="324" cy="108" r="2.2"/>
    <circle cx="334" cy="120" r="2"/>
    <circle cx="322" cy="130" r="1.8" opacity="0.8"/>
  </g>
  <path d="M368 48 C352 96 352 160 370 196" fill="none" stroke="{MEM}" stroke-width="2.3" stroke-linecap="round"/>
  {"".join(lgic(348, y, GABA, hot=True) for y in (86, 118, 150))}
  {label(214, 52, "GABA", "middle")}
  {label(318, 46, "CLEFT")}
  {label(396, 206, "Cl−")}
  {label(392, 100, "GABA-A")}
</svg>'''


def monograph_page() -> str:
    deltas = [
        ("GABA-A efficacy", "1.00", "×1.9"),
        ("Release probability", "0.62", "unchanged"),
        ("Cleft GABA", "follows release", "unchanged"),
        ("Firing", "12 Hz", "5 Hz"),
        ("Spike shape", "Hodgkin–Huxley", "unchanged"),
    ]
    rows = "".join(
        f'<div class="delta"><span>{n}</span><b>{a}</b><em>{b}</em></div>' for n, a, b in deltas
    )
    body = f'''
    {top(
        slot("Drug", "Diazepam", "0.55") + slot("Synapse", "GABAergic"),
        '<div class="linkish">Back to the lab</div>',
    )}
    <div class="monograph">
      <aside class="notes">
        <div class="fact"><span class="k">Class</span><span class="v">Benzodiazepine</span></div>
        <div class="fact"><span class="k">Role</span><span class="v">Positive allosteric modulator</span></div>
        <div class="fact"><span class="k">Receptor</span><span class="v">GABA-A, α–γ2 site</span></div>
        <div class="fact"><span class="k">Ion</span><span class="v">Chloride</span></div>
        <div class="fact"><span class="k">Does not bind</span><span class="v">The GABA site itself</span></div>
        <div class="fact"><span class="k">Pairs cleanly with</span><span class="v">Epilepsy, alcohol</span></div>
        <p class="disclaimer">Educational model only. Not medical advice or a dosing guide.</p>
      </aside>
      <article class="article">
        <p class="kicker">Mechanism of action</p>
        <h1>Diazepam</h1>
        <p class="lede">A modulator of inhibition. It cannot open the chloride channel alone, and the model refuses to pretend that it can.</p>
        <div class="block">
          <h3>Mechanism</h3>
          <p>Diazepam binds the benzodiazepine site on GABA-A, at the interface of an alpha subunit and gamma-2. When GABA is also bound, the channel opens more often. Chloride current grows and the membrane sits further from threshold.</p>
        </div>
        <div class="block">
          <h3>In this model</h3>
          <p>The stage is a GABAergic synapse. Vesicle release is left alone. Efficacy scales with dose, to about ×1.9 at 0.55. Empty the cleft of GABA and the drug current falls to zero. Firing on the trace drops from 12 Hz to 5 Hz.</p>
        </div>
        <div class="block">
          <h3>Effects</h3>
          <p>Sedation, less anxiety, muscle relaxation, and fewer seizures. The trace loses spikes. Spike shape, carried by sodium and potassium channels, stays put.</p>
        </div>
        <div class="block">
          <h3>Side effects</h3>
          <p>Drowsiness, ataxia, anterograde amnesia, and dependence. Stopping suddenly can provoke seizures. Breathing can fail when alcohol or an opioid is added. The lab flags that stack instead of treating it as a routine combination.</p>
        </div>
      </article>
      <aside class="instrument">
        <p class="kicker">What the stage changes</p>
        <h2>At dose 0.55</h2>
        <div class="mini">{MINI_GABA}</div>
        <div class="deltas">{rows}</div>
        <div class="mini-trace">{DIAZ_SWEEP}</div>
      </aside>
    </div>'''
    return page("NeuroPharm Lab — diazepam", "tone-gaba", body)


def compare_page() -> str:
    stats = [
        ("Window", "400<small>ms</small>"),
        ("Firing", "12 → 30<small>Hz</small>"),
        ("GABA-A", "1.00 → 0.40"),
        ("Cleft glutamate", "1.0 → 1.3"),
        ("Persistent Na", "0 → 0.29"),
    ]
    cells = "".join(f'<div><span class="k">{k}</span><span class="v">{v}</span></div>' for k, v in stats)
    body = f'''
    {top(
        slot("Disease", "Epilepsy", "0.72") + slot("Drug", "Add a treatment", ghost=True),
        switch(True),
    )}
    <div class="compare">
      <div class="compare-lead">
        <h2>Baseline against the condition</h2>
        <p>Same axons, same afferent rate. Only epilepsy is applied on the right.</p>
      </div>
      <div class="panels">
        <article class="panel">
          <div class="panel-h"><h3>Baseline</h3><span>Inhibition intact</span></div>
          <div class="art">{closeup("base")}</div>
          <div class="sweep">{BASE_SWEEP}</div>
        </article>
        <article class="panel">
          <div class="panel-h"><h3>Epilepsy</h3><span>Severity 0.72 · no drug yet</span></div>
          <div class="art">{closeup("epi")}</div>
          <div class="sweep">{EPI_SWEEP}</div>
        </article>
      </div>
      <div class="stats">{cells}</div>
    </div>'''
    return page("NeuroPharm Lab — compare", "tone-glu", body)


def main():
    files = {
        "lab.html": main_page(),
        "library.html": library_page(),
        "monograph.html": monograph_page(),
        "compare.html": compare_page(),
    }
    for name, html in files.items():
        path = OUT / name
        path.write_text(html)
        print(path, path.stat().st_size)


if __name__ == "__main__":
    main()
