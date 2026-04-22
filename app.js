if (window.parent !== window) document.body.classList.add('in-iframe');

var channel = new BroadcastChannel('ai-transcribe');

var speakers = {
  me: { label: '我', color: 'var(--speaker-a)', initial: '我' },
  zy: { label: '张毅', color: 'var(--speaker-b)', initial: '张' },
  u1: { label: '未知说话人1', color: 'var(--speaker-c)', initial: '?' },
  u2: { label: '未知说话人2', color: 'var(--speaker-d)', initial: '?' },
};

var mockTranscript = [
  { speaker: 'me', text: '好，大家都到齐了，我们开始吧。今天主要讨论一下AI录音转写这个功能方向，配合折叠屏的多任务场景来做。先简单说下背景，我们调研发现用户在很多场景下都有实时转文字的需求，不只是会议，看视频、听讲座、上网课这些场景都很普遍。', ts: '00:03' },
  { speaker: 'zy', text: '对，我补充一下之前的用户访谈数据。', ts: '00:38' },
  { speaker: 'zy', text: '大概有接近70%的用户反馈过，在需要记录内容的时候，手动打字效率太低了。特别是多人对话的时候根本来不及。还有一些用户提到看外语视频的时候也希望有实时字幕能力，这些其实本质上都是同一类需求——把音频实时转成文字。', ts: '00:42' },
  { speaker: 'u1', text: '技术层面我说一下。目前端侧的语音识别模型中文准确率在95%以上，延迟控制在500毫秒以内。', ts: '01:15' },
  { speaker: 'me', text: '嗯，那说话人分离的能力呢？', ts: '01:30' },
  { speaker: 'u1', text: '说话人分离目前4个人以内基本没问题，准确率大概85%左右。超过6个人会有混淆，后续还需要持续优化。另外有一个技术点想说明，如果音频源是系统内录而不是麦克风采集的话，声纹分离的效果会更稳定，因为没有环境噪音干扰。这对于用户看视频、听录播的场景其实是个利好。', ts: '01:34' },
  { speaker: 'u2', text: '排期方面确认一下，如果4月中旬启动，6周开发加2周联调测试，5月底可以出第一个版本对吧？', ts: '02:18' },
  { speaker: 'u1', text: '对。', ts: '02:30' },
  { speaker: 'u2', text: '好的，记下来了。', ts: '02:32' },
  { speaker: 'zy', text: '交互方面我有些想法。核心的转写页面要足够通用，不应该绑死在某个特定场景。用户可能在开会的时候用，也可能在看B站视频的时候开，甚至听播客的时候也会想用。所以页面设计上应该弱化来源感，强调转写本身——谁在说、说了什么、什么时候说的，这三个信息最重要。', ts: '02:36' },
  { speaker: 'me', text: '同意。那信息层级就是：顶部音频来源和状态，中间是逐字稿主体，说话人用颜色区分就够了，不需要真实姓名，因为很多场景是识别不到姓名的。底部放基础操作。', ts: '03:10' },
  { speaker: 'u1', text: '还有一点，关于逐字稿的段落划分。从技术上来说，我们可以根据语音的停顿间隔来自动分段，超过2秒的静默就断一个段落。同一个说话人连续说的话如果中间有明显停顿也会分成多段，这样阅读体验会更好，不会出现一整屏都是密密麻麻的文字。', ts: '03:32' },
  { speaker: 'zy', text: '这个好，视觉上也更透气。', ts: '04:05' },
  { speaker: 'u2', text: '那我整理一下今天的结论。第一，转写助手定位为通用音频转文字工具，支持系统内录和麦克风两种音频源。第二，页面设计以说话人加逐字稿为核心，弱化具体场景。第三，技术方案采用端侧加云端混合，优先保证实时性。排期4月中启动，5月底出首版。', ts: '04:10' },
  { speaker: 'me', text: '大家还有补充吗？没有的话今天先到这。', ts: '04:48' },
  { speaker: 'u1', text: '没有了。', ts: '04:55' },
  { speaker: 'zy', text: '没有。', ts: '04:57' },
];

var transcriptArea = document.getElementById('transcriptArea');
var sentenceCountEl = document.getElementById('sentenceCount');
var charCountEl = document.getElementById('charCount');
var durationEl = document.getElementById('duration');
var statusTimeEl = document.getElementById('statusTime');

var sentenceCount = 0;
var totalChars = 0;
var startTime = Date.now();
var isPaused = false;
var isStopped = false;
var activeFilter = 'all';

channel.postMessage({ type: 'start', time: startTime });

function updateDuration() {
  var elapsed = Math.floor((Date.now() - startTime) / 1000);
  var min = String(Math.floor(elapsed / 60)).padStart(2, '0');
  var sec = String(elapsed % 60).padStart(2, '0');
  durationEl.textContent = min + ':' + sec;
  var now = new Date();
  statusTimeEl.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
}

var durationTimer = setInterval(updateDuration, 1000);
updateDuration();

function addTranscriptBlock(speakerKey, text, timestamp, index) {
  return new Promise(function(resolve) {
    var speaker = speakers[speakerKey];

    var block = document.createElement('div');
    block.className = 'transcript-block';
    block.setAttribute('data-speaker', speakerKey);

    if (activeFilter !== 'all' && activeFilter !== speakerKey) {
      block.style.display = 'none';
    }

    block.innerHTML =
      '<div class="transcript-block-header">' +
        '<div class="transcript-avatar" style="background:' + speaker.color + '">' + speaker.initial + '</div>' +
        '<span class="transcript-speaker" style="color:' + speaker.color + '">' + speaker.label + '</span>' +
        '<span class="speaking-tag"><span></span><span></span><span></span></span>' +
        '<span class="transcript-time">' + timestamp + '</span>' +
      '</div>' +
      '<div class="transcript-text"><span class="text-content"></span><span class="typing-cursor"></span></div>';

    transcriptArea.appendChild(block);
    transcriptArea.scrollTop = transcriptArea.scrollHeight;

    var textContent = block.querySelector('.text-content');
    var cursor = block.querySelector('.typing-cursor');
    var speakingTag = block.querySelector('.speaking-tag');

    var charIndex = 0;
    var typingSpeed = 30;

    function typeChar() {
      if (isStopped) { resolve(); return; }
      if (isPaused) {
        setTimeout(typeChar, 100);
        return;
      }
      if (charIndex < text.length) {
        textContent.textContent += text[charIndex];
        charIndex++;
        totalChars++;
        charCountEl.textContent = totalChars;
        transcriptArea.scrollTop = transcriptArea.scrollHeight;
        var speed = typingSpeed + Math.random() * 16 - 8;
        var ch = text[charIndex - 1];
        if (ch === '，' || ch === '。') speed += 30;
        if (ch === '、' || ch === '；') speed += 20;
        if (ch === '——') speed += 25;
        setTimeout(typeChar, speed);
      } else {
        cursor.remove();
        speakingTag.remove();
        sentenceCount++;
        sentenceCountEl.textContent = sentenceCount;
        channel.postMessage({
          type: 'segment-done',
          index: index,
          speaker: speakerKey,
          speakerLabel: speaker.label,
          text: text,
          ts: timestamp,
          total: mockTranscript.length,
          sentenceCount: sentenceCount,
          charCount: totalChars
        });
        resolve();
      }
    }

    setTimeout(typeChar, 200);
  });
}

function parseDelay(ts) {
  var parts = ts.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

async function playTranscript() {
  for (var i = 0; i < mockTranscript.length; i++) {
    if (isStopped) break;

    var gap;
    if (i === 0) {
      gap = 600;
    } else {
      var prev = parseDelay(mockTranscript[i - 1].ts);
      var curr = parseDelay(mockTranscript[i].ts);
      gap = Math.max((curr - prev) * 80, 300);
      gap = Math.min(gap, 1500);
    }

    await new Promise(function(r) { setTimeout(r, gap); });
    if (isStopped) break;
    if (isPaused) {
      await new Promise(function(resolve) {
        var check = setInterval(function() {
          if (!isPaused || isStopped) { clearInterval(check); resolve(); }
        }, 200);
      });
    }
    if (isStopped) break;
    await addTranscriptBlock(mockTranscript[i].speaker, mockTranscript[i].text, mockTranscript[i].ts, i);
  }
  if (!isStopped) {
    channel.postMessage({ type: 'end' });
  }
}

var pauseBtn = document.getElementById('pauseBtn');
pauseBtn.addEventListener('click', function() {
  isPaused = !isPaused;
  channel.postMessage({ type: isPaused ? 'pause' : 'resume' });
  if (isPaused) {
    pauseBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg> 继续';
  } else {
    pauseBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg> 暂停';
  }
});

var stopBtn = document.getElementById('stopBtn');
stopBtn.addEventListener('click', function() {
  isStopped = true;
  clearInterval(durationTimer);
  channel.postMessage({ type: 'stop' });
  document.querySelector('.recording-dot').style.animation = 'none';
  document.querySelector('.recording-dot').style.background = '#9CA3AF';
  var detail = document.querySelector('.source-detail');
  detail.innerHTML = '<span class="recording-dot" style="animation:none;background:#9CA3AF"></span> 已结束 · 腾讯会议 · 4 位说话人';
  document.querySelectorAll('.waveform-bar').forEach(function(b) { b.style.animation = 'none'; b.style.transform = 'scaleY(0.3)'; });
  stopBtn.disabled = true;
  stopBtn.style.opacity = '0.5';
  pauseBtn.disabled = true;
  pauseBtn.style.opacity = '0.5';
});

document.querySelectorAll('.filter-chip').forEach(function(chip) {
  chip.addEventListener('click', function() {
    document.querySelectorAll('.filter-chip').forEach(function(c) { c.classList.remove('active'); });
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;

    document.querySelectorAll('.transcript-block').forEach(function(block) {
      if (activeFilter === 'all' || block.dataset.speaker === activeFilter) {
        block.style.display = '';
      } else {
        block.style.display = 'none';
      }
    });
  });
});

var askBubble = document.getElementById('askBubble');
var selectedBlock = null;
var selectedText = '';

transcriptArea.addEventListener('click', function(e) {
  var block = e.target.closest('.transcript-block');
  if (!block || block.querySelector('.typing-cursor')) return;

  if (selectedBlock === block) {
    block.classList.remove('selected');
    askBubble.classList.remove('show');
    selectedBlock = null;
    selectedText = '';
    return;
  }

  if (selectedBlock) selectedBlock.classList.remove('selected');

  block.classList.add('selected');
  selectedBlock = block;
  selectedText = block.querySelector('.text-content').textContent;

  var rect = block.getBoundingClientRect();
  var areaRect = document.body.getBoundingClientRect();
  askBubble.classList.add('show');
  askBubble.style.top = (rect.top - areaRect.top - 44) + 'px';
  askBubble.style.left = (rect.left - areaRect.left + rect.width / 2 - askBubble.offsetWidth / 2) + 'px';
});

document.addEventListener('click', function(e) {
  if (!e.target.closest('.transcript-block') && !e.target.closest('.ask-bubble')) {
    if (selectedBlock) selectedBlock.classList.remove('selected');
    askBubble.classList.remove('show');
    selectedBlock = null;
    selectedText = '';
  }
});

askBubble.addEventListener('click', function(e) {
  e.stopPropagation();
  if (!selectedText) return;

  var speaker = selectedBlock ? selectedBlock.querySelector('.transcript-speaker').textContent : '';
  var ts = selectedBlock ? selectedBlock.querySelector('.transcript-time').textContent : '';

  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'askV',
      text: selectedText,
      speaker: speaker,
      ts: ts
    }, '*');
  } else {
    localStorage.setItem('askV_text', selectedText);
    localStorage.setItem('askV_speaker', speaker);
    localStorage.setItem('askV_ts', ts);
    window.open('chat.html', '_blank');
  }

  if (selectedBlock) selectedBlock.classList.remove('selected');
  askBubble.classList.remove('show');
  selectedBlock = null;
  selectedText = '';
});

playTranscript();
