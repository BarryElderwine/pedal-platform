# Tube Screamer Explorer

An interactive way to learn a guitar overdrive pedal (TS808 "Tube Screamer") by
probing a real schematic and watching the signal on a simulated oscilloscope.

This is the first pedal in a planned catalog of standard analog pedal architectures —
see **[ROADMAP.md](ROADMAP.md)** for where it's headed (more pedals, audio, and a
"design → build" package: schematic, board layout, parts list, and build instructions).

## How to run

**Option A — just open it (offline, no setup)**
Double-click **`index.html`**. It opens in your browser and runs entirely locally.

**Option B — local server (most compatible; recommended)**
Double-click **`run.command`** (macOS). It starts a tiny local web server and opens
the app at `http://localhost:8123/`. Close that Terminal window to stop it.
> Use Option B if the docked oscilloscope ever looks blank on `file://`.

Works in any modern browser (Chrome, Safari, Edge). No internet connection needed.

## What you can do

- **Click any component** on the schematic (resistors, caps, transistors, op-amps,
  the diodes, the pots, even the jacks) to read what it does. Parts with a value you
  can change (Drive, Tone, Level, clipping diodes, input cap, mid cap) show a swap /
  slider control.
- **Click a blue probe clip** on any node to point the oscilloscope there.
- **Circuit state** (bottom of the inspector) shows Gain / Clip voltage / Mid-bump /
  Grit — these update as you swap parts.
- **Open Oscilloscope & Signal Generator** opens a draggable bench window. It contains:
  - the **Signal Injector** (function generator): waveform, pitch, pick strength — the
    stimulus you feed into the pedal;
  - a real **oscilloscope**: Volts/div, Time/div, triggering, AC/DC coupling, two channels
    (input vs. your probed node), and live measurements;
  - a **Lessons** drawer that teaches how to actually use a scope for pedal debugging.
  It live-updates as you probe nodes and swap parts in the main window.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main app — schematic, inspector, signal injector |
| `scope.html` | The oscilloscope / "how to use a scope" learning tool |
| `dsp.js`     | Shared signal model used by both |

## Note

The circuit simulation is a **simplified real-time model** — physically motivated and
great for learning the *behavior* (mid-hump boost, soft clipping, tone tilt), but it is
not a full SPICE simulation of exact part values.
