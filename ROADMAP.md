# Pedal Platform — Roadmap

An interactive catalog of **standard analog guitar-pedal architectures**. Each pedal
can be explored (probe a faithful schematic on a simulated oscilloscope), understood
(learn what every part does), tweaked, heard, and eventually **turned into a buildable
project** (schematic + board layout + parts list + instructions).

> Status: **v0.1.1** — one pedal shipped (TS808 Tube Screamer). Model is a behavioral
> real-time approximation, not SPICE.
>
> **Current focus:** keep refining the Tube Screamer — model fidelity, UX, and audio —
> *before* expanding the catalog. See [Tube Screamer backlog](#near-term-tube-screamer-backlog).

---

## The core idea: pedal-as-data

The one architectural bet that makes everything else possible: a pedal is a **netlist**
(components + nets + values + metadata), and every surface is a *projection* of it.

```
            ┌────────────────────────────────────────────┐
            │   NETLIST  (single source of truth)         │
            │   components · nets · values · metadata      │
            └────────────────────────────────────────────┘
                 │            │            │           │
      ┌──────────┘     ┌──────┘      ┌─────┘      ┌────┘
      ▼                ▼             ▼            ▼
 Interactive       DSP model      Circuit      Build Package
 schematic         (sim/hear)     editor       (schematic export ·
 (probe/learn)     engine A/B     (add/remove   board layout · BOM ·
                                  /change parts) build instructions)
```

Today the TS schematic and model are hardcoded. Turning them into a netlist +
projections is the **platform refactor** — the true "next" before the catalog scales.

The DSP model is itself a *graph of primitives*, which means it can also be **emitted** to
other targets — HDL for an FPGA, C for a DSP/MCU — not just run in the browser. That makes
a **digital realization** a natural sibling of the (analog) Build Package; see below.

---

## The catalog (tagged by engine)

Categories don't share one engine. The overdrive/distortion world is *memoryless*
(output depends only on the present input). Modulation and delay need **time** — buffers
of past audio and an LFO. That split drives the build order more than preference does.

| Family | Archetypes | Engine core | Status |
|---|---|---|---|
| **Overdrive / Dist / Fuzz** | Tube Screamer ✓, Klon, Bluesbreaker · Rat, DS-1 · Fuzz Face, Big Muff, Tone Bender | **A** — static nonlinearity + filters | engine **done** |
| **Filter / Wah** | Cry Baby (swept bandpass), envelope filter / auto-wah, EQ | **A** + control source (sweep or envelope follower) | small add |
| **Tremolo** | amplitude ↔ LFO (optical / bias trem) | **A** + LFO | small add |
| **Phaser** | Phase 90, Small Stone (cascaded all-pass, LFO-swept notches) | **B-lite** — all-pass chain + LFO (no buffer) | build |
| **Chorus / Vibrato / Flanger** | CE-1, Small Clone · Electric Mistress (BBD delay, LFO-modulated, ±feedback, dry blend) | **B** — fractional delay line + LFO | build |
| **Delay / Echo** | Memory Man (BBD) · Space Echo (tape: delay + saturation + wow/flutter) | **B** — long delay buffer + feedback | build |
| **Reverb** | spring / plate | **B+** — all-pass / comb reverb network | build (harder) |
| **Pitch (analog)** | Octavia (octave-up = rectifier), OC-2 octave-down (flip-flop divider), ring mod (×carrier) | **A** + rectifier / oscillator | analog-doable |
| **Pitch (chromatic)** | Whammy, harmonizer, poly pitch | **digital** — no standard analog architecture | scope decision |

### The two engines
- **Core A — static + filters** (have it): memoryless nonlinearity (clip variants),
  IIR filters, envelope follower, and an LFO that can modulate a *parameter* (tremolo).
  Covers all gain/distortion/fuzz/boost, wah/EQ/envelope, tremolo, octave/ring-mod.
- **Core B — time-varying** (to build): a fractional (interpolated) **delay line** with
  feedback and filtering, plus **all-pass** sections. Build it once and chorus, flanger,
  vibrato, delay, echo, and phaser mostly fall out of it. This is the single biggest lift.

---

## Pedal Build Package (design → build)

When a user tweaks a circuit to their liking — including **adding or removing parts** —
they can generate a complete, buildable project. Outputs, easiest → hardest:

1. **Exported schematic** *(cheap — direct netlist projection).* Clean, standard schematic
   with proper symbols, reference designators, net labels, and a title block. Export
   SVG / PDF.
2. **Bill of Materials (BOM)** *(cheap — direct projection).* Every part with value, type,
   package, quantity, reference designators, and (stretch) supplier part numbers + rough
   cost from a distributor (Tayda / Mouser / Digi-Key).
3. **Board / layout drawing** *(medium → hard).*
   - **Stripboard / Veroboard** layout — component placement + track cuts on a grid.
     Most tractable and matches how DIY pedals are actually built. Start here.
   - **Pictorial placement drawing** — the "build doc" image showing where each part goes.
   - **Custom PCB** — *hard* (auto-routing is an industry unto itself). Pragmatic path:
     **export a standard netlist to KiCad** rather than build a router in-app.
4. **Build instructions** *(medium).* Step-by-step assembly generated from the netlist +
   layout: populate parts by height, sockets for ICs/transistors, off-board wiring for
   pots/jacks/true-bypass footswitch, enclosure drilling template.

**Dependencies:** #1 and #2 need only the **netlist** (available right after the platform
refactor — a strong early proof that pedal-as-data pays off). #3 and #4, and especially the
"add/remove parts" flow, need a real **circuit editor** and are later work.

---

## Digital realization — FPGA / DSP backends (code-gen)

Alongside the *analog* Build Package (real components), the same design can target
*silicon*: generate a digital implementation of the pedal's DSP model. Two flavors, very
different in difficulty:

- **Behavioral-model → HDL (feasible, high-value).** Emit the signal chain we already
  simulate as a fixed-point, sample-synchronous pipeline in Verilog/VHDL wired to an audio
  codec. The primitives map straight onto FPGA fabric: IIR/one-pole filters → DSP-slice
  MACs, soft-clip / diode curves → LUT or piecewise-poly, delay lines (Core B) → block RAM,
  LFO → phase accumulator + LUT, knobs → parameter registers. FPGAs are ideal for this
  (parallel, low-latency streaming DSP).
- **Real-time analog solving → HDL (research-grade).** Solve the circuit equations in
  hardware (Wave Digital Filters / nonlinear state-space). Doable for diode clippers and
  tone stacks, but the TS's nonlinear op-amp+diode *feedback* needs iterative solving — the
  "true analog fidelity" path, tied to the SPICE-accurate question. Much larger lift.

It's a **compiler-backend pattern**: once the signal chain is data (an IR), emit it to
several targets from one source —

```
signal graph (IR) ─► JS backend    (in-browser sim — have it)
                 ├─► HDL backend   (Verilog/VHDL, FPGA)
                 └─► C/DSP backend  (MCU/DSP firmware — later)
```

**The package would ship:** generated HDL for the chain, a top-level with an I2S/codec
audio interface + parameter registers, computed fixed-point coefficients + word-width
choices, a target-board note, a resource estimate (LUT/DSP/BRAM), and a **testbench that
plays a WAV through the HDL and diffs it against the JS model** — the sim as golden
reference verifying the hardware.

**Caveats:** it's a *digital emulation* (not a literal analog reproduction); fixed-point
scaling / quantization + IIR stability is where the real engineering lives; nonlinearities
become LUT/poly approximations; synthesis uses vendor tools (Vivado/Quartus) outside the
app (we emit HDL + project files). Gated on the signal-graph IR (from the platform refactor)
plus a validated audio-rate model — a later/stretch output, but a clean and compelling one.

So a finished design has **two realization tracks** from the same source: an **analog build**
(real components — schematic/PCB/BOM/instructions) and a **digital build** (FPGA/DSP code).

## The bench grows with the catalog

A static scope trace teaches gain/clipping well, but modulation and delay are about
*movement and frequency*. Learning surfaces to add:
- **Audio A/B** (bypass vs. engaged) — the biggest missing piece even for the TS; these
  effects are ear-first.
- **Frequency-response / Bode view** per node — complements the scope, clarifies tone
  stacks and the TS mid-hump.
- **Spectrum / notch view** — a phaser *is* moving notches: invisible on a scope, obvious
  on a spectrum.
- **LFO / parameter animation** — show the modulation sweeping in real time.

---

## Phased plan (pre-1.0; order over dates)

- **Now → next patches** — Refine the **Tube Screamer** (model + UX + add audio A/B).
  See backlog below.
- **v0.2.0 — Platform refactor.** Netlist data model + projections. Port TS to a
  definition; add **Rat** and **Big Muff** (Core A) to prove it's pluggable. Ship
  **schematic export + BOM** as the first Build-Package outputs (cheap netlist projections).
- **v0.3.0 — Core B** (delay line + LFO) → **chorus / flanger / vibrato**, then **analog
  delay**; add **phaser** (all-pass) and **tremolo** (trivial) alongside. Add spectrum + LFO
  views to the bench.
- **v0.4.0 — Circuit editor** (add / remove / change parts) → unlocks user-driven tweaks,
  then the full **Build Package** (stripboard layout, pictorial drawing, supplier BOM,
  build instructions; KiCad netlist export).
- **v0.5.0 — Filter / wah + envelope**, then the **octave / ring-mod** pitch batch;
  decide on an optional digital-pitch module.
- **Stretch — Digital realization.** HDL/DSP code-gen backend off the signal-graph IR
  (FPGA behavioral-model target first), with the JS model as the verification reference.

Rationale: land the netlist refactor and a spare overdrive or two *before* Core B, so the
hardest engine is built on a proven foundation — not at the same time as the abstraction.

---

## Near-term: Tube Screamer backlog

*(Priorities TBD — this is the working list before the platform refactor.)*

### Model fidelity
- Validate component values/labels against a canonical TS808 schematic (several current
  values are representative, not exact).
- Tone control: model the real tone-network transfer function (currently a simplified tilt).
- Clipping: add oversampling to tame aliasing on hard/LED clipping; refine asymmetric-diode
  behavior.
- Input stage: model input impedance / pickup loading (treble loss) and the real Q1 buffer.
- Gain stage: verify the mid-hump corner & Q from the 4.7k / 0.047µF + 51k network and the
  51pF (C3) HF rolloff.
- DC bias: represent the 4.5 V Vref bias so DC-coupled scope views are meaningful.

### UX
- **Audio**: hear the pedal (A/B bypass) — highest-value gap.
- Verify the flow-dot clip-color boundary lines up with the actual clip node.
- Bigger probe hit targets (currently ~11 px).
- Wire-hover tooltips (node name + voltage).
- Responsive / mobile layout; light theme; keyboard nav + ARIA on the interactive SVG.
- "Show all values" toggle; clearer selected state.
- Preset mods (e.g. TS9 vs TS808 diffs, Keeley mod) and shareable config via URL state.
- A Bode / frequency-response view per node.

---

## Open questions / scope decisions
- **Digital pitch**: include a clearly-labeled digital module (Whammy/harmonizer), or keep
  the catalog strictly analog and stop at octave/ring-mod?
- **PCB**: KiCad-netlist export only, or attempt an in-app stripboard→PCB step later?
- **Audio engine**: Web Audio graph vs. reusing the JS DSP model at audio rate. (A clean
  audio-rate signal graph is also the prerequisite for the FPGA/DSP code-gen backend.)
- **FPGA / DSP codegen**: fixed-point word widths + nonlinearity approximation (LUT vs
  poly); and whether to pursue the Wave-Digital-Filter "true analog" path vs. shipping the
  behavioral model to HDL.
- **Reverb**: how faithfully to model spring/plate vs. a tasteful approximation.
