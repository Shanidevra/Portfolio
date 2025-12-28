// DOM Content Loader for Chatbot
document.addEventListener('DOMContentLoaded', function() {
    // Chatbot elements
    const chatToggle = document.getElementById('chatToggle');
    const chatContainer = document.getElementById('chatContainer');
    const closeChat = document.getElementById('closeChat');
    const sendBtn = document.getElementById('sendBtn');
    const userInput = document.getElementById('userInput');
    const chatbox = document.getElementById('chatbox');
    const micBtn = document.getElementById('micBtn');
    
    // Speech synthesis instance
    let currentSpeech = null;
    
    // Add Chatbot CSS dynamically
    const chatbotStyles = `
        /* Chatbot Specific Styles */
        .chat-header {
            background: linear-gradient(45deg, #3498db, #2980b9);
            color: white;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .chat-header span {
            font-weight: 600;
            font-size: 18px;
        }
        
        .close-btn {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background 0.3s;
        }
        
        .close-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        #chatbox {
            height: 400px;
            overflow-y: auto;
            padding: 15px;
            background: #f8f9fa;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .input-container {
            display: flex;
            padding: 10px;
            background: white;
            border-top: 1px solid #ddd;
            gap: 5px;
        }
        
        #userInput {
            flex: 1;
            padding: 10px 15px;
            border: 1px solid #ddd;
            border-radius: 25px;
            font-size: 14px;
            outline: none;
        }
        
        #userInput:focus {
            border-color: #3498db;
        }
        
        #sendBtn, #micBtn {
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 50%;
            background: #3498db;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.3s;
        }
        
        #sendBtn:hover, #micBtn:hover {
            background: #2980b9;
        }
        
        .user, .bot {
            max-width: 80%;
            padding: 10px 15px;
            border-radius: 18px;
            word-wrap: break-word;
            line-height: 1.4;
            position: relative;
        }
        
        .user {
            background: #3498db;
            color: white;
            align-self: flex-end;
            margin-left: auto;
        }
        
        .bot {
            background: #e9ecef;
            color: #333;
            align-self: flex-start;
        }
        
        /* Audio button for bot messages */
        .audio-btn {
            position: absolute;
            top: 5px;
            right: 5px;
            background: transparent;
            border: none;
            color: #3498db;
            cursor: pointer;
            font-size: 12px;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.3s ease;
            opacity: 0.7;
        }
        
        .audio-btn:hover {
            opacity: 1;
            background: rgba(52, 152, 219, 0.1);
            transform: scale(1.1);
        }
        
        .audio-btn.playing {
            color: #e74c3c;
            opacity: 1;
        }
        
        .bot .audio-btn {
            color: #666;
        }
        
        .bot .audio-btn:hover {
            background: rgba(0, 0, 0, 0.1);
        }
        
        .thinking {
            display: flex;
            gap: 5px;
            padding: 10px;
            align-self: flex-start;
        }
        
        .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #666;
            animation: bounce 1.4s infinite ease-in-out both;
        }
        
        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
        
        /* Responsive styles for chatbot */
        @media (max-width: 768px) {
            .chat-container {
                width: 90%;
                right: 5%;
                bottom: 100px;
            }
        }
        
        @media (max-width: 576px) {
            .chat-container {
                width: 95%;
                right: 2.5%;
            }
            
            .bot, .user {
                max-width: 85%;
            }
        }
    `;
    
    // Add chatbot styles to document
    const styleSheet = document.createElement('style');
    styleSheet.textContent = chatbotStyles;
    document.head.appendChild(styleSheet);
    
    // Initialize chatbot functionality
    function initializeChatbot() {
        // Toggle chat visibility
        chatToggle.addEventListener('click', () => {
            chatContainer.classList.toggle('active');
        });
        
        // Close chat
        closeChat.addEventListener('click', () => {
            chatContainer.classList.remove('active');
            // Stop any ongoing speech when closing chat
            if (currentSpeech) {
                window.speechSynthesis.cancel();
                currentSpeech = null;
            }
        });
        
        // Function to stop any ongoing speech
        function stopAllSpeech() {
            window.speechSynthesis.cancel();
            // Remove playing class from all audio buttons
            document.querySelectorAll('.audio-btn.playing').forEach(btn => {
                btn.classList.remove('playing');
                btn.innerHTML = '<i class="fas fa-volume-up"></i>';
            });
            currentSpeech = null;
        }
        
        // Function to speak text
        function speakText(text, audioBtn) {
            // Stop any ongoing speech first
            stopAllSpeech();
            
            if ('speechSynthesis' in window) {
                const speech = new SpeechSynthesisUtterance(text);
                speech.rate = 1.5;
                speech.pitch = 1;
                speech.volume = 1;
                
                // Set voice if available
                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    // Try to find a natural sounding voice
                    const preferredVoice = voices.find(v => v.lang === 'en-US' && (v.name.includes('Google') || v.name.includes('Microsoft'))) || voices[0];
                    speech.voice = preferredVoice;
                }
                
                // Update button to playing state
                audioBtn.classList.add('playing');
                audioBtn.innerHTML = '<i class="fas fa-stop"></i>';
                
                // Store reference to current speech
                currentSpeech = speech;
                
                // When speech starts
                speech.onstart = () => {
                    audioBtn.classList.add('playing');
                    audioBtn.innerHTML = '<i class="fas fa-stop"></i>';
                };
                
                // When speech ends
                speech.onend = () => {
                    audioBtn.classList.remove('playing');
                    audioBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                    currentSpeech = null;
                };
                
                // When speech is cancelled
                speech.onerror = () => {
                    audioBtn.classList.remove('playing');
                    audioBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                    currentSpeech = null;
                };
                
                window.speechSynthesis.speak(speech);
            } else {
                alert('Text-to-speech is not supported in your browser.');
            }
        }
        
        // Function to create audio button
        function createAudioButton(text) {
            const audioBtn = document.createElement('button');
            audioBtn.className = 'audio-btn';
            audioBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            audioBtn.setAttribute('data-text', text);
            
            audioBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (this.classList.contains('playing')) {
                    stopAllSpeech();
                } else {
                    speakText(text, this);
                }
            });
            
            return audioBtn;
        }
        
        // Send message
        function sendMessage() {
            const message = userInput.value.trim();
            if (!message) return;
            
            // Add user message
            const userMessage = document.createElement('div');
            userMessage.className = 'user';
            userMessage.textContent = message;
            chatbox.appendChild(userMessage);
            
            // Clear input
            userInput.value = '';
            
            // Add thinking indicator
            const thinking = document.createElement('div');
            thinking.className = 'bot thinking';
            thinking.innerHTML = `
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            `;
            chatbox.appendChild(thinking);
            
            // Scroll to bottom
            chatbox.scrollTop = chatbox.scrollHeight;
            
            // Simulate bot response (replace with actual API call)
            setTimeout(() => {
                chatbox.removeChild(thinking);
                
                const botResponse = document.createElement('div');
                botResponse.className = 'bot';
                
                // Simple responses based on input
                const lowerMessage = message.toLowerCase();
                let response = getBotResponse(lowerMessage);
                
                botResponse.textContent = response;
                
                // Add audio button to bot response
                const audioBtn = createAudioButton(response);
                botResponse.appendChild(audioBtn);
                
                chatbox.appendChild(botResponse);
                chatbox.scrollTop = chatbox.scrollHeight;
            }, 1000);
        }
        
        // Function to get bot response based on input
        function getBotResponse(message) {
            if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
                return "Hello! How can I help you today?";
            } else if (message.includes('project')) {
                return "Shani has worked on several projects including Crop Counsel, AI Chatbot, and Heart Disease Prediction. Check out the Projects section for more details!";
            } else if (message.includes('skill')) {
                return "Shani specializes in Python, Machine Learning, Flask, and AI integration. See the Skills section for the complete list.";
            } else if (message.includes('contact')) {
                return "You can contact Shani via email at sunnydevra27052000@gmail.com or phone +91 7060085834.";
            } else if (message.includes('name')) {
                return "My name is AI Assistant, and I'm here to help you learn more about Shani Devra's work.";
            } else if (message.includes('thank')) {
                return "You're welcome! Feel free to ask if you have more questions.";
            } else if (message.includes('help')) {
                return "I can tell you about Shani's projects, skills, education, and contact information. What would you like to know?";
            } else if (message.includes('education')) {
                return "Shani completed his MCA from Teerthanker Mahavir University with specialization in Artificial Intelligence & Machine Learning.";
            } else if (message.includes('experience')) {
                return "Shani is an AI & Python Developer with experience in building real-time conversational AI systems and scalable automation solutions.";
            } else if (message.includes('cv') || message.includes('resume')) {
                return "You can download Shani's CV by clicking the 'Download CV' button in the About section.";
            } else if (message.includes('location') || message.includes('where')) {
                return "Shani is based in Gohawar Jait, Bijnor, Uttar Pradesh, India.";
            } else if (message.includes('hire') || message.includes('job')) {
                return "Shani is available for freelance projects and full-time opportunities. You can contact him through the Contact section.";
            } else {
                return "I'm an AI assistant created to help you learn more about Shani Devra. You can ask me about his projects, skills, education, or contact information.";
            }
        }
        
        // Send message on button click
        sendBtn.addEventListener('click', sendMessage);
        
        // Send message on Enter key
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        // Voice input
        let isListening = false;
        let recognition = null;
        
        // Check if browser supports speech recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                userInput.value = transcript;
                sendMessage();
            };
            
            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                isListening = false;
            };
            
            recognition.onend = () => {
                isListening = false;
                micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            };
        } else {
            micBtn.style.display = 'none';
        }
        
        // Toggle voice input
        micBtn.addEventListener('click', () => {
            if (!recognition) {
                alert('Speech recognition is not supported in your browser.');
                return;
            }
            
            if (!isListening) {
                try {
                    recognition.start();
                    isListening = true;
                    micBtn.innerHTML = '<i class="fas fa-stop"></i>';
                } catch (error) {
                    console.error('Speech recognition error:', error);
                    micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                    isListening = false;
                }
            } else {
                recognition.stop();
                isListening = false;
                micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            }
        });
        
        // Initialize voices for speech synthesis
        if ('speechSynthesis' in window) {
            // Some browsers need this to load voices
            window.speechSynthesis.onvoiceschanged = function() {
                // Voices are now loaded
                console.log('Speech synthesis voices loaded');
            };
        }
        
        // Add event listeners to existing audio buttons
        document.querySelectorAll('.audio-btn').forEach(btn => {
            const text = btn.getAttribute('data-text');
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (this.classList.contains('playing')) {
                    stopAllSpeech();
                } else {
                    speakText(text, this);
                }
            });
        });
    }
    
    // Initialize chatbot when DOM is loaded
    initializeChatbot();
    
    // Add chatbot loaded message to console
    console.log('Chatbot module loaded successfully');
});