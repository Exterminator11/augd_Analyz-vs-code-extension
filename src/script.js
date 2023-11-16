const vscode = window.acquireVsCodeApi();
hljs.highlightAll();

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
        console.log('Success:', data);
        analyzingChat.remove();
        createChat('bot', data.text,data.code);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

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
    const pre=document.createElement('pre'); // tag that highlight js needs
    const code1=document.createElement('code'); // Tag that highlight js needs
    // This should be the structure
    // <pre>
    //     <code>
    //         // Code here
    //     </code>
    // </pre>
    const con=document.createElement('div'); // this you can remove
    pre.appendChild(code1);
    con.appendChild(pre);

    if(sender === 'user'){
        p.textContent = text;
    }
    else{
        p.textContent = text;
        code1.textContent=code;
    }


    if(text === 'Analyzing'){
        const span = document.createElement('span');
        span.textContent = '...';
        p.appendChild(span);
    }
    chat.appendChild(con);
    chat.appendChild(p);

    // Add the new chat message to the chat section
    document.querySelector('.chat-section').appendChild(chat);
    return chat;
}