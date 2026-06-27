"""
FAQ chatbot engine.

The idea is simple: we keep a list of question/answer pairs, clean up the text
with some basic NLP (lowercasing, dropping stopwords, lemmatizing), turn the
questions into TF-IDF vectors, and then for any user query we find the question
with the highest cosine similarity and return its answer.

If nothing is similar enough we just say we don't know instead of guessing.
"""

import json
import os
import re
import string

import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def _ensure_nltk_data():
    """Download the NLTK data we rely on, but only if it's missing."""
    needed = [
        ("tokenizers/punkt", "punkt"),
        ("tokenizers/punkt_tab", "punkt_tab"),
        ("corpora/stopwords", "stopwords"),
        ("corpora/wordnet", "wordnet"),
        ("corpora/omw-1.4", "omw-1.4"),
    ]
    for path, pkg in needed:
        try:
            nltk.data.find(path)
        except LookupError:
            nltk.download(pkg, quiet=True)


class FAQChatbot:
    def __init__(self, faq_path="faqs.json", threshold=0.2):
        _ensure_nltk_data()

        self.threshold = threshold
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words("english"))

        self.faqs = self._load_faqs(faq_path)
        self.questions = [item["question"] for item in self.faqs]

        # We match against the question plus its answer. The question is repeated
        # so it still carries the most weight, but pulling in the answer text
        # noticeably improves recall when users phrase things differently
        # (e.g. "money back" lands on the refund entry).
        corpus = []
        for item in self.faqs:
            combined = (item["question"] + " ") * 2 + item["answer"]
            corpus.append(self.preprocess(combined))

        self.vectorizer = TfidfVectorizer()
        self.question_vectors = self.vectorizer.fit_transform(corpus)

    @staticmethod
    def _load_faqs(path):
        if not os.path.exists(path):
            raise FileNotFoundError(f"Could not find FAQ file: {path}")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not data:
            raise ValueError("FAQ file is empty.")
        return data

    def preprocess(self, text):
        """Lowercase, strip punctuation/numbers, tokenize, remove stopwords, lemmatize."""
        text = text.lower()
        # keep letters and spaces only
        text = re.sub(r"[^a-z\s]", " ", text)

        tokens = word_tokenize(text)
        clean_tokens = []
        for tok in tokens:
            if tok in string.punctuation:
                continue
            if tok in self.stop_words:
                continue
            if len(tok) < 2:
                continue
            clean_tokens.append(self.lemmatizer.lemmatize(tok))

        return " ".join(clean_tokens)

    def get_response(self, user_query):
        """
        Return a dict with the best answer and some debug info.
        Falls back to a default message when confidence is too low.
        """
        cleaned = self.preprocess(user_query)
        if not cleaned.strip():
            return {
                "answer": "Could you rephrase that? I didn't catch a clear question.",
                "matched_question": None,
                "confidence": 0.0,
            }

        query_vec = self.vectorizer.transform([cleaned])
        scores = cosine_similarity(query_vec, self.question_vectors)[0]

        best_idx = int(scores.argmax())
        best_score = float(scores[best_idx])

        if best_score < self.threshold:
            return {
                "answer": (
                    "Sorry, I'm not sure about that one. Try rephrasing, or "
                    "contact our support team at support@example.com."
                ),
                "matched_question": None,
                "confidence": round(best_score, 3),
            }

        return {
            "answer": self.faqs[best_idx]["answer"],
            "matched_question": self.faqs[best_idx]["question"],
            "confidence": round(best_score, 3),
        }
