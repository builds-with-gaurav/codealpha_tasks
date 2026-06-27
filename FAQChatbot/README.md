# FAQ Chatbot

A retrieval-based chatbot that answers frequently asked questions. It uses basic
NLP (NLTK) to clean up text and TF-IDF + cosine similarity (scikit-learn) to find
the FAQ that best matches whatever the user types.

Built for the CodeAlpha AI internship (Task 2).

## How it works

1. The FAQs live in `faqs.json` as a list of question/answer pairs.
2. Each entry is preprocessed: lowercased, stripped of punctuation/numbers,
   tokenized, stopwords removed, and lemmatized.
3. The cleaned text is turned into TF-IDF vectors with scikit-learn.
4. For a user's question we vectorize it the same way and compute cosine
   similarity against every FAQ. The closest one wins.
5. If the best score is below a confidence threshold, the bot says it doesn't
   know instead of returning a bad guess.

The matcher indexes the answer text along with the question, which helps when
people phrase things differently from the original FAQ wording.

## Project layout

```
.
├── chatbot.py        # the NLP engine (preprocessing + TF-IDF matching)
├── cli.py            # command-line chat
├── app.py            # Flask server + REST endpoint
├── faqs.json         # the FAQ knowledge base
├── requirements.txt
└── frontend/         # web chat UI (HTML/CSS/JS)
    ├── index.html
    ├── styles.css
    └── app.js
```

## Setup

```bash
pip install -r requirements.txt
```

The first run downloads a few small NLTK data packages (punkt, stopwords,
wordnet) automatically.

## Running it

Command line:

```bash
python cli.py
```

Web app:

```bash
python app.py
# open http://localhost:5000
```

## API

`POST /ask`

```json
{ "message": "how long does shipping take?" }
```

Response:

```json
{
  "answer": "Standard delivery takes 3 to 5 business days...",
  "matched_question": "How long does delivery take?",
  "confidence": 0.35
}
```

## Customizing

Edit `faqs.json` to use your own questions and answers. No code changes needed.
You can tune how strict the matching is by changing the `threshold` value when
creating `FAQChatbot` (lower = more answers but more wrong guesses).

## Notes

- The web UI talks to the Flask backend. If you open `frontend/index.html`
  directly without the server, it falls back to a small in-browser matcher so
  you can still click around -- but the Python engine is the real one.
