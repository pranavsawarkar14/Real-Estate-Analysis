# Prop Analytics - Your Smart Real Estate Companion

Hey there! 👋 Welcome to Prop Analytics, a project I built to make real estate data analysis actually enjoyable and accessible. You know how frustrating it can be to dig through spreadsheets and try to make sense of property trends? Yeah, I felt that pain too. That's why I created this tool.

## What's This All About?

Imagine being able to ask your real estate data questions like you're talking to a friend: "Which areas in Pune are good for investment?" or "How did Wakad perform compared to Aundh last year?" That's exactly what this does. No more complex SQL queries or confusing dashboards - just plain English questions and smart answers.

I've been working in real estate analytics for a while, and I was tired of the same old boring tools. So I built something different - a platform that actually understands what you're asking and gives you insights that matter.

## The Cool Stuff It Does

**Talk to Your Data**: Just type what you want to know. "Show me price trends in Baner" or "Which area has the best ROI?" - it gets it.

**Smart AI Insights**: I integrated Google's Gemini AI to give you actual analysis, not just numbers. It's like having a real estate expert explain the data to you.

**Beautiful Charts**: Because nobody likes staring at raw numbers. The visualizations actually help you understand what's happening in the market.

**Easy Data Upload**: Drag and drop your Excel files, and you're good to go. I made sure it handles all the messy data cleaning stuff automatically.

**Export Everything**: Found something interesting? Export it as CSV or Excel and share it with your team.

**Works Everywhere**: Built it mobile-first because I know you're probably checking property data on your phone half the time.

## What I Built It With

I chose technologies that I actually enjoy working with and that get the job done well:

**Backend (The Brain)**:
- Python with Django - because life's too short for complicated frameworks
- Django REST Framework - clean APIs that just work
- pandas for data crunching - it's a beast for Excel processing
- Google Gemini AI - for the smart insights that make this special
- SQLite for development, PostgreSQL for when things get serious

**Frontend (The Pretty Face)**:
- React 18 - because it makes building UIs actually fun
- Vite for development - seriously fast hot reloading
- Bootstrap 5 - I'm not a designer, so I let the pros handle the styling
- Chart.js for visualizations - simple but powerful
- Axios for API calls - reliable and straightforward

## Getting It Running on Your Machine

Alright, let's get you set up. Don't worry, I've made this as painless as possible.

### What You'll Need

- Python 3.8 or newer (I developed this on 3.10, works great)
- Node.js 16+ (18 is what I use)
- A Google API key if you want the AI features (totally optional though)
- About 10 minutes of your time

### Step 1: Get the Code

```bash
git clone https://github.com/yourusername/prop-analytics.git
cd prop-analytics
```

### Step 2: Backend Setup

```bash
# Jump into the backend folder
cd backend

# Create a virtual environment (trust me, you want this)
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install the Python stuff
pip install -r requirements.txt

# Set up your environment variables
cp .env.example .env
# Open .env in your favorite editor and add your Google API key if you have one

# Set up the database
python manage.py migrate

# Fire it up!
python manage.py runserver
```

Your backend should now be humming along at `http://localhost:8000`. You can test it by visiting `http://localhost:8000/api/health` - you should see a friendly JSON response.

### Step 3: Frontend Setup

Open a new terminal (keep the backend running) and:

```bash
cd frontend

# Install the Node.js dependencies
npm install

# Start the development server
npm run dev
```

Now open `http://localhost:5173` in your browser, and you should see Prop Analytics in all its glory!

## Setting Up the AI Features (Optional but Recommended)

The AI insights are what make this tool really shine. Here's how to get them working:

1. Head over to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Add it to your `.env` file like this: `GOOGLE_API_KEY=your-key-here`

Don't have an API key? No worries! The app works perfectly fine with smart mock responses that show you exactly how the AI features work.

## Your Data and How to Use It

I've included a sample dataset with real estate data from Pune to get you started. It has everything you need: years, areas, prices, and demand scores. 

Want to use your own data? Just make sure your Excel file has these columns:
- **Year** - like 2020, 2021, 2022
- **Area** - the location names
- **Price** - property prices (I use lakhs, but any currency works)
- **Demand** - a score from 1-10 representing market demand

The upload is super forgiving - it'll tell you exactly what's wrong if something doesn't look right.

## How to Ask Questions (The Fun Part!)

This is where the magic happens. You can ask questions in plain English:

**For single areas:**
- "Tell me about Wakad"
- "How's Aundh doing?"
- "Show me Kothrud price trends"

**For comparisons:**
- "Compare Wakad and Aundh"
- "Which is better: Baner or Pune?"
- "Wakad vs Aundh demand over 3 years"

**For investment insights:**
- "Best areas for investment"
- "Which area has highest growth?"
- "Show me emerging markets"

**For time-based analysis:**
- "Price trends over last 2 years"
- "How did 2022 perform?"
- "Growth since 2020"

The AI understands context, so you can ask follow-up questions and it'll remember what you were talking about.

## API Endpoints (For the Developers)

If you want to integrate this with other tools, here are the main endpoints:

```bash
# Ask questions
POST /api/query
{
  "query": "Analyze Wakad price trends"
}

# Upload data
POST /api/upload
# Send Excel file as multipart/form-data

# Download filtered data
GET /api/download?area=Wakad&format=csv

# Get available areas
GET /api/areas

# Health check
GET /api/health
```

## Deploying This Thing

Ready to share it with the world? I've deployed this on several platforms, and here's what works best:

### For the Backend (Django)

**Render** (my personal favorite for simplicity):
1. Connect your GitHub repo
2. Set the build command to `pip install -r requirements.txt`
3. Set start command to `python manage.py runserver 0.0.0.0:$PORT`
4. Add your environment variables in their dashboard

**Heroku** (the classic choice):
```bash
heroku create your-app-name
heroku config:set GOOGLE_API_KEY=your-key
heroku config:set DJANGO_SECRET_KEY=your-secret
git push heroku main
```

### For the Frontend (React)

**Vercel** (works like magic):
1. Connect your GitHub repo
2. Vercel auto-detects it's a Vite project
3. Set your API URL in environment variables
4. Deploy!

**Netlify** (also great):
1. Run `npm run build` locally
2. Drag the `dist` folder to Netlify
3. Or connect GitHub for automatic deployments

## When Things Go Wrong (Troubleshooting)

I've been there - things break, and it's frustrating. Here are the most common issues I've seen:

**Backend won't start?**
- Make sure your virtual environment is activated
- Check that all dependencies installed correctly
- Try `python manage.py migrate` again

**Frontend can't connect to backend?**
- Is the backend actually running on port 8000?
- Check the API URL in your frontend code
- CORS issues? Make sure localhost is in your Django CORS settings

**File upload not working?**
- File must be .xlsx or .xls
- Check that you have the required columns
- File size under 10MB
- No empty rows at the top

**AI not working?**
- Double-check your Google API key
- Make sure you have billing enabled (Google requires it)
- The app falls back to mock responses if the API fails

## Contributing and Making It Better

I built this because I needed it, but I know it can be so much better with help from others. If you want to contribute:

1. Fork the repo
2. Create a branch for your feature
3. Make your changes (and please add tests!)
4. Submit a pull request

I'm especially interested in:
- Better mobile experience
- More chart types
- Integration with real estate APIs
- Performance improvements
- Better AI prompts

## A Few Important Notes

**Security**: Never commit your API keys! Use environment variables for everything sensitive.

**Performance**: The sample dataset is small, but this handles much larger files well. For production, consider PostgreSQL instead of SQLite.

**Costs**: Google's Gemini API is pretty affordable, but keep an eye on usage if you're processing lots of queries.

## License and Legal Stuff

This is MIT licensed, which basically means you can do whatever you want with it. Use it commercially, modify it, share it - just keep the original license notice.

## Get in Touch

Found a bug? Have an idea? Just want to say hi? 

- Open an issue on GitHub
- Start a discussion if you have questions
- Email me at [your-email] for anything else

I genuinely hope this tool helps you make better real estate decisions. I built it because I was frustrated with existing tools, and I think you'll find it refreshing too.

Happy analyzing! 🏠📊

---

*P.S. If this helps you make a great investment decision, I'd love to hear about it! Success stories keep me motivated to make this even better.*