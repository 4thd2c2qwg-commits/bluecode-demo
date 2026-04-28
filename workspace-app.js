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

  var SIDEBAR_W = 180;
  var SIDEBAR_GAP = 20;
  var SIDEBAR_MAIN_GAP = 20;

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

    var ratio = SRC_W / SRC_H;
    var sideCount = sideApps.length;
    var totalGaps = (sideCount - 1) * SIDEBAR_GAP;

    var MARGIN = 24;
    var areaW = wsW - MARGIN * 2;
    var areaH = wsH - MARGIN * 2;
    var maxMainW = areaW - SIDEBAR_W - SIDEBAR_MAIN_GAP;
    var maxMainH = areaH;
    var mainW, mainH;
    if (maxMainW / maxMainH > ratio) {
      mainH = maxMainH;
      mainW = Math.round(mainH * ratio);
    } else {
      mainW = maxMainW;
      mainH = Math.round(mainW / ratio);
    }

    var sidebarH = mainH;
    var sideItemH = Math.round((sidebarH - totalGaps) / sideCount);

    var totalW = SIDEBAR_W + SIDEBAR_MAIN_GAP + mainW;
    var totalH = mainH;
    var originX = Math.round((wsW - totalW) / 2);
    var originY = Math.round((wsH - totalH) / 2);

    var mainX = originX + SIDEBAR_W + SIDEBAR_MAIN_GAP;
    var mainY = originY;

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
        var y = originY + sideIdx * (sideItemH + SIDEBAR_GAP);
        w.style.left = originX + 'px';
        w.style.top = y + 'px';
        w.style.width = SIDEBAR_W + 'px';
        w.style.height = sideItemH + 'px';
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
          var s = SIDEBAR_W / SRC_W;
          slot.content.style.width = SRC_W + 'px';
          slot.content.style.height = SRC_H + 'px';
          slot.content.style.transform = 'scale(' + s + ')';
          slot.content.style.left = '0px';
          slot.content.style.top = '0px';
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
