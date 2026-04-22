if (window.parent !== window) document.body.classList.add('in-iframe');

var channel = new BroadcastChannel('ai-transcribe');

var statusTimeEl = document.getElementById('statusTime');
function updateClock() {
  var now = new Date();
  statusTimeEl.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
}
setInterval(updateClock, 1000);
updateClock();

var loadingState = document.getElementById('loadingState');
var summaryContent = document.getElementById('summaryContent');
var progressBar = document.getElementById('progressBar');
var sourceDetail = document.getElementById('sourceDetail');
var sourceBadge = document.getElementById('sourceBadge');
var loadingText = document.getElementById('loadingText');
var loadingSub = document.getElementById('loadingSub');

var contentArea = document.getElementById('contentArea');

var overviewText = document.getElementById('overviewText');
var keypointBody = document.getElementById('keypointBody');
var keypointCount = document.getElementById('keypointCount');
var decisionBody = document.getElementById('decisionBody');
var decisionCount = document.getElementById('decisionCount');
var todoBody = document.getElementById('todoBody');
var todoCount = document.getElementById('todoCount');
var riskBody = document.getElementById('riskBody');
var riskCount = document.getElementById('riskCount');
var timelineBody = document.getElementById('timelineBody');

var started = false;
var segmentsDone = 0;

var overviewStages = [
  { at: 2, text: '讨论围绕 AI录音转写功能 展开，目前正在介绍背景和用户需求...' },
  { at: 5, text: '讨论围绕 AI录音转写功能 展开，从用户需求和技术可行性两个维度进行评估。70%用户存在实时音频转文字需求...' },
  { at: 8, text: '讨论围绕 AI录音转写功能 展开，从用户需求、技术可行性和项目排期三个维度进行评估。团队正在讨论技术方案和排期...' },
  { at: 13, text: '本次讨论围绕 <strong>AI录音转写功能</strong> 展开，从用户需求、技术可行性和项目排期三个维度进行了评估。团队一致认为该功能应定位为通用音频转文字工具，覆盖会议、视频、播客等多种场景，适配折叠屏多任务交互。' },
];

var keypointStages = [
  { at: 3, items: [
    '70%用户存在实时音频转文字需求，不限于会议场景',
  ]},
  { at: 5, items: [
    '70%用户存在实时音频转文字需求，不限于会议场景',
    '端侧语音识别中文准确率95%+，延迟<500ms',
    '说话人分离4人以内准确率85%，系统内录效果优于麦克风采集',
  ]},
  { at: 11, items: [
    '70%用户存在实时音频转文字需求，不限于会议场景',
    '端侧语音识别中文准确率95%+，延迟<500ms',
    '说话人分离4人以内准确率85%，系统内录效果优于麦克风采集',
    '转写页面定位通用工具，强调"谁说、说了什么、什么时候说"',
  ]},
  { at: 12, items: [
    '70%用户存在实时音频转文字需求，不限于会议场景',
    '端侧语音识别中文准确率95%+，延迟<500ms',
    '说话人分离4人以内准确率85%，系统内录效果优于麦克风采集',
    '转写页面定位通用工具，强调"谁说、说了什么、什么时候说"',
    '自动分段策略：2秒以上静默断开段落，提升阅读体验',
  ]},
];

var decisionStages = [
  { at: 9, items: [
    { badge: '已确认', text: '技术方案采用端侧+云端混合架构，优先保证实时性' },
  ]},
  { at: 14, items: [
    { badge: '已确认', text: '转写助手定位为通用音频转文字工具，支持系统内录和麦克风两种音频源' },
    { badge: '已确认', text: '技术方案采用端侧+云端混合架构，优先保证实时性' },
    { badge: '已确认', text: '开发排期4月中旬启动，5月底交付首个可用版本' },
  ]},
];

var todoStages = [
  { at: 14, items: [
    { text: '输出转写功能PRD文档，包含通用化交互方案', assignee: '张毅', deadline: '截止 本周五' },
    { text: '完成端侧语音模型性能评测报告', assignee: '未知说话人1', deadline: '截止 下周三' },
    { text: '协调设计资源，完成转写页面UI设计稿', assignee: '未知说话人2', deadline: '截止 下周五' },
  ]},
];

var riskStages = [
  { at: 6, items: [
    { type: 'warn', text: '说话人分离超过6人时准确率下降，需持续优化' },
  ]},
  { at: 11, items: [
    { type: 'warn', text: '说话人分离超过6人时准确率下降，需持续优化' },
    { type: 'info', text: '页面设计中说话人姓名识别问题：多数场景无法获取真实姓名' },
  ]},
];

var timelineStages = [
  { at: 1, items: [
    { time: '00:03', title: '背景介绍', desc: '用户多场景实时转文字需求说明' },
  ]},
  { at: 3, items: [
    { time: '00:03', title: '背景介绍', desc: '用户多场景实时转文字需求说明' },
    { time: '00:38', title: '数据支撑', desc: '70%用户访谈反馈，手动记录效率低' },
  ]},
  { at: 5, items: [
    { time: '00:03', title: '背景介绍', desc: '用户多场景实时转文字需求说明' },
    { time: '00:38', title: '数据支撑', desc: '70%用户访谈反馈，手动记录效率低' },
    { time: '01:15', title: '技术方案', desc: '端侧模型能力与说话人分离方案讨论' },
  ]},
  { at: 8, items: [
    { time: '00:03', title: '背景介绍', desc: '用户多场景实时转文字需求说明' },
    { time: '00:38', title: '数据支撑', desc: '70%用户访谈反馈，手动记录效率低' },
    { time: '01:15', title: '技术方案', desc: '端侧模型能力与说话人分离方案讨论' },
    { time: '02:18', title: '排期确认', desc: '4月中启动，6+2周，5月底首版' },
  ]},
  { at: 11, items: [
    { time: '00:03', title: '背景介绍', desc: '用户多场景实时转文字需求说明' },
    { time: '00:38', title: '数据支撑', desc: '70%用户访谈反馈，手动记录效率低' },
    { time: '01:15', title: '技术方案', desc: '端侧模型能力与说话人分离方案讨论' },
    { time: '02:18', title: '排期确认', desc: '4月中启动，6+2周，5月底首版' },
    { time: '02:36', title: '交互设计', desc: '通用化页面设计思路与信息层级' },
  ]},
  { at: 14, items: [
    { time: '00:03', title: '背景介绍', desc: '用户多场景实时转文字需求说明' },
    { time: '00:38', title: '数据支撑', desc: '70%用户访谈反馈，手动记录效率低' },
    { time: '01:15', title: '技术方案', desc: '端侧模型能力与说话人分离方案讨论' },
    { time: '02:18', title: '排期确认', desc: '4月中启动，6+2周，5月底首版' },
    { time: '02:36', title: '交互设计', desc: '通用化页面设计思路与信息层级' },
    { time: '04:10', title: '结论确认', desc: '三项决策达成一致' },
  ]},
];

function showCard(id) {
  var card = document.getElementById(id);
  if (card && !card.classList.contains('show')) {
    card.classList.add('show');
  }
}

function typeText(el, html, done) {
  var plain = html.replace(/<[^>]+>/g, '');
  el.textContent = '';
  var i = 0;
  var cursor = document.createElement('span');
  cursor.className = 'typing-cursor-sm';
  el.appendChild(cursor);

  function tick() {
    if (i < plain.length) {
      cursor.before(document.createTextNode(plain[i]));
      i++;
      var speed = 15 + Math.random() * 10;
      if (plain[i - 1] === '，' || plain[i - 1] === '。') speed += 40;
      setTimeout(tick, speed);
    } else {
      cursor.remove();
      el.innerHTML = html;
      if (done) done();
    }
  }
  tick();
}

function getLatestStage(stages, index) {
  var result = null;
  for (var i = 0; i < stages.length; i++) {
    if (stages[i].at <= index) result = stages[i];
  }
  return result;
}

var lastOverview = -1;
var lastKeypoints = -1;
var lastDecisions = -1;
var lastTodos = -1;
var lastRisks = -1;
var lastTimeline = -1;

function updateSummary(segIndex) {
  var seg = segIndex + 1;

  var ov = getLatestStage(overviewStages, seg);
  if (ov && ov.at !== lastOverview) {
    lastOverview = ov.at;
    showCard('card-overview');
    typeText(overviewText, ov.text);
  }

  var kp = getLatestStage(keypointStages, seg);
  if (kp && kp.at !== lastKeypoints) {
    lastKeypoints = kp.at;
    showCard('card-keypoints');
    keypointCount.textContent = kp.items.length + '项';
    var html = '';
    kp.items.forEach(function(item, i) {
      html += '<div class="key-point' + (i === kp.items.length - 1 ? ' new-item' : '') + '">' +
        '<span class="point-num">' + (i + 1) + '</span>' +
        '<span class="point-text">' + item + '</span></div>';
    });
    keypointBody.innerHTML = html;
  }

  var dc = getLatestStage(decisionStages, seg);
  if (dc && dc.at !== lastDecisions) {
    lastDecisions = dc.at;
    showCard('card-decisions');
    decisionCount.textContent = dc.items.length + '项';
    var html = '';
    dc.items.forEach(function(item, i) {
      html += '<div class="decision-item' + (i === dc.items.length - 1 ? ' new-item' : '') + '">' +
        '<span class="decision-badge">' + item.badge + '</span>' +
        '<span class="decision-text">' + item.text + '</span></div>';
    });
    decisionBody.innerHTML = html;
  }

  var td = getLatestStage(todoStages, seg);
  if (td && td.at !== lastTodos) {
    lastTodos = td.at;
    showCard('card-todos');
    todoCount.textContent = td.items.length + '项';
    var html = '';
    td.items.forEach(function(item) {
      html += '<div class="todo-item"><div class="todo-check"></div><div class="todo-content">' +
        '<div class="todo-text">' + item.text + '</div>' +
        '<div class="todo-meta"><span class="todo-assignee">' + item.assignee + '</span>' +
        '<span class="todo-deadline">' + item.deadline + '</span></div></div></div>';
    });
    todoBody.innerHTML = html;
    bindTodoChecks();
  }

  var rk = getLatestStage(riskStages, seg);
  if (rk && rk.at !== lastRisks) {
    lastRisks = rk.at;
    showCard('card-risks');
    riskCount.textContent = rk.items.length + '项';
    var html = '';
    rk.items.forEach(function(item, i) {
      html += '<div class="risk-item' + (i === rk.items.length - 1 ? ' new-item' : '') + '">' +
        '<span class="risk-dot ' + item.type + '"></span>' +
        '<span class="risk-text">' + item.text + '</span></div>';
    });
    riskBody.innerHTML = html;
  }

  var tl = getLatestStage(timelineStages, seg);
  if (tl && tl.at !== lastTimeline) {
    lastTimeline = tl.at;
    showCard('card-timeline');
    var html = '';
    tl.items.forEach(function(item, i) {
      html += '<div class="timeline-item' + (i === tl.items.length - 1 ? ' new-item' : '') + '">' +
        '<span class="timeline-time">' + item.time + '</span>' +
        '<div class="timeline-dot"></div>' +
        '<div class="timeline-text"><strong>' + item.title + '</strong><span>' + item.desc + '</span></div></div>';
    });
    timelineBody.innerHTML = html;
  }

  contentArea.scrollTop = contentArea.scrollHeight;
}

function bindTodoChecks() {
  document.querySelectorAll('.todo-check').forEach(function(check) {
    check.addEventListener('click', function() {
      check.classList.toggle('checked');
    });
  });
}

function onStart() {
  if (started) return;
  started = true;
  loadingText.textContent = 'AI 正在分析内容';
  loadingSub.textContent = '正在接收转写数据，总结即将生成...';
}

function onFirstSegment() {
  loadingState.style.display = 'none';
  summaryContent.style.display = 'flex';
  sourceDetail.textContent = '腾讯会议 · 4 位参与者 · 转写进行中';
}

function onEnd() {
  sourceBadge.innerHTML = '已完成';
  sourceBadge.classList.add('ended');
  sourceDetail.textContent = '腾讯会议 · 4 位参与者 · 约5分钟';
  document.querySelectorAll('.card-live-tag').forEach(function(tag) {
    tag.textContent = '已完成';
    tag.classList.add('done');
  });
  var wrap = document.getElementById('progressWrap');
  if (wrap) wrap.style.display = 'none';
}

channel.onmessage = function(e) {
  var msg = e.data;

  if (msg.type === 'start') {
    onStart();
  }

  if (msg.type === 'segment-done') {
    onStart();
    segmentsDone = msg.index + 1;
    var pct = Math.round((segmentsDone / msg.total) * 100);
    progressBar.style.width = pct + '%';

    if (segmentsDone === 1) {
      onFirstSegment();
    }

    sourceDetail.textContent = '腾讯会议 · ' + msg.charCount + '字已转写 · ' + msg.sentenceCount + '段';

    setTimeout(function() {
      updateSummary(msg.index);
    }, 800);
  }

  if (msg.type === 'end') {
    progressBar.style.width = '100%';
    setTimeout(onEnd, 1500);
  }

  if (msg.type === 'stop') {
    progressBar.style.width = progressBar.style.width;
    onEnd();
  }

  if (msg.type === 'pause') {
    sourceBadge.innerHTML = '<span class="live-dot" style="background:var(--speaker-c)"></span>已暂停';
  }

  if (msg.type === 'resume') {
    sourceBadge.innerHTML = '<span class="live-dot"></span>实时同步中';
  }
};
