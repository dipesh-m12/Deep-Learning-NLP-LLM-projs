from textblob import TextBlob

def analyze_sentiment(text):
    analysis = TextBlob(text)
    score = analysis.sentiment.polarity

    if score > 0.6:
        return 'ecstatic'
    elif score > 0.3:
        return 'happy'
    elif score > 0:
        return 'content'
    elif score > -0.3:
        return 'neutral'
    elif score > -0.6:
        return 'sad'
    else:
        return 'depressed'
