// Marketing landing page for the Disciplio iOS app.
// Static markup kept as one string so the design stays exactly as designed.

const CSS = `
/* The old PWA set overflow-x:hidden on html, body and #root, which turns each
   of them into a scroll container and can trap page scrolling. The marketing
   page is a normal document, so undo that here. */
html,body,#root{overflow:visible!important;height:auto!important;max-height:none!important;position:static!important}
html{overflow-y:auto!important}
body{margin:0;background:#0a120e;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}
a{color:#6ee7b7;text-decoration:none}
a:hover{color:#a7f3d0}
img{max-width:100%}
.navlink{color:rgba(255,255,255,.6)}
.navlink:hover{color:#a7f3d0}
@media(max-width:760px){
.nav{padding:16px 20px!important}
.navhide{display:none!important}
.hero{flex-direction:column!important;gap:40px!important;padding:32px 24px 56px!important}
.h1{font-size:38px!important;letter-spacing:-1.2px!important}
.herophone>div{width:260px!important}
.stats{flex-wrap:wrap!important}
.stats>div{flex:1 1 50%!important;border-left:none!important;border-top:1px solid rgba(255,255,255,.08)!important}
.featwrap{padding:56px 24px!important;gap:56px!important}
.feat{flex-direction:column!important;gap:28px!important}
.feat>div{margin-left:0!important;max-width:100%!important}
.feat>div:first-child{width:240px!important}
.cta{padding:56px 24px 64px!important}
.ctah{font-size:32px!important}
}
`;

const APPLE_LOGO = `<svg viewBox="0 0 384 512" width="20" height="20" fill="currentColor" style="flex:none"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>`;

const HTML = `
<div style="max-width:1180px;margin:0 auto;background:#0a120e;color:#e7ece9">
  <div class="nav" style="display:flex;justify-content:space-between;align-items:center;padding:22px 56px">
    <div style="font-size:18px;font-weight:800;letter-spacing:-.5px">Disciplio<span style="color:#6ee7b7">.</span></div>
    <div style="display:flex;gap:28px;align-items:center;font-size:13px;color:rgba(255,255,255,.6)">
      <a class="navhide navlink" href="#program">The Reset</a><a class="navhide navlink" href="#stats">Stats</a><a class="navhide navlink" href="#partners">Partners</a>
      <span style="background:#6ee7b7;color:#04150d;font-weight:700;padding:8px 18px;border-radius:20px;font-size:13px">Get the app</span>
    </div>
  </div>
  <div class="hero" style="display:flex;align-items:center;gap:60px;padding:40px 56px 80px;position:relative;overflow:hidden">
    <div style="position:absolute;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,rgba(110,231,183,.12),transparent 60%);right:-250px;top:-200px;pointer-events:none"></div>
    <div style="flex:1;display:flex;flex-direction:column;gap:24px;max-width:520px">
      <div style="font-size:12px;font-weight:700;letter-spacing:2.5px;color:#6ee7b7">THE 60 DAY RESET</div>
      <div class="h1" style="font-size:58px;font-weight:800;line-height:1.02;letter-spacing:-2px;color:#f2f5f3;text-wrap:balance">Done drifting? Reset your life in 60 days.</div>
      <div style="font-size:17px;line-height:1.55;color:rgba(255,255,255,.6);max-width:420px;text-wrap:pretty">One short lesson and one action every day, on top of the commitments you choose. Do them and your life stats climb. Miss a day and your streak is on the line.</div>
      <div style="display:flex;gap:14px;align-items:center;margin-top:8px">
        <div style="display:flex;align-items:center;gap:10px;background:#f2f5f3;color:#0a120e;padding:12px 22px;border-radius:12px">${APPLE_LOGO}<span style="display:flex;flex-direction:column;line-height:1.1"><span style="font-size:9px;font-weight:600">Download on the</span><span style="font-size:16px;font-weight:700">App Store</span></span></div>
        <div style="font-size:13px;color:rgba(255,255,255,.5)">7 day free trial</div>
      </div>
    </div>
    <div class="herophone" style="flex:none;position:relative;z-index:1">
      <div style="width:300px;border-radius:44px;border:6px solid #1c2621;box-shadow:0 40px 80px rgba(0,0,0,.6),0 0 0 1px rgba(110,231,183,.15);overflow:hidden;background:#000"><img src="/landing/hero.png" style="width:100%;display:block" alt="Disciplio home screen"></div>
    </div>
  </div>
  <div class="stats" id="stats" style="display:flex;border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.08);scroll-margin-top:80px">
    <div style="flex:1;padding:26px 20px;text-align:center;display:flex;flex-direction:column;gap:4px"><span style="font-size:30px;font-weight:800;color:#6ee7b7">60</span><span style="font-size:12px;color:rgba(255,255,255,.5)">days, four phases</span></div>
    <div style="flex:1;padding:26px 20px;text-align:center;display:flex;flex-direction:column;gap:4px;border-left:1px solid rgba(255,255,255,.08)"><span style="font-size:30px;font-weight:800;color:#6ee7b7">5</span><span style="font-size:12px;color:rgba(255,255,255,.5)">life stats that climb</span></div>
    <div style="flex:1;padding:26px 20px;text-align:center;display:flex;flex-direction:column;gap:4px;border-left:1px solid rgba(255,255,255,.08)"><span style="font-size:30px;font-weight:800;color:#6ee7b7">1</span><span style="font-size:12px;color:rgba(255,255,255,.5)">streak for everything</span></div>
    <div style="flex:1;padding:26px 20px;text-align:center;display:flex;flex-direction:column;gap:4px;border-left:1px solid rgba(255,255,255,.08)"><span style="font-size:30px;font-weight:800;color:#6ee7b7">+1</span><span style="font-size:12px;color:rgba(255,255,255,.5)">partner who sees you slip</span></div>
  </div>
  <div class="featwrap" style="display:flex;flex-direction:column;gap:90px;padding:90px 56px">
    <div class="feat" id="program" style="display:flex;gap:70px;align-items:center;scroll-margin-top:80px">
      <div style="flex:none;width:280px;border-radius:36px;border:5px solid #1c2621;overflow:hidden;background:#000"><img src="/landing/program.png" style="width:100%;display:block" alt="Daily lesson"></div>
      <div style="flex:1;display:flex;flex-direction:column;gap:14px;max-width:440px">
        <div style="font-size:11px;font-weight:700;letter-spacing:2.5px;color:#6ee7b7">THE PROGRAM</div>
        <div style="font-size:34px;font-weight:800;letter-spacing:-1px;line-height:1.1">One honest lesson. Every day.</div>
        <div style="font-size:15px;line-height:1.6;color:rgba(255,255,255,.6);text-wrap:pretty">Four phases take you from fixing your sleep to locking in a new identity. No fluff, no lectures. One lesson and one action per day.</div>
        <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap">
          <span style="font-size:11px;font-weight:600;padding:5px 12px;border:1px solid rgba(110,231,183,.35);border-radius:14px;color:#6ee7b7">Foundation</span>
          <span style="font-size:11px;font-weight:600;padding:5px 12px;border:1px solid rgba(110,231,183,.35);border-radius:14px;color:#6ee7b7">Momentum</span>
          <span style="font-size:11px;font-weight:600;padding:5px 12px;border:1px solid rgba(110,231,183,.35);border-radius:14px;color:#6ee7b7">Build</span>
          <span style="font-size:11px;font-weight:600;padding:5px 12px;border:1px solid rgba(110,231,183,.35);border-radius:14px;color:#6ee7b7">Lock In</span>
        </div>
      </div>
    </div>
    <div class="feat" style="display:flex;gap:70px;align-items:center;flex-direction:row-reverse">
      <div style="flex:none;width:280px;border-radius:36px;border:5px solid #1c2621;overflow:hidden;background:#000"><img src="/landing/stats.png" style="width:100%;display:block" alt="Life stats"></div>
      <div style="flex:1;display:flex;flex-direction:column;gap:14px;max-width:440px;margin-left:auto">
        <div style="font-size:11px;font-weight:700;letter-spacing:2.5px;color:#6ee7b7">LIFE STATS</div>
        <div style="font-size:34px;font-weight:800;letter-spacing:-1px;line-height:1.1">A life that levels up.</div>
        <div style="font-size:15px;line-height:1.6;color:rgba(255,255,255,.6);text-wrap:pretty">Every completed task earns XP across Physical, Mental, Discipline, Social and Work. Ranks are earned, and your overall rating shows exactly where you stand, and where you could be by day 60.</div>
      </div>
    </div>
    <div class="feat" style="display:flex;gap:70px;align-items:center">
      <div style="flex:none;width:280px;border-radius:36px;border:5px solid #1c2621;overflow:hidden;background:#000"><img src="/landing/receipt.png" style="width:100%;display:block" alt="Perfect day receipt"></div>
      <div style="flex:1;display:flex;flex-direction:column;gap:14px;max-width:440px">
        <div style="font-size:11px;font-weight:700;letter-spacing:2.5px;color:#6ee7b7">STREAKS &amp; PERFECT DAYS</div>
        <div style="font-size:34px;font-weight:800;letter-spacing:-1px;line-height:1.1">A receipt worth sharing.</div>
        <div style="font-size:15px;line-height:1.6;color:rgba(255,255,255,.6);text-wrap:pretty">One streak covers all your commitments, with freezes to protect you when life happens. Finish everything and the perfect-day receipt appears the moment you complete your last task.</div>
      </div>
    </div>
    <div class="feat" id="partners" style="display:flex;gap:70px;align-items:center;flex-direction:row-reverse;scroll-margin-top:80px">
      <div style="flex:none;width:280px;border-radius:36px;border:5px solid #1c2621;overflow:hidden;background:#000"><img src="/landing/partner.png" style="width:100%;display:block" alt="Accountability partner"></div>
      <div style="flex:1;display:flex;flex-direction:column;gap:14px;max-width:440px;margin-left:auto">
        <div style="font-size:11px;font-weight:700;letter-spacing:2.5px;color:#6ee7b7">ACCOUNTABILITY</div>
        <div style="font-size:34px;font-weight:800;letter-spacing:-1px;line-height:1.1">Do the reset with someone.</div>
        <div style="font-size:15px;line-height:1.6;color:rgba(255,255,255,.6);text-wrap:pretty">Link a partner. See each other&rsquo;s progress daily and send a nudge when they slip. Nobody wants to explain a broken streak.</div>
      </div>
    </div>
  </div>
  <div class="cta" style="padding:80px 56px 90px;text-align:center;display:flex;flex-direction:column;gap:18px;align-items:center;background:radial-gradient(60% 100% at 50% 100%,rgba(110,231,183,.1),transparent 70%)">
    <div class="ctah" style="font-size:42px;font-weight:800;letter-spacing:-1.5px;max-width:560px;line-height:1.08;text-wrap:balance">Day 1 is the hardest. Start it now.</div>
    <div style="font-size:14px;color:rgba(255,255,255,.5)">7 day free trial, cancel anytime</div>
    <div style="display:flex;align-items:center;gap:10px;background:#6ee7b7;color:#04150d;padding:13px 26px;border-radius:12px;margin-top:6px">${APPLE_LOGO}<span style="display:flex;flex-direction:column;line-height:1.1;text-align:left"><span style="font-size:9px;font-weight:600">Download on the</span><span style="font-size:16px;font-weight:800">App Store</span></span></div>
    <div style="display:flex;gap:20px;font-size:12px;color:rgba(255,255,255,.35);margin-top:30px"><a href="/terms" style="color:rgba(255,255,255,.45)">Terms</a><a href="/privacy" style="color:rgba(255,255,255,.45)">Privacy</a><a href="mailto:support@disciplio.app" style="color:rgba(255,255,255,.45)">Support</a><span>&copy; 2026 Disciplio</span></div>
  </div>
</div>
`;

export default function Landing() {
  return (
    <>
      <style>{CSS}</style>
      <div dangerouslySetInnerHTML={{ __html: HTML }} />
    </>
  );
}
