if (window.parent !== window) document.body.classList.add('in-iframe');

var chatArea = document.getElementById('chatArea');
var contextCard = document.getElementById('contextCard');
var contextQuote = document.getElementById('contextQuote');
var contextMeta = document.getElementById('contextMeta');
var contextClose = document.getElementById('contextClose');
var suggestChips = document.getElementById('suggestChips');
var suggest1 = document.getElementById('suggest1');
var suggest2 = document.getElementById('suggest2');
var inputField = document.getElementById('inputField');
var welcomeSection = document.getElementById('welcomeSection');
var statusTimeEl = document.getElementById('statusTime');

var contextText = '';
var contextSpeaker = '';
var contextTs = '';

var isResponding = false;

function updateClock() {
  var now = new Date();
  statusTimeEl.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
}
setInterval(updateClock, 1000);
updateClock();

function extractNoun(text) {
  var patterns = [
    /端侧[^\s，。、]*模型/, /语音识别/, /说话人分离/, /声纹分离/,
    /系统内录/, /环境噪音/, /AI[^\s，。、]*/, /折叠屏/,
    /多任务/, /实时转[^\s，。、]*/, /音频源/, /准确率/,
    /用户访谈/, /排期/, /联调测试/, /交互/,
    /逐字稿/, /段落划分/, /停顿间隔/
  ];
  for (var i = 0; i < patterns.length; i++) {
    var m = text.match(patterns[i]);
    if (m) return m[0];
  }
  if (text.length > 10) {
    var idx = text.indexOf('，');
    if (idx > 4 && idx < 20) return text.substring(0, idx);
  }
  return text.length > 15 ? text.substring(0, 12) + '…' : text;
}

var mockResponses = {
  explain: function(text, speaker) {
    if (text.indexOf('70%') !== -1 || text.indexOf('用户访谈') !== -1) {
      return '这段话的核心意思是：根据前期的用户调研数据，绝大多数用户（约70%）在需要记录内容时，都觉得手动打字效率不够高，尤其是多人对话和外语视频这类场景。\n\n' + speaker + '想表达的关键点是：不同场景下的转写需求，本质上是同一个问题——"把音频实时变成文字"。这为产品的通用化定位提供了数据支撑。';
    }
    if (text.indexOf('端侧') !== -1 || text.indexOf('语音识别') !== -1 || text.indexOf('说话人分离') !== -1) {
      return '这段话在说明当前的技术能力边界：\n\n• **语音识别**：中文准确率已达95%+，延迟<500ms，基本满足实时转写需求\n• **说话人分离**：4人以内效果好（~85%准确率），超过6人会有混淆\n• **系统内录优势**：相比麦克风采集，系统内录没有环境噪音，声纹分离更稳定\n\n简单说，技术上已经具备了做这个功能的基础条件，只是在多人场景下还需要持续优化。';
    }
    if (text.indexOf('排期') !== -1 || text.indexOf('4月') !== -1 || text.indexOf('5月') !== -1) {
      return '这是在确认项目的时间计划：\n\n• **启动时间**：4月中旬\n• **开发周期**：6周（约到5月底）\n• **测试周期**：2周联调测试\n• **首版交付**：5月底\n\n整体是一个比较紧凑但合理的排期安排。';
    }
    if (text.indexOf('交互') !== -1 || text.indexOf('通用') !== -1 || text.indexOf('弱化') !== -1) {
      return '这段话是在讨论产品设计理念：\n\n核心观点是转写页面应该做成**通用工具**，而不是只服务于某个特定场景（比如会议）。用户使用场景很多样——开会、看视频、听播客等，所以设计上应该弱化"来源感"，突出三个核心信息：\n\n1. **谁在说**（说话人识别）\n2. **说了什么**（转写文字）\n3. **什么时候说的**（时间戳）';
    }
    if (text.indexOf('段落划分') !== -1 || text.indexOf('停顿') !== -1 || text.indexOf('静默') !== -1) {
      return '这段是关于自动分段的技术方案：\n\n系统会根据语音中的停顿来智能分段——超过2秒的静默就会自动断开成新的段落。即使是同一个人在说话，如果有明显停顿也会分段。\n\n这样做的好处是让逐字稿更易读，避免出现大段密集文字，提升阅读体验。';
    }
    return '这段话是' + speaker + '在讨论中提出的观点。\n\n核心内容是关于AI转写功能的设计方向——强调通用性和实用性，让转写能力不局限于单一场景，而是覆盖各种音频转文字的需求。从技术、产品和项目三个维度推进落地。';
  },
  noun: function(noun, text) {
    if (noun.indexOf('说话人分离') !== -1 || noun.indexOf('声纹') !== -1) {
      return '**说话人分离**（Speaker Diarization）是一项语音AI技术，能自动识别"这段话是谁说的"。\n\n工作原理是通过分析每个人的声纹特征（音调、语速、音色等），将音频中不同人的语音片段区分开来。\n\n目前的能力：\n• 4人以内准确率约85%\n• 系统内录比麦克风效果更好（无环境噪音干扰）\n• 超过6人会有混淆，需要持续优化';
    }
    if (noun.indexOf('端侧') !== -1) {
      return '**端侧模型**是指直接运行在手机本地的AI模型，与之对应的是"云端模型"。\n\n优势：\n• **低延迟**：不需要联网，响应速度快\n• **隐私保护**：数据不离开设备\n• **离线可用**：无网络时也能工作\n\n在这个项目中，端侧语音识别模型的中文准确率已达95%以上，延迟控制在500ms以内。采用的是端侧+云端混合方案，优先保证实时性。';
    }
    if (noun.indexOf('系统内录') !== -1) {
      return '**系统内录**是指直接捕获手机系统内部播放的音频，而不是通过麦克风从外部录音。\n\n比如你在看视频或听网课时，系统内录可以直接获取清晰的原始音频流，不会混入周围的环境噪音。\n\n相比麦克风采集，系统内录的优势是：\n• 音质更清晰、更稳定\n• 声纹分离效果更好\n• 特别适合看视频、听录播等场景';
    }
    if (noun.indexOf('准确率') !== -1) {
      return '会议中提到了两个准确率指标：\n\n1. **语音识别准确率 95%+**：指把语音转成文字的准确度，即100个字里大约有95个以上是正确的\n2. **说话人分离准确率 ~85%**：指识别"这段话是谁说的"的准确度\n\n95%的语音识别准确率在行业中属于较高水平，基本满足实用需求。说话人分离的85%还有提升空间，特别是超过6人的场景。';
    }
    if (noun.indexOf('排期') !== -1 || noun.indexOf('联调') !== -1) {
      return '**排期**是项目管理中对时间安排的规划。这次的排期是：\n\n• 4月中旬启动开发\n• 6周开发周期\n• 2周联调测试\n• 5月底出首版\n\n**联调测试**指的是将各个模块（端侧模型、UI界面、后端服务等）整合在一起进行测试，确保它们能协同工作。这是产品上线前的重要环节。';
    }
    if (noun.indexOf('逐字稿') !== -1 || noun.indexOf('段落划分') !== -1) {
      return '**逐字稿**是把音频内容一字不差地转录成文字的结果，是AI转写功能的核心输出。\n\n在这个产品中，逐字稿会配合：\n• 说话人标识（不同颜色区分）\n• 时间戳（记录说话时间）\n• 自动分段（基于2秒静默间隔）\n\n自动分段可以避免大段文字堆砌，让阅读体验更好。';
    }
    return '**' + noun + '**是这次讨论中提到的一个关键概念。\n\n在AI转写的语境下，它涉及到如何让语音识别和转写功能更好地服务用户的实际使用场景。团队正在从技术可行性、产品体验、项目排期等多个维度来规划这个功能的落地方案。';
  },
  generic: function(question) {
    if (question.indexOf('总结') !== -1 || question.indexOf('概括') !== -1) {
      return '这次讨论的核心内容是：\n\n团队在规划一个**AI音频转写功能**，面向vivo折叠屏设备。主要结论：\n\n1. **定位**：通用音频转文字工具（不限于会议）\n2. **技术**：端侧+云端混合方案，中文识别95%+\n3. **设计**：以说话人+逐字稿为核心，弱化场景\n4. **排期**：4月中启动，5月底首版';
    }
    if (question.indexOf('谁') !== -1 && question.indexOf('参加') !== -1) {
      return '从转写记录来看，这次讨论有4位参与者：\n\n1. **我**（主持人）：负责主持讨论、确认方向\n2. **张毅**：负责用户调研和交互设计\n3. **未知说话人1**：技术负责人，介绍技术能力\n4. **未知说话人2**：项目管理，负责排期确认';
    }
    return '根据转写内容，这次讨论围绕AI转写功能展开，涵盖了用户需求（70%用户有转写需求）、技术能力（95%+识别准确率）、产品设计（通用化方向）和项目排期（5月底首版）等方面。\n\n你可以针对某个具体话题进一步提问，我来帮你详细分析。';
  }
};

function initContext() {
  if (!contextText) return;

  contextQuote.textContent = contextText;
  contextMeta.textContent = contextSpeaker + ' · ' + contextTs;
  contextCard.classList.add('show');

  contextClose.onclick = function() {
    contextCard.classList.remove('show');
  };

  var noun = extractNoun(contextText);
  suggest1.textContent = '解释一下这段话';
  suggest2.textContent = '"' + noun + '"是什么意思？';
  suggestChips.classList.add('show');

  suggest1.onclick = function() {
    if (isResponding) return;
    handleSuggestClick('explain', suggest1.textContent);
  };

  suggest2.onclick = function() {
    if (isResponding) return;
    handleSuggestClick('noun', suggest2.textContent);
  };
}

var hasContext = !!contextText;

function createMsgEl(type, content, withContext) {
  var msg = document.createElement('div');
  msg.className = 'message ' + type;

  var avatar = document.createElement('div');
  avatar.className = 'msg-avatar ' + (type === 'ai' ? 'ai' : 'user-av');
  if (type === 'ai') {
    avatar.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="white" stroke-width="1.5" stroke-linecap="round"/><circle cx="9" cy="10" r="1.2" fill="white"/><circle cx="15" cy="10" r="1.2" fill="white"/></svg>';
  } else {
    avatar.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#6B7280" stroke-width="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#6B7280" stroke-width="1.5"/></svg>';
  }

  var bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  if (type === 'user') {
    if (withContext && contextText) {
      var quoteEl = document.createElement('div');
      quoteEl.className = 'msg-quote';
      quoteEl.innerHTML = '<div class="msg-quote-label">引用 · ' + contextSpeaker + ' ' + contextTs + '</div><div class="msg-quote-text">' + contextText + '</div>';
      bubble.appendChild(quoteEl);
      var textEl = document.createElement('div');
      textEl.textContent = content;
      bubble.appendChild(textEl);
    } else {
      bubble.textContent = content;
    }
  }

  msg.appendChild(avatar);
  msg.appendChild(bubble);

  return { el: msg, bubble: bubble };
}

function addUserMessage(text, withContext) {
  var result = createMsgEl('user', text, withContext);
  chatArea.appendChild(result.el);
  chatArea.scrollTop = chatArea.scrollHeight;
  return result;
}

function addAiMessage() {
  var result = createMsgEl('ai', '');
  result.bubble.innerHTML = '<span class="typing-cursor"></span>';
  chatArea.appendChild(result.el);
  chatArea.scrollTop = chatArea.scrollHeight;
  return result;
}

function typeAiResponse(bubble, text) {
  return new Promise(function(resolve) {
    bubble.innerHTML = '';
    var span = document.createElement('span');
    var cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    bubble.appendChild(span);
    bubble.appendChild(cursor);

    var formatted = text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
    var segments = [];
    var temp = document.createElement('div');
    temp.innerHTML = formatted;

    function flattenNodes(node) {
      if (node.nodeType === 3) {
        for (var i = 0; i < node.textContent.length; i++) {
          segments.push({ type: 'char', value: node.textContent[i] });
        }
      } else if (node.nodeName === 'BR') {
        segments.push({ type: 'html', value: '<br>' });
      } else if (node.nodeName === 'B') {
        segments.push({ type: 'html', value: '<b>' });
        flattenNodes(node.childNodes[0] || document.createTextNode(''));
        segments.push({ type: 'html', value: '</b>' });
      } else {
        for (var j = 0; j < node.childNodes.length; j++) {
          flattenNodes(node.childNodes[j]);
        }
      }
    }
    for (var n = 0; n < temp.childNodes.length; n++) {
      flattenNodes(temp.childNodes[n]);
    }

    var idx = 0;
    var currentHtml = '';
    function typeNext() {
      if (idx < segments.length) {
        var seg = segments[idx];
        if (seg.type === 'html') {
          currentHtml += seg.value;
        } else {
          currentHtml += seg.value;
        }
        span.innerHTML = currentHtml;
        idx++;
        chatArea.scrollTop = chatArea.scrollHeight;
        var delay = 25 + Math.random() * 15;
        if (seg.type === 'char' && (seg.value === '。' || seg.value === '\n')) delay += 60;
        if (seg.type === 'char' && (seg.value === '，' || seg.value === '、')) delay += 30;
        if (seg.type === 'html') delay = 0;
        setTimeout(typeNext, delay);
      } else {
        cursor.remove();
        resolve();
      }
    }
    setTimeout(typeNext, 400);
  });
}

function handleSuggestClick(type, displayText) {
  isResponding = true;
  welcomeSection.style.display = 'none';
  var sendWithContext = hasContext;
  contextCard.classList.remove('show');
  suggestChips.classList.remove('show');

  addUserMessage(displayText, sendWithContext);
  hasContext = false;

  var responseText;
  if (type === 'explain') {
    responseText = mockResponses.explain(contextText, contextSpeaker);
  } else if (type === 'noun') {
    var noun = extractNoun(contextText);
    responseText = mockResponses.noun(noun, contextText);
  } else {
    responseText = mockResponses.generic(displayText);
  }

  setTimeout(function() {
    var ai = addAiMessage();
    typeAiResponse(ai.bubble, responseText).then(function() {
      isResponding = false;
    });
  }, 600);
}

function handleSend() {
  var text = inputField.value.trim();
  if (!text || isResponding) return;
  inputField.value = '';
  isResponding = true;
  welcomeSection.style.display = 'none';
  var sendWithContext = hasContext;
  contextCard.classList.remove('show');
  suggestChips.classList.remove('show');

  addUserMessage(text, sendWithContext);
  hasContext = false;

  var responseText = mockResponses.generic(text);

  setTimeout(function() {
    var ai = addAiMessage();
    typeAiResponse(ai.bubble, responseText).then(function() {
      isResponding = false;
    });
  }, 600);
}

inputField.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleSend();
  }
});

window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'askV-context') {
    contextText = e.data.text;
    contextSpeaker = e.data.speaker;
    contextTs = e.data.ts;
    hasContext = true;
    initContext();
  }
});

initContext();
