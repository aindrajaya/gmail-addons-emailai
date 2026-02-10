// --- CONFIGURATION ---
// You can leave this empty if you want the client to input their own Key in settings too!
var DEFAULT_API_KEY = 'pplx-.....'; 

// DEFAULTS
var DEFAULT_TOPICS = 'subject:(blockchain OR security OR "smart contract")';
var DEFAULT_RANGE = '30'; 
var DEFAULT_TAB_NAME = 'BlockchainNews';

/**
 * ------------------------------------------------------------------
 * SECTION 1: GMAIL ADD-ON UI (Sidebar)
 * ------------------------------------------------------------------
 */

/**
 * TRIGGER: Main Entry Point
 */
function loadMainCard(e) {
  var card = CardService.newCardBuilder();
  var section = CardService.newCardSection();

  // Check if setup is complete
  var props = PropertiesService.getUserProperties();
  var sheetId = props.getProperty('SHEET_ID');

  if (!sheetId) {
    // Show "Setup Needed" Message if no sheet is linked
    section.addWidget(CardService.newTextParagraph().setText("<b>⚠️ Setup Required</b><br>Please go to Settings and link a Google Sheet first."));
  }

  // Button 1: Analyze
  var currentAction = CardService.newAction().setFunctionName('handleScanClick');
  var currentBtn = CardService.newTextButton()
      .setText('Analyze This Email')
      .setOnClickAction(currentAction)
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED);

  // Button 2: Batch Scan
  var batchAction = CardService.newAction().setFunctionName('handleBatchScan');
  var batchBtn = CardService.newTextButton()
      .setText('Batch Scan Inbox (Last 5)')
      .setOnClickAction(batchAction);

  // Button 3: Settings
  var settingsAction = CardService.newAction().setFunctionName('buildSettingsCard');
  var settingsBtn = CardService.newTextButton()
      .setText('⚙️ Settings')
      .setOnClickAction(settingsAction);

  section.addWidget(CardService.newTextParagraph().setText("<b>ChainX Security AI</b>"));
  section.addWidget(currentBtn);
  section.addWidget(batchBtn);
  section.addWidget(settingsBtn);
  
  card.addSection(section);
  return card.build();
}

/**
 * UI: SETTINGS CARD (Now with Sheet Inputs)
 */
function buildSettingsCard(e) {
  var props = PropertiesService.getUserProperties();
  
  var savedId = props.getProperty('SHEET_ID') || '';
  var savedTab = props.getProperty('TAB_NAME') || DEFAULT_TAB_NAME;
  var savedTopics = props.getProperty('TOPICS') || DEFAULT_TOPICS;
  var savedRange = props.getProperty('RANGE') || DEFAULT_RANGE;

  var card = CardService.newCardBuilder();
  
  // SECTION 1: DATABASE CONFIG
  var dbSection = CardService.newCardSection().setHeader("📊 Database Configuration");
  
  var idInput = CardService.newTextInput()
      .setFieldName('form_sheet_id')
      .setTitle('Google Sheet ID')
      .setHint('Paste the long ID from your Sheet URL')
      .setValue(savedId);

  var tabInput = CardService.newTextInput()
      .setFieldName('form_tab_name')
      .setTitle('Sheet Tab Name')
      .setHint('e.g. Sheet1 or BlockchainNews')
      .setValue(savedTab);

  dbSection.addWidget(idInput);
  dbSection.addWidget(tabInput);

  // SECTION 2: AI CONFIG
  var aiSection = CardService.newCardSection().setHeader("🤖 AI Configuration");

  var topicInput = CardService.newTextInput()
      .setFieldName('form_topics')
      .setTitle('Search Query')
      .setHint('e.g. subject:(blockchain OR security)')
      .setValue(savedTopics);

  var rangeInput = CardService.newTextInput()
      .setFieldName('form_range')
      .setTitle('Days to Look Back')
      .setHint('e.g. 7')
      .setValue(savedRange);

  aiSection.addWidget(topicInput);
  aiSection.addWidget(rangeInput);

  // SAVE BUTTON
  var saveAction = CardService.newAction().setFunctionName('saveSettings');
  var saveBtn = CardService.newTextButton()
      .setText('Save Preferences')
      .setOnClickAction(saveAction)
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED);

  aiSection.addWidget(saveBtn);
  
  card.addSection(dbSection);
  card.addSection(aiSection);
  return card.build();
}

function saveSettings(e) {
  var inputs = e.formInput;
  var props = PropertiesService.getUserProperties();

  props.setProperty('SHEET_ID', inputs.form_sheet_id.trim());
  props.setProperty('TAB_NAME', inputs.form_tab_name.trim());
  props.setProperty('TOPICS', inputs.form_topics);
  props.setProperty('RANGE', inputs.form_range);

  return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("✅ Settings Saved!"))
      .setNavigation(CardService.newNavigation().popCard())
      .build();
}

/**
 * ACTION: Handle "Analyze This Email"
 */
function handleScanClick(e) {
  var props = PropertiesService.getUserProperties();
  if (!props.getProperty('SHEET_ID')) {
     return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("⚠️ Error: Please set Google Sheet ID in Settings first."))
      .build();
  }

  var accessToken = e.messageMetadata.accessToken;
  var messageId = e.messageMetadata.messageId;
  GmailApp.setCurrentMessageAccessToken(accessToken);
  
  var message = GmailApp.getMessageById(messageId);
  var analysis = analyzeWithPerplexity(message.getPlainBody(), message.getSubject());

  return buildResultCard(message.getSubject(), message.getFrom(), message.getDate().toString(), analysis);
}

/**
 * UI: RESULT CARD
 */
function buildResultCard(subject, sender, date, analysis) {
  var card = CardService.newCardBuilder();
  var section = CardService.newCardSection();

  section.addWidget(CardService.newKeyValue().setTopLabel("Topic").setContent(analysis.subTopic));
  section.addWidget(CardService.newTextParagraph().setText("<b>Summary:</b><br>" + analysis.summary));
  
  if (analysis.link && analysis.link !== "N/A") {
    section.addWidget(CardService.newTextParagraph().setText("<b>Reference:</b><br>" + analysis.link));
  }

  var saveAction = CardService.newAction()
      .setFunctionName('saveToSheetAction')
      .setParameters({
        "date": date,
        "sender": sender,
        "subject": subject,
        "summary": analysis.summary,
        "subTopic": analysis.subTopic,
        "link": analysis.link
      });

  var saveBtn = CardService.newTextButton()
      .setText('Save to Database')
      .setOnClickAction(saveAction)
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED);

  section.addWidget(saveBtn);
  card.addSection(section);
  
  return card.build();
}

function saveToSheetAction(e) {
  var p = e.parameters;
  // This helper function now handles errors if ID is bad
  var result = saveRowToSheet(p.date, p.sender, p.subject, {summary: p.summary, subTopic: p.subTopic, link: p.link});
  
  if (result.success) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("✅ Saved to Sheets!"))
      .build();
  } else {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("❌ Error: " + result.error))
      .build();
  }
}

/**
 * HELPER: Save to Google Sheet (DYNAMIC ID)
 */
function saveRowToSheet(date, sender, subject, analysis) {
  var props = PropertiesService.getUserProperties();
  var sheetId = props.getProperty('SHEET_ID');
  var tabName = props.getProperty('TAB_NAME') || DEFAULT_TAB_NAME;

  if (!sheetId) {
    return { success: false, error: "No Sheet ID configured." };
  }
  
  try {
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName(tabName);
    
    if (!sheet) {
      // If tab doesn't exist, try to create it
      sheet = ss.insertSheet(tabName);
      sheet.appendRow(["Date", "Sender", "Subject", "Summary", "SubTopic", "Link"]);
    }
    
    sheet.appendRow([date, sender, subject, analysis.summary, analysis.subTopic, analysis.link]);
    return { success: true };

  } catch (e) {
    console.error("Sheet Error: " + e.toString());
    return { success: false, error: "Invalid Sheet ID or Permissions." };
  }
}

/**
 * ACTION: Handle "Batch Scan"
 */
function handleBatchScan(e) {
  var props = PropertiesService.getUserProperties();
  if (!props.getProperty('SHEET_ID')) {
     return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("⚠️ Please set Google Sheet ID first."))
      .build();
  }

  var topics = props.getProperty('TOPICS') || DEFAULT_TOPICS;
  var range = props.getProperty('RANGE') || DEFAULT_RANGE;

  var query = topics + ' newer_than:' + range + 'd is:unread';
  var threads = GmailApp.search(query);
  
  if (threads.length === 0) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("No unread emails found."))
      .build();
  }

  var limit = Math.min(threads.length, 5);
  var processedCount = 0;

  for (var i = 0; i < limit; i++) {
    var msg = threads[i].getMessages()[0];
    var analysis = analyzeWithPerplexity(msg.getPlainBody(), msg.getSubject());
    saveRowToSheet(msg.getDate(), msg.getFrom(), msg.getSubject(), analysis);
    threads[i].markRead();
    processedCount++;
  }

  return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("Processed " + processedCount + " emails."))
      .build();
}

/**
 * HELPER: Call Perplexity API (Fixed)
 */
function analyzeWithPerplexity(emailBody, emailSubject) {
  // 1. Clean up the input text
  var cleanBody = emailBody.substring(0, 3000)
    .replace(/(\r\n|\n|\r)/gm, " ") // Remove line breaks
    .replace(/"/g, "'");            // Remove double quotes
  
  var systemPrompt = "You are a Blockchain Security Analyst. Output valid JSON: {summary, subTopic, link}.";
  var userPrompt = "Analyze: " + emailSubject + " " + cleanBody;

  var url = "https://api.perplexity.ai/chat/completions";
  
  var payload = {
    "model": "sonar", 
    "messages": [
      { "role": "system", "content": systemPrompt },
      { "role": "user", "content": userPrompt }
    ],
    "temperature": 0.1
  };

  var options = {
    "method": "post",
    "headers": {
      "Authorization": "Bearer " + (PropertiesService.getUserProperties().getProperty('API_KEY') || DEFAULT_API_KEY),
      "Content-Type": "application/json"
    },
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var responseText = response.getContentText(); // Get RAW text first
    
    // --- FIX IS HERE: Simple check for HTML errors ---
    // If the first character is "<", it's an HTML error page, not JSON.
    if (responseText.charAt(0) === "<") {
      return { "summary": "Connection Error (HTML)", "subTopic": "Error", "link": "Check API Key" };
    }

    // Now it is safe to parse
    var json = JSON.parse(responseText);
    
    // Check if API returned a logical error
    if (json.error) {
      return { "summary": "API Error: " + json.error.message, "subTopic": "Error", "link": "N/A" };
    }
    
    // Extract the answer
    var content = json.choices[0].message.content;
    
    // Clean up any Markdown formatting (```json ... ```)
    var cleanJson = content.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(cleanJson);
    
  } catch (e) {
    console.error("Analysis Failed: " + e.toString());
    return { "summary": "Script Error: " + e.toString(), "subTopic": "Error", "link": "N/A" };
  }
}

/**
 * AUTOMATION: Background Function
 */
function runAutomaticScan() {
  var props = PropertiesService.getUserProperties();
  if (!props.getProperty('SHEET_ID')) return; // Stop if no sheet linked

  var topics = props.getProperty('TOPICS') || DEFAULT_TOPICS;
  var range = props.getProperty('RANGE') || DEFAULT_RANGE;
  
  var query = topics + ' newer_than:' + range + 'd is:unread';
  var threads = GmailApp.search(query);
  
  if (threads.length === 0) return;
  
  var limit = Math.min(threads.length, 10);
  
  for (var i = 0; i < limit; i++) {
    try {
      var msg = threads[i].getMessages()[0];
      var analysis = analyzeWithPerplexity(msg.getPlainBody(), msg.getSubject());
      saveRowToSheet(msg.getDate(), msg.getFrom(), msg.getSubject(), analysis);
      threads[i].markRead();
      Utilities.sleep(1000); 
    } catch (e) {
      console.error("Auto-scan failed for: " + threads[i].getFirstMessageSubject());
    }
  }
}