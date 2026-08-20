(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  function el(n, a, t) { const e = document.createElementNS(NS, n); for (const k in a) if (a[k] != null) e.setAttribute(k, a[k]); if (t != null) e.textContent = t; return e; }

  /* ===== 波形（本文の図1を再現：0.1秒ごとの値を通るなめらかな曲線） ===== */
  const NODES = [2.8, 6.1, 6.8, 4.2, 0.9, 1.6, 3.9, 6.5, 5.0, 2.0, 3.0]; // t=0,0.1,…,1.0
  function catmull(p, t) {                       // p: 配列, t: 添字（実数）
    const i = Math.max(0, Math.min(p.length - 2, Math.floor(t))), f = t - i;
    const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
    return 0.5 * ((2 * p1) + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
  }
  const WAVES = {
    book: t => Math.max(0, Math.min(7, catmull(NODES, t * 10))),
    sin: t => 3.5 + 3.4 * Math.sin(2 * Math.PI * t * 1.5),
    mix: t => 3.5 + 2.2 * Math.sin(2 * Math.PI * t * 1.5) + 1.2 * Math.sin(2 * Math.PI * t * 5 + 1)
  };
  const DUR = 1.0;
  let wave = WAVES.book;

  /* ===== STEP 1 ===== */
  function sampleSeq(fs, qb) {
    const levels = Math.pow(2, qb), n = Math.floor(DUR * fs) + 1, out = [];
    for (let i = 0; i < n; i++) {
      const t = i / fs;
      if (t > DUR + 1e-9) break;
      const v = Math.max(0, Math.min(7, wave(t)));
      const q = Math.max(0, Math.min(levels - 1, Math.round(v / 7 * (levels - 1))));
      out.push({ t: t, v: v, q: q, y: q / (levels - 1) * 7 });
    }
    return out;
  }
  function drawSamp() {
    const fs = +$('fs').value, qb = +$('qb').value, levels = Math.pow(2, qb);
    $('fsV').textContent = fs; $('qbV').textContent = qb; $('stepV').textContent = levels;
    $('periodV').textContent = (Math.round(1 / fs * 1000) / 1000);
    const S = sampleSeq(fs, qb);
    const W = 480, H = 300, M = { t: 12, r: 12, b: 30, l: 46 };
    const iw = W - M.l - M.r, ih = H - M.t - M.b;
    const X = t => M.l + t / DUR * iw, Y = v => M.t + ih - v / 7 * ih;
    const svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', role: 'img', 'aria-label': 'アナログ波形の標本化と量子化' });
    for (let k = 0; k < levels; k++) {
      const v = k / (levels - 1) * 7, y = Y(v);
      svg.appendChild(el('line', { x1: M.l, y1: y, x2: M.l + iw, y2: y, class: 'grid' }));
      if (levels <= 8) svg.appendChild(el('text', { x: M.l - 6, y: y + 3, class: 'lvlab', 'text-anchor': 'end' },
        k.toString(2).padStart(qb, '0') + '  ' + k));
    }
    svg.appendChild(el('line', { x1: M.l, y1: M.t + ih, x2: M.l + iw, y2: M.t + ih, class: 'axis' }));
    svg.appendChild(el('line', { x1: M.l, y1: M.t, x2: M.l, y2: M.t + ih, class: 'axis' }));
    for (let k = 0; k <= 10; k += 2) {
      const t = k / 10;
      svg.appendChild(el('text', { x: X(t), y: H - 14, class: 'axlab', 'text-anchor': 'middle' }, t.toFixed(1)));
    }
    svg.appendChild(el('text', { x: M.l + iw, y: H - 2, class: 'axlab', 'text-anchor': 'end' }, '時刻（秒）'));
    const pts = [];
    for (let k = 0; k <= 300; k++) { const t = k / 300 * DUR; pts.push(X(t) + ',' + Y(Math.max(0, Math.min(7, wave(t))))); }
    svg.appendChild(el('polyline', { points: pts.join(' '), class: 'ana' }));
    let dpath = '';
    S.forEach((s, i) => {
      svg.appendChild(el('line', { x1: X(s.t), y1: Y(s.v), x2: X(s.t), y2: Y(s.y), class: 'stem' }));
      svg.appendChild(el('circle', { cx: X(s.t), cy: Y(s.v), r: 2.6, class: 'sdot' }));
      svg.appendChild(el('circle', { cx: X(s.t), cy: Y(s.y), r: 3.4, class: 'qdot' }));
      if (i === 0) dpath = 'M' + X(s.t) + ' ' + Y(s.y);
      else dpath += ' L' + X(S[i - 1].t) + ' ' + Y(s.y) + ' L' + X(s.t) + ' ' + Y(s.y);
    });
    svg.appendChild(el('path', { d: dpath, class: 'dig' }));
    const box = $('sampBox'); box.innerHTML = ''; box.appendChild(svg);

    const bitsArr = S.map(s => s.q.toString(2).padStart(qb, '0'));
    const all = bitsArr.join('');
    $('bitOut').innerHTML = bitsArr.map((b, i) =>
      '<span class="g' + (all.slice(0, 12).length > i * qb ? ' head' : '') + '">' + b + '</span>').join('') || '—';
    $('mLevels').textContent = S.slice(0, 8).map(s => s.q).join('，') + (S.length > 8 ? '，…' : '');
    $('mHead12').textContent = all.slice(0, 12) || '—';
    const err = S.reduce((a, s) => a + Math.abs(s.v - s.y), 0) / (S.length || 1);
    $('mErr').textContent = (Math.round(err * 100) / 100) + '（段階値）';
    const n = $('sampNote');
    const isK = fs === 10 && qb === 3, isKi = fs === 5 && qb === 3, book = $('waveSel').value === 'book';
    if (book && isK) { n.className = 'note ok'; n.innerHTML = '本文【カ】の条件です。段階値は 3，6，7，4，… なので、2進法に直すと <strong class="mono">011 110 111 100</strong>。先頭12ビットは <strong class="mono">011110111100</strong> です。'; }
    else if (book && isKi) { n.className = 'note ok'; n.innerHTML = '本文【キ】の条件です。0.2秒ごとに読むので段階値は 3，7，1，4，… となり、先頭12ビットは <strong class="mono">011111001100</strong> です。'; }
    else {
      n.className = 'note info';
      n.innerHTML = '1÷' + fs + '＝<strong>' + (Math.round(1 / fs * 1000) / 1000) + '秒</strong>ごとに標本化し、' +
        '<strong>' + levels + '段階</strong>のいちばん近い値に丸めています。' +
        (err > 0.6 ? '青い階段がもとの波形からかなり離れています。' : '青い階段がもとの波形によく重なっています。') +
        '　この1秒間のデータ量は ' + fs + ' × ' + qb + ' ＝ <strong>' + (fs * qb) + 'ビット</strong>です。';
    }
  }

  /* ===== STEP 2 ===== */
  const CD_MB = 44100 * 16 * 2 * 60 / 8 / 1000 / 1000;
  function drawData() {
    const fs = +$('dFs').value || 0, qb = +$('dQb').value || 0, ch = +$('dCh').value || 0, sec = +$('dSec').value || 0;
    const bits = fs * qb * ch * sec, mb = bits / 8 / 1000 / 1000;
    $('dEq').innerHTML = fs.toLocaleString() + '（Hz） × ' + qb + '（ビット） × ' + ch + '（ch） × ' + sec + '（秒）<br>＝ ' +
      bits.toLocaleString() + '（ビット）<br>÷ 8 ÷ 1000 ÷ 1000 ＝ ' + (Math.round(mb * 1000) / 1000) + '（MB）';
    $('dMB').textContent = (Math.round(mb * 10) / 10) + ' MB';
    $('dRatio').textContent = (Math.round(mb / CD_MB * 100) / 100) + ' 倍';
    const n = $('dNote');
    n.className = 'note info';
    if (fs === 44100 && qb === 16 && ch === 2 && sec === 60)
      n.innerHTML = '音楽CDの条件です。10.584MB を四捨五入して <strong>約10.6MB</strong>（本文【ウ】＝②）。';
    else if (fs === 88200 && qb === 24 && ch === 2 && sec === 60)
      n.innerHTML = 'ハイレゾ音源の条件です。CDと比べると <span class="mono">(88200×24)÷(44100×16)＝2×1.5＝<strong>3倍</strong></span>（本文【エ】＝②）。' +
        'チャンネル数と時間が同じなら、<strong>標本化周波数の比 × 量子化ビット数の比</strong>で求められます。';
    else
      n.innerHTML = '1秒あたり <strong>' + (fs * qb * ch / 8 / 1000).toLocaleString() + ' kB</strong>。' +
        '標本化周波数か量子化ビット数を2倍にすると、データ量も2倍になります。';
  }

  /* ===== STEP 3 ===== */
  const BLANKS = [
    { k: 'ア', q: '標本化周波数44.1kHzとは、1秒間に何回標本化するか。', ch: ['44.1', '44100', '88.2', '88200'], a: '44100',
      why: '1kHz＝1000Hz なので 44.1kHz＝44100Hz。1秒間に44100回標本化します。' },
    { k: 'イ', q: '量子化ビット数16ビットのとき、音の波の高さは何段階で表せるか。', ch: ['2', '16', '32', '2²', '2¹⁶', '2³²'], a: '2¹⁶',
      why: 'nビットなら2のn乗段階。16ビットなら2¹⁶＝65,536段階です。' },
    { k: 'ウ', q: 'ステレオ（2ch）で1分間の音声ファイルのデータ量は何MBか。', ch: ['0.17', '10.1', '10.6', '17.6'], a: '10.6',
      why: '44100×16×2×60＝84,672,000ビット。÷8÷1000÷1000＝10.584≒10.6MBです。' },
    { k: 'エ', q: 'ハイレゾ音源（88.2kHz・24ビット）は音楽CDの何倍のデータ量か。', ch: ['1.5', '2', '3', '4'], a: '3',
      why: '(88200×24)÷(44100×16)＝2×1.5＝3倍。チャンネル数と時間が同じなので、周波数の比とビット数の比をかけるだけです。' }
  ];
  let bAns = {};
  function drawBlanks() {
    $('blankBox').innerHTML = BLANKS.map((b, i) =>
      '<div' + (i ? ' style="margin-top:18px;padding-top:16px;border-top:1px solid var(--line)"' : '') + '>' +
      '<p class="qhead" style="margin:0 0 8px">【' + b.k + '】　' + b.q + '</p>' +
      '<div class="choice4" data-i="' + i + '">' + b.ch.map((c, j) =>
        '<button class="btn" data-i="' + i + '" data-c="' + c + '" style="text-align:center">' + '⓪①②③④⑤'[j] + '　' + c + '</button>').join('') +
      '</div><div class="note" id="bfb' + i + '" hidden></div></div>').join('');
    $('blankBox').querySelectorAll('button[data-c]').forEach(btn => btn.addEventListener('click', () => {
      const i = +btn.dataset.i, b = BLANKS[i], ok = btn.dataset.c === b.a;
      const row = $('blankBox').querySelector('.choice4[data-i="' + i + '"]');
      row.classList.add('locked');
      [...row.children].forEach(x => { if (x.dataset.c === b.a) x.classList.add('correct'); else if (x === btn) x.classList.add('wrong'); });
      const fb = $('bfb' + i);
      fb.hidden = false; fb.className = 'note ' + (ok ? 'ok' : 'ng');
      fb.innerHTML = (ok ? '正解。' : '正解は <strong>' + b.a + '</strong>。') + b.why;
      bAns[i] = ok;
      const done = Object.keys(bAns).length, right = Object.values(bAns).filter(Boolean).length;
      const n = $('blankNote');
      n.className = 'note ' + (done === BLANKS.length ? (right === done ? 'ok' : 'warn') : 'info');
      n.innerHTML = done + ' / ' + BLANKS.length + ' 問解答（正解 ' + right + ' 問）' +
        (done === BLANKS.length ? '<br>本文の答えは【ア】①　【イ】④　【ウ】②　【エ】② です。' : '');
    }));
    $('blankNote').className = 'note info';
    $('blankNote').textContent = '0 / ' + BLANKS.length + ' 問解答';
  }

  /* ===== STEP 4 ===== */
  const JUDGE = [
    { k: 'a', t: '標本化周期が大きいほど、もとのアナログ波形に近くなる。', ok: false,
      why: '標本化周期は標本化する時間間隔のこと。<strong>小さいほど</strong>細かく読み取れるので、もとの波形に近づきます。' },
    { k: 'b', t: '量子化ビット数が小さいほど、もとのアナログ波形に近くなる。', ok: false,
      why: '量子化ビット数が<strong>大きいほど</strong>段階が細かくなり、もとの波形に近づきます。' },
    { k: 'c', t: '量子化における段階値の間隔が短いほど、データ量は大きくなる。', ok: true,
      why: '間隔が短い＝段階が多い＝必要なビット数が増えるので、データ量は大きくなります。精度とデータ量はトレードオフです。' },
    { k: 'd', t: 'サンプリング周波数と標本化周期は同じ意味でよく使われる。', ok: false,
      why: 'サンプリング周波数は1秒あたりの<strong>回数</strong>、標本化周期は1回あたりの<strong>時間間隔</strong>。互いに逆数の関係で、意味は異なります。' },
    { k: 'e', t: 'サンプリング周波数が50Hzのとき、標本化周期は0.5秒である。', ok: false,
      why: '1÷50＝<strong>0.02秒</strong>です。標本化周期はサンプリング周波数の逆数で求めます。' }
  ];
  let jAns = {};
  function drawJudge() {
    $('jBox').innerHTML = JUDGE.map((j, i) =>
      '<div><div class="st"><span class="k">' + j.k + '</span><span class="t">' + j.t + '</span>' +
      '<span class="jb" data-i="' + i + '"><button class="btn" data-i="' + i + '" data-v="1">○</button>' +
      '<button class="btn" data-i="' + i + '" data-v="0">×</button></span></div>' +
      '<div class="note" id="jfb' + i + '" hidden style="margin-top:8px"></div></div>').join('');
    $('jBox').querySelectorAll('button[data-v]').forEach(btn => btn.addEventListener('click', () => {
      const i = +btn.dataset.i, j = JUDGE[i], said = btn.dataset.v === '1', ok = said === j.ok;
      const row = $('jBox').querySelector('.jb[data-i="' + i + '"]');
      row.classList.add('locked'); row.style.pointerEvents = 'none';
      [...row.children].forEach(x => {
        const v = x.dataset.v === '1';
        if (v === j.ok) x.classList.add('correct'); else if (x === btn) x.classList.add('wrong');
      });
      const fb = $('jfb' + i);
      fb.hidden = false; fb.className = 'note ' + (ok ? 'ok' : 'ng');
      fb.innerHTML = '<strong>' + (j.ok ? '正しい記述です。' : '誤りです。') + '</strong>' + j.why;
      jAns[i] = ok;
      const done = Object.keys(jAns).length;
      const n = $('jNote');
      n.className = 'note ' + (done === JUDGE.length ? 'ok' : 'info');
      n.innerHTML = done + ' / ' + JUDGE.length + ' 判定' +
        (done === JUDGE.length ? '<br>正しいものは <strong>c の1つだけ</strong>なので、【オ】の答えは <strong>①（1つ）</strong> です。' : '');
    }));
    $('jNote').className = 'note info';
    $('jNote').textContent = '0 / ' + JUDGE.length + ' 判定';
  }

  /* ===== STEP 5 ===== */
  const CH12 = ['111000000111', '001101100111', '011110111100', '011111001100', '001101110001', '111000000011'];
  const Q3 = [
    { k: 'カ', q: '標本化周波数10Hz・量子化ビット数3ビットのとき、先頭12ビットは', a: '011110111100',
      why: '0.1秒ごとに読むと段階値は 3，6，7，4。2進法で 011，110，111，100 なので 011110111100 です。' },
    { k: 'キ', q: '標本化周波数5Hz・量子化ビット数3ビットのとき、先頭12ビットは', a: '011111001100',
      why: '0.2秒ごとに読むと段階値は 3，7，1，4。2進法で 011，111，001，100 なので 011111001100 です。' }
  ];
  let q3Ans = {};
  function drawQ3() {
    $('q3Box').innerHTML = Q3.map((q, i) =>
      '<div' + (i ? ' style="margin-top:18px;padding-top:16px;border-top:1px solid var(--line)"' : '') + '>' +
      '<p class="qhead" style="margin:0 0 8px">【' + q.k + '】　' + q.q + '</p>' +
      '<div class="choice4" data-i="' + i + '">' + CH12.map((c, j) =>
        '<button class="btn mono" data-i="' + i + '" data-c="' + c + '" style="text-align:center">' + '⓪①②③④⑤'[j] + '　' + c + '</button>').join('') +
      '</div><div class="note" id="qfb' + i + '" hidden></div></div>').join('');
    $('q3Box').querySelectorAll('button[data-c]').forEach(btn => btn.addEventListener('click', () => {
      const i = +btn.dataset.i, q = Q3[i], ok = btn.dataset.c === q.a;
      const row = $('q3Box').querySelector('.choice4[data-i="' + i + '"]');
      row.classList.add('locked');
      [...row.children].forEach(x => { if (x.dataset.c === q.a) x.classList.add('correct'); else if (x === btn) x.classList.add('wrong'); });
      const fb = $('qfb' + i);
      fb.hidden = false; fb.className = 'note ' + (ok ? 'ok' : 'ng');
      fb.innerHTML = (ok ? '正解。' : '正解は <span class="mono">' + q.a + '</span>。') + q.why;
      q3Ans[i] = ok;
      const done = Object.keys(q3Ans).length;
      const n = $('q3Note');
      n.className = 'note ' + (done === 2 ? 'ok' : 'info');
      n.innerHTML = done + ' / 2 問解答' + (done === 2 ? '<br>本文の答えは【カ】②　【キ】③ です。STEP 1 のプリセットで確かめられます。' : '');
    }));
    $('q3Note').className = 'note info';
    $('q3Note').textContent = '0 / 2 問解答';
  }

  function init() {
    ['fs', 'qb'].forEach(i => $(i).addEventListener('input', drawSamp));
    $('waveSel').addEventListener('change', () => { wave = WAVES[$('waveSel').value]; drawSamp(); });
    $('presetK').addEventListener('click', () => { $('waveSel').value = 'book'; wave = WAVES.book; $('fs').value = 10; $('qb').value = 3; drawSamp(); });
    $('presetKi').addEventListener('click', () => { $('waveSel').value = 'book'; wave = WAVES.book; $('fs').value = 5; $('qb').value = 3; drawSamp(); });
    ['dFs', 'dQb', 'dCh', 'dSec'].forEach(i => $(i).addEventListener('input', drawData));
    const set = (fs, qb, ch, sec) => { $('dFs').value = fs; $('dQb').value = qb; $('dCh').value = ch; $('dSec').value = sec; drawData(); };
    $('presetCD').addEventListener('click', () => set(44100, 16, 2, 60));
    $('presetHR').addEventListener('click', () => set(88200, 24, 2, 60));
    $('presetTel').addEventListener('click', () => set(8000, 8, 1, 60));
    window.Terms.glossary($('glossBox'), ['標本化', '量子化', '符号化', '標本化周波数', '標本化周期', '量子化ビット数', 'PCM方式', 'チャンネル数', 'ハイレゾ音源', 'アナログ', 'デジタル', 'ビット']);
    drawSamp(); drawData(); drawBlanks(); drawJudge(); drawQ3();
    window.Terms.attach();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
