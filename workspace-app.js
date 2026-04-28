(function() {
  var AGENT_BADGES = {
    transcribe: {
      gradient: 'linear-gradient(135deg, #5b8def, #4a6cf7)',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M12 1v14M8 5v6M16 5v6M4 9v2M20 9v2"/><path d="M8 19h8M12 15v4"/></svg>'
    },
    summary: {
      gradient: 'linear-gradient(135deg, #34d399, #10b981)',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="14" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>'
    },
    capture: {
      gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/></svg>'
    }
  };

  var APPS_FULL = [
    { id: 'xiaov',      title: '蓝心小V',   url: 'xiaov.html' },
    { id: 'meeting',    title: '腾讯会议',   url: 'meeting-screenshot.png', isImage: true, icon: 'meeting-icon.png' },
    { id: 'transcribe', title: 'AI转写',     url: 'index.html' },
    { id: 'summary',    title: 'AI总结',     url: 'summary.html' },
    { id: 'chat',       title: 'AI问答',     url: 'chat.html' },
    { id: 'capture',    title: 'AI智能截屏', url: 'capture.html' }
  ];

  var APPS_INITIAL = [
    { id: 'xiaov',   title: '蓝心小V',   url: 'xiaov.html' },
    { id: 'meeting', title: '腾讯会议',   url: 'meeting-screenshot.png', isImage: true, icon: 'meeting-icon.png' }
  ];

  var SRC_W = 2200;
  var SRC_H = 2480;
  var ICON_SRC = 'xiaov-icon.png';

  var SIDEBAR_W = 180;
  var SIDEBAR_GAP = 20;
  var SIDEBAR_MAIN_GAP = 20;
  var SIDE_SLOT_COUNT = 4;

  var phase = 'meeting';
  var mainAppId = 'xiaov';
  var currentApps = APPS_INITIAL;
  var workspace = document.getElementById('workspace');
  var fullscreenMeeting = document.getElementById('fullscreenMeeting');
  var atomIsland = document.getElementById('atomIsland');

  var appSlots = {};
  var placeholderSlots = [];
  var inited = false;

  function getSideApps() {
    var side = currentApps.filter(function(a) { return a.id !== mainAppId; });
    var xi = side.findIndex(function(a) { return a.id === 'xiaov'; });
    if (xi > 0) {
      var xApp = side.splice(xi, 1)[0];
      side.unshift(xApp);
    }
    return side;
  }

  function updateTime() {
    var now = new Date();
    var h = now.getHours().toString().padStart(2, '0');
    var m = now.getMinutes().toString().padStart(2, '0');
    document.getElementById('statusTime').textContent = h + ':' + m;
  }

  function startPhase1() {
    phase = 'meeting';
    fullscreenMeeting.classList.remove('hidden');
    workspace.classList.remove('show');
    atomIsland.classList.remove('show');

    if (!inited) {
      initWorkspace();
      inited = true;
    }

    setTimeout(function() {
      atomIsland.classList.add('show');
    }, 2000);
  }

  function getLayoutMetrics() {
    var wsW = workspace.clientWidth;
    var wsH = workspace.clientHeight;
    var ratio = SRC_W / SRC_H;
    var GAP = SIDEBAR_GAP;
    var sideGaps = (SIDE_SLOT_COUNT - 1) * GAP;

    var mainH = wsH - GAP * 2;
    var mainW = Math.round(mainH * ratio);
    var sideItemH = Math.round((mainH - sideGaps) / SIDE_SLOT_COUNT);
    var sideW = Math.round(sideItemH * ratio);

    var totalW = sideW + GAP + mainW;
    if (totalW + GAP * 2 > wsW) {
      totalW = wsW - GAP * 2;
      mainW = totalW - sideW - GAP;
      mainH = Math.round(mainW / ratio);
      sideItemH = Math.round((mainH - sideGaps) / SIDE_SLOT_COUNT);
      sideW = Math.round(sideItemH * ratio);
      totalW = sideW + GAP + mainW;
    }

    var originX = Math.round((wsW - totalW) / 2);
    var originY = Math.round((wsH - mainH) / 2);
    var mainX = originX + sideW + GAP;
    return {
      originX: originX,
      originY: originY,
      mainX: mainX,
      mainW: mainW,
      mainH: mainH,
      sideItemH: sideItemH,
      sideW: sideW
    };
  }

  function getSlot1Rect() {
    var m = getLayoutMetrics();
    var wsRect = workspace.getBoundingClientRect();
    var bodyRect = document.body.getBoundingClientRect();
    var offsetTop = wsRect.top - bodyRect.top;
    var offsetLeft = wsRect.left - bodyRect.left;
    return {
      left: offsetLeft + m.originX,
      top: offsetTop + m.originY,
      width: m.sideW,
      height: m.sideItemH
    };
  }

  atomIsland.addEventListener('click', function() {
    if (phase !== 'meeting') return;
    phase = 'workspace';
    atomIsland.classList.remove('show');
    atomIsland.classList.add('dismiss');

    appSlots['meeting'].wrapper.classList.add('skip-enter');

    var rect = getSlot1Rect();
    var bodyW = document.body.clientWidth;
    var bodyH = document.body.clientHeight;
    var scaleX = rect.width / bodyW;
    var scaleY = rect.height / bodyH;
    var tx = rect.left;
    var ty = rect.top;
    fullscreenMeeting.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + scaleX + ', ' + scaleY + ')';
    fullscreenMeeting.style.borderRadius = (12 / scaleX) + 'px / ' + (12 / scaleY) + 'px';
    fullscreenMeeting.classList.add('shrink-to-slot');

    var enterEls = [];
    var mainSlot = appSlots[mainAppId];
    if (mainSlot) {
      mainSlot.wrapper.classList.add('entering', 'enter-d0');
      enterEls.push(mainSlot.wrapper);
    }

    var sideApps = getSideApps();
    var delayIdx = 1;
    sideApps.forEach(function(app) {
      var sd = appSlots[app.id];
      if (sd && app.id !== 'meeting') {
        sd.wrapper.classList.add('entering', 'enter-d' + delayIdx);
        enterEls.push(sd.wrapper);
      }
      delayIdx++;
    });
    for (var pi = sideApps.length; pi < SIDE_SLOT_COUNT; pi++) {
      placeholderSlots[pi].classList.add('entering', 'enter-d' + delayIdx);
      enterEls.push(placeholderSlots[pi]);
      delayIdx++;
    }

    workspace.classList.add('show');

    setTimeout(function() {
      enterEls.forEach(function(el) { el.classList.add('enter-go'); });
    }, 20);

    setTimeout(function() {
      enterEls.forEach(function(el) {
        el.classList.remove('entering', 'enter-go', 'enter-d0', 'enter-d1', 'enter-d2', 'enter-d3', 'enter-d4', 'enter-d5', 'skip-enter');
      });
      appSlots['meeting'].wrapper.classList.remove('skip-enter');
    }, 800);

    setTimeout(function() {
      fullscreenMeeting.style.display = 'none';
    }, 750);
  });

  function initWorkspace() {
    currentApps.forEach(function(app) {
      createSlot(app);
    });

    for (var i = 0; i < SIDE_SLOT_COUNT; i++) {
      var ph = document.createElement('div');
      ph.className = 'app-slot is-placeholder';
      ph.style.display = 'none';
      var phClip = document.createElement('div');
      phClip.className = 'slot-clip';
      phClip.innerHTML = '<svg class="plus-svg" width="28" height="28" viewBox="0 0 28 28"><line x1="14" y1="6" x2="14" y2="22" stroke="#fff" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="14" x2="22" y2="14" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>';
      ph.appendChild(phClip);
      workspace.appendChild(ph);
      placeholderSlots.push(ph);
    }

    applyLayout();
  }

  function createSlot(app) {
    if (appSlots[app.id]) return;

    var wrapper = document.createElement('div');
    wrapper.className = 'app-slot';
    wrapper.dataset.appId = app.id;

    var clip = document.createElement('div');
    clip.className = 'slot-clip';

    var content;
    if (app.isImage) {
      content = document.createElement('img');
      content.src = app.url;
      content.className = 'slot-img';
    } else {
      content = document.createElement('iframe');
      content.src = app.url;
      content.setAttribute('scrolling', 'no');
      content.className = 'slot-iframe';
    }
    clip.appendChild(content);

    var overlay = document.createElement('div');
    overlay.className = 'slot-overlay';
    clip.appendChild(overlay);

    wrapper.appendChild(clip);

    var badge = AGENT_BADGES[app.id];
    var iconEl;
    if (badge) {
      iconEl = document.createElement('div');
      iconEl.className = 'slot-badge';
      iconEl.style.background = badge.gradient;
      iconEl.innerHTML = badge.svg;
    } else {
      iconEl = document.createElement('img');
      iconEl.className = 'slot-icon';
      iconEl.src = app.icon || ICON_SRC;
      iconEl.width = 32;
      iconEl.height = 32;
    }
    wrapper.appendChild(iconEl);

    overlay.addEventListener('click', function() { swapTo(app.id); });

    workspace.appendChild(wrapper);

    appSlots[app.id] = {
      app: app,
      wrapper: wrapper,
      content: content,
      overlay: overlay,
      icon: iconEl
    };
  }

  function applyLayout() {
    var sideApps = getSideApps();
    var m = getLayoutMetrics();

    currentApps.forEach(function(app) {
      var slot = appSlots[app.id];
      if (!slot) return;
      slot.wrapper.style.display = '';
    });

    var mainSlot = appSlots[mainAppId];
    if (mainSlot) {
      var w = mainSlot.wrapper;
      w.style.left = m.mainX + 'px';
      w.style.top = m.originY + 'px';
      w.style.width = m.mainW + 'px';
      w.style.height = m.mainH + 'px';
      w.style.borderRadius = '20px';
      w.style.zIndex = '1';
      w.classList.remove('is-thumb', 'is-placeholder', 'fly-out');
      w.classList.add('is-main');
      mainSlot.overlay.style.pointerEvents = 'none';
       mainSlot.icon.style.opacity = '0';

      var s = m.mainH / SRC_H;
      mainSlot.content.style.width = SRC_W + 'px';
      mainSlot.content.style.height = SRC_H + 'px';
      mainSlot.content.style.transform = 'scale(' + s + ')';
      mainSlot.content.style.left = '0px';
      mainSlot.content.style.top = '0px';
    }

    for (var i = 0; i < SIDE_SLOT_COUNT; i++) {
      var y = m.originY + i * (m.sideItemH + SIDEBAR_GAP);

      if (i < sideApps.length) {
        var sApp = sideApps[i];
        var sd = appSlots[sApp.id];
        if (!sd) continue;
        sd.wrapper.style.left = m.originX + 'px';
        sd.wrapper.style.top = y + 'px';
        sd.wrapper.style.width = m.sideW + 'px';
        sd.wrapper.style.height = m.sideItemH + 'px';
        sd.wrapper.style.borderRadius = '12px';
        sd.wrapper.style.zIndex = '10';
        sd.wrapper.classList.remove('is-main', 'is-placeholder', 'fly-out');
        sd.wrapper.classList.add('is-thumb');
        sd.overlay.style.pointerEvents = 'auto';
        sd.icon.style.opacity = '1';

        var sc = m.sideItemH / SRC_H;
        sd.content.style.width = SRC_W + 'px';
        sd.content.style.height = SRC_H + 'px';
        sd.content.style.transform = 'scale(' + sc + ')';
        sd.content.style.left = '0px';
        sd.content.style.top = '0px';

        placeholderSlots[i].style.display = 'none';
      } else {
        placeholderSlots[i].style.display = '';
        placeholderSlots[i].style.left = m.originX + 'px';
        placeholderSlots[i].style.top = y + 'px';
        placeholderSlots[i].style.width = m.sideW + 'px';
        placeholderSlots[i].style.height = m.sideItemH + 'px';
        placeholderSlots[i].style.borderRadius = '12px';
        placeholderSlots[i].style.zIndex = '10';
      }
    }

    Object.keys(appSlots).forEach(function(id) {
      if (id === mainAppId) return;
      var isSide = sideApps.some(function(a) { return a.id === id; });
      if (!isSide) {
        appSlots[id].wrapper.style.display = 'none';
      }
    });
  }

  var SWAP_DURATION = 500;
  var SWAP_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var swapping = false;
  var swapGeneration = 0;

  function swapTo(targetId) {
    if (targetId === mainAppId || swapping) return;
    swapping = true;
    var gen = ++swapGeneration;

    var oldId = mainAppId;
    var oldMainSlot = appSlots[oldId];
    var newMainSlot = appSlots[targetId];
    var m = getLayoutMetrics();

    var oldIdx = currentApps.findIndex(function(a) { return a.id === oldId; });
    var newIdx = currentApps.findIndex(function(a) { return a.id === targetId; });
    var tmp = currentApps[oldIdx];
    currentApps[oldIdx] = currentApps[newIdx];
    currentApps[newIdx] = tmp;
    mainAppId = targetId;

    var sideApps = getSideApps();
    var sideIdx = sideApps.findIndex(function(a) { return a.id === oldId; });
    var targetY = m.originY + sideIdx * (m.sideItemH + SIDEBAR_GAP);

    newMainSlot.wrapper.classList.add('swapping');
    oldMainSlot.wrapper.classList.add('swapping');
    newMainSlot.icon.style.opacity = '0';
    oldMainSlot.icon.style.opacity = '1';
    oldMainSlot.wrapper.style.zIndex = '15';
    newMainSlot.wrapper.style.zIndex = '15';

    var bigScale = m.mainH / SRC_H;
    var smallScale = m.sideItemH / SRC_H;
    var swapT = 'left ' + SWAP_DURATION + 'ms ' + SWAP_EASE + ', ' +
      'top ' + SWAP_DURATION + 'ms ' + SWAP_EASE + ', ' +
      'width ' + SWAP_DURATION + 'ms ' + SWAP_EASE + ', ' +
      'height ' + SWAP_DURATION + 'ms ' + SWAP_EASE + ', ' +
      'border-radius ' + SWAP_DURATION + 'ms ' + SWAP_EASE;
    var contentT = 'transform ' + SWAP_DURATION + 'ms ' + SWAP_EASE;

    newMainSlot.wrapper.style.transition = swapT;
    oldMainSlot.wrapper.style.transition = swapT;
    newMainSlot.content.style.transition = contentT;
    oldMainSlot.content.style.transition = contentT;

    for (var i = 0; i < sideApps.length; i++) {
      if (sideApps[i].id === oldId) continue;
      var sd = appSlots[sideApps[i].id];
      if (sd) sd.wrapper.style.transition = swapT;
    }
    for (var pi = sideApps.length; pi < SIDE_SLOT_COUNT; pi++) {
      placeholderSlots[pi].style.transition = swapT;
    }

    void workspace.offsetHeight;

    newMainSlot.wrapper.style.left = m.mainX + 'px';
    newMainSlot.wrapper.style.top = m.originY + 'px';
    newMainSlot.wrapper.style.width = m.mainW + 'px';
    newMainSlot.wrapper.style.height = m.mainH + 'px';
    newMainSlot.wrapper.style.borderRadius = '20px';
    newMainSlot.content.style.transform = 'scale(' + bigScale + ')';

    oldMainSlot.wrapper.style.left = m.originX + 'px';
    oldMainSlot.wrapper.style.top = targetY + 'px';
    oldMainSlot.wrapper.style.width = m.sideW + 'px';
    oldMainSlot.wrapper.style.height = m.sideItemH + 'px';
    oldMainSlot.wrapper.style.borderRadius = '12px';
    oldMainSlot.content.style.transform = 'scale(' + smallScale + ')';

    for (var i = 0; i < sideApps.length; i++) {
      if (sideApps[i].id === oldId) continue;
      var sd = appSlots[sideApps[i].id];
      if (!sd) continue;
      var sy = m.originY + i * (m.sideItemH + SIDEBAR_GAP);
      sd.wrapper.style.top = sy + 'px';
    }
    for (var pi = sideApps.length; pi < SIDE_SLOT_COUNT; pi++) {
      var py = m.originY + pi * (m.sideItemH + SIDEBAR_GAP);
      placeholderSlots[pi].style.top = py + 'px';
    }

    function cleanup() {
      if (gen !== swapGeneration) return;

      newMainSlot.wrapper.style.transition = 'none';
      oldMainSlot.wrapper.style.transition = 'none';
      newMainSlot.content.style.transition = 'none';
      oldMainSlot.content.style.transition = 'none';
      void workspace.offsetHeight;

      oldMainSlot.wrapper.style.zIndex = '10';
      newMainSlot.wrapper.style.zIndex = '1';

      newMainSlot.wrapper.classList.remove('is-thumb', 'is-placeholder', 'fly-out', 'swapping');
      newMainSlot.wrapper.classList.add('is-main');
      newMainSlot.overlay.style.pointerEvents = 'none';
      newMainSlot.icon.style.opacity = '0';

      oldMainSlot.wrapper.classList.remove('is-main', 'is-placeholder', 'fly-out', 'swapping');
      oldMainSlot.wrapper.classList.add('is-thumb');
      oldMainSlot.overlay.style.pointerEvents = 'auto';
      oldMainSlot.icon.style.opacity = '1';

      void workspace.offsetHeight;
      newMainSlot.wrapper.style.transition = '';
      oldMainSlot.wrapper.style.transition = '';
      newMainSlot.content.style.transition = '';
      oldMainSlot.content.style.transition = '';

      swapping = false;
    }

    newMainSlot.wrapper.addEventListener('transitionend', function onEnd(e) {
      if (e.target !== newMainSlot.wrapper || e.propertyName !== 'width') return;
      newMainSlot.wrapper.removeEventListener('transitionend', onEnd);
      cleanup();
    });

    setTimeout(function() {
      cleanup();
    }, SWAP_DURATION + 100);
  }

  function deployAgents(agentIds) {
    var m = getLayoutMetrics();
    var sideApps = getSideApps();
    var existingSideCount = sideApps.length;

    var mainCenterX = m.mainX + m.mainW / 2;
    var mainCenterY = m.originY + m.mainH / 2;

    agentIds.forEach(function(agentId, idx) {
      if (appSlots[agentId]) return;

      var appDef = APPS_FULL.find(function(a) { return a.id === agentId; });
      if (!appDef) return;

      currentApps.push(appDef);
      createSlot(appDef);

      var slot = appSlots[agentId];
      var sideIdx = existingSideCount + idx;
      var targetX = m.originX;
      var targetY = m.originY + sideIdx * (m.sideItemH + SIDEBAR_GAP);

      var w = slot.wrapper;
      w.style.left = mainCenterX - m.sideW / 2 + 'px';
      w.style.top = mainCenterY - m.sideItemH / 2 + 'px';
      w.style.width = m.sideW + 'px';
      w.style.height = m.sideItemH + 'px';
      w.style.borderRadius = '12px';
      w.style.zIndex = '20';
      w.style.opacity = '0';
      w.style.transform = 'scale(0.3)';
      w.style.display = '';
      w.className = 'app-slot is-thumb fly-out';

      slot.overlay.style.pointerEvents = 'auto';
      slot.icon.style.opacity = '1';

      var sc = m.sideItemH / SRC_H;
      slot.content.style.width = SRC_W + 'px';
      slot.content.style.height = SRC_H + 'px';
      slot.content.style.transform = 'scale(' + sc + ')';
      slot.content.style.left = '0px';
      slot.content.style.top = '0px';

      var phIdx = sideIdx;
      if (phIdx < placeholderSlots.length) {
        placeholderSlots[phIdx].style.display = 'none';
      }

      setTimeout(function() {
        w.style.transition = 'left 0.6s cubic-bezier(0.22,1,0.36,1), top 0.6s cubic-bezier(0.22,1,0.36,1), opacity 0.4s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)';
        w.style.left = targetX + 'px';
        w.style.top = targetY + 'px';
        w.style.opacity = '1';
        w.style.transform = 'scale(1)';

        setTimeout(function() {
          w.style.transition = '';
          w.style.zIndex = '10';
          w.classList.remove('fly-out');
        }, 700);
      }, 100 + idx * 250);
    });
  }

  window.addEventListener('message', function(e) {
    if (!e.data) return;

    if (e.data.type === 'deploy-agents') {
      deployAgents(e.data.agents);
    }

    if (e.data.type === 'switch-agent') {
      swapTo(e.data.agentId);
    }

    if (e.data.type === 'askV') {
      if (!appSlots['chat']) {
        var chatApp = APPS_FULL.find(function(a) { return a.id === 'chat'; });
        if (chatApp) {
          currentApps.push(chatApp);
          createSlot(chatApp);
        }
      }
      swapTo('chat');
      var chatSlot = appSlots['chat'];
      if (chatSlot && chatSlot.content.contentWindow) {
        setTimeout(function() {
          chatSlot.content.contentWindow.postMessage({
            type: 'askV-context',
            text: e.data.text,
            speaker: e.data.speaker,
            ts: e.data.ts
          }, '*');
        }, 100);
      }
    }
  });

  updateTime();
  setInterval(updateTime, 30000);
  window.addEventListener('resize', function() {
    if (inited) applyLayout();
  });
  startPhase1();
})();
