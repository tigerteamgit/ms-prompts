Prompt As Code

Prompts are inputs to Language Learning Models (LLMs).  Natural language is a code that the model interprets into 0s and 1s.  In order to communicate to a machine, you must talk like a machine. 

The Problem

Asking LLMs to accomplish what we want them to generate is a big task.  There are many fine nuances to creating prompts that are accurate, reproducible, and programmable.  Necessary steps include identifying features, data modeling, automating discovery, data triage, and aggregated visibility.   

Microsoft Prompt Flow has been deprecated, a new customized approach is needed to optimize prompts.

The Solution

This build calls for a customized Foundry prompt tuning change management CI/CD solution.  The proposed system will accurately assess, remediate, and trace changes, which subsequently leads to KPI-driven improvements in model performance.  

Questions to be answered:

How to isolate factors?
How to track changes?
How to identify patterns?
What factors affect machine performance?
What does success look like?


Prompt Engineering for Language Models (PELM) Framework

<img width="470" height="242" alt="image" src="https://github.com/user-attachments/assets/38d68811-b50f-4664-a34a-40afd4a960a4" />
<br></br>


<img width="473" height="277" alt="image" src="https://github.com/user-attachments/assets/367c1cf2-0c70-4503-9978-343c58d02edc" />

Change and Release Management

KPIs:
Specify AI Output
Identify Failure Patterns
Improve Accuracy
Improve Engagement
Improve Consistency

Rubric Standards:
Success Rate
Failures tracking

Testing:
Template Testing
Task Testing

Hard->Soft Prompting Strategy

Prompt Key Identifier Table (Multiple Keys for easier indexing)
<br></br>
<img width="520" height="58" alt="image" src="https://github.com/user-attachments/assets/fe2c9996-af26-4376-8596-07fba1babb75" />


Prompt Specification Table
<br></br>
<img width="548" height="168" alt="image" src="https://github.com/user-attachments/assets/3dd31db4-1da3-41ca-b85f-9608fa94e213" />

Change Management LLMOps Table
<br></br>
<img width="548" height="99" alt="image" src="https://github.com/user-attachments/assets/0d687e56-6fe7-4df0-98d0-e391fb8b08f9" />

Game-Specific Muli-Modal Table
<br></br>
<img width="542" height="86" alt="image" src="https://github.com/user-attachments/assets/b1dbd8ec-841a-4afd-a479-04e22065ad49" />

Task (summarization, translation, coding, role-play, brainstorming)
<br></br>
Prompt Type (zero-shot, one-shot, few-shot, instruction-based, chain-of-thought, contextual, role-based, reflexive prompting, multi-modal prompting)
<br></br>
Statistical Analysis (response accuracy, coherence, diversity)
<br></br>
Quality Gates
<br></br>
Max Tokens
TTL
Topics
Line number
Run_id
url
<br></br>
Category
evidence
Groundtruth
Prediction
grade
Folderpath
datapath
language
Bias

Experiment 1:
<br></br>
<img width="519" height="281" alt="image" src="https://github.com/user-attachments/assets/e97e65e5-a99a-4be7-bfaf-2439a28a58f9" />

Goal:

Build highly enriched dataset for scalability into RAG Fine-Tuning (RAFT) Framework

->Quality - understand what a good labeled document is
->Tokenization Method - prioritize name-entity-recognition (NER)
->Create and Train on similar tasks to avoid overfitting data
-> Identify high-priority tasks
-> Develop scoring parameters
->Data Storage- what is the most efficient way to store data to train on

Domain Categorization -  perform RAG

Prompt Library Categorization - Kmodes to segment data

PCA to find data anomaly inferences (like dog-poker)

Taxonomy: (know how to retrieve data)
Metadata schema: format, purpose, location, and creation date

Dataset Enrichment:

Nodes

Prompt
Prompt Type
Role
Task
Context
Constraints
Examples

Edges

Token-max
Indexes, TF-IDF, 
Word chunk (Document or smaller)
Tokenization Method, Token group (possible NERs)
PCA edge































