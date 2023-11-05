# Analyz-vs-code-extension
Analyz a Code Buddy is a powerful Visual Studio Code extension designed to assist developers during coding sessions, providing real-time code analysis and helpful suggestions for better understanding and efficient coding. Leveraging the Mistral Instruct model fine-tuned on a dataset of over 200 rows, this extension offers comprehensive support for various programming languages and scenarios. With seamless integration into Visual Studio Code, it delivers a user-friendly experience, allowing developers to optimize their code structure and enhance overall coding efficiency. 


# Fine-tuned model

🔗https://huggingface.co/RachitD15673/mistral-finetuned-7B-instruct-manual

**Fine-Tuned Mistral 7B Model**

In this repository, we detail the process through which the Mistral 7B language model was fine-tuned using a specialized dataset sourced from the Algorithms repository on GitHub.

Fine-Tuning Process Overview

The fine-tuning was accomplished by employing the QLoRA (Query-specific LORA) technique, a method that efficiently adapts large language models to new tasks with minimal parameter updates.

Steps of Fine-Tuning with QLoRA:

1. *Dataset Acquisition*:
   - We procured a custom dataset of algorithmic content from TheAlgoritms GitHub repository, which provided diverse coding problems and their algorithmic solutions.

2. *Preprocessing*:
   - The dataset underwent preprocessing to structure it appropriately for the model, involving tokenization and formatting suitable for the Mistral 7B's input requirements.

3. *QLoRA Configuration*:
   - We configured QLoRA by specifying the additional parameters to be introduced to the model’s attention mechanism, specifically targeting the query matrices.

4. *Model Initialization*:
   - The pre-trained Mistral 7B model was loaded, and QLoRA was integrated, allowing for efficient fine-tuning without extensive retraining of the original model parameters.

5. *Training*:
   - The training loop, tailored for the QLoRA-augmented model, optimized the newly introduced parameters using the prepared dataset, focusing the model's learning on algorithmic patterns and intricacies.

6. *Validation*:
   - Post-training, the model was evaluated against a set of algorithmic problems it had not seen before to ensure it had effectively learned from the fine-tuning process.

7. *Model Saving*:
   - With fine-tuning complete and the model achieving a high level of performance on algorithmic content, we saved the enhanced model, encapsulating the QLoRA adjustments.

The fine-tuning process allowed us to maintain the breadth of knowledge inherent to Mistral 7B while refining its expertise to understand and generate algorithmic code effectively.


# Demo

https://github.com/srujan-landeri/Analyz-vs-code-extension/assets/66351075/64d78fd6-3923-4a84-b727-a2a834bdd4ac

