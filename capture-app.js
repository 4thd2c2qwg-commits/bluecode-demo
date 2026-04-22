if (window.parent !== window) document.body.classList.add('in-iframe');

var captureGrid = document.getElementById('captureGrid');
var emptyState = document.getElementById('emptyState');
var captureCount = document.getElementById('captureCount');
var progressBar = document.getElementById('progressBar');
var pauseBtn = document.getElementById('pauseBtn');
var stopBtn = document.getElementById('stopBtn');
var actionsRunning = document.getElementById('actionsRunning');
var actionsDone = document.getElementById('actionsDone');
var savePdfBtn = document.getElementById('savePdfBtn');
var saveNoteBtn = document.getElementById('saveNoteBtn');
var toastEl = document.getElementById('toast');
var statusTimeEl = document.getElementById('statusTime');
var captureStatus = document.getElementById('captureStatus');
var sourceDetail = document.querySelector('.source-detail');

var slides = [
  {
    accent: 'accent-blue',
    title: 'AI录音转写 · 产品需求评审',
    subtitle: 'Q2 重点项目 · vivo X Fold 折叠屏',
    bullets: [],
    page: 1,
    time: '10:36',
    type: 'cover'
  },
  {
    accent: 'accent-dark',
    title: '目录',
    subtitle: '',
    bullets: ['一、项目背景与用户痛点', '二、核心功能方案', '三、技术架构', '四、竞品分析', '五、交互设计方案', '六、开发排期与里程碑', '七、风险与应对策略', '八、Q&A 讨论'],
    page: 2,
    time: '10:37',
    type: 'list'
  },
  {
    accent: 'accent-blue',
    title: '用户痛点分析',
    subtitle: '基于 2000+ 用户调研数据',
    bullets: ['70% 用户反馈手动记录效率低', '多人对话场景来不及记录', '外语视频缺乏实时字幕', '录音回放找关键信息耗时'],
    page: 3,
    time: '10:39',
    type: 'bullets',
    chart: [65, 85, 50, 70]
  },
  {
    accent: 'accent-dark',
    title: '核心功能方案',
    subtitle: '',
    bullets: ['实时语音转文字（端侧 + 云端混合）', '智能说话人识别与分离', '自动分段与标点优化', 'AI 摘要生成与关键词提取', '跨应用音频捕获（系统内录）'],
    page: 4,
    time: '10:42',
    type: 'bullets'
  },
  {
    accent: 'accent-green',
    title: '技术架构',
    subtitle: '端云协同 · 低延迟 · 高准确率',
    bullets: [],
    page: 5,
    time: '10:45',
    type: 'diagram',
    diagram: ['系统内录', '→', '端侧ASR', '→', '声纹分离', '→', '云端NLU', '→', '结构化输出']
  },
  {
    accent: 'accent-purple',
    title: '技术指标',
    subtitle: '',
    bullets: [],
    page: 6,
    time: '10:47',
    type: 'table',
    table: {
      headers: ['指标', '当前能力', '目标值'],
      rows: [
        ['中文识别准确率', '95.2%', '97%+'],
        ['端侧延迟', '<500ms', '<300ms'],
        ['说话人分离(≤4人)', '85%', '92%+'],
        ['声纹注册耗时', '10s', '5s']
      ]
    }
  },
];

var lightbox = document.getElementById('lightbox');
var lightboxSlide = document.getElementById('lightboxSlide');
var lightboxPage = document.getElementById('lightboxPage');
var lightboxTitle = document.getElementById('lightboxTitle');
var lightboxClose = document.getElementById('lightboxClose');
var lightboxPrev = document.getElementById('lightboxPrev');
var lightboxNext = document.getElementById('lightboxNext');
var viewingIndex = -1;

var currentIndex = 0;
var isPaused = false;
var isStopped = false;
var scanEl = null;

function updateClock() {
  var now = new Date();
  statusTimeEl.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
}
setInterval(updateClock, 1000);
updateClock();

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(function() { toastEl.classList.remove('show'); }, 2000);
}

function buildSlideHtml(slide) {
  var html = '<div class="slide-preview ' + slide.accent + '">';
  html += '<div class="slide-title">' + slide.title + '</div>';
  if (slide.subtitle) html += '<div class="slide-subtitle">' + slide.subtitle + '</div>';
  if (slide.type === 'bullets' || slide.type === 'list') {
    html += '<ul class="slide-bullets">';
    for (var i = 0; i < slide.bullets.length; i++) {
      html += '<li>' + slide.bullets[i] + '</li>';
    }
    html += '</ul>';
  }
  if (slide.type === 'diagram' && slide.diagram) {
    html += '<div class="slide-diagram">';
    for (var d = 0; d < slide.diagram.length; d++) {
      if (slide.diagram[d] === '→') {
        html += '<span class="diagram-arrow">→</span>';
      } else {
        html += '<span class="diagram-box">' + slide.diagram[d] + '</span>';
      }
    }
    html += '</div>';
  }
  if (slide.type === 'table' && slide.table) {
    html += '<table class="slide-table"><tr>';
    for (var h = 0; h < slide.table.headers.length; h++) {
      html += '<th>' + slide.table.headers[h] + '</th>';
    }
    html += '</tr>';
    for (var r = 0; r < slide.table.rows.length; r++) {
      html += '<tr>';
      for (var c = 0; c < slide.table.rows[r].length; c++) {
        html += '<td>' + slide.table.rows[r][c] + '</td>';
      }
      html += '</tr>';
    }
    html += '</table>';
  }
  if (slide.chart) {
    html += '<div class="slide-chart">';
    var colors = ['#60A5FA', '#34D399', '#FBBF24', '#F87171'];
    for (var b = 0; b < slide.chart.length; b++) {
      html += '<div class="slide-chart-bar" style="height:' + slide.chart[b] + '%;background:' + colors[b % colors.length] + '"></div>';
    }
    html += '</div>';
  }
  html += '<div class="slide-page-num">' + slide.page + ' / ' + slides.length + '</div>';
  html += '</div>';
  html += '<div class="card-meta"><span class="card-page">第 ' + slide.page + ' 页</span><span class="card-new-tag">新</span><span class="card-time">' + slide.time + '</span></div>';
  return html;
}

function addScanIndicator() {
  if (scanEl) return;
  scanEl = document.createElement('div');
  scanEl.className = 'capture-scanning show';
  scanEl.innerHTML = '<div class="scan-spinner"></div> 正在检测画面变化...';
  captureGrid.appendChild(scanEl);
  captureGrid.scrollTop = captureGrid.scrollHeight;
}

function removeScanIndicator() {
  if (scanEl) {
    scanEl.remove();
    scanEl = null;
  }
}

function addSlide(slide) {
  removeScanIndicator();
  captureGrid.querySelectorAll('.card-new-tag').forEach(function(tag) {
    tag.remove();
  });
  var card = document.createElement('div');
  card.className = 'capture-card';
  card.innerHTML = buildSlideHtml(slide);
  captureGrid.appendChild(card);
  captureGrid.scrollTop = captureGrid.scrollHeight;
  currentIndex++;
  captureCount.textContent = currentIndex;
  progressBar.style.width = Math.round((currentIndex / slides.length) * 100) + '%';
}

function finishCapture() {
  removeScanIndicator();
  isStopped = true;
  actionsRunning.style.display = 'none';
  actionsDone.style.display = 'flex';
  sourceDetail.innerHTML = '<span class="recording-dot" style="animation:none;background:#9CA3AF"></span> 已结束 · ' + slides.length + ' 页投屏材料';
  progressBar.style.width = '100%';
}

var slideDelays = [3000, 8000, 6000, 10000, 8000, 5000];

async function runCapture() {
  emptyState.style.display = 'flex';
  await delay(3000);
  if (isStopped) return;
  emptyState.style.display = 'none';

  for (var i = 0; i < slides.length; i++) {
    if (isStopped) break;
    addScanIndicator();
    var scanTime = (slideDelays[i] || 6000) + Math.random() * 2000 - 1000;
    await delay(scanTime);
    if (isStopped) break;
    if (isPaused) {
      await waitResume();
    }
    if (isStopped) break;
    addSlide(slides[i]);
    await delay(800);
  }

  if (!isStopped) {
    finishCapture();
  }
}

function delay(ms) {
  return new Promise(function(r) { setTimeout(r, ms); });
}

function waitResume() {
  return new Promise(function(resolve) {
    var check = setInterval(function() {
      if (!isPaused || isStopped) { clearInterval(check); resolve(); }
    }, 200);
  });
}

pauseBtn.addEventListener('click', function() {
  isPaused = !isPaused;
  if (isPaused) {
    pauseBtn.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg> 继续捕获';
    removeScanIndicator();
  } else {
    pauseBtn.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg> 暂停捕获';
  }
});

stopBtn.addEventListener('click', function() {
  finishCapture();
});

savePdfBtn.addEventListener('click', function() {
  savePdfBtn.innerHTML = '<div class="scan-spinner" style="width:42px;height:42px;border-width:6px"></div> 生成中...';
  setTimeout(function() {
    savePdfBtn.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg> 已保存';
    showToast('PDF 已保存到本地文件');
  }, 1500);
});

saveNoteBtn.addEventListener('click', function() {
  saveNoteBtn.innerHTML = '<div class="scan-spinner" style="width:42px;height:42px;border-width:6px;border-top-color:var(--primary)"></div> 同步中...';
  setTimeout(function() {
    saveNoteBtn.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg> 已存入';
    showToast('已存到原子笔记「Q2产品需求评审会」');
  }, 1200);
});

function buildLightboxSlideHtml(slide) {
  var html = '<div class="slide-preview ' + slide.accent + '">';
  html += '<div class="slide-title">' + slide.title + '</div>';
  if (slide.subtitle) html += '<div class="slide-subtitle">' + slide.subtitle + '</div>';
  if (slide.type === 'bullets' || slide.type === 'list') {
    html += '<ul class="slide-bullets">';
    for (var i = 0; i < slide.bullets.length; i++) {
      html += '<li>' + slide.bullets[i] + '</li>';
    }
    html += '</ul>';
  }
  if (slide.type === 'diagram' && slide.diagram) {
    html += '<div class="slide-diagram">';
    for (var d = 0; d < slide.diagram.length; d++) {
      if (slide.diagram[d] === '→') {
        html += '<span class="diagram-arrow">→</span>';
      } else {
        html += '<span class="diagram-box">' + slide.diagram[d] + '</span>';
      }
    }
    html += '</div>';
  }
  if (slide.type === 'table' && slide.table) {
    html += '<table class="slide-table"><tr>';
    for (var h = 0; h < slide.table.headers.length; h++) {
      html += '<th>' + slide.table.headers[h] + '</th>';
    }
    html += '</tr>';
    for (var r = 0; r < slide.table.rows.length; r++) {
      html += '<tr>';
      for (var c = 0; c < slide.table.rows[r].length; c++) {
        html += '<td>' + slide.table.rows[r][c] + '</td>';
      }
      html += '</tr>';
    }
    html += '</table>';
  }
  if (slide.chart) {
    html += '<div class="slide-chart">';
    var colors = ['#60A5FA', '#34D399', '#FBBF24', '#F87171'];
    for (var b = 0; b < slide.chart.length; b++) {
      html += '<div class="slide-chart-bar" style="height:' + slide.chart[b] + '%;background:' + colors[b % colors.length] + '"></div>';
    }
    html += '</div>';
  }
  html += '<div class="slide-page-num">' + slide.page + ' / ' + slides.length + '</div>';
  html += '</div>';
  return html;
}

function openLightbox(idx) {
  viewingIndex = idx;
  renderLightbox();
  lightbox.classList.add('show');
}

function closeLightbox() {
  lightbox.classList.remove('show');
  viewingIndex = -1;
}

function renderLightbox() {
  var slide = slides[viewingIndex];
  lightboxSlide.innerHTML = buildLightboxSlideHtml(slide);
  lightboxPage.textContent = slide.page + ' / ' + currentIndex;
  lightboxTitle.textContent = slide.title;
  lightboxPrev.disabled = viewingIndex === 0;
  lightboxNext.disabled = viewingIndex >= currentIndex - 1;
}

lightboxClose.addEventListener('click', closeLightbox);

lightbox.addEventListener('click', function(e) {
  if (e.target === lightbox) closeLightbox();
});

lightboxPrev.addEventListener('click', function() {
  if (viewingIndex > 0) {
    viewingIndex--;
    lightboxSlide.style.animation = 'none';
    lightboxSlide.offsetHeight;
    lightboxSlide.style.animation = 'lbSlideIn 0.25s ease';
    renderLightbox();
  }
});

lightboxNext.addEventListener('click', function() {
  if (viewingIndex < currentIndex - 1) {
    viewingIndex++;
    lightboxSlide.style.animation = 'none';
    lightboxSlide.offsetHeight;
    lightboxSlide.style.animation = 'lbSlideIn 0.25s ease';
    renderLightbox();
  }
});

document.addEventListener('keydown', function(e) {
  if (!lightbox.classList.contains('show')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') lightboxPrev.click();
  if (e.key === 'ArrowRight') lightboxNext.click();
});

captureGrid.addEventListener('click', function(e) {
  var card = e.target.closest('.capture-card');
  if (!card) return;
  var cards = captureGrid.querySelectorAll('.capture-card');
  for (var i = 0; i < cards.length; i++) {
    if (cards[i] === card) {
      openLightbox(i);
      break;
    }
  }
});

runCapture();
