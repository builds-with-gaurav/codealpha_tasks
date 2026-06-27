"""
Command-line interface for the FAQ chatbot.

Run it with:  python cli.py
Type your question and press Enter. Type 'quit' or 'exit' to stop.
"""

from codealpha_tasks.FAQChatbot.CodeAlpha_FAQChatbot.CodeAlpha_FAQChatbot.chatbot import FAQChatbot


def main():
    bot = FAQChatbot()

    print("=" * 55)
    print("  Support FAQ Bot")
    print("  Ask me anything about orders, returns, payments...")
    print("  (type 'quit' to exit)")
    print("=" * 55)

    while True:
        try:
            query = input("\nYou: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBye!")
            break

        if not query:
            continue
        if query.lower() in {"quit", "exit", "bye"}:
            print("Bot: Thanks for stopping by. Take care!")
            break

        result = bot.get_response(query)
        print(f"Bot: {result['answer']}")

        # Show the match info only when we actually matched something.
        if result["matched_question"]:
            print(f"     (matched: \"{result['matched_question']}\" "
                  f"| score {result['confidence']})")


if __name__ == "__main__":
    main()
