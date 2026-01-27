document.getElementById('gen').addEventListener('click', function() {
    const prompt = document.getElementById('WESEND').value;
    const responseEl = document.getElementById('response');

    responseEl.textContent = 'Loading...';
        fetch('http://localhost:3000/llm/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        })
        .then(res => res.json())
        .then(data => {
            if(data.results) {
                let output = `Found ${data.count} results\n\n`;
                output += `SQL Query:\n${data.query}\n\n`;
                output += `Results:\n${JSON.stringify(data.results, null, 2)}`;
                responseEl.textContent = output;
            } else if(data.error) {
                responseEl.textContent = 'Error: ' + data.error;
            } else {
                responseEl.textContent = 'Unexpected response format';
            }
        })
        .catch(err => {
            responseEl.textContent = 'Request failed: ' + err.message;
        });
});