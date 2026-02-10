# ChainxSecurity AI - Gmail Add-on

A powerful Gmail add-on that automatically analyzes emails for blockchain and security-related content using Perplexity AI, then organizes the insights into Google Sheets for easy tracking and analysis.

## 🚀 Features

- **Smart Email Analysis**: Automatically analyzes email content using Perplexity AI to extract blockchain and security insights
- **Flexible Search**: Customizable search queries to target specific topics (blockchain, security, smart contracts, etc.)
- **Single Email Analysis**: Analyze the currently selected email with one click
- **Batch Processing**: Scan up to 10 recent unread emails matching your criteria
- **Google Sheets Integration**: Automatically save analysis results to your preferred Google Sheet
- **Automated Background Scanning**: Set up automatic periodic scans for hands-free operation
- **Configurable Settings**: Easy setup through a user-friendly settings panel

## 📋 Prerequisites

- Google Account with Gmail access
- Google Apps Script project
- Perplexity AI API key (get one from [Perplexity AI](https://www.perplexity.ai/))
- Google Sheet for storing results

## 🛠 Installation

### 1. Create Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com/)
2. Create a new project
3. Replace the default code with the contents of `Code.gs`
4. Update the `appsscript.json` file with the provided configuration

### 2. Configure API Access

1. In your Apps Script project, go to **Project Settings**
2. Check "Show 'appsscript.json' manifest file in editor"
3. Ensure the following OAuth scopes are included:
   - `https://www.googleapis.com/auth/gmail.addons.execute`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/script.external_request`

### 3. Deploy as Gmail Add-on

1. In Apps Script, click **Deploy** > **New Deployment**
2. Choose **Gmail add-on** as the type
3. Configure the deployment settings
4. Install the add-on to your Gmail account

## ⚙️ Configuration

### 1. Perplexity AI API Key

You can configure your API key in two ways:

**Option A: Hard-code in script (less secure)**
```javascript
var DEFAULT_API_KEY = 'pplx-your-api-key-here';
```

**Option B: Set via add-on settings (recommended)**
- Leave `DEFAULT_API_KEY` empty in the code
- Enter your API key through the add-on's Settings panel

### 2. Google Sheet Setup

1. Create a new Google Sheet or use an existing one
2. Copy the Sheet ID from the URL (the long string between `/spreadsheets/d/` and `/edit`)
3. In the Gmail add-on, go to **Settings** and paste the Sheet ID
4. Specify the tab name (or leave as default "BlockchainNews")

### 3. Search Configuration

Customize your email search criteria in Settings:

- **Search Query**: Use Gmail search syntax
  - Default: `subject:(blockchain OR security OR "smart contract")`
  - Examples: 
    - `from:newsletter@crypto.com`
    - `subject:DeFi OR body:NFT`
    - `has:attachment subject:whitepaper`

- **Days to Look Back**: How many days of emails to search (default: 30)

## 📖 Usage

### Manual Analysis

1. **Single Email**: Select any email in Gmail and click "Analyze This Email"
2. **Batch Scan**: Click "Batch Scan Inbox (Last 5)" to process multiple emails at once

### Results

Each analysis provides:
- **Summary**: AI-generated summary of the email content
- **Sub-Topic**: Categorization of the blockchain/security topic
- **Reference Link**: Relevant external links (when available)

### Automatic Background Scanning

Set up the `runAutomaticScan()` function to run periodically:

1. In Apps Script, go to **Triggers**
2. Add a new trigger for `runAutomaticScan`
3. Set it to run time-driven (hourly, daily, etc.)

## 📊 Data Structure

The add-on saves the following data to your Google Sheet:

| Column | Description |
|--------|-------------|
| Date | Email received date |
| Sender | Email sender address |
| Subject | Email subject line |
| Summary | AI-generated summary |
| SubTopic | Categorized topic |
| Link | Reference URLs (if found) |

## 🔧 Customization

### Search Queries

Modify the default search behavior by updating these variables in [Code.gs](Code.gs):

```javascript
var DEFAULT_TOPICS = 'your-custom-search-query';
var DEFAULT_RANGE = '7'; // days
var DEFAULT_TAB_NAME = 'YourTabName';
```

### AI Model Settings

Adjust the Perplexity AI model and parameters in the `analyzeWithPerplexity` function:

```javascript
var payload = {
  "model": "sonar", // or other available models
  "temperature": 0.1, // adjust creativity (0.0-1.0)
  // ... other parameters
};
```

## 🚨 Error Handling

The add-on includes robust error handling for:
- Invalid API keys
- Missing or inaccessible Google Sheets
- Network connectivity issues
- Malformed API responses

Error messages are displayed directly in the Gmail interface.

## 🔒 Security Notes

- Store API keys securely using Google Apps Script's PropertiesService
- Review OAuth permissions carefully
- Only grant access to necessary Google services
- Regularly rotate API keys for security

## 📝 File Structure

```
├── appsscript.json    # Gmail add-on configuration
├── Code.gs           # Main application code
└── README.md         # This documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with your Gmail account
5. Submit a pull request

## 📄 License

This project is open source. Please check the repository for license details.

## 🆘 Support

If you encounter issues:

1. Check that all OAuth scopes are properly configured
2. Verify your Perplexity AI API key is valid
3. Ensure the Google Sheet ID is correct and accessible
4. Review the Apps Script logs for detailed error messages

## 🔮 Future Enhancements

- Support for additional AI providers
- Advanced filtering and categorization options
- Export functionality (CSV, PDF)
- Integration with other productivity tools
- Enhanced email thread analysis

---

**Built with ❤️ using Google Apps Script and Perplexity AI**