(function () {
  var KEY = 'page-one-paper-theme';      // 手动选择记忆键
  var DAY = '#faf6e9';                   // 米白
  var NIGHT = '#efe6d0';                 // 夜晚 · 浅色暖光
  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function systemTheme() {
    return mq && mq.matches ? 'night' : 'day';
  }

  function savedTheme() {
    try { return localStorage.getItem(KEY); } catch (e) { /* ignore */ }
    return null;
  }

  function syncMeta(theme) {
    var meta = document.getElementById('meta-theme-color');
    if (meta) meta.setAttribute('content', theme === 'night' ? NIGHT : DAY);
  }

  function syncButton(theme) {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    var night = theme === 'night';
    var icon = btn.querySelector('.theme-toggle__icon');
    if (icon) icon.textContent = night ? '☀' : '☾'; // 显示“将要切去”的模式
    btn.setAttribute('aria-label', night ? '切换到白天模式' : '切换到夜晚模式');
    btn.setAttribute('title', night ? '切换到白天' : '切换到夜晚');
  }

  function apply(theme, manual) {
    root.dataset.theme = theme;
    if (manual) {
      try { localStorage.setItem(KEY, theme); } catch (e) { /* ignore */ }
    }
    syncMeta(theme);
    syncButton(theme);
  }

  // 初始：手动选择优先，否则跟随系统（head 内联脚本已在首帧前定稿）
  var saved = savedTheme();
  apply(saved === 'day' || saved === 'night' ? saved : systemTheme(), false);

  // 系统亮暗变化时跟随（仅当用户没有手动切换过）
  if (mq) {
    var onSystemChange = function () {
      if (!savedTheme()) apply(systemTheme(), false);
    };
    if (mq.addEventListener) mq.addEventListener('change', onSystemChange);
    else if (mq.addListener) mq.addListener(onSystemChange);
  }

  // 手动切换
  var toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      apply(root.dataset.theme === 'night' ? 'day' : 'night', true);
    });
  }

  /* ---------- 年度总结:给月份 h4 标注大号数字(data-month) ---------- */
  (function monthChapters() {
    var tl = document.querySelector('.page--timeline .page-body');
    if (!tl) return;
    var cn = { 一: '01', 二: '02', 三: '03', 四: '04', 五: '05', 六: '06', 七: '07', 八: '08', 九: '09', 十: '10', 十一: '11', 十二: '12' };
    tl.querySelectorAll('h4').forEach(function (h) {
      var t = h.textContent.trim();
      var m = t.match(/^(\d{1,2})\s*[月\.、]/) || t.match(/^([一二三四五六七八九十]{1,3})月/);
      if (!m) return;
      var num = /^\d/.test(m[1]) ? ('0' + m[1]).slice(-2) : cn[m[1]];
      if (num) h.setAttribute('data-month', num);
    });
  })();

  /* ---------- 文章目录 TOC（客户端生成，无需插件） ---------- */
  (function buildToc() {
    var tocNav = document.getElementById('post-toc');
    var body = document.querySelector('.post-body');
    if (!tocNav || !body) return;

    var heads = body.querySelectorAll('h2, h3');
    if (heads.length < 2) { tocNav.remove(); return; }

    var list = document.createElement('ul');
    list.className = 'post-toc__list';
    var links = [];
    heads.forEach(function (h, i) {
      if (!h.id) h.id = 'toc-heading-' + i;
      var li = document.createElement('li');
      li.className = 'post-toc__item post-toc__item--' + h.tagName.toLowerCase();
      var a = document.createElement('a');
      a.className = 'post-toc__link';
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      a.dataset.target = h.id;
      li.appendChild(a);
      list.appendChild(li);
      links.push({ a: a, h: h });
    });
    var label = document.createElement('p');
    label.className = 'post-toc__label';
    label.textContent = '目录';
    tocNav.appendChild(label);
    tocNav.appendChild(list);

    // 滚动高亮当前章节
    var current = null;
    function onScroll() {
      var fromTop = window.scrollY + 96;
      var active = links[0];
      for (var i = 0; i < links.length; i++) {
        if (links[i].h.offsetTop <= fromTop) active = links[i];
        else break;
      }
      if (active === current) return;
      if (current) current.a.classList.remove('is-active');
      if (active) active.a.classList.add('is-active');
      current = active;
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { onScroll(); ticking = false; });
    }, { passive: true });
    onScroll();
  })();

  /* ---------- 代码块：包装容器 + 复制按钮 ---------- */
  (function enhanceCodeBlocks() {
    var pres = document.querySelectorAll('.markdown-body pre, .post-body pre');
    pres.forEach(function (pre) {
      if (pre.closest('.codeblock')) return;
      var code = pre.querySelector('code');
      var lang = '';
      if (code) {
        var m = (code.className || '').match(/language-([\w-]+)/);
        if (m) lang = m[1];
      }

      var wrap = document.createElement('div');
      wrap.className = 'codeblock';
      pre.parentNode.insertBefore(wrap, pre);

      var bar = document.createElement('div');
      bar.className = 'codeblock__bar';
      for (var i = 0; i < 3; i++) {
        var dot = document.createElement('span');
        dot.className = 'codeblock__dot';
        bar.appendChild(dot);
      }
      if (lang) {
        var langEl = document.createElement('span');
        langEl.className = 'codeblock__lang';
        langEl.textContent = lang;
        bar.appendChild(langEl);
      }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'codeblock__copy';
      btn.textContent = '复制';
      bar.appendChild(btn);

      wrap.appendChild(bar);
      wrap.appendChild(pre);

      btn.addEventListener('click', function () {
        var text = code ? code.innerText : pre.innerText;
        function done() {
          btn.textContent = '已复制';
          btn.classList.add('is-done');
          setTimeout(function () {
            btn.textContent = '复制';
            btn.classList.remove('is-done');
          }, 1600);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { legacyCopy(text, done); });
        } else {
          legacyCopy(text, done);
        }
      });
    });

    function legacyCopy(text, done) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ }
      document.body.removeChild(ta);
    }
  })();
})();
