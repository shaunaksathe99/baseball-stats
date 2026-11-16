/* Plate 450 Diary - optional online account (parent/guardian email sign-in) and cross-device sync.
   Talks to Supabase over plain HTTPS (no SDK). Everything is opt-in: with no config the app stays fully offline.
   The pure merge logic is testable in Node; the rest registers with the app through window.DDApp. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(null);
  else { var api = factory(root); root.Cloud = api; if (root.DDApp) api.boot(root.DDApp); }
})(typeof self !== 'undefined' ? self : this, function (win) {
  'use strict';

  /* ---------- pure: merge two sanitized diaries ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  // Union by id. Nothing is lost; when both sides have the same game, this device's copy wins.
  function merge(local, remote) {
    var out = clone(local || { players: [] });
    out.players = out.players || [];
    ((remote && remote.players) || []).forEach(function (rp) {
      var lp = null;
      out.players.forEach(function (p) { if (!lp && (p.id === rp.id || p.pid === rp.pid)) lp = p; });
      if (!lp) { if (out.players.length < 12) out.players.push(clone(rp)); return; }
      var gi = {}; lp.games.forEach(function (g) { gi[g.id] = 1; });
      rp.games.forEach(function (g) { if (!gi[g.id]) lp.games.push(clone(g)); });
      var oi = {}; lp.goals.forEach(function (g) { oi[g.id] = 1; });
      rp.goals.forEach(function (g) { if (!oi[g.id]) lp.goals.push(clone(g)); });
      var a = lp.iq, b = rp.iq || {};
      Object.keys(b.r || {}).forEach(function (id) { if (!a.r[id] || b.r[id][0] > a.r[id][0]) a.r[id] = b.r[id].slice(); });
      Object.keys(b.qz || {}).forEach(function (id) { if (!a.qz[id] || b.qz[id][0] > a.qz[id][0] || (b.qz[id][0] === a.qz[id][0] && b.qz[id][1] > a.qz[id][1])) a.qz[id] = b.qz[id].slice(); });
      a.xp = Math.max(a.xp || 0, b.xp || 0); a.best = Math.max(a.best || 0, b.best || 0);
      if (!lp.plan && rp.plan) lp.plan = rp.plan;
      if (!lp.last || !lp.last.season) lp.last = rp.last || lp.last;
    });
    if (!out.terms && remote && remote.terms) out.terms = clone(remote.terms);
    if (!out.cons && remote && remote.cons) out.cons = clone(remote.cons);
    return out;
  }
  function hasPlayers(d) { return !!(d && d.players && d.players.length); }

  /* ---------- the rest needs a browser ---------- */
  var K = 'dugoutDiary.cloud.v1';
  function boot(A) {
    var cfg = (win && win.DD_CLOUD) || {};
    var url = String(cfg.url || '').replace(/\/+$/, ''), key = String(cfg.anonKey || '');
    var on = /^https:\/\/[a-z0-9.-]+$/i.test(url) || /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(url);
    on = on && key.length > 20;
    var esc = A.esc;
    var st = { s: null, last: '', dirty: false, at: 0 };
    try { var raw = JSON.parse(localStorage.getItem(K) || 'null'); if (raw && raw.s && raw.s.a && raw.s.r && raw.s.u) st = { s: { a: String(raw.s.a), r: String(raw.s.r), x: Number(raw.s.x) || 0, u: String(raw.s.u), e: String(raw.s.e || '') }, last: String(raw.last || ''), dirty: !!raw.dirty, at: Number(raw.at) || 0 }; } catch (e) { /* start signed out */ }
    var ui = { status: 'idle', msg: '', email: '', busy: false, again: false, timer: null };
    function persist() { try { localStorage.setItem(K, JSON.stringify(st)); } catch (e) { /* ignore */ } }
    function signedIn() { return !!st.s; }

    function req(method, path, body, headers) {
      var h = { apikey: key, 'Content-Type': 'application/json' };
      // New-style publishable keys are not JWTs, so they go only in the apikey header. Signed-in calls add the user's token.
      if (st.s && !(headers && headers.noAuth)) h.Authorization = 'Bearer ' + st.s.a;
      if (headers) Object.keys(headers).forEach(function (k) { if (k !== 'noAuth') h[k] = headers[k]; });
      return fetch(url + path, { method: method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) }).then(function (r) {
        return r.text().then(function (t) { var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = null; } return { ok: r.ok, status: r.status, json: j }; });
      }, function () { return { ok: false, status: 0, json: null }; });
    }
    function takeSession(j) {
      if (!j || !j.access_token || !j.refresh_token || !j.user || !j.user.id) return false;
      st.s = { a: j.access_token, r: j.refresh_token, x: Number(j.expires_at) || (Math.floor(Date.now() / 1000) + (Number(j.expires_in) || 3600)), u: j.user.id, e: String(j.user.email || ui.email || '') };
      persist(); return true;
    }
    function ensureToken() {
      if (!st.s) return Promise.resolve(false);
      if (st.s.x - Math.floor(Date.now() / 1000) > 60) return Promise.resolve(true);
      return req('POST', '/auth/v1/token?grant_type=refresh_token', { refresh_token: st.s.r }, { noAuth: true }).then(function (r) {
        if (r.ok && takeSession(r.json)) return true;
        if (r.status === 400 || r.status === 401 || r.status === 403) { st = { s: null, last: '', dirty: false, at: 0 }; persist(); ui.status = 'out'; ui.msg = 'You were signed out. Your diary is still on this device. Sign in again to keep syncing.'; }
        return false;
      });
    }

    function setStatus(s, m) { ui.status = s; ui.msg = m || ''; refresh(); }
    function refresh() {
      var h = (location.hash || '#home');
      if (h === '#about' || h === '#home' || h === '' ) A.render();
    }

    function push(local) {
      var data = JSON.parse(JSON.stringify(local));
      return req('POST', '/rest/v1/diaries?on_conflict=user_id', { user_id: st.s.u, data: data }, { Prefer: 'resolution=merge-duplicates,return=representation' }).then(function (r) {
        if (!r.ok) throw new Error('push ' + r.status);
        var row = Array.isArray(r.json) ? r.json[0] : r.json;
        st.last = (row && row.updated_at) || ''; st.dirty = false; st.at = Date.now(); persist();
      });
    }
    function sync() {
      if (!on || !signedIn()) return Promise.resolve();
      if (ui.busy) { ui.again = true; return Promise.resolve(); }
      ui.busy = true; setStatus('syncing');
      return ensureToken().then(function (ok) {
        if (!ok) throw new Error('auth');
        return req('GET', '/rest/v1/diaries?select=data,updated_at');
      }).then(function (r) {
        if (r === undefined) return;
        if (r.status === 401) { throw new Error('auth'); }
        if (!r.ok) throw new Error('get ' + r.status);
        var row = Array.isArray(r.json) && r.json[0] ? r.json[0] : null, local = A.getDb();
        if (!row) { return hasPlayers(local) ? push(local) : (st.dirty = false, st.at = Date.now(), persist()); }
        var remote = A.sanitizeDb(row.data);
        if (row.updated_at === st.last && st.last) { return st.dirty && hasPlayers(local) ? push(local) : (st.dirty = false, persist()); }
        if (!hasPlayers(local) || (st.last && !st.dirty)) { A.setDb(remote, true); st.last = row.updated_at; st.dirty = false; st.at = Date.now(); persist(); return; }
        var merged = merge(local, remote); A.setDb(merged, true);
        return push(A.getDb());
      }).then(function () { setStatus('ok'); }, function (e) {
        if (String(e && e.message) === 'auth') { if (signedIn()) setStatus('error', 'Could not sign in to sync. Check your connection and try again.'); else setStatus('out', ui.msg); }
        else setStatus(navigator.onLine === false ? 'offline' : 'error', 'Could not sync right now. Your diary is safe on this device and will sync later.');
      }).then(function () { ui.busy = false; if (ui.again) { ui.again = false; schedule(500); } });
    }
    function schedule(ms) { if (!on || !signedIn()) return; clearTimeout(ui.timer); ui.timer = setTimeout(sync, ms === undefined ? 2500 : ms); }
    A.ext.onSave = function () { if (!signedIn()) return; st.dirty = true; persist(); schedule(); };
    if (on) {
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && signedIn() && Date.now() - st.at > 30000) sync(); });
      window.addEventListener('online', function () { if (signedIn()) schedule(500); });
      if (signedIn()) setTimeout(sync, 800);
    }

    /* ---------- sign-in screens ---------- */
    function box(f) { return f.querySelector('[data-errbox]'); }
    function err(f, m) { var b = box(f); if (!b) return; b.hidden = !m; b.textContent = m || ''; }
    var GATE = 'dugoutDiary.agegate', HOLD = 24 * 3600 * 1000;
    function gateBlocked() { try { var v = Number(localStorage.getItem(GATE)); return v > 0 && Date.now() - v < HOLD; } catch (e) { return false; } }
    function stepAsk() {
      A.openModal('<h3>Ask a parent or guardian</h3><p>Online saving has to be set up by a parent or guardian (18 or older). Please ask one to do it for you.</p>' +
        '<p class="muted">Your diary already works on this device with no account, and you can keep logging games. A parent can add your player to their account later.</p>' +
        '<div class="actions"><button class="btn" data-action="modal-close">OK</button></div>');
    }
    function stepAge() {
      if (gateBlocked()) { stepAsk(); return; }
      A.openModal('<h3>Who is setting this up?</h3><p class="muted">Online accounts are for parents and guardians. One account can hold all of your family’s players.</p>' +
        '<div class="actions" style="flex-direction:column;align-items:stretch"><button class="btn" data-action="cloud-age-adult">I’m a parent or guardian (18 or older)</button>' +
        '<button class="btn ghost" data-action="cloud-age-kid">I’m a player, or I’m under 18</button><button class="btn ghost" data-action="modal-close">Cancel</button></div>');
    }
    function stepEmail(msg) {
      A.openModal('<h3>Parent or guardian sign-in</h3><p class="muted">Keep the family’s diary safe and use it on any phone or computer. We email a one-time code to approve the account, so there is no password to remember.</p>' +
        '<form data-form="cloud-email" novalidate><div class="error" data-errbox hidden role="alert"></div>' +
        '<div class="field"><label for="cl-email">Parent or guardian email</label><input id="cl-email" name="email" type="email" inputmode="email" autocomplete="email" maxlength="120" value="' + esc(ui.email) + '"></div>' +
        '<label class="check"><input type="checkbox" name="agree"> <span>I am a parent or guardian, 18 or older. I give permission for my child’s diary (nicknames, stats and notes) to be saved online under my email, and I accept the <a href="#terms" target="_blank" rel="noopener">Terms &amp; Privacy Notice</a>.</span></label>' +
        '<p class="hint">Use your own email, not your child’s. We send the approval code there. Only your email is stored, never your child’s.</p>' +
        '<div class="actions"><button type="button" class="btn ghost" data-action="modal-close">Cancel</button><button class="btn" type="submit">Email me a code</button></div></form>');
      if (msg) { var f = document.querySelector('form[data-form=cloud-email]'); if (f) err(f, msg); }
    }
    function stepCode(msg) {
      A.openModal('<h3>Approve with the code</h3><p class="muted">We sent an approval code to <b>' + esc(ui.email) + '</b>. It can take a minute. Check spam too. <b>Only the parent or guardian should enter it.</b> If your child asked you to set this up, enter the code yourself.</p>' +
        '<form data-form="cloud-code" novalidate><div class="error" data-errbox hidden role="alert"></div>' +
        '<div class="field"><label for="cl-code">Code from the email</label><input id="cl-code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="123456"></div>' +
        '<div class="actions"><button type="button" class="btn ghost" data-action="cloud-back">Back</button><button class="btn" type="submit">Approve and sign in</button></div></form>');
      if (msg) { var f = document.querySelector('form[data-form=cloud-code]'); if (f) err(f, msg); }
    }
    A.ext.actions['cloud-open'] = function () { ui.email = ''; stepAge(); };
    A.ext.actions['cloud-age-adult'] = function () { stepEmail(); };
    A.ext.actions['cloud-age-kid'] = function () { try { localStorage.setItem(GATE, String(Date.now())); } catch (e) { /* ignore */ } stepAsk(); };
    A.ext.actions['cloud-back'] = function () { stepEmail(); };
    A.ext.forms['cloud-email'] = function (f) {
      var email = String(f.elements.email.value || '').trim().toLowerCase();
      if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(email) || email.length > 120) return err(f, 'Enter the parent or guardian’s email address.');
      if (!f.elements.agree.checked) return err(f, 'Please confirm you are the parent or guardian and agree to the Terms & Privacy Notice.');
      ui.email = email; err(f, ''); var b = f.querySelector('button[type=submit]'); b.disabled = true; b.textContent = 'Sending…';
      req('POST', '/auth/v1/otp', { email: email, create_user: true }, { noAuth: true }).then(function (r) {
        if (r.ok) { stepCode(); return; }
        var m = r.status === 429 ? 'Too many tries. Wait a few minutes and try again.' : r.status === 0 ? 'Could not reach the sign-in service. Check your connection.' : 'Could not send the email. Check the address and try again.';
        b.disabled = false; b.textContent = 'Email me a code'; err(f, m);
      });
    };
    A.ext.forms['cloud-code'] = function (f) {
      var code = String(f.elements.code.value || '').replace(/\s/g, '');
      if (!/^\d{6,10}$/.test(code)) return err(f, 'Type the 6-digit code from the email.');
      err(f, ''); var b = f.querySelector('button[type=submit]'); b.disabled = true; b.textContent = 'Checking…';
      req('POST', '/auth/v1/verify', { type: 'email', email: ui.email, token: code }, { noAuth: true }).then(function (r) {
        if (r.ok && takeSession(r.json)) { st.last = ''; A.setConsent(); st.dirty = hasPlayers(A.getDb()); persist(); A.closeModal(); A.flash('Signed in. Syncing your diary…'); sync(); return; }
        b.disabled = false; b.textContent = 'Approve and sign in';
        err(f, r.status === 0 ? 'Could not reach the sign-in service. Check your connection.' : 'That code did not work. It may have expired. Go back to get a new one.');
      });
    };
    A.ext.actions['cloud-sync'] = function () { sync(); };
    A.ext.actions['cloud-out'] = function () {
      var s = st.s; st = { s: null, last: '', dirty: false, at: 0 }; persist(); ui.status = 'idle'; ui.msg = '';
      if (s) req('POST', '/auth/v1/logout', {}, { Authorization: 'Bearer ' + s.a, noAuth: true });
      A.flash('Signed out. Your diary stays on this device.'); A.render();
    };
    A.ext.actions['cloud-del'] = function () {
      A.openModal('<h3>Delete your online account?</h3><p>This permanently deletes your online copy and your account (the email address). The diary on this device is <b>not</b> deleted. Download a backup first if you want extra safety.</p>' +
        '<div class="actions"><button class="btn ghost" data-action="modal-close">Cancel</button><button class="btn danger" data-action="cloud-del-yes">Delete account</button></div>');
    };
    A.ext.actions['cloud-del-yes'] = function () {
      ensureToken().then(function (ok) { return ok ? req('POST', '/rest/v1/rpc/delete_account', {}) : { ok: false }; }).then(function (r) {
        A.closeModal();
        if (r.ok) { st = { s: null, last: '', dirty: false, at: 0 }; persist(); ui.status = 'idle'; A.flash('Your online account and copy were deleted. Your diary is still on this device.'); }
        else A.flash('Could not delete the account right now. Try again later, or contact us.');
        A.render();
      });
    };

    function ago(t) { if (!t) return 'not yet'; var m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' hr ago' : new Date(t).toLocaleDateString(); }
    A.ext.aboutCard = function () {
      if (!on) return '';
      if (!signedIn()) {
        return '<section class="card"><h3>Save online</h3><p class="muted">Sign in with a parent or guardian email to back up your diary and use it on other devices. Optional, free, and no password.</p>' +
          (ui.msg && ui.status === 'out' ? '<p class="hint" role="status">' + esc(ui.msg) + '</p>' : '') +
          '<button class="btn block" data-action="cloud-open">Sign in or create account</button><p class="hint">Without signing in, your diary stays only in this browser.</p></section>';
      }
      var line = ui.status === 'syncing' ? 'Syncing…' : ui.status === 'error' || ui.status === 'offline' ? esc(ui.msg) : st.dirty ? 'Changes waiting to sync' : 'Saved online · last synced ' + ago(st.at);
      return '<section class="card"><h3>Online account</h3><p>Signed in as <b>' + esc(st.s.e) + '</b></p><p class="muted" role="status" aria-live="polite">' + line + '</p>' +
        '<div class="row wrap"><button class="btn grow" data-action="cloud-sync">Sync now</button><button class="btn ghost grow" data-action="cloud-out">Sign out</button></div>' +
        '<p class="hint">This account covers every player in the diary (' + A.getDb().players.length + ' now, up to 12). Switch between them with the name button at the top.</p>' +
        '<p class="hint">Erasing a diary on this device does not erase the online copy. To remove it, delete your account.</p><button class="btn danger block" data-action="cloud-del" style="margin-top:8px">Delete my online account</button></section>';
    };
  }

  return { merge: merge, boot: boot, hasPlayers: hasPlayers };
});
