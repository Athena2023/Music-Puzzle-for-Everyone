    // 音乐拼图游戏
document.addEventListener('DOMContentLoaded', () => {
    let segments = [];
    let puzzlePieces = [];
    let correctSequence = []; 
    let currentPlayingSegment = null;

    /**************************************************
    模块 1: 初始化
    ***************************************************/
   
    // 获取 DOM 元素
   
    const audioFileInput = document.getElementById('audio-file-input');
    const segmentCountInput = document.getElementById('segment-count');
    const segmentButtonsContainer = document.querySelector('.segments-list');
    const puzzleBoard = document.querySelector('.puzzle-board');
    const playPuzzleButton = document.getElementById('play-puzzle');
    const resetPuzzleButton = document.getElementById('reset-puzzle');
    const processAudioButton = document.getElementById('process-audio');
    const rewindButton = document.getElementById('rewind-10s');
    const forwardButton = document.getElementById('forward-10s');
    const jumpTimeInput = document.getElementById('jump-time');
    const jumpButton = document.getElementById('jump-button');

    /**************************************************
    模块 2: 音频读取及处理
    ***************************************************/

    //---------------------主函数--------------------------
    // 读取完整音频文件及用户分段数量（为“处理音频”按钮添加事件监听器）
    processAudioButton.addEventListener('click', () => {
        const file = audioFileInput.files[0];
        const segmentCount = parseInt(segmentCountInput.value);
        if (!file) {
            speak('请先选择一个音频文件');
            return;
        }
        if (isNaN(segmentCount) || segmentCount < 2 || segmentCount > 10) {
            speak('请指定一个有效的片段数量，2到10之间');
            return;
        }
        speak('正在处理音频，请稍候');
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const arrayBuffer = event.target.result;
            processAudio(arrayBuffer, segmentCount);
        };
        reader.readAsArrayBuffer(file);
    });

    // 初始化音频
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();

    // 切割音频文件并生成音频片段
    function processAudio(arrayBuffer, segmentCount) {
        audioContext.decodeAudioData(arrayBuffer, function(audioBuffer) {

            const segmentDuration = audioBuffer.duration / segmentCount;

            const segmentBlobs = [];
            for (let i = 0; i < segmentCount; i++) {
                const startTime = i * segmentDuration;
                const endTime = (i + 1) * segmentDuration;
                const segmentBuffer = extractAudioSegment(audioBuffer, startTime, endTime);
                // 将 AudioBuffer 转换为 Blob
                const segmentBlob = bufferToWave(segmentBuffer, 0, segmentBuffer.length);
                segmentBlobs.push(segmentBlob);
            }

            // 将分割后的音频片段转换为 Audio 对象，供游戏使用
            segments = segmentBlobs.map((blob, index) => {
                const url = URL.createObjectURL(blob); //生成一个可以在浏览器中使用的 URL
                const audio = new Audio(url);
                return {
                    id: index + 1, // 原始顺序的 ID
                    audio: audio,
                    isPlaying: false
                };
            });

            // 存储正确的片段顺序
            correctSequence = segments.map(segment => segment.id);

            // 打乱 segments 数组
            shuffleArray(segments);

            // 为打乱后的片段生成新的标签
            segments.forEach((segment, index) => {
                segment.label = `片段 ${index + 1}`; // 重新编号
            });

            // 初始化游戏
            initializeGameWithSegments();

            speak('音频处理完成，游戏开始');

        }, function(error) {
            console.error('音频解码失败：', error);
            speak('音频文件处理失败');
        });
    }

    //---------------------函数的定义--------------------------
    
    // Fisher-Yates 洗牌算法
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // 提取音频片段
    function extractAudioSegment(audioBuffer, startTime, endTime) {
        const sampleRate = audioBuffer.sampleRate;
        const startSample = Math.floor(startTime * sampleRate);
        const endSample = Math.floor(endTime * sampleRate);
        const segmentDuration = endSample - startSample;
        // 创建新的 AudioBuffer
        const numberOfChannels = audioBuffer.numberOfChannels;
        const segmentBuffer = audioContext.createBuffer(numberOfChannels, segmentDuration, sampleRate);

        for (let channel = 0; channel < numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel).slice(startSample, endSample);
            segmentBuffer.copyToChannel(channelData, channel, 0);
        }

        return segmentBuffer;
    }

    // 将 AudioBuffer 转换为 WAV 格式的 Blob
    function bufferToWave(abuffer, offset, len) {
        var numOfChan = abuffer.numberOfChannels,
            length = len * numOfChan * 2 + 44,
            buffer = new ArrayBuffer(length),
            view = new DataView(buffer),
            channels = [],
            i,
            sample,
            pos = 0;

        // 写入 WAV 文件头部
        setUint32(0x46464952);       // "RIFF" 标记
        setUint32(length - 8);       // 文件长度
        setUint32(0x45564157);       // "WAVE" 标记

        // "fmt " chunk，用于描述音频格式
        setUint32(0x20746d66);       // "fmt " 标记
        setUint32(16);               // "fmt " 的头部长度
        setUint16(1);                // 音频格式，1 表示 PCM 格式
        setUint16(numOfChan);        // 通道数
        setUint32(abuffer.sampleRate);  // 采样率
        setUint32(abuffer.sampleRate * 2 * numOfChan); // 字节率（采样率 × 通道数 × 每个采样的字节数）
        setUint16(numOfChan * 2);    // 每个采样的字节数
        setUint16(16);               // 每个采样的位深

        // "data" chunk，用于存储音频数据
        setUint32(0x61746164);       // "data" 标记
        setUint32(length - pos - 4); // 音频数据的长度


        // 写入音频数据
        for (i = 0; i < numOfChan; i++)
            channels.push(abuffer.getChannelData(i));

        while (pos < length) {
            for (i = 0; i < numOfChan; i++) {
                sample = Math.max(-1, Math.min(1, channels[i][offset])); // 限制在 [-1, 1]
                sample = (sample * 32767) | 0; // 转换为 16 位整数
                view.setInt16(pos, sample, true); 
                pos += 2;
            }
            offset++;
        }

        return new Blob([buffer], { type: 'audio/wav' });

        function setUint16(data) {
            view.setUint16(pos, data, true);
            pos += 2;
        }

        function setUint32(data) {
            view.setUint32(pos, data, true);
            pos += 4;
        }
    }

    /**************************************************
    模块 3: 游戏初始化与控制模块
    ***************************************************/

    //---------------------主函数--------------------------

    // 初始化游戏界面
    function initializeGameWithSegments() {
        // 清空之前的音乐片段按钮
        segmentButtonsContainer.innerHTML = '';

        // 为新的音频片段创建按钮
        segments.forEach(segment => {
            const button = document.createElement('button');
            button.classList.add('segment-button');
            button.setAttribute('data-segment', segment.id);
            button.textContent = segment.label;
            button.setAttribute('aria-label', `播放并选择${segment.label}`);

            // 添加点击事件
            button.addEventListener('click', () => {
                toggleSegmentPlayback(segment);
                addPieceToPuzzle(segment);
            });

            // 添加键盘事件
            button.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleSegmentPlayback(segment);
                    addPieceToPuzzle(segment);
                }
            });

            segmentButtonsContainer.appendChild(button);
        });

        // 清空拼图区域和拼图片段数组
        puzzleBoard.innerHTML = '';
        puzzlePieces = [];
    }

    //---------------------函数的定义--------------------------

    // 播放/暂停音频片段
    function toggleSegmentPlayback(segment) {
        if (segment.isPlaying) {
            segment.audio.pause();
            segment.isPlaying = false;
            speak(`${segment.label} 已暂停`);
        } else {
            stopAllAudio();
            segment.audio.currentTime = 0;
            segment.audio.play();
            segment.isPlaying = true;
            currentPlayingSegment = segment;
            speak(`正在播放${segment.label}`);
        }
    }

    // 停止所有音频播放
    function stopAllAudio() {
        segments.forEach(segment => {
            if (segment.audio) {
                segment.audio.pause();
                segment.isPlaying = false;
                segment.audio.currentTime = 0;
            }
        });
        currentPlayingSegment = null;
    }

    // 添加拼图片段到拼图区域
    function addPieceToPuzzle(segment) {
        // 检查是否已添加过
        if (puzzlePieces.includes(segment)) {
            speak(`${segment.label} 已在拼图中，不能重复添加`);
            return;
        }

        // 创建拼图片段的元素，使用 <button>
        const pieceElement = document.createElement('button');
        pieceElement.classList.add('puzzle-piece');
        pieceElement.setAttribute('data-segment', segment.id);
        pieceElement.textContent = segment.label;
        pieceElement.setAttribute('aria-label', `拼图片段：${segment.label}`);
        pieceElement.setAttribute('role', 'listitem');

        // 添加到拼图区域并更新拼图数组
        puzzleBoard.appendChild(pieceElement);
        puzzlePieces.push(segment);
        speak(`${segment.label} 已添加到拼图`);

        // 为拼图片段添加播放控制事件
        pieceElement.addEventListener('click', () => {
            toggleSegmentPlayback(segment);
        });

        pieceElement.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleSegmentPlayback(segment);
            }
        });

        // 将焦点设置到新添加的拼图片段
        pieceElement.focus();
    }

    // 移除拼图片段
    function removePieceFromPuzzle(pieceElement, segment) {
        puzzleBoard.removeChild(pieceElement);

        puzzlePieces = puzzlePieces.filter(s => s.id !== segment.id);

        if (segment.isPlaying) {
            segment.audio.pause();
            segment.isPlaying = false;
        }

        speak(`${segment.label} 已从拼图中移除`);

        // 将焦点设置到拼图区域的下一个拼图片段，或返回到拼图区域
        const remainingPieces = puzzleBoard.querySelectorAll('.puzzle-piece');
        if (remainingPieces.length > 0) {
            remainingPieces[0].focus();
        } else {
            puzzleBoard.focus();
        }
    }

    //---------------------拼图检查与结果输出--------------------------

    // 为“播放拼图”按钮添加事件监听器
    playPuzzleButton.addEventListener('click', () => {
        if (puzzlePieces.length === 0) {
            speak('拼图为空，请先添加音乐片段');
            return;
        }
        playPuzzlePieces(0);
    });

    // 添加键盘事件
    playPuzzleButton.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            playPuzzleButton.click();
        }
    });

    // 播放拼图片段并在完成后检查顺序
    function playPuzzlePieces(index) {
        if (index < puzzlePieces.length) {
            const segment = puzzlePieces[index];
            stopAllAudio();
    
            // 更新当前播放的片段
            currentPlayingSegment = segment;
            segment.audio.currentTime = 0;
            segment.audio.play();
            segment.isPlaying = true;
    
            // 当当前片段播放结束后，播放下一个
            segment.audio.onended = () => {
                segment.isPlaying = false;
                playPuzzlePieces(index + 1);
            };
        } else {

            speak('拼图播放完成');
            checkPuzzleCorrectness();
        }
    }
    

    // 检查拼图是否正确
    function checkPuzzleCorrectness() {
        const userSequence = puzzlePieces.map(segment => segment.id);
        const isCorrect = arraysEqual(userSequence, correctSequence);

        if (isCorrect) {
            playCongratulationsAudio();
        } else {
            speak('拼图顺序不正确，请重试');
        }
    }

    function arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    // 播放“恭喜，拼对了”的音频
    function playCongratulationsAudio() {
        speak('恭喜，拼对了');
    }

    // 重置拼图
    resetPuzzleButton.addEventListener('click', () => {
        puzzleBoard.innerHTML = '';
        puzzlePieces = [];
        stopAllAudio();
        speak('拼图已重置');
    });

    resetPuzzleButton.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            resetPuzzleButton.click();
        }
    });

    /**************************************************
    模块 4: 语音反馈与全局事件模块
    ***************************************************/

    // 语音反馈函数
    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        window.speechSynthesis.speak(utterance);
    }

    // 全局键盘事件监听器
    document.addEventListener('keydown', (event) => {
        // 忽略文本输入框中的按键
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            return;
        }

        // 自定义导航键
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            moveFocus('next');
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            moveFocus('previous');
        } 
        // 删除键（Delete 或 Backspace）用于移除拼图片段
        else if (event.key === 'Delete' || event.key === 'Backspace') {
            if (document.activeElement.classList.contains('puzzle-piece')) {
                event.preventDefault();
                const pieceElement = document.activeElement;
                const segmentId = parseInt(pieceElement.getAttribute('data-segment'));
                const segment = puzzlePieces.find(s => s.id === segmentId);
                if (segment) {
                    removePieceFromPuzzle(pieceElement, segment);
                }
            }
        } 
        // 空格键停止所有音频
        else if (event.key === ' ') {
            event.preventDefault();
            stopAllAudio();
            speak('所有音频已停止');
        } 
        // Alt + P 播放拼图
        else if (event.altKey && event.key === 'p') {
            event.preventDefault();
            playPuzzleButton.click();
        } 
        // Alt + R 重置拼图
        else if (event.altKey && event.key === 'r') {
            event.preventDefault();
            resetPuzzleButton.click();
        } 
        // Alt + 1-9 播放特定音频片段
        else if (event.altKey && event.key >= '1' && event.key <= '9') {
            event.preventDefault();
            const index = parseInt(event.key) - 1;
            if (segments[index]) {
                toggleSegmentPlayback(segments[index]);
                addPieceToPuzzle(segments[index]);
            }
        } 
        // 快进和快退快捷键
        else if (event.key === 'f') {
            event.preventDefault();
            forwardButton.click();
        } else if (event.key === 'b') {
            event.preventDefault();
            rewindButton.click();
        } 
        // 跳转快捷键
        else if (event.key === 'j') {
            event.preventDefault();
            jumpButton.click();
        }
        // 焦点移动快捷键
        else if (event.altKey && event.key === 'x') {
            // 移动焦点到左侧栏
            document.querySelector('.left-column').focus({ preventScroll: false });
            speak('已跳转到左侧栏');
        } else if (event.altKey && event.key === 'c') {
            // 移动焦点到右侧栏
            document.querySelector('.right-column').focus({ preventScroll: false });
            speak('已跳转到右侧栏');
        }
    });

    // 焦点移动函数
    function moveFocus(direction) {
        const focusableElements = Array.from(document.querySelectorAll('button, .puzzle-board[tabindex]'));

        // 过滤可见元素
        const visibleFocusableElements = focusableElements.filter(elem => elem.offsetParent !== null);
        const currentIndex = visibleFocusableElements.indexOf(document.activeElement);

        let nextIndex;
        if (direction === 'next') {
            nextIndex = (currentIndex + 1) % visibleFocusableElements.length;
        } else if (direction === 'previous') {
            nextIndex = (currentIndex - 1 + visibleFocusableElements.length) % visibleFocusableElements.length;
        }

        visibleFocusableElements[nextIndex].focus();
    }


    // 快退 10 秒
    rewindButton.addEventListener('click', () => {
        if (currentPlayingSegment && currentPlayingSegment.audio) {
            currentPlayingSegment.audio.currentTime = Math.max(0, currentPlayingSegment.audio.currentTime - 10);
            speak('快退 10 秒');
        }
    });

    // 快进 10 秒
    forwardButton.addEventListener('click', () => {
        if (currentPlayingSegment && currentPlayingSegment.audio) {
            currentPlayingSegment.audio.currentTime = Math.min(currentPlayingSegment.audio.duration, currentPlayingSegment.audio.currentTime + 10);
            speak('快进 10 秒');
        }
    });

    // 跳转到指定时间
    jumpButton.addEventListener('click', () => {
        const jumpTime = parseFloat(jumpTimeInput.value);
        if (currentPlayingSegment && currentPlayingSegment.audio && !isNaN(jumpTime)) {
            currentPlayingSegment.audio.currentTime = Math.min(currentPlayingSegment.audio.duration, Math.max(0, jumpTime));
            speak(`跳转到第 ${jumpTime} 秒`);
        }
    });

    // 为跳转输入框添加键盘事件，按下 Enter 键即可跳转
    jumpTimeInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            jumpButton.click();
        }
    });

});