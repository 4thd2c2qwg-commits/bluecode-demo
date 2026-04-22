(function() {
  var APPS = [
    { id: 'meeting',    title: '腾讯会议',   url: 'meeting-screenshot.png', isImage: true, icon: 'meeting-icon.png' },
    { id: 'transcribe', title: 'AI转写',     url: 'index.html' },
    { id: 'summary',    title: 'AI总结',     url: 'summary.html' },
    { id: 'chat',       title: 'AI问答',     url: 'chat.html' },
    { id: 'capture',    title: 'AI智能截屏', url: 'capture.html' }
  ];

  var SRC_W = 2200;
  var SRC_H = 2480;
  var ICON_SRC = 'xiaov-icon.png';

  var PADDING = 24;
  var ICON_OFFSET = 6;
  var SIDEBAR_LEFT = PADDING + ICON_OFFSET;
  var SIDEBAR_W = 180;
  var SIDEBAR_H = 203;
  var SIDEBAR_GAP = 8;
  var SIDEBAR_MAIN_GAP = 16;

  var MAIN_LEFT = SIDEBAR_LEFT + SIDEBAR_W + SIDEBAR_MAIN_GAP;
  var MAIN_TOP = PADDING;
  var MAIN_RIGHT = PADDING;
  var MAIN_BOTTOM = PADDING;

  var mainAppId = 'meeting';
  var workspace = document.getElementById('workspace');

  var appSlots = {};

  function init() {
    APPS.forEach(function(app) {
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

      var icon = document.createElement('img');
      icon.className = 'slot-icon';
      icon.src = app.icon || ICON_SRC;
      icon.width = 32;
      icon.height = 32;
      wrapper.appendChild(icon);

      overlay.addEventListener('click', function() { swapTo(app.id); });

      workspace.appendChild(wrapper);

      appSlots[app.id] = {
        app: app,
        wrapper: wrapper,
        content: content,
        overlay: overlay,
        icon: icon
      };
    });

    applyLayout();
  }

  function applyLayout() {
    var sideApps = APPS.filter(function(a) { return a.id !== mainAppId; });
    var wsW = workspace.clientWidth;
    var wsH = workspace.clientHeight;

    var totalSideH = sideApps.length * SIDEBAR_H + (sideApps.length - 1) * SIDEBAR_GAP;
    var sideStartY = Math.round((wsH - totalSideH) / 2);

    var availW = wsW - MAIN_LEFT - MAIN_RIGHT;
    var availH = wsH - MAIN_TOP - MAIN_BOTTOM;
    var ratio = SRC_W / SRC_H;
    var mainW, mainH;
    if (availW / availH > ratio) {
      mainH = availH;
      mainW = Math.round(mainH * ratio);
    } else {
      mainW = availW;
      mainH = Math.round(mainW / ratio);
    }
    var mainX = MAIN_LEFT + Math.round((availW - mainW) / 2);
    var mainY = MAIN_TOP + Math.round((availH - mainH) / 2);

    var sideIdx = 0;
    APPS.forEach(function(app) {
      var slot = appSlots[app.id];
      var w = slot.wrapper;

      if (app.id === mainAppId) {
        w.style.left = mainX + 'px';
        w.style.top = mainY + 'px';
        w.style.width = mainW + 'px';
        w.style.height = mainH + 'px';
        w.style.borderRadius = '20px';
        w.style.zIndex = '1';
        w.classList.add('is-main');
        w.classList.remove('is-thumb');
        slot.overlay.style.display = 'none';
        slot.icon.style.display = 'none';

        if (app.isImage) {
          slot.content.style.width = '100%';
          slot.content.style.height = '100%';
          slot.content.style.objectFit = 'cover';
          slot.content.style.objectPosition = 'top center';
          slot.content.style.transform = '';
          slot.content.style.left = '';
          slot.content.style.top = '';
        } else {
          var s = mainW / SRC_W;
          slot.content.style.width = SRC_W + 'px';
          slot.content.style.height = SRC_H + 'px';
          slot.content.style.transform = 'scale(' + s + ')';
          slot.content.style.left = '0px';
          slot.content.style.top = '0px';
        }
      } else {
        var y = sideStartY + sideIdx * (SIDEBAR_H + SIDEBAR_GAP);
        w.style.left = SIDEBAR_LEFT + 'px';
        w.style.top = y + 'px';
        w.style.width = SIDEBAR_W + 'px';
        w.style.height = SIDEBAR_H + 'px';
        w.style.borderRadius = '12px';
        w.style.zIndex = '10';
        w.classList.add('is-thumb');
        w.classList.remove('is-main');
        slot.overlay.style.display = '';
        slot.icon.style.display = '';

        if (app.isImage) {
          slot.content.style.width = '100%';
          slot.content.style.height = '100%';
          slot.content.style.objectFit = 'cover';
          slot.content.style.objectPosition = 'top center';
          slot.content.style.transform = '';
          slot.content.style.left = '';
          slot.content.style.top = '';
        } else {
          var scaleX = SIDEBAR_W / SRC_W;
          var scaleY = SIDEBAR_H / SRC_H;
          var s = Math.max(scaleX, scaleY);
          var renderedW = SRC_W * s;
          var renderedH = SRC_H * s;
          var offX = (SIDEBAR_W - renderedW) / 2;
          var offY = (SIDEBAR_H - renderedH) / 2;
          slot.content.style.width = SRC_W + 'px';
          slot.content.style.height = SRC_H + 'px';
          slot.content.style.transform = 'scale(' + s + ')';
          slot.content.style.left = (offX / s) + 'px';
          slot.content.style.top = (offY / s) + 'px';
        }

        sideIdx++;
      }
    });
  }

  function swapTo(targetId) {
    if (targetId === mainAppId) return;
    mainAppId = targetId;
    applyLayout();
  }

  function updateTime() {
    var now = new Date();
    var h = now.getHours().toString().padStart(2, '0');
    var m = now.getMinutes().toString().padStart(2, '0');
    document.getElementById('statusTime').textContent = h + ':' + m;
  }

  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'askV') {
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
  init();
  window.addEventListener('resize', applyLayout);
})();
