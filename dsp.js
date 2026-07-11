/* ============================================================================
   dsp.js — shared Tube Screamer signal model
   Classic script (no modules) so it loads over http:// AND file://.
   Exposes window.TSDSP. Signal generation is deterministic from absolute time,
   so the oscilloscope can sample arbitrary windows and trigger cleanly.
   ========================================================================== */
(function(){
  "use strict";

  const VERSION = "0.1.1";   // single source of truth — bump on release, keep in sync with the git tag

  const STOCK = { cin:0.047, drive:250, cg:0.047, diode:"si", tone:50, vol:70,
                  freq:220, amp:55, wf:"guitar" };

  const NODES = ["in","buf","boost","clip","tone","out"];
  const NODE_LABEL = { in:"Input", buf:"After input buffer", boost:"After gain (pre-clip)",
                       clip:"Op-amp output (clipped)", tone:"After tone", out:"Output" };

  function diodeVf(t){ return {none:99, ge:0.3, si:0.6, asym:0.6, led:1.7}[t]; }
  function softclip(x,th){ return th>=90 ? x : th*Math.tanh(x/th); }
  function softclipAsym(x,th){ const tp=th, tn=th*0.55; return x>=0 ? tp*Math.tanh(x/tp) : tn*Math.tanh(x/tn); }

  function wave(wf, ph){
    switch(wf){
      case "sine":   return Math.sin(ph);
      case "tri":    return (2/Math.PI)*Math.asin(Math.sin(ph));
      case "square": return Math.tanh(4*Math.sin(ph));
      default:       return (Math.sin(ph)+0.45*Math.sin(2*ph+0.3)+0.28*Math.sin(3*ph)+0.14*Math.sin(4*ph))*0.62;
    }
  }

  // generate source samples for absolute times t0 .. t0+(N-1)*dt
  function genSource(P, N, dt, t0){
    const f=P.freq, amp=P.amp/100*0.7, out=new Float32Array(N);
    t0 = t0||0;
    for(let i=0;i<N;i++){ const t=t0+i*dt; out[i]=wave(P.wf, 2*Math.PI*f*t)*amp; }
    return out;
  }

  // process a source buffer through the whole TS chain; returns every node trace
  function processChain(P, src, dt){
    const N=src.length;
    const buf=new Float32Array(N), boost=new Float32Array(N), clip=new Float32Array(N),
          tone=new Float32Array(N), out=new Float32Array(N);
    let lpIn=0, lpMid=0, lpTone=0;
    const rcIn=470000*P.cin*1e-6,           aIn=dt/(rcIn+dt);
    const fMid=1/(2*Math.PI*4700*P.cg*1e-6), rcMid=1/(2*Math.PI*fMid), aMid=dt/(rcMid+dt);
    const rcTone=1/(2*Math.PI*720),          aTone=dt/(rcTone+dt);
    const G=1+(51000+P.drive*1000)/4700, Vf=diodeVf(P.diode);
    const clipFn = P.diode==="asym" ? softclipAsym : softclip;
    const toneK=P.tone/100, volK=P.vol/100;
    let clipped=0;
    for(let i=0;i<N;i++){
      const x0=src[i];
      lpIn += aIn*(x0-lpIn); const xb=x0-lpIn; buf[i]=xb;
      lpMid += aMid*(xb-lpMid); const hp=xb-lpMid; const added=(G-1)*hp; boost[i]=xb+added;
      const addC=clipFn(added,Vf); if(Math.abs(added)>Vf*1.02 && Vf<90) clipped++;
      const yc=xb+addC; clip[i]=yc;
      lpTone += aTone*(yc-lpTone); const low=lpTone, high=yc-lpTone;
      const kl=1.4-0.9*toneK, kh=0.5+1.1*toneK; const yt=low*kl+high*kh; tone[i]=yt;
      out[i]=yt*volK;
    }
    return { in:src, buf, boost, clip, tone, out, grit:clipped/N, G, Vf, fMid };
  }

  function compute(P, N, dt, t0){ return processChain(P, genSource(P,N,dt,t0||0), dt); }

  window.TSDSP = { VERSION, STOCK, NODES, NODE_LABEL, diodeVf, softclip, softclipAsym, wave, genSource, processChain, compute };
})();
