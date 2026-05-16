// ==========================================
// ИНИЦИАЛИЗАЦИЯ ЧАСТИЦ (ФОН)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    if(typeof particlesJS !== 'undefined') {
        particlesJS("particles-js", {
            "particles": {
                "number": { "value": 60, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": "#00ffff" },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.3, "random": false },
                "size": { "value": 3, "random": true },
                "line_linked": { "enable": true, "distance": 150, "color": "#00ffff", "opacity": 0.2, "width": 1 },
                "move": { "enable": true, "speed": 1.5, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": { "enable": true, "mode": "grab" },
                    "onclick": { "enable": true, "mode": "push" },
                    "resize": true
                },
                "modes": {
                    "grab": { "distance": 140, "line_linked": { "opacity": 0.5 } }
                }
            },
            "retina_detect": true
        });
    }

    // Анимация счетчиков (статистика)
    const counters = document.querySelectorAll('.stat-box h2');
    counters.forEach(counter => {
        counter.innerText = '0';
        const updateCounter = () => {
            const target = +counter.getAttribute('data-target');
            const c = +counter.innerText;
            const increment = target / 50;
            if(c < target) {
                counter.innerText = `${Math.ceil(c + increment)}`;
                setTimeout(updateCounter, 40);
            } else {
                counter.innerText = target;
            }
        };
        updateCounter();
    });

    initQuiz();
});

// ==========================================
// ПЕРЕКЛЮЧЕНИЕ ТЕМЫ
// ==========================================
function toggleTheme() {
    const body = document.body;
    if (body.getAttribute('data-theme') === 'light') {
        body.removeAttribute('data-theme');
    } else {
        body.setAttribute('data-theme', 'light');
    }
    
    // Обновляем цвет частиц под тему
    if(window.pJSDom && window.pJSDom.length > 0) {
        const isLight = body.getAttribute('data-theme') === 'light';
        const color = isLight ? "#0055ff" : "#00ffff";
        window.pJSDom[0].pJS.particles.color.value = color;
        window.pJSDom[0].pJS.particles.line_linked.color = color;
        window.pJSDom[0].pJS.fn.particlesRefresh();
    }
}

// ==========================================
// ОКНА (ФУНКЦИОНАЛ ПОЛНОЭКРАННЫХ СТРАНИЦ)
// ==========================================
const modals = document.querySelectorAll('.modal');

function openModal(id) {
    modals.forEach(m => m.style.display = "none"); 
    const modal = document.getElementById(id);
    if(modal) {
        modal.style.display = "block";
        // ИСПРАВЛЕНО: Блокируем внешний скролл сайта, убирая второй ползунок
        document.body.style.overflow = 'hidden'; 
        window.scrollTo(0, 0); 
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if(modal) {
        modal.style.display = "none";
        // ИСПРАВЛЕНО: Возвращаем скролл главной странице при закрытии
        document.body.style.overflow = 'auto'; 
    }
}

// ==========================================
// ИНТЕРАКТИВНАЯ АУДИОЛАБОРАТОРИЯ (Web Audio API)
// ==========================================
let audioCtx;
let oscillator;
let gainNode;
let biquadFilter;
let analyser;
let isPlaying = false;
let animationId;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        
        biquadFilter = audioCtx.createBiquadFilter();
        biquadFilter.type = "lowshelf";
        biquadFilter.frequency.value = 200;
        
        gainNode = audioCtx.createGain();
        gainNode.gain.value = document.getElementById('volume').value;

        biquadFilter.connect(gainNode);
        gainNode.connect(analyser);
        analyser.connect(audioCtx.destination);
    }
}

function startSound() {
    initAudio();
    if (isPlaying) return;
    
    oscillator = audioCtx.createOscillator();
    oscillator.type = document.getElementById('waveType').value;
    oscillator.frequency.value = document.getElementById('freq').value;
    
    oscillator.connect(biquadFilter);
    oscillator.start();
    isPlaying = true;
    
    drawWaveform();
}

function stopSound() {
    if (isPlaying && oscillator) {
        oscillator.stop();
        oscillator.disconnect();
        isPlaying = false;
        cancelAnimationFrame(animationId);
        clearCanvas();
    }
}

document.getElementById('freq').addEventListener('input', function() {
    if (isPlaying) oscillator.frequency.value = this.value;
});

document.getElementById('waveType').addEventListener('change', function() {
    if (isPlaying) oscillator.type = this.value;
});

document.getElementById('volume').addEventListener('input', function() {
    if (gainNode) gainNode.gain.value = this.value;
});

document.getElementById('bass').addEventListener('input', function() {
    if (biquadFilter) biquadFilter.gain.value = this.value;
});

const canvas = document.getElementById('waveCanvas');
const canvasCtx = canvas.getContext('2d');

function drawWaveform() {
    if (!isPlaying) return;
    
    animationId = requestAnimationFrame(drawWaveform);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);
    
    canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 255, 255)';
    canvasCtx.beginPath();
    
    const sliceWidth = canvas.width * 1.0 / bufferLength;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;
        
        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }
        x += sliceWidth;
    }
    
    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
}

function clearCanvas() {
    canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, canvas.height / 2);
    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.strokeStyle = 'rgb(0, 255, 255)';
    canvasCtx.stroke();
}

window.addEventListener('resize', () => {
    canvas.width = canvas.parentElement.clientWidth - 20;
    canvas.height = 300;
    if(!isPlaying) clearCanvas();
});

setTimeout(() => {
    canvas.width = canvas.parentElement.clientWidth - 20;
    canvas.height = 300;
    clearCanvas();
}, 100);

// ==========================================
// AI АССИСТЕНТ
// ==========================================
function toggleAssistant() {
    const box = document.getElementById('assistantBox');
    box.style.display = box.style.display === 'flex' ? 'none' : 'flex';
}

function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    if (!message) return;

    const chat = document.getElementById('chatMessages');
    
    const userDiv = document.createElement('div');
    userDiv.className = 'user-message';
    userDiv.innerText = message;
    chat.appendChild(userDiv);
    
    input.value = '';
    chat.scrollTop = chat.scrollHeight;

    setTimeout(() => {
        const botDiv = document.createElement('div');
        botDiv.className = 'bot-message';
        
        let response = "Я устал отвечать, думайте сами!";
        const lowerMsg = message.toLowerCase();
        
        if(lowerMsg.includes('mp3')) response = "MP3 — это кодек с потерей качества, основанный на психоакустике. Он удаляет звуки, которые мы не слышим.";
        else if(lowerMsg.includes('flac')) response = "FLAC работает как архиватор (например, ZIP), но для аудио. Он сжимает файл без потери качества.";
        else if(lowerMsg.includes('частота')) response = "Человек слышит частоты от 20 Гц (глубокий бас) до 20 000 Гц (высокий писк).";
        
        botDiv.innerText = response;
        chat.appendChild(botDiv);
        chat.scrollTop = chat.scrollHeight;
    }, 1000);
}

document.getElementById('userInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// ==========================================
// ВИКТОРИНА (QUIZ)
// ==========================================
const quizData = [
    {
        q: "Какой формат сжимает аудио без потери качества?",
        a: ["MP3", "FLAC", "AAC", "WAV"],
        correct: 1
    },
    {
        q: "В каком году изобрели первый компакт-диск (CD)?",
        a: ["1975", "1982", "1991", "1995"],
        correct: 1
    },
    {
        q: "Какая технология используется для создания пространственного звука?",
        a: ["Dolby Atmos", "MP3", "MIDI", "Lossless"],
        correct: 0
    }
];

let currentQuestion = 0;

function initQuiz() {
    if(currentQuestion < quizData.length) {
        document.getElementById('question').innerText = quizData[currentQuestion].q;
        for(let i=0; i<4; i++) {
            document.getElementById(`a${i}`).innerText = quizData[currentQuestion].a[i];
            document.getElementById(`a${i}`).style.background = "var(--card-bg)";
            document.getElementById(`a${i}`).disabled = false;
        }
        document.getElementById('quizResult').innerText = "";
    } else {
        document.getElementById('quizBox').innerHTML = "<h3>Викторина пройдена!</h3><p>Вы отлично разбираетесь в технологиях цифрового звука.</p><button class='main-btn' onclick='resetQuiz()' style='margin-top:15px;'>Пройти заново</button>";
    }
}

function answerQuiz(index) {
    const isCorrect = index === quizData[currentQuestion].correct;
    
    for(let i=0; i<4; i++) {
        document.getElementById(`a${i}`).disabled = true;
    }

    if(isCorrect) {
        document.getElementById(`a${index}`).style.background = "rgba(0, 255, 0, 0.2)";
        document.getElementById('quizResult').innerText = "Верно! ✅";
        document.getElementById('quizResult').style.color = "#00ff00";
    } else {
        document.getElementById(`a${index}`).style.background = "rgba(255, 0, 0, 0.2)";
        document.getElementById(`a${quizData[currentQuestion].correct}`).style.background = "rgba(0, 255, 0, 0.2)";
        document.getElementById('quizResult').innerText = "Ошибка! ❌";
        document.getElementById('quizResult').style.color = "#ff0000";
    }

    setTimeout(() => {
        currentQuestion++;
        initQuiz();
    }, 1500);
}

function resetQuiz() {
    currentQuestion = 0;
    document.getElementById('quizBox').innerHTML = `
        <h3 id="question">Вопрос</h3>
        <div class="quiz-buttons">
            <button onclick="answerQuiz(0)" id="a0"></button>
            <button onclick="answerQuiz(1)" id="a1"></button>
            <button onclick="answerQuiz(2)" id="a2"></button>
            <button onclick="answerQuiz(3)" id="a3"></button>
        </div>
        <div id="quizResult"></div>
    `;
    initQuiz();
}
function toggleAssistant() {
    const box = document.getElementById('assistantBox');
    if (box) {
        box.style.display = box.style.display === 'flex' ? 'none' : 'flex';
    }
}