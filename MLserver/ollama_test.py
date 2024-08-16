from langchain_ollama import OllamaLLM

# Pass the model name during initialization
model = OllamaLLM(model="llama3.1")

# Invoke the model with your input
result = model.invoke(input="Hi, how are you?")

print(result)
