const vscode = window.acquireVsCodeApi();

let workspacePath = "";
let isPlay = false;

// Handle the message inside the webview
window.addEventListener('message', event => {
    console.log("Received message from extension:", event.data);

    switch (event.data.type) {
        case 'files':
            const filesArray = event.data.files;
            workspacePath = event.data.workspacePath;
            break;

        case 'algorithmComplexity':
            // vscode.window.showInformationMessage("Starting a complexity analysis.");
            const code = event.data.code;
            const functionName = event.data.functionName;
            const language = event.data.language;
            complexityChat(functionName, code, language);
            break;

        case 'chat':
            // vscode.window.showInformationMessage("Starting a normal chat with the bot.");
            createChat('bot', event.data.text);
            break;

        case 'scrollDown':
            // vscode.window.showInformationMessage("Auto Scrolling down existing chat.");
            const chatContainer = document.getElementsByClassName('chat-section')[0];
            chatContainer.scrollTop = chatContainer.scrollHeight;
            break;
    } 
});

// Handling Enter Message
document.getElementById('user-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('sendButton').click();
    }
});

// Handling Send Button
document.getElementById('sendButton').addEventListener('click', function() {
    const inputValue = document.getElementById('user-input').value;

    if(inputValue.trim() === '') {

        // Sending a message back to the extension
        vscode.postMessage({ command: 'alert', text: 'Please enter a message.'});
        return;
    }

    createChat('user', inputValue);
    const chatContainer = document.getElementsByClassName('chat-section')[0];
    chatContainer.scrollTop = chatContainer.scrollHeight;
    document.getElementById('user-input').value = '';

    const analyzingChat = createChat('bot', 'Analyzing');
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    console.log('Sending message to analyz:', inputValue);
    // fetch('https://api-aknalyz.onrender.com/generate_text', {
    fetch('http://localhost:8000/generate_text', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            question: inputValue
        })
    })
    .then(response => response.json())
    .then(data => {
        analyzingChat.remove();
        createChat('bot', data.text.trim(),data.code.trim());
        chatContainer.scrollTop = chatContainer.scrollHeight;
    })
    .catch(error => {
        console.error('Error from analyz:', error);
    });
});

function copyCode(code){    
    console.log("code to be copied:" + code);
    navigator.clipboard.writeText(code);
}

async function newFile(code){
    // creating a new file in workspacePath 
    console.log("Sent Message for new file")
    vscode.postMessage({
        command: 'newFile',
        code: code
    });
}

async function getSpeech(textInput){   

    var text = decodeURIComponent(textInput);

    // Create a new SpeechSynthesisUtterance instance
    var utterance = new SpeechSynthesisUtterance(text);

    // Use the default speech synthesis voice
    utterance.voice = speechSynthesis.getVoices()[0];
    speechSynthesis.speak(utterance);   
    // if(!isPlay){
    //     speechSynthesis.speak(utterance);
    //     isPlay = true;
    // }
    // else{
    //     speechSynthesis.pause();
    //     isPlay = false;
    // }
}

function getSpeech(text){
      // Create a new SpeechSynthesisUtterance instance
      var utterance = new SpeechSynthesisUtterance(decodeURIComponent(text));

      // Use the default speech synthesis voice
      utterance.voice = speechSynthesis.getVoices()[0];
      utterance.rate = parseFloat(0.8);
      let isPlay=true

      // Speak the text
      if(isPlay){
        isPlay=true
        speechSynthesis.speak(utterance);
      }
      else{
        isPlay=false;
        speechSynthesis.pause();
      }
}
// Creating Chat 
function createChat(sender,text,code){
    const chat = document.createElement('div');
    chat.classList.add('chat');
    const img = document.createElement('img');
    if(sender === 'bot'){
        img.src = 'https://cdn-icons-png.flaticon.com/128/2593/2593635.png';
    }

    else{
        img.src = "https://cdn-icons-png.flaticon.com/128/4046/4046275.png?track=ais";
    }
    chat.appendChild(img);

    const p = document.createElement('p');

    // structuring the code for highlight.js
    const pre=document.createElement('pre'); // tag that highlight js needs
    const code1=document.createElement('code'); // Tag that highlight js needs
    // This should be the structure of the code
    // <pre>
    //     <code>
    //         Code here
    //     </code>
    // </pre>

    if(code && code.length > 0){
        console.log("code:" + code);
        const con=document.createElement('div'); // this you can remove
        pre.appendChild(code1);
        con.appendChild(pre);
    
        if(sender === 'user'){
            p.textContent = text;
        }
        else{
            p.textContent = text;
            code1.textContent = code;
        }
    
        if(text === 'Analyzing'){
            const span = document.createElement('span');
            span.textContent = '...';
            p.appendChild(span);
        }
    
        con.appendChild(p);
        chat.appendChild(con);
        
        iconsContainer = document.createElement('div');

        iconsContainer.innerHTML = `
    <div class="icons">
        <img onclick="copyCode(decodeURIComponent('${encodeURIComponent(code)}'))" src="https://cdn-icons-png.flaticon.com/128/3719/3719119.png" alt="copy">
        <img onclick="newFile(decodeURIComponent('${encodeURIComponent(code)}'))" src="https://cdn-icons-png.flaticon.com/128/7163/7163714.png" alt="new file">
        <img onclick="getSpeech('${encodeURIComponent(text)}')" src="https://cdn-icons-png.flaticon.com/128/2326/2326200.png" alt="voiceover">
    </div>
`;

        chat.appendChild(iconsContainer);
        document.querySelector('.chat-section').appendChild(chat);
        return chat;
    }
    else{
        if(sender === 'user'){
            p.textContent = text;
        }
        else{
            p.textContent = text;
        }
    
        if(text === 'Analyzing'){
            const span = document.createElement('span');
            span.textContent = '...';
            p.appendChild(span);
        }
    
        chat.appendChild(p);
    
        document.querySelector('.chat-section').appendChild(chat);
        return chat;
    }
}

// complexity analysis chat
function complexityChat(functionName, functionCode, language){

    const chatContainer = document.getElementsByClassName('chat-section')[0];
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const analyzingChat = createChat('bot', 'Analyzing');
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // fetch('https://api-analyz.onrender.com/generate_text', {
    fetch('http://localhost:8000/algorithm_complexity', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            function_name: functionName,
            programming_language: language,
            function_code: functionCode
        })
    })
    .then(response => response.json())
    .then(data => {
        analyzingChat.remove();
        createChat('bot', functionCode + '\n\n' + data.generated_text.trim());
        chatContainer.scrollTop = chatContainer.scrollHeight;
    })
    .catch(error => {
        console.error('Error from analyz:', error);
    });
}