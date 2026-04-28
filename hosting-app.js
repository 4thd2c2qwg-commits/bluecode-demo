if (window.parent !== window) document.body.classList.add('in-iframe');

(function() {
  var statusTimeEl = document.getElementById('statusTime');
  function updateClock() {
    var now = new Date();
    statusTimeEl.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  }
  setInterval(updateClock, 1000);
  updateClock();

  var contextModal = document.getElementById('contextModal');
  var contextBackdrop = document.getElementById('contextBackdrop');
  var contextClose = document.getElementById('contextClose');
  var contextBody = document.getElementById('contextBody');

  function openContext(feed) {
    var html = '';
    if (feed.context && feed.context.length > 0) {
      feed.context.forEach(function(line) {
        html += '<div class="context-line">' +
          '<span class="context-line-time">' + line.time + '</span>' +
          '<span class="context-line-speaker block-speaker ' + line.speakerClass + '">' + line.speaker + '</span>' +
          '<span class="context-line-text">' + line.text + '</span>' +
          '</div>';
      });
    }
    html += '<div class="context-current-label">▼ 当前内容</div>';
    html += '<div class="context-line context-current">' +
      '<span class="context-line-time">' + feed.time + '</span>' +
      '<span class="context-line-speaker block-speaker ' + feed.speakerClass + '">' + feed.speaker + '</span>' +
      '<span class="context-line-text">' + feed.original + '</span>' +
      '</div>';
    contextBody.innerHTML = html;
    contextModal.classList.add('open');
  }

  function closeContext() {
    contextModal.classList.remove('open');
  }

  contextBackdrop.addEventListener('click', closeContext);
  contextClose.addEventListener('click', closeContext);

  var setupView = document.getElementById('setupView');
  var hostingView = document.getElementById('hostingView');
  var tabBar = document.getElementById('tabBar');
  var tabPanels = document.getElementById('tabPanels');
  var sourceDetail = document.getElementById('sourceDetail');
  var startBtn = document.getElementById('startBtn');
  var pauseBtn = document.getElementById('pauseBtn');
  var exportBtn = document.getElementById('exportBtn');
  var contentArea = document.getElementById('contentArea');

  var focusGrid = document.getElementById('focusGrid');
  var mentionSection = document.getElementById('mentionSection');
  var mentionNameInput = document.getElementById('mentionNameInput');
  var personSection = document.getElementById('personSection');
  var topicSection = document.getElementById('topicSection');
  var topicInput = document.getElementById('topicInput');

  var selectedTypes = { mention: true, person: false, topic: false };
  var selectedPersons = ['张毅'];
  var selectedTopics = ['交互'];
  var myName = '李逍雨';

  focusGrid.addEventListener('click', function(e) {
    var card = e.target.closest('.focus-card');
    if (!card) return;
    var type = card.dataset.type;
    card.classList.toggle('selected');
    selectedTypes[type] = card.classList.contains('selected');
    mentionSection.style.display = selectedTypes.mention ? '' : 'none';
    personSection.style.display = selectedTypes.person ? '' : 'none';
    topicSection.style.display = selectedTypes.topic ? '' : 'none';
  });

  document.getElementById('personChips').addEventListener('click', function(e) {
    var chip = e.target.closest('.person-chip');
    if (!chip) return;
    chip.classList.toggle('selected');
    var name = chip.dataset.person;
    var idx = selectedPersons.indexOf(name);
    if (idx >= 0) selectedPersons.splice(idx, 1);
    else selectedPersons.push(name);
  });

  document.getElementById('topicTags').addEventListener('click', function(e) {
    var tag = e.target.closest('.topic-tag');
    if (!tag) return;
    tag.classList.toggle('selected');
    var kw = tag.dataset.kw;
    var idx = selectedTopics.indexOf(kw);
    if (idx >= 0) selectedTopics.splice(idx, 1);
    else selectedTopics.push(kw);
  });

  topicInput.addEventListener('keydown', function(e) {
    if (e.key !== 'Enter') return;
    var val = topicInput.value.trim();
    if (!val || selectedTopics.indexOf(val) >= 0) return;
    selectedTopics.push(val);
    var tag = document.createElement('div');
    tag.className = 'topic-tag selected';
    tag.dataset.kw = val;
    tag.textContent = val;
    tag.addEventListener('click', function() {
      tag.classList.toggle('selected');
      var i = selectedTopics.indexOf(val);
      if (i >= 0) selectedTopics.splice(i, 1);
      else selectedTopics.push(val);
    });
    document.getElementById('topicTags').appendChild(tag);
    topicInput.value = '';
  });

  startBtn.addEventListener('click', function() {
    startHosting();
  });

  var tabs = [];
  var panels = {};
  var panelCounts = {};
  var activeTab = null;
  var feedIndex = 0;

  function startHosting() {
    myName = mentionNameInput.value.trim() || '李逍雨';
    setupView.style.display = 'none';
    hostingView.style.display = 'flex';
    pauseBtn.style.display = '';
    exportBtn.style.display = '';
    sourceDetail.textContent = '腾讯会议 · 实时托管中';

    tabs = [];
    if (selectedTypes.mention) {
      tabs.push({ id: 'mention', label: '提到我的', dotClass: 'mention' });
    }
    if (selectedTypes.person) {
      selectedPersons.forEach(function(p) {
        tabs.push({ id: 'person-' + p, label: p + '的发言', dotClass: 'person', person: p });
      });
    }
    if (selectedTypes.topic) {
      selectedTopics.forEach(function(t) {
        tabs.push({ id: 'topic-' + t, label: t, dotClass: 'topic', topic: t });
      });
    }

    if (tabs.length === 0) {
      tabs.push({ id: 'mention', label: '提到我的', dotClass: 'mention' });
    }

    tabBar.innerHTML = '';
    tabPanels.innerHTML = '';

    tabs.forEach(function(tab, i) {
      var el = document.createElement('div');
      el.className = 'tab-item' + (i === 0 ? ' active' : '');
      el.dataset.tabId = tab.id;
      el.innerHTML = '<span class="tab-dot ' + tab.dotClass + '"></span>' +
        '<span class="tab-label">' + tab.label + '</span>' +
        '<span class="tab-count" id="count-' + tab.id + '">0</span>';
      el.addEventListener('click', function() { switchTab(tab.id); });
      tabBar.appendChild(el);

      var panel = document.createElement('div');
      panel.className = 'tab-panel' + (i === 0 ? ' active' : '');
      panel.id = 'panel-' + tab.id;
      panel.innerHTML = '<div class="panel-empty" id="empty-' + tab.id + '">' +
        '<div class="empty-icon"><svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>' +
        '<div class="empty-text">正在从转写中监听相关内容…</div>' +
        '<div class="empty-shimmer"><div class="shimmer-line"></div><div class="shimmer-line"></div><div class="shimmer-line"></div></div></div>';
      tabPanels.appendChild(panel);

      panels[tab.id] = panel;
      panelCounts[tab.id] = 0;
    });

    activeTab = tabs[0].id;

    setTimeout(function() { startFeed(); }, 2000);
  }

  function switchTab(id) {
    if (activeTab === id) return;
    activeTab = id;
    tabBar.querySelectorAll('.tab-item').forEach(function(el) {
      el.classList.toggle('active', el.dataset.tabId === id);
    });
    Object.keys(panels).forEach(function(k) {
      panels[k].classList.toggle('active', k === id);
    });
  }

  function addCount(tabId) {
    panelCounts[tabId]++;
    var el = document.getElementById('count-' + tabId);
    if (el) el.textContent = panelCounts[tabId];
  }

  function hideEmpty(tabId) {
    var emp = document.getElementById('empty-' + tabId);
    if (emp) emp.style.display = 'none';
  }

  var MOCK_FEED = [
    {
      tab: 'mention',
      time: '02:18',
      speaker: '张毅',
      speakerClass: 's-b',
      original: '这个转写功能的交互方案，<mark>逍雨</mark>你之前不是做过类似的吗？你来负责这块的PRD吧。',
      summary: '张毅提议由你负责转写功能的交互方案 PRD 编写，基于你之前的经验。',
      context: [
        { time: '01:55', speaker: '张毅', speakerClass: 's-b', text: '好，技术方案聊完了，接下来说说产品侧的分工。' },
        { time: '01:58', speaker: '未知说话人2', speakerClass: 's-d', text: 'PRD谁来写？之前语音助手那个项目的经验可以参考。' },
        { time: '02:05', speaker: '未知说话人1', speakerClass: 's-c', text: '那交互方案这块谁来跟？之前那版语音助手的方案还能复用吗？' },
        { time: '02:10', speaker: '张毅', speakerClass: 's-b', text: '可以复用一部分，但转写场景的信息密度更高，需要重新设计信息层级。' },
        { time: '02:14', speaker: '未知说话人2', speakerClass: 's-d', text: '对，而且折叠屏的多窗口模式下布局会完全不一样。' },
      ],
      extras: [
        { type: 'local', icon: 'local', title: '语音助手交互方案v2.1.pptx', source: '本地文件 · 3天前修改' },
      ]
    },
    {
      tab: 'person-张毅',
      time: '01:15',
      speaker: '张毅',
      speakerClass: 's-b',
      original: '从用户反馈来看，70%的用户有实时音频转文字的需求，而且不限于会议场景，播客、网课这些也需要。',
      summary: '张毅引用用户调研数据说明转文字需求广泛，需求范围覆盖会议、播客、网课等多场景。',
      context: [
        { time: '00:50', speaker: '张毅', speakerClass: 's-b', text: '那我先介绍一下背景，这个功能的需求其实酝酿很久了。' },
        { time: '00:55', speaker: '未知说话人2', speakerClass: 's-d', text: '嗯，之前好几个版本都提过，一直没排上。' },
        { time: '01:03', speaker: '未知说话人1', speakerClass: 's-c', text: '这个功能的需求来源是什么？有数据支撑吗？' },
        { time: '01:07', speaker: '张毅', speakerClass: 's-b', text: '有的，上个月用户调研刚做完，我给大家看下数据。' },
        { time: '01:11', speaker: '未知说话人2', speakerClass: 's-d', text: '好，我们听听具体的用户反馈。' },
      ],
      extras: [
        { type: 'web', icon: 'web', title: '2025年语音转文字市场需求分析报告', source: '联网搜索 · 36kr.com' },
      ]
    },
    {
      tab: 'topic-交互',
      time: '02:36',
      speaker: '未知说话人2',
      speakerClass: 's-d',
      original: '转写页面的交互要通用化设计，不能只绑定会议场景。信息层级要做好——谁说的、说了什么、什么时候说，这三层得清晰。',
      summary: '讨论转写页面交互设计原则：通用化（不限会议），信息层级三要素——说话人、内容、时间。',
      context: [
        { time: '02:18', speaker: '张毅', speakerClass: 's-b', text: '逍雨你来负责这块的PRD吧，交互稿也一起出。' },
        { time: '02:22', speaker: '未知说话人1', speakerClass: 's-c', text: '好的，那页面设计这块有什么大的方向吗？' },
        { time: '02:25', speaker: '张毅', speakerClass: 's-b', text: '接下来聊一下转写页面的设计思路，大家有什么想法？' },
        { time: '02:28', speaker: '未知说话人1', speakerClass: 's-c', text: '我觉得不能只做会议记录，应该更通用一些。' },
        { time: '02:32', speaker: '张毅', speakerClass: 's-b', text: '对，定位就是通用音频转文字工具，会议只是其中一个场景。' },
      ],
      extras: [
        { type: 'local', icon: 'local', title: '原子工作台交互规范.sketch', source: '本地文件 · 上周修改' },
        { type: 'web', icon: 'web', title: '折叠屏多任务交互设计最佳实践', source: '联网搜索 · uxdesign.cc' },
      ]
    },
    {
      tab: 'mention',
      time: '03:42',
      speaker: '未知说话人1',
      speakerClass: 's-c',
      original: '端侧模型的性能评测，<mark>逍雨</mark>你那边也看一下数据，特别是延迟超过500ms的case。',
      summary: '需要你协助检查端侧模型延迟超标的case，关注>500ms的异常数据。',
      context: [
        { time: '03:22', speaker: '张毅', speakerClass: 's-b', text: '技术细节再深入聊一下，端侧模型的能力边界在哪。' },
        { time: '03:26', speaker: '未知说话人2', speakerClass: 's-d', text: '纯端侧的话，4人以内识别没问题，再多就得上云端辅助了。' },
        { time: '03:30', speaker: '张毅', speakerClass: 's-b', text: '端侧模型目前中文识别准确率95%以上，延迟控制在500ms以内。' },
        { time: '03:35', speaker: '未知说话人2', speakerClass: 's-d', text: '但是有些方言场景和嘈杂环境下延迟会飙升，这个得关注。' },
        { time: '03:38', speaker: '未知说话人1', speakerClass: 's-c', text: '嗯，我们需要有人专门跟进这块的异常数据。' },
      ],
      extras: [
        { type: 'web', icon: 'web', title: '端侧语音识别模型延迟优化方案汇总', source: '联网搜索 · arxiv.org' },
        { type: 'local', icon: 'local', title: '端侧模型性能评测_v1.xlsx', source: '本地文件 · 今天' },
      ]
    },
    {
      tab: 'person-张毅',
      time: '02:50',
      speaker: '张毅',
      speakerClass: 's-b',
      original: '排期的话，我跟开发聊过了，4月中旬可以启动，6周开发加2周测试，5月底出首版。',
      summary: '张毅确认开发排期：4月中启动，6周开发+2周测试，预计5月底交付首个可用版本。',
      context: [
        { time: '02:36', speaker: '未知说话人2', speakerClass: 's-d', text: '页面设计的事先放一放，排期的问题更紧迫。' },
        { time: '02:38', speaker: '未知说话人1', speakerClass: 's-c', text: '对，产品和开发得对齐一下时间节点。' },
        { time: '02:40', speaker: '未知说话人1', speakerClass: 's-c', text: '技术方案定了的话，排期大概什么时候能开始？' },
        { time: '02:43', speaker: '未知说话人2', speakerClass: 's-d', text: '设计这边至少需要两周出稿，开发可以并行准备。' },
        { time: '02:47', speaker: '张毅', speakerClass: 's-b', text: '我已经提前跟开发那边沟通过了，他们可以配合。' },
      ],
      extras: []
    },
    {
      tab: 'topic-交互',
      time: '03:15',
      speaker: '张毅',
      speakerClass: 's-b',
      original: '交互上有一点要注意，折叠屏的多窗口场景下，转写窗口缩小后文字要自动调整密度，不能糊成一团。',
      summary: '折叠屏小窗模式下需要自适应文字密度，避免内容在缩放后不可读。',
      context: [
        { time: '02:55', speaker: '张毅', speakerClass: 's-b', text: '排期说完了，回到交互的话题。' },
        { time: '02:58', speaker: '未知说话人1', speakerClass: 's-c', text: '刚才说到折叠屏适配，这块有坑要提前踩。' },
        { time: '03:05', speaker: '未知说话人2', speakerClass: 's-d', text: '折叠屏那边多窗口的适配有什么特殊要求吗？' },
        { time: '03:08', speaker: '未知说话人1', speakerClass: 's-c', text: '主要是缩放后内容的可读性，之前几个应用都踩过坑。' },
        { time: '03:12', speaker: '未知说话人2', speakerClass: 's-d', text: '对，特别是文字密集的页面，缩小后完全看不清。' },
      ],
      extras: [
        { type: 'web', icon: 'web', title: 'Android 大屏窗口适配指南 (2025)', source: '联网搜索 · developer.android.com' },
      ]
    },
    {
      tab: 'mention',
      time: '04:10',
      speaker: '张毅',
      speakerClass: 's-b',
      original: '最后确认一下分工，<mark>逍雨</mark>负责PRD和交互稿，本周五前给到我review。',
      summary: '你的任务确认：负责 PRD + 交互稿，截止本周五提交给张毅 review。',
      context: [
        { time: '03:55', speaker: '未知说话人1', speakerClass: 's-c', text: '说话人分离的颜色方案也需要设计出一版。' },
        { time: '03:58', speaker: '未知说话人2', speakerClass: 's-d', text: '嗯，这个我记下来了，跟设计那边同步。' },
        { time: '04:02', speaker: '张毅', speakerClass: 's-b', text: '好，技术方案和排期都确认了，我们来分一下工。' },
        { time: '04:05', speaker: '未知说话人1', speakerClass: 's-c', text: '我这边负责端侧模型的评测报告，下周三前出。' },
        { time: '04:08', speaker: '未知说话人2', speakerClass: 's-d', text: '设计资源我来协调，下周五前给设计稿。' },
      ],
      extras: []
    },
    {
      tab: 'person-张毅',
      time: '04:25',
      speaker: '张毅',
      speakerClass: 's-b',
      original: '好的，那这次会议三个结论都确认了：技术用混合架构、排期4月中启动、<mark>逍雨</mark>负责PRD。散会。',
      summary: '张毅做会议收尾，确认三项决策：混合技术架构、4月中启动排期、你负责 PRD。',
      context: [
        { time: '04:10', speaker: '张毅', speakerClass: 's-b', text: '逍雨负责PRD和交互稿，本周五前给到我review。' },
        { time: '04:13', speaker: '未知说话人1', speakerClass: 's-c', text: '时间有点紧，但应该能赶上。' },
        { time: '04:18', speaker: '未知说话人1', speakerClass: 's-c', text: '还有什么遗漏的吗？我觉得差不多了。' },
        { time: '04:20', speaker: '未知说话人2', speakerClass: 's-d', text: '我这边没有了，该确认的都确认了。' },
        { time: '04:22', speaker: '张毅', speakerClass: 's-b', text: '好，那我总结一下今天的结论。' },
      ],
      extras: []
    },
    {
      tab: 'topic-交互',
      time: '04:00',
      speaker: '未知说话人1',
      speakerClass: 's-c',
      original: '说话人分离的交互展示也是个问题，超过4个人的场景颜色分配怎么做，需要设计同学给方案。',
      summary: '多说话人（>4人）场景的颜色区分方案需设计团队提供，当前4人以内方案可行。',
      context: [
        { time: '03:42', speaker: '未知说话人1', speakerClass: 's-c', text: '逍雨你那边也看一下端侧延迟的数据。' },
        { time: '03:46', speaker: '张毅', speakerClass: 's-b', text: '嗯好，说话人分离的能力边界也要同步关注。' },
        { time: '03:50', speaker: '张毅', speakerClass: 's-b', text: '说话人分离这块，4人以内准确率85%，基本够用了。' },
        { time: '03:54', speaker: '未知说话人2', speakerClass: 's-d', text: '那超过4个人呢？大型会议经常六七个人同时在线。' },
        { time: '03:57', speaker: '张毅', speakerClass: 's-b', text: '超过6人准确率会下降，这个后续持续优化，但交互上要先考虑到。' },
      ],
      extras: [
        { type: 'web', icon: 'web', title: '多人对话UI中的说话人区分设计', source: '联网搜索 · medium.com' },
      ]
    }
  ];

  function getTabFeeds() {
    var result = {};
    tabs.forEach(function(t) { result[t.id] = []; });
    MOCK_FEED.forEach(function(item) {
      if (result[item.tab]) result[item.tab].push(item);
    });
    return result;
  }

  function startFeed() {
    var tabFeeds = getTabFeeds();
    var tabIdx = {};
    tabs.forEach(function(t) { tabIdx[t.id] = 0; });

    var allItems = [];
    tabs.forEach(function(t) {
      var feeds = tabFeeds[t.id] || [];
      feeds.forEach(function(f, i) {
        allItems.push({ tabId: t.id, feedIdx: i, feed: f });
      });
    });

    var globalIdx = 0;
    function pushNext() {
      if (globalIdx >= allItems.length) return;
      var item = allItems[globalIdx];
      globalIdx++;
      hideEmpty(item.tabId);
      addCount(item.tabId);
      renderBlock(item.tabId, item.feed);
      var nextDelay = 2500 + Math.random() * 2000;
      setTimeout(pushNext, nextDelay);
    }
    pushNext();
  }

  function renderExtraCard(ex) {
    return '<div class="extra-card">' +
      '<div class="extra-icon ' + ex.icon + '">' +
      (ex.type === 'web'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>'
      ) + '</div>' +
      '<div class="extra-body"><div class="extra-title">' + ex.title + '</div>' +
      '<div class="extra-source">' + ex.source + '</div></div>' +
      '<div class="extra-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 6 15 12 9 18"/></svg></div>' +
      '</div>';
  }

  function renderBlock(tabId, feed) {
    var panel = panels[tabId];
    if (!panel) return;

    var block = document.createElement('div');
    block.className = 'content-block';

    var headerHTML = '<div class="block-header">' +
      '<span class="block-time">' + feed.time + '</span>' +
      '<span class="block-speaker ' + feed.speakerClass + '">' + feed.speaker + '</span>' +
      '<span class="block-tag new">NEW</span>' +
      '</div>';

    var originalHTML = '<div class="block-section">' +
      '<div class="section-title-row">' +
        '<div class="section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span>原文</span></div>' +
        '<button class="context-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>查看前文</button>' +
      '</div>' +
      '<div class="original-text">' + feed.original + '</div>' +
      '</div>';

    var summaryHTML = '<div class="block-section">' +
      '<div class="section-title-row">' +
        '<div class="section-title ai"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg><span>AI 总结</span></div>' +
      '</div>' +
      '<div class="summary-text" id="sum-' + (++feedIndex) + '"></div>' +
      '</div>';

    var webExtras = [];
    var localExtras = [];
    if (feed.extras) {
      feed.extras.forEach(function(ex) {
        if (ex.type === 'web') webExtras.push(ex);
        else localExtras.push(ex);
      });
    }

    var webHTML = '';
    if (webExtras.length > 0) {
      webHTML = '<div class="block-section extra-section" data-extra="web">' +
        '<div class="section-title-row">' +
          '<div class="section-title web"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg><span>联网搜索</span></div>' +
        '</div>' +
        '<div class="searching-state"><span class="searching-spinner"></span><span class="searching-text">正在搜索相关内容…</span></div>' +
        '<div class="extra-list" style="display:none;">';
      webExtras.forEach(function(ex) { webHTML += renderExtraCard(ex); });
      webHTML += '</div></div>';
    }

    var localHTML = '';
    if (localExtras.length > 0) {
      localHTML = '<div class="block-section extra-section" data-extra="local">' +
        '<div class="section-title-row">' +
          '<div class="section-title local"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg><span>本地文件</span></div>' +
        '</div>' +
        '<div class="searching-state"><span class="searching-spinner"></span><span class="searching-text">正在检索本地文件…</span></div>' +
        '<div class="extra-list" style="display:none;">';
      localExtras.forEach(function(ex) { localHTML += renderExtraCard(ex); });
      localHTML += '</div></div>';
    }

    block.innerHTML = headerHTML + originalHTML + summaryHTML + webHTML + localHTML;
    panel.appendChild(block);

    var extraSections = block.querySelectorAll('.extra-section');
    extraSections.forEach(function(section, idx) {
      var delay = 1500 + idx * 1200;
      setTimeout(function() {
        var searching = section.querySelector('.searching-state');
        var list = section.querySelector('.extra-list');
        if (searching) searching.style.display = 'none';
        if (list) { list.style.display = ''; list.classList.add('extra-reveal'); }
        panel.scrollTop = panel.scrollHeight;
      }, delay);
    });

    var ctxBtn = block.querySelector('.context-btn');
    if (ctxBtn) {
      (function(f) {
        ctxBtn.addEventListener('click', function() { openContext(f); });
      })(feed);
    }

    var sumEl = block.querySelector('.summary-text');
    typeText(sumEl, feed.summary);

    panel.scrollTop = panel.scrollHeight;

    setTimeout(function() {
      var tag = block.querySelector('.block-tag');
      if (tag) {
        tag.classList.remove('new');
        tag.textContent = '';
        tag.style.display = 'none';
      }
    }, 5000);
  }

  function typeText(el, text) {
    el.textContent = '';
    var cursor = document.createElement('span');
    cursor.className = 'typing-cursor-sm';
    el.appendChild(cursor);
    var i = 0;
    function tick() {
      if (i < text.length) {
        cursor.before(document.createTextNode(text[i]));
        i++;
        var speed = 20 + Math.random() * 15;
        if (text[i - 1] === '，' || text[i - 1] === '。') speed += 50;
        setTimeout(tick, speed);
      } else {
        cursor.remove();
      }
    }
    tick();
  }
})();
