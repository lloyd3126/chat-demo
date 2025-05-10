const chatBox = document.getElementById('chatBox');
const chatHeader = document.getElementById('chatHeader');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

async function loadChat() {
    addInfoMessage('正在載入對話...');

    const urlParams = new URLSearchParams(window.location.search);
    const chatId = urlParams.get('id'); // 確保 URL 參數名為 'id'

    if (!chatId) {
        chatHeader.textContent = "未指定對話";
        chatBox.innerHTML = ''; // 清空"正在載入"
        addErrorMessage('請在網址中提供 chat ID，例如：index.html?id=檔名 (不含 .json)');
        disableInput(true);
        return;
    }

    const filePath = `./data/${chatId}.json`; // 假設 JSON 檔案在 data 資料夾
    chatHeader.textContent = `對話內容 (ID: ${chatId})`;
    disableInput(false);

    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            chatBox.innerHTML = ''; // 清空"正在載入"
            if (response.status === 404) {
                throw new Error(`找不到對話檔案：${filePath}。請確認檔案存在且路徑正確。`);
            }
            throw new Error(`HTTP 錯誤！ 狀態: ${response.status}`);
        }
        const data = await response.json();
        chatBox.innerHTML = ''; // 清空"正在載入"
        // 如果有 title，顯示於 #chatHeader，並保留圖示
        if (data.title && chatHeader) {
            // 找到 chatHeader 的第一個文字節點
            const nodes = Array.from(chatHeader.childNodes);
            const textNode = nodes.find(n => n.nodeType === Node.TEXT_NODE);
            if (textNode) {
                textNode.textContent = data.title + ' ';
            } else {
                // 若沒有文字節點，則在最前面插入
                chatHeader.insertBefore(document.createTextNode(data.title + ' '), chatHeader.firstChild);
            }
        }
        displayMessages(data.messages, chatId);
    } catch (error) {
        console.error('無法讀取對話資料:', error);
        chatBox.innerHTML = ''; // 清空"正在載入"
        addErrorMessage(`無法載入對話內容。 (${error.message})`);
        disableInput(true);
    }
}

function displayMessages(messages, chatId) {
    if (!messages || messages.length === 0) {
        // 使用 addMessageToChatBox 顯示系統訊息
        addMessageToChatBox('系統提示詞', `對話 (ID: ${chatId}) 沒有內容可顯示。`, 'system-prompt');
        return;
    }

    messages.forEach((msg, index) => {
        // 根據 msg.role 決定 typeClass，如果沒有則默認為 role的小寫
        const typeClass = msg.role ? (msg.role === 'developer' || msg.role === 'System' ? 'system-prompt' : msg.role.toLowerCase()) : 'system-prompt';
        addMessageToChatBox(msg.role === 'developer' || msg.role === 'System' ? '系統提示詞' : (msg.role || 'System'), msg.content, typeClass, index * 0.1);
    });

    scrollToBottom();
}

function addMessageToChatBox(role, content, typeClass, animationDelay = 0) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', typeClass || (role === 'developer' || role === 'System' ? 'system-prompt' : (role ? role.toLowerCase() : 'system-prompt')));
    messageDiv.style.animationDelay = `${animationDelay}s`;

    const roleSpan = document.createElement('span');
    roleSpan.classList.add('role');
    roleSpan.textContent = (role === 'developer' || role === 'System') ? '系統提示詞' : role;

    // 訊息內容支援 markdown
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    if (window.marked) {
        contentDiv.innerHTML = marked.parse(content);
    } else {
        contentDiv.innerHTML = content.replace(/\n/g, '<br>');
    }

    if (typeClass === 'system-prompt') {
        // System-prompt header: 保留 chevron 與收合功能
        const headerDiv = document.createElement('div');
        headerDiv.className = 'system-prompt-header';
        headerDiv.style.display = 'flex';
        headerDiv.style.alignItems = 'center';
        headerDiv.style.cursor = 'pointer';
        headerDiv.style.gap = '8px';

        // Chevron icon
        const chevron = document.createElement('i');
        chevron.className = 'bi bi-chevron-down toggle-icon';
        chevron.setAttribute('aria-label', '收合/展開');

        // 角色名稱
        const currentRoleSpan = document.createElement('span');
        currentRoleSpan.classList.add('role');
        if (role === 'developer' || role === 'System') {
            currentRoleSpan.textContent = '系統提示詞';
        } else {
            currentRoleSpan.textContent = role;
        }

        headerDiv.appendChild(currentRoleSpan);
        headerDiv.appendChild(chevron);

        // 預設展開
        messageDiv.appendChild(headerDiv);
        messageDiv.appendChild(contentDiv);

        headerDiv.addEventListener('click', () => {
            contentDiv.classList.toggle('content-collapsed');
            chevron.classList.toggle('icon-rotated');
        });
    } else if (typeClass === 'user' || typeClass === 'assistant') {
        // User/Assistant header: 顯示 chevron，可點擊收合
        const headerDiv = document.createElement('div');
        headerDiv.className = `${typeClass}-header`;
        headerDiv.style.display = 'flex';
        headerDiv.style.alignItems = 'center';
        headerDiv.style.cursor = 'pointer';
        headerDiv.style.gap = '8px';

        const currentRoleSpan = document.createElement('span');
        currentRoleSpan.classList.add('role');
        if (typeClass === 'user') {
            currentRoleSpan.textContent = '提示';
        } else {
            currentRoleSpan.textContent = '回覆';
        }

        // Chevron icon
        const chevron = document.createElement('i');
        chevron.className = 'bi bi-chevron-down toggle-icon';
        chevron.setAttribute('aria-label', '收合/展開');

        headerDiv.appendChild(currentRoleSpan);
        headerDiv.appendChild(chevron);

        messageDiv.appendChild(headerDiv);
        messageDiv.appendChild(contentDiv);

        // header 點擊可收合
        headerDiv.addEventListener('click', () => {
            contentDiv.classList.toggle('content-collapsed');
            chevron.classList.toggle('icon-rotated');
            // 同步 actions 區塊的展開/收合按鈕狀態
            if (toggleContentBtn) {
                if (contentDiv.classList.contains('content-collapsed')) {
                    toggleContentBtn.innerHTML = '展開 <i class="bi bi-chevron-expand"></i>';
                } else {
                    toggleContentBtn.innerHTML = '收合 <i class="bi bi-chevron-contract"></i>';
                }
            }
        });
    } else {
        // role 標籤顯示規則
        if (typeClass !== 'user' && typeClass !== 'assistant') {
            messageDiv.appendChild(roleSpan);
        }
        messageDiv.appendChild(contentDiv);
    }

    // 複製按鈕區塊
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';

    // 複製純文字按鈕
    const copyBtn = document.createElement('button');
    copyBtn.classList.add('copy-btn');
    copyBtn.title = '複製純文字';
    copyBtn.innerHTML = `<i class="bi bi-copy"></i> 複製文字`;
    copyBtn.addEventListener('click', () => {
        // 複製純文字（去除 HTML 標籤）
        const temp = document.createElement('div');
        temp.innerHTML = contentDiv.innerHTML;
        const text = temp.textContent || temp.innerText || '';
        navigator.clipboard.writeText(text).then(() => {
            showCopyFeedback(copyBtn, '純文字已複製！');
        });
    });

    // 複製 Markdown 按鈕
    const copyMdBtn = document.createElement('button');
    copyMdBtn.classList.add('copy-md-btn');
    copyMdBtn.title = '複製 Markdown';
    copyMdBtn.innerHTML = `<i class="bi bi-markdown"></i> 複製 Markdown`;
    copyMdBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(content).then(() => {
            showCopyFeedback(copyMdBtn, 'Markdown 已複製！');
        });
    });

    actionsDiv.appendChild(copyBtn);
    actionsDiv.appendChild(copyMdBtn);

    // User/Assistant 增加展開/收合按鈕
    let toggleContentBtn = null;
    if (typeClass === 'user' || typeClass === 'assistant') {
        toggleContentBtn = document.createElement('button');
        toggleContentBtn.classList.add('toggle-content-btn');
        toggleContentBtn.innerHTML = '收合 <i class="bi bi-chevron-contract"></i>';

        toggleContentBtn.addEventListener('click', () => {
            contentDiv.classList.toggle('content-collapsed');
            // 同步 chevron 狀態
            const headerChevron = messageDiv.querySelector('.toggle-icon');
            if (contentDiv.classList.contains('content-collapsed')) {
                toggleContentBtn.innerHTML = '展開 <i class="bi bi-chevron-expand"></i>';
                if (headerChevron) headerChevron.classList.add('icon-rotated');
            } else {
                toggleContentBtn.innerHTML = '收合 <i class="bi bi-chevron-contract"></i>';
                if (headerChevron) headerChevron.classList.remove('icon-rotated');
            }
        });
        actionsDiv.appendChild(toggleContentBtn);
    }

    // 將訊息框與按鈕區塊分開 append
    chatBox.appendChild(messageDiv);

    // 根據訊息類型決定按鈕區塊對齊
    if (typeClass === 'user') {
        actionsDiv.classList.add('actions-user');
    } else if (typeClass === 'assistant') {
        actionsDiv.classList.add('actions-assistant');
    } else if (typeClass === 'system-prompt') {
        actionsDiv.classList.add('actions-system-prompt');
    } else {
        actionsDiv.classList.add('actions-other');
    }
    chatBox.appendChild(actionsDiv);

    scrollToBottom();
    return messageDiv;
}

// 複製提示
function showCopyFeedback(btnElem, msg) {
    let tip = btnElem.parentElement.querySelector('.copy-tip');
    if (!tip) {
        tip = document.createElement('span');
        tip.className = 'copy-tip';
        btnElem.parentElement.appendChild(tip);
    }
    tip.textContent = msg || '已複製！';
    tip.style.display = 'inline-block';
    setTimeout(() => {
        tip.style.display = 'none';
    }, 1200);
}

function addErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.classList.add('error-message');
    errorDiv.textContent = message;
    chatBox.appendChild(errorDiv);
    scrollToBottom();
}

function addInfoMessage(message) {
    chatBox.innerHTML = ''; // 清空現有內容再顯示 info
    const infoDiv = document.createElement('div');
    infoDiv.classList.add('info-message');
    infoDiv.textContent = message;
    chatBox.appendChild(infoDiv);
    scrollToBottom();
}

function handleUserInput() {
    const messageText = userInput.value.trim();
    if (messageText === "") return;

    addMessageToChatBox('User', messageText, 'user');
    userInput.value = "";
    autoGrowTextarea(userInput); // 發送後重置高度
    disableInput(true);

    // 模擬 AI 回應
    setTimeout(() => {
        const aiResponse = "這是一個模擬的 AI 回應。\n我收到了您的訊息：" + messageText.substring(0, 30) + "...";
        addMessageToChatBox('Assistant', aiResponse, 'assistant');
        disableInput(false);
        userInput.focus();
    }, 1000 + Math.random() * 800);
}

function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

function autoGrowTextarea(element) {
    element.style.height = 'auto'; // 先重置為 auto 以獲取正確的 scrollHeight
    element.style.height = (element.scrollHeight) + 'px';
}

function disableInput(disabled) {
    userInput.disabled = disabled;
    sendButton.disabled = disabled;
    if (disabled) {
        userInput.placeholder = "AI 正在輸入...";
    } else {
        userInput.placeholder = "輸入訊息...";
    }
}

// 事件監聽
sendButton.addEventListener('click', handleUserInput);
userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleUserInput();
    }
});

userInput.addEventListener('input', () => {
    autoGrowTextarea(userInput);
});

document.addEventListener('DOMContentLoaded', () => {
    // 顯示 .input-area 條件判斷
    const inputArea = document.querySelector('.input-area');
    const urlParams = new URLSearchParams(window.location.search);
    if (
        urlParams.get('mode') === 'chat'
        && inputArea
    ) {
        inputArea.style.display = 'flex';
    }
    loadChat();
    userInput.focus();
    autoGrowTextarea(userInput);
});
