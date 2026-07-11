# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
While the project is pre-1.0, minor version bumps may include breaking changes.

## [Unreleased]

## [0.1.0] - 2026-07-11

First tagged prototype: an interactive learning tool for guitar overdrive pedals,
starting with the TS808 Tube Screamer.

### Added
- **Schematic** (`index.html`): a faithful TS808 signal-path schematic drawn with
  real component symbols (Q1/Q2 buffers, IC1a/IC1b op-amps, feedback + clipping-diode
  network, R/C, pots).
  - Every component is clickable and inspectable — swappable parts (input cap, drive,
    mid-hump cap, clipping diodes, tone, level) expose swap controls; fixed parts show
    an info panel with value and role.
  - Probe clips on every node route the oscilloscope to that point.
  - Animated signal-flow dots that redden/flatten past the clipping stage.
  - Component inspector with a "Circuit state" readout (gain, clip voltage, mid-bump
    frequency, grit).
- **Oscilloscope** (`scope.html`): a draggable in-page bench window ("learning mode").
  - Built-in **signal injector / function generator** (waveform, pitch, pick strength).
  - Real scope controls: Volts/div, Time/div, position, AC/DC/GND coupling, edge
    triggering (source/edge/level, auto vs normal).
  - Two channels (input vs. probed node), live measurements (Vpp, frequency, Vmax,
    measured gain), Auto-set, and a Lessons drawer on how to use a scope.
  - Live coaching hints (e.g. off-screen signal, no trigger lock).
  - Opens as an iframe dock (no popup blockers; works over `file://`) with an optional
    "New window" pop-out.
- **Shared model** (`dsp.js`): a real-time behavioral signal model (mid-hump boost,
  clean+clipped-boost feedback topology, tone tilt, volume) — deterministic from
  absolute time so the scope can trigger cleanly.
- **Tooling**: `README.md` and a double-clickable `run.command` local launcher.

[Unreleased]: https://github.com/BarryElderwine/pedal-platform/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/BarryElderwine/pedal-platform/releases/tag/v0.1.0
