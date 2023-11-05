import requests

API_URL = "https://api-inference.huggingface.co/models/RachitD15673/mistral-7b-finetuned"
headers = {"Authorization": "Bearer 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"}

def query(payload):
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.json()
	
output = query({
	"inputs": "Can you please let us know more details about your ",
})

print(output)