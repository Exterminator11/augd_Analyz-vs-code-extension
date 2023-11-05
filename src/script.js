const vscode = window.acquireVsCodeApi();

document.getElementById('user-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('sendButton').click();
    }
});

document.getElementById('sendButton').addEventListener('click', function() {
    const inputValue = document.getElementById('user-input').value;

    if(inputValue.trim() === '') {
        // Send a message to the extension
        vscode.postMessage({ command: 'alert', text: 'Please enter a message.'});
        return;
    }

    createChat('user', inputValue);
    const chatContainer = document.getElementsByClassName('chat-section')[0];
    chatContainer.scrollTop = chatContainer.scrollHeight;
    document.getElementById('user-input').value = '';

    // Create a chat message with the text "Analyzing..."
    const analyzingChat = createChat('bot', 'Analyzing');
    chatContainer.scrollTop = chatContainer.scrollHeight;
    

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
        createChat('bot', data.generated_text);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

function createChat(sender,text){
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

    // Add the new chat message to the chat section
    document.querySelector('.chat-section').appendChild(chat);
    return chat;
}