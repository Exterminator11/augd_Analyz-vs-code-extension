import streamlit as st
from transformers import pipeline

@st.cache(allow_output_mutation=True)
def load_model():
    return pipeline("text2text-generation", "pszemraj/flan-t5-large-grammar-synthesis", 
                    max_length=64, repetition_penalty=1.05, early_stopping=True, num_beams=100)

def main():
    st.title('Text Correction App')
    text = st.text_area("Enter Text:", value='', height=None, max_chars=None, key=None)
    if st.button('Correct Text'):
        model = load_model()
        corrected_text = model(text)[0]['generated_text']
        st.text_area("Corrected Text:", value=corrected_text, height=None, max_chars=None, key=None)

if __name__ == '__main__':
    main()