// No Firebase imports needed for core app.js functionality with custom backend
// All Firebase-related imports have been removed.
// --- THREE.JS SETUP ---
// Three.js is disabled to avoid loading issues. The app runs without 3D rendering.
function initThreeJS() {
    // No-op: Three.js initialization removed
}

// --- CONFIGURATION AND GLOBAL STATE ---
// Backend API configuration from window.ENV (see config.js)
const API_BASE_URL = `${window.ENV.BACKEND_API}/api`;
const appState = {
    userId: null,
    transactions: [],
    goals: [],
    obligations: [],

    isLoading: true,
    isSaving: false, // State for the transaction button
    isAnalyzing: false,

    // Form States
    amount: '',
    description: '',
    category: 'Uncategorized',
    type: 'expense',
    isBusiness: false,
    gstAmount: '',

    // Feature States
    isShared: false,
    currentLanguage: localStorage.getItem('currentLanguage') || 'en',
    alert: { message: '', type: '' },
    // Pagination/Visibility State
    visibleTransactionsCount: 5,
    visibleGoalsCount: 3,
    visibleObligationsCount: 3,
    visibleBudgetsCount: 3,
    authView: 'login', // 'login' or 'create'
    currentMainView: localStorage.getItem('currentMainView') || 'dashboard', // 'dashboard', 'profile', 'admin', 'groups', or 'splits'

    // Groups state
    groups: [],
    groupBalances: {},
    currentGroupMembers: [], // Store current group members for shared dashboard
    selectedGroupId: null, // For the groups management view


    // Budgets state
    budgets: [],

    activeCurrency: 'INR',
    // Email preferences
    emailAlertsEnabled: true,

    // Authentication state
    token: localStorage.getItem('authToken') || null,

    // Chatbot State
    isChatOpen: false,
    isChatThinking: false,
    // Chatbot State
    isChatOpen: false,
    isChatThinking: false,
    chatHistory: [{ role: 'model', text: 'WELCOME_MESSAGE' }],

    // Family Mode State
    currentGroupId: null, // The active group for shared mode
    geminiApiKey: null, // To store the fetched Gemini API key
    showBudgetSuggestionPrompt: false,
};

// DOM Element references
const D = {
    mainContent: document.getElementById('main-content'),
    appTitle: document.getElementById('app-title'),
    ledgerTitle: document.getElementById('ledger-title'),
    userIdDisplay: document.getElementById('user-id-display'),
    languageSelector: document.getElementById('language-selector'),
    alertContainer: document.getElementById('alert-container'),
    onboardingContainer: document.getElementById('onboarding-container'),
    logoutBtn: document.getElementById('logout-btn'),
    headerDetails: document.getElementById('header-details'),
    fabContainer: document.getElementById('fab-container'),
    chatWindowContainer: document.getElementById('chat-window-container'),
};

// --- ADMIN CONFIGURATION ---
// Check if current user is admin
// Check if current user is admin
const isAdmin = () => {
    return appState.isAdmin;
};

// --- TRANSLATION DATA (Multi-Language Support) ---
const translations = {
    en: {
        APP_TITLE: "Gamyartha 🚀", LEDGER_TITLE_PRIVATE: "My Private Ledger", LEDGER_TITLE_SHARED: "Shared Community Ledger", TOGGLE_MODE: "Ledger Privacy:", MODE_SHARED: "Community", MODE_PRIVATE: "Private", TOTAL_INCOME: "Total Income", TOTAL_EXPENSE: "Total Expense", NET_BALANCE: "Net Balance", SMART_ENTRY_TITLE: "Smart Entry (AI Powered)", DESCRIPTION_LABEL: "Description (Paste SMS/Note Here)", DESCRIPTION_PLACEHOLDER: "e.g., Paid Rs 550 for electricity bill", AI_ANALYZE_BUTTON: "AI Analyze", THINKING_BUTTON: "Thinking...", CATEGORY_LABEL: "Category", AMOUNT_LABEL: "Amount (₹)", AMOUNT_PLACEHOLDER: "e.g., 550", RECORD_DEBIT: "Record Debit", RECORD_CREDIT: "Record Credit", SAVING_BUTTON: "Saving...", HISTORY_TITLE: "Transaction History", NO_ENTRIES: "No entries in the ledger yet. Start tracking!", EXPENSE: "Expense", INCOME: "Income", GOALS_TITLE: "Savings Goals", OBLIGATIONS_TITLE: "Due Date Alerts", BUSINESS_RELATED: "Business Related?", GST_AMOUNT: "GST Amount (₹)", DUE_DATE: "Due Date", ADD_OBLIGATION: "Add Due Payment", DUE_IN_7_DAYS: "Due in 7 days!", NO_OBLIGATIONS: "No current due payments.", ADD_NEW_GOAL: "Add New Goal", GOAL_NAME: "Goal Name", GOAL_TARGET: "Target Amount (₹)", GOAL_DATE: "Target Date", REQUIRED_DAILY: "Req. Daily Savings", ADD_GOAL_BUTTON: "Add Goal", LANGUAGE: "Language", EXPORT_TAX: "Export Business Ledger (CSV)", VOICE_ENTRY: "Voice Entry", MARK_PAID: "Mark as Paid", SAVE_GOAL_BUTTON: "Save Goal", GOAL_COMPLETED: "Goal Reached!", GOAL_PROGRESS_ALERT: "Goal Progress: Saved %s towards %s.", DUE_TODAY_ALERT: "Due Today: %s payment is due!", LOGIN_TITLE: "Welcome to Gamyartha", CREATE_TITLE: "Create Your Account", LOGIN_BUTTON: "Log In", CREATE_BUTTON: "Sign Up", ALREADY_ACCOUNT: "Already have an account? Log In", NEED_ACCOUNT: "Don't have an account? Sign Up", EMAIL_PLACEHOLDER: "Email Address", PASSWORD_PLACEHOLDER: "Password", LOGOUT: "Logout", FORGOT_PASSWORD_LINK: "Forgot Password?", PASSWORD_RESET_SUCCESS: "If an account exists, a password reset link has been sent to %s.", CHAT_TITLE: "Gamyartha Advisor", CHAT_PLACEHOLDER: "Ask a financial question...", SEND: "Send", WELCOME_MESSAGE: "Hello! I'm Gamyartha Advisor. Ask me anything about budgeting, savings goals, or general finance!", GO_TO_PROFILE: "My Profile", GO_TO_DASHBOARD: "Dashboard", GO_TO_ADMIN: "Admin Panel", PROFILE_TITLE: "User Profile", USER_EMAIL: "Email", USER_ID_FULL: "User ID (UID)", ACCOUNT_TYPE: "Account Type", ACCOUNT_PERMANENT: "Permanent (Email/Password)", ACCOUNT_ANONYMOUS: "Anonymous (Local)", CHANGE_PASSWORD: "Change Password", NEW_PASSWORD_PLACEHOLDER: "New Password (min 6 chars)", AUTH_LOGOUT_PROMPT: "Security requirement: Please logout and login again to change password.", budgets_title: "Budgets", budget: "Budget", spent: "Spent", remaining: "Remaining", add_new_budget: "Add New Budget", budget_category: "Category", budget_amount: "Budget Amount (₹)", add_budget_button: "Add Budget", FIRESTORE_BAD_REQUEST: "Write failed: Check Firebase security rules (status 400).",
        SUMMARY_SHARED_SUBTITLE: "Managing finances together",
        SUMMARY_PRIVATE_SUBTITLE: "Here is your financial overview",
        FAMILY_HEADER_TITLE: "Family Ledger",
        FAMILY_HEADER_SUBTITLE: "Select a group or create a new one to start.",
        CREATE_FAMILY_GROUP: "Create Family Group",
        PAGES_PRIVACY_TITLE: "Privacy Policy",

        // Footer & Misc
        FOOTER_TAGLINE: "Navigate Your Wealth with Intelligence",
        FOOTER_ABOUT: "About Us",
        FOOTER_SUPPORT: "Support",
        INVITE_MODAL_TITLE: "Invite Members",
        INVITE_MODAL_SUBTITLE: "Share this link to add members to the group.",
        COPY_LINK: "Copy Link",
        COPIED: "Copied!",
        FAMILY_BTN_SWITCH_PRIVATE: "Switch to Private",
        FAMILY_BTN_FAMILY_GROUPS: "Family & Groups",
        FAMILY_BTN_PRIVATE: "Private",
        FAMILY_BTN_FAMILY: "Family",
        NOTIFICATIONS_TITLE: "Notifications",
        MARK_ALL_READ: "Mark all read",
        LOADING: "Loading...",
        NET_WORTH_BTN: "Net Worth & Assets",
        CALENDAR_BTN: "Financial Calendar",
        MANAGE_GROUPS: "Manage Groups",
        DELETE_ACCOUNT_TITLE: "Delete Account",
        DELETE_ACCOUNT_WARNING: "Once you delete your account, there is no going back. Please be certain.",
        DELETE_ACCOUNT_BUTTON: "Delete Account Permanently",
        DELETE_CONFIRM_TEXT: "Are you ABSOLUTELY SURE you want to delete your account? This action cannot be undone and will delete all your data.",
        DELETE_CONFIRM_EMAIL: "To confirm, please type your email address:",
        ACCOUNT_DELETED: "Your account has been deleted. We are sorry to see you go.",
        CURRENCY_PREFERENCE_TITLE: "Currency Preference",
        DISPLAY_CURRENCY_LABEL: "Display Currency",
        EMAIL_ALERTS_TITLE: "Email Alerts",
        ENABLE_EMAIL_NOTIFICATIONS: "Enable Email Notifications",
        EMAIL_NOTIFICATIONS_DESC: "Receive alerts for due dates, goal completions, and transactions",
        EMAIL_ALERTS_STATUS: "Email alerts",
        ENABLED: "enabled",
        DISABLED: "disabled",
        PASSWORD_VALIDATION_ERROR: "Password must be at least 6 characters long.",
        CURRENCY_UPDATED: "Currency updated to %s",
        FAILED_UPDATE_CURRENCY: "Failed to update currency preference.",
        PROFILE_TAB_DETAILS: "Details",
        PROFILE_TAB_GROUPS: "Groups",
        PROFILE_TAB_SUBSCRIPTIONS: "Subscriptions",
        PROFILE_TAB_BADGES: "Badges",
        PROFILE_TAB_TIMETRAVEL: "Time Travel",
        PROFILE_TAB_CHALLENGES: "Challenges",
        GROUPS_TITLE: "Groups",
        GROUPS_CREATE_GROUP: "New Group",
        GROUPS_ADD_EXPENSE: "Add Expense",
        GROUPS_SETTLE_UP: "Settle Up",
        GROUPS_OVERALL_BALANCE: "Overall Balance",
        GROUPS_YOU_OWE: "You owe",
        GROUPS_YOU_ARE_OWED: "You are owed",
        GROUPS_NO_GROUPS: "No groups yet.",
        GROUPS_CREATE_FIRST: "Create your first group to start splitting bills!",
        GROUPS_MEMBER: "member",
        GROUPS_MEMBERS: "members",
        GROUPS_PAID_BY: "paid by",
        GROUPS_NO_EXPENSES: "No expenses recorded in this group yet.",
        GROUPS_SETTLED_UP: "Settled Up",
        GAMIFICATION_LOADING: "Loading badges...",
        GAMIFICATION_NO_BADGES: "No Badges Yet",
        GAMIFICATION_START_EARNING: "Start using the app to earn achievements!",
        GAMIFICATION_LOCKED: "Locked",
        GAMIFICATION_EARNED: "Earned",
        GAMIFICATION_YOUR_ACHIEVEMENTS: "Your Achievements",
        GAMIFICATION_LEVEL_UP: "Level up your financial fitness!",
        GAMIFICATION_EARNED_BADGES: "Earned Badges",
        GAMIFICATION_NEXT_CHALLENGES: "Next Challenges",
        GAMIFICATION_NO_EARNED_YET: "You haven't earned any badges yet. Keep going!",
    },
    hi: {
        APP_TITLE: "गम्यार्थ 🚀", LEDGER_TITLE_PRIVATE: "मेरा निजी खाता", LEDGER_TITLE_SHARED: "साझा सामुदायिक खाता", TOGGLE_MODE: "खाता मोड बदलें:", MODE_SHARED: "साझा", MODE_PRIVATE: "निजी", TOTAL_INCOME: "कुल आय", TOTAL_EXPENSE: "कुल खर्च", NET_BALANCE: "शुद्ध शेष", SMART_ENTRY_TITLE: "स्मार्ट एंट्री (एआई संचालित)", DESCRIPTION_LABEL: "विवरण (एसएमएस/नोट पेस्ट करें)", DESCRIPTION_PLACEHOLDER: "उदाहरण: बिजली बिल के लिए ₹550 दिए", AI_ANALYZE_BUTTON: "एआई विश्लेषण", THINKING_BUTTON: "सोच रहा है...", CATEGORY_LABEL: "श्रेणी", AMOUNT_LABEL: "राशि (₹)", AMOUNT_PLACEHOLDER: "उदाहरण: 550", RECORD_DEBIT: "खर्च रिकॉर्ड करें", RECORD_CREDIT: "आय रिकॉर्ड करें", SAVING_BUTTON: "सहेजा जा रहा है...", HISTORY_TITLE: "लेन-देन इतिहास", NO_ENTRIES: "अभी तक खाते में कोई प्रविष्टि नहीं है। ट्रैकिंग शुरू करें!", EXPENSE: "खर्च", INCOME: "आय", GOALS_TITLE: "बचत लक्ष्य", OBLIGATIONS_TITLE: "देय तिथि अलर्ट", BUSINESS_RELATED: "व्यवसाय से संबंधित?", GST_AMOUNT: "जीएसटी राशि (₹)", DUE_DATE: "देय तिथि", ADD_OBLIGATION: "देय भुगतान जोड़ें", DUE_IN_7_DAYS: "7 दिनों में देय!", NO_OBLIGATIONS: "कोई वर्तमान देय भुगतान नहीं।", ADD_NEW_GOAL: "नया लक्ष्य जोड़ें", GOAL_NAME: "लक्ष्य का नाम", GOAL_TARGET: "लक्ष्य राशि (₹)", GOAL_DATE: "लक्ष्य तिथि", REQUIRED_DAILY: "आवश्यक दैनिक बचत", ADD_GOAL_BUTTON: "लक्ष्य जोड़ें", LANGUAGE: "भाषा", EXPORT_TAX: "व्यवसाय खाता निर्यात करें (CSV)", VOICE_ENTRY: "वॉयस एंट्री", MARK_PAID: "भुगतान हो गया", SAVE_GOAL_BUTTON: "लक्ष्य सहेजें", GOAL_COMPLETED: "लक्ष्य पूरा!", GOAL_PROGRESS_ALERT: "लक्ष्य प्रगति: %s की ओर %s बचाया गया।", DUE_TODAY_ALERT: "आज देय: %s का भुगतान आज देय है!", LOGIN_TITLE: "गम्यार्थ में आपका स्वागत है", CREATE_TITLE: "अपना खाता बनाएँ", LOGIN_BUTTON: "लॉग इन करें", CREATE_BUTTON: "साइन अप करें", ALREADY_ACCOUNT: "पहले से ही खाता है? लॉग इन करें", NEED_ACCOUNT: "खाता नहीं है? साइन अप करें", EMAIL_PLACEHOLDER: "ईमेल पता", PASSWORD_PLACEHOLDER: "पास् वर्ड", LOGOUT: "लॉग आउट", FORGOT_PASSWORD_LINK: "पासवर्ड भूल गए?", PASSWORD_RESET_SUCCESS: "यदि कोई खाता मौजूद है, तो %s पर एक पासवर्ड रीसेट लिंक भेजा गया है।", CHAT_TITLE: "गम्यार्थ सलाहकार", CHAT_PLACEHOLDER: "एक वित्तीय प्रश्न पूछें...", SEND: "भेजें", WELCOME_MESSAGE: "नमस्ते! मैं गम्यार्थ सलाहकार हूँ। बजट, बचत लक्ष्यों या सामान्य वित्त के बारे में कुछ भी पूछें!", GO_TO_PROFILE: "मेरी प्रोफ़ाइल", GO_TO_DASHBOARD: "डैशबोर्ड", PROFILE_TITLE: "उपयोगकर्ता प्रोफ़ाइल", USER_EMAIL: "ईमेल", USER_ID_FULL: "उपयोगकर्ता आईडी (UID)", ACCOUNT_TYPE: "खाता प्रकार", ACCOUNT_PERMANENT: "स्थायी (ईमेल/पासवर्ड)", ACCOUNT_ANONYMOUS: "गुमनाम (स्थानीय)", CHANGE_PASSWORD: "पासवर्ड बदलें", NEW_PASSWORD_PLACEHOLDER: "नया पासवर्ड डालें (न्यूनतम 6 अक्षर)", AUTH_LOGOUT_PROMPT: "सुरक्षा आवश्यकता: पासवर्ड बदलने से पहले अपनी पहचान सत्यापित करने के लिए कृपया लॉग आउट करें और वापस लॉग इन करें।", FIRESTORE_BAD_REQUEST: "लिखना विफल: अपनी Firebase सुरक्षा नियम जांचें (स्टेटस 400)。",
        SUMMARY_SHARED_SUBTITLE: "एक साथ वित्त प्रबंधन",
        SUMMARY_PRIVATE_SUBTITLE: "यहाँ आपका वित्तीय अवलोकन है",
        FAMILY_HEADER_TITLE: "पारिवारिक खाता",
        FAMILY_HEADER_SUBTITLE: "शुरू करने के लिए एक समूह चुनें या एक नया बनाएं।",
        CREATE_FAMILY_GROUP: "पारिवारिक समूह बनाएं",
        DASHBOARD_SUFFIX: "डैशबोर्ड",
        SHARED_FAMILY_LEDGER: "साझा पारिवारिक खाता",
        MEMBERS_COUNT: "सदस्य",
        INVITE_BUTTON: "आमंत्रित करें",
        INVITE_MODAL_TITLE: "सदस्यों को आमंत्रित करें",
        INVITE_MODAL_SUBTITLE: "समूह में सदस्यों को जोड़ने के लिए यह लिंक साझा करें।",
        COPY_LINK: "लिंक कॉपी करें",
        COPIED: "कॉपी किया गया!",
        FAMILY_BTN_SWITCH_PRIVATE: "निजी मोड में जाएं",
        FAMILY_BTN_FAMILY_GROUPS: "परिवार और समूह",
        FAMILY_BTN_PRIVATE: "निजी",
        FAMILY_BTN_FAMILY: "परिवार",
        NOTIFICATIONS_TITLE: "सूचनाएं",
        MARK_ALL_READ: "सभी पढ़ी हुई चिह्नित करें",
        LOADING: "लोड हो रहा है...",
        NET_WORTH_BTN: "नेट वर्थ और संपत्ति",
        CALENDAR_BTN: "वित्तीय कैलेंडर",
        MANAGE_GROUPS: "समूह प्रबंधित करें",
        DELETE_ACCOUNT_TITLE: "खाता हटाएं",
        DELETE_ACCOUNT_WARNING: "एक बार जब आप अपना खाता हटा देते हैं, तो वापस नहीं जा सकते। कृपया सुनिश्चित हों।",
        DELETE_ACCOUNT_BUTTON: "खाता स्थायी रूप से हटाएं",
        DELETE_CONFIRM_TEXT: "क्या आप वाकई अपना खाता हटाना चाहते हैं? यह कार्रवाई पूर्ववत नहीं की जा सकती और आपका सारा डेटा हटा दिया जाएगा।",
        DELETE_CONFIRM_EMAIL: "पुष्टि करने के लिए, कृपया अपना ईमेल पता टाइप करें:",
        ACCOUNT_DELETED: "आपका खाता हटा दिया गया है। हमें आपको जाते हुए देखकर खेद है।",
        CURRENCY_PREFERENCE_TITLE: "मुद्रा वरीयता",
        DISPLAY_CURRENCY_LABEL: "प्रदर्शन मुद्रा",
        EMAIL_ALERTS_TITLE: "ईमेल अलर्ट",
        ENABLE_EMAIL_NOTIFICATIONS: "ईमेल सूचनाएं सक्षम करें",
        EMAIL_NOTIFICATIONS_DESC: "देय तिथियों, लक्ष्य पूर्णता और लेनदेन के लिए अलर्ट प्राप्त करें",
        EMAIL_ALERTS_STATUS: "ईमेल अलर्ट",
        ENABLED: "सक्षम",
        DISABLED: "अक्षम",
        PASSWORD_VALIDATION_ERROR: "पासवर्ड कम से कम 6 अक्षर लंबा होना चाहिए।",
        CURRENCY_UPDATED: "मुद्रा %s में अपडेट की गई",
        FAILED_UPDATE_CURRENCY: "मुद्रा वरीयता अपडेट करने में विफल।",
        PROFILE_TAB_DETAILS: "विवरण",
        PROFILE_TAB_GROUPS: "समूह",
        PROFILE_TAB_SUBSCRIPTIONS: "सदस्यताएं",
        PROFILE_TAB_BADGES: "बैज",
        PROFILE_TAB_TIMETRAVEL: "टाइम ट्रैवल",
        PROFILE_TAB_CHALLENGES: "चुनौतियां",
        GROUPS_TITLE: "समूह",
        GROUPS_CREATE_GROUP: "नया समूह",
        GROUPS_ADD_EXPENSE: "खर्च जोड़ें",
        GROUPS_SETTLE_UP: "हिसाब चुकता",
        GROUPS_OVERALL_BALANCE: "कुल शेष",
        GROUPS_YOU_OWE: "आप पर बकाया है",
        GROUPS_YOU_ARE_OWED: "आपको मिलना है",
        GROUPS_NO_GROUPS: "अभी तक कोई समूह नहीं।",
        GROUPS_CREATE_FIRST: "बिल बांटने के लिए अपना पहला समूह बनाएं!",
        GROUPS_MEMBER: "सदस्य",
        GROUPS_MEMBERS: "सदस्य",
        GROUPS_PAID_BY: "द्वारा भुगतान",
        GROUPS_NO_EXPENSES: "इस समूह में अभी तक कोई खर्च दर्ज नहीं है।",
        GROUPS_SETTLED_UP: "हिसाब बराबर",
        GAMIFICATION_LOADING: "बैज लोड हो रहे हैं...",
        GAMIFICATION_NO_BADGES: "कोई बैज नहीं",
        GAMIFICATION_START_EARNING: "उपलब्धियां अर्जित करने के लिए ऐप का उपयोग शुरू करें!",
        GAMIFICATION_LOCKED: "बंद",
        GAMIFICATION_EARNED: "अर्जित",
        GAMIFICATION_YOUR_ACHIEVEMENTS: "आपकी उपलब्धियां",
        GAMIFICATION_LEVEL_UP: "अपनी वित्तीय फिटनेस का स्तर बढ़ाएं!",
        GAMIFICATION_EARNED_BADGES: "अर्जित बैज",
        GAMIFICATION_NEXT_CHALLENGES: "अगली चुनौतियां",
        GAMIFICATION_NO_EARNED_YET: "आपने अभी तक कोई बैज अर्जित नहीं किया है। चलते रहो!",
    },
    te: {
        APP_TITLE: "గమ్యార్థ 🚀", LEDGER_TITLE_PRIVATE: "నా వ్యక్తిగత ఖాతా", LEDGER_TITLE_SHARED: "భాగస్వామ్య కమ్యూనిటీ ఖాతా", TOGGLE_MODE: "ఖాతా మోడ్ టోగుల్ చేయండి:", MODE_SHARED: "భాగస్వామ్యం", MODE_PRIVATE: "వ్యక్తిగత", TOTAL_INCOME: "మొత్తం ఆదాయం", TOTAL_EXPENSE: "మొత్తం ఖర్చు", NET_BALANCE: "నికర నిల్వ", SMART_ENTRY_TITLE: "స్మార్ట్ ఎంట్రీ (AI పవర్డ్)", DESCRIPTION_LABEL: "వివరణ (SMS/గమనికను ఇక్కడ అతికించండి)", DESCRIPTION_PLACEHOLDER: "ఉదాహరణ: విద్యుత్ బిల్లుకు ₹550 చెల్లించారు", AI_ANALYZE_BUTTON: "AI విశ్లేషించు", THINKING_BUTTON: "ఆలోచిస్తోంది...", CATEGORY_LABEL: "వర్గం", AMOUNT_LABEL: "మొత్తం (₹)", AMOUNT_PLACEHOLDER: "ఉదాహరణ: 550", RECORD_DEBIT: "డెబిట్ రికార్డ్ చేయండి", RECORD_CREDIT: "క్రెడిట్ రికార్డ్ చేయండి", SAVING_BUTTON: "సేవింగ్...", HISTORY_TITLE: "లావాదేవీ చరిత్ర", NO_ENTRIES: "ఖాతాలో ఇంకా ఎంట్రీలు లేవు. ట్రాకింగ్ ప్రారంభించండి!", EXPENSE: "ఖర్చు", INCOME: "ఆదాయం", GOALS_TITLE: "పొదుపు లక్ష్యాలు", OBLIGATIONS_TITLE: "గడువు తేదీ హెచ్చరికలు", BUSINESS_RELATED: "వ్యాపార సంబంధితమా?", GST_AMOUNT: "GST మొత్తం (₹)", DUE_DATE: "గడువు తేదీ", ADD_OBLIGATION: "గడువు చెల్లింపును జోడించండి", DUE_IN_7_DAYS: "7 రోజులలో గడువు!", NO_OBLIGATIONS: "ప్రస్తుతం చెల్లించాల్సినవి లేవు.", ADD_NEW_GOAL: "కొత్త లక్ష్యాన్ని జోడించండి", GOAL_NAME: "లక్ష్యం పేరు", GOAL_TARGET: "లక్ష్య మొత్తం (₹)", GOAL_DATE: "లక్ష్యం తేదీ", REQUIRED_DAILY: "అవసరమైన రోజువారీ పొదుపు", ADD_GOAL_BUTTON: "లక్ష్యాన్ని జోడించండి", LANGUAGE: "భాష", EXPORT_TAX: "వ్యాపార ఖాతాను ఎగుమతి చేయండి (CSV)", VOICE_ENTRY: "వాయిస్ ఎంట్రీ", MARK_PAID: "చెల్లించారు అని గుర్తు పెట్టండి", SAVE_GOAL_BUTTON: "లక్ష్యాన్ని సేవ్ చేయండి", GOAL_COMPLETED: "లక్ష్యం చేరుకుంది!", GOAL_PROGRESS_ALERT: "లక్ష్య పురోగతి: %s లక్ష్యం కోసం %s ఆదా చేయబడింది.", DUE_TODAY_ALERT: "ఈ రోజు గడువు: %s చెల్లింపు ఈ రోజు గడువు!", LOGIN_TITLE: "గమ్యార్థకి స్వాగతం", CREATE_TITLE: "మీ ఖాతాను సృష్టించండి", LOGIN_BUTTON: "లాగిన్ చేయండి", CREATE_BUTTON: "సైన్ అప్ చేయండి", ALREADY_ACCOUNT: "ఇప్పటికే ఖాతా ఉందా? లాగిన్ చేయండి", NEED_ACCOUNT: "ఖాతా లేదా? సైన్ అప్ చేయండి", EMAIL_PLACEHOLDER: "ఇమెయిల్ చిరునామా", PASSWORD_PLACEHOLDER: "పాస్‌వర్డ్", LOGOUT: "లాగ్ అవుట్", FORGOT_PASSWORD_LINK: "పాస్వర్డ్ మర్చిపోయారా?", PASSWORD_RESET_SUCCESS: "ఒక ఖాతా ఉంటే, %s కు పాస్వర్డ్ రీసెట్ లింక్ పంపబడింది.", CHAT_TITLE: "గమ్యార్థ సలహాదారు", CHAT_PLACEHOLDER: "ఒక ఆర్థిక ప్రశ్న అడగండి...", SEND: "పంపు", WELCOME_MESSAGE: "నమస్కారం! నేను గమ్యార్థ సలహాదారుని. బడ్జెటింగ్, పొదుపు లక్ష్యాలు లేదా సాధారణ ఆర్థిక విషయాల గురించి ఏదైనా అడగండి!", GO_TO_PROFILE: "నా ప్రొఫైల్", GO_TO_D్యాష్‌బోర్డ్: "డాష్‌బోర్డ్", PROFILE_TITLE: "వినియోగదారు ప్రొఫైల్", USER_EMAIL: "ఇమెయిల్", USER_ID_FULL: "వినియోగదారు ID (UID)", ACCOUNT_TYPE: "ఖాతా రకం", ACCOUNT_PERMANENT: "శాశ్వత (ఇమెయిల్/పాస్‌వర్డ్)", ACCOUNT_ANONYMOUS: "అనామక (స్థానిక)", CHANGE_PASSWORD: "పాస్వర్డ్ మార్చండి", NEW_PASSWORD_PLACEHOLDER: "కొత్త పాస్‌వర్డ్ నమోదు చేయండి (కనీసం 6 అక్షరాలు)", AUTH_LOGOUT_PROMPT: "భద్రతా అవసరం: దయచేసి పాస్‌వర్డ్‌ను మార్చడానికి ముందు మీ గుర్తింపును ధృవీకరించడానికి లాగ్ అవుట్ చేసి మళ్లీ లాగిన్ అవ్వండి。", FIRESTORE_BAD_REQUEST: "రాయడం విఫలమైంది: మీ Firebase భద్రతా నియమాలను తనిఖీ చేయండి (స్థితి 400).",
        SUMMARY_SHARED_SUBTITLE: "ఆర్థిక వ్యవహారాలను కలిసి నిర్వహించడం",
        SUMMARY_PRIVATE_SUBTITLE: "మీ ఆర్థిక అవలోకనం ఇక్కడ ఉంది",
        FAMILY_HEADER_TITLE: "కుటుంబ ఖాతా",
        FAMILY_HEADER_SUBTITLE: "ప్రారంభించడానికి ఒక సమూహాన్ని ఎంచుకోండి లేదా కొత్తదాన్ని సృష్టించండి.",
        CREATE_FAMILY_GROUP: "కుటుంబ సమూహాన్ని సృష్టించండి",
        DASHBOARD_SUFFIX: "డాష్‌బోర్డ్",
        SHARED_FAMILY_LEDGER: "భాగస్వామ్య కుటుంబ ఖాతా",
        MEMBERS_COUNT: "సభ్యులు",
        INVITE_BUTTON: "ఆహ్వానించండి",
        INVITE_MODAL_TITLE: "సభ్యులను ఆహ్వానించండి",
        INVITE_MODAL_SUBTITLE: "సమూహానికి సభ్యులను జోడించడానికి ఈ లింక్‌ను భాగస్వామ్యం చేయండి.",
        COPY_LINK: "లింక్ కాపీ చేయండి",
        COPIED: "కాపీ చేయబడింది!",
        FAMILY_BTN_SWITCH_PRIVATE: "వ్యక్తిగత మోడ్‌కు మారండి",
        FAMILY_BTN_FAMILY_GROUPS: "కుటుంబం & సమూహాలు",
        FAMILY_BTN_PRIVATE: "వ్యక్తిగత",
        FAMILY_BTN_FAMILY: "కుటుంబం",
        NOTIFICATIONS_TITLE: "నోటిఫికేషన్లు",
        MARK_ALL_READ: "అన్నీ చదివినట్లు గుర్తు పెట్టండి",
        LOADING: "లోడ్ అవుతోంది...",
        NET_WORTH_BTN: "నికర విలువ & ఆస్తులు",
        CALENDAR_BTN: "ఆర్థిక క్యాలెండర్",
        MANAGE_GROUPS: "సమూహాలను నిర్వహించండి",
        DELETE_ACCOUNT_TITLE: "ఖాతాను తొలగించండి",
        DELETE_ACCOUNT_WARNING: "మీరు మీ ఖాతాను తొలగించిన తర్వాత, తిరిగి పొందలేరు. దయచేసి నిర్ధారించుకోండి.",
        DELETE_ACCOUNT_BUTTON: "ఖాతాను శాశ్వతంగా తొలగించండి",
        DELETE_CONFIRM_TEXT: "మీరు ఖచ్చితంగా మీ ఖాతాను తొలగించాలనుకుంటున్నారా? ఈ చర్య రద్దు చేయబడదు మరియు మీ డేటా మొత్తం తొలగించబడుతుంది.",
        DELETE_CONFIRM_EMAIL: "నిర్ధారించడానికి, దయచేసి మీ ఇమెయిల్ చిరునామాను టైప్ చేయండి:",
        ACCOUNT_DELETED: "మీ ఖాతా తొలగించబడింది. మీరు వెళ్లిపోతుంటే మాకు విచారంగా ఉంది.",
        CURRENCY_PREFERENCE_TITLE: "కరెన్సీ ప్రాధాన్యత",
        DISPLAY_CURRENCY_LABEL: "కరెన్సీని ప్రదర్శించు",
        EMAIL_ALERTS_TITLE: "ఇమెయిల్ అలర్ట్స్",
        ENABLE_EMAIL_NOTIFICATIONS: "ఇమెయిల్ నోటిఫికేషన్లను ప్రారంభించండి",
        EMAIL_NOTIFICATIONS_DESC: "గడువు తేదీలు, లక్ష్య పూర్తి మరియు లావాదేవీల కోసం అలర్ట్స్ పొందండి",
        EMAIL_ALERTS_STATUS: "ఇమెయిల్ అలర్ట్స్",
        ENABLED: "ప్రారంభించబడింది",
        DISABLED: "నిలిపివేయబడింది",
        PASSWORD_VALIDATION_ERROR: "పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి.",
        CURRENCY_UPDATED: "కరెన్సీ %s కు నవీకరించబడింది",
        FAILED_UPDATE_CURRENCY: "కరెన్సీ ప్రాధాన్యతను నవీకరించడంలో విఫలమైంది.",
        PROFILE_TAB_DETAILS: "వివరాలు",
        PROFILE_TAB_GROUPS: "సమూహాలు",
        PROFILE_TAB_SUBSCRIPTIONS: "చందాలు",
        PROFILE_TAB_BADGES: "బ్యాడ్జ్‌లు",
        PROFILE_TAB_TIMETRAVEL: "టైమ్ ట్రావెల్",
        PROFILE_TAB_CHALLENGES: "సవాళ్లు",
        GROUPS_TITLE: "సమూహాలు",
        GROUPS_CREATE_GROUP: "కొత్త సమూహం",
        GROUPS_ADD_EXPENSE: "ఖర్చును జోడించండి",
        GROUPS_SETTLE_UP: "సెటిల్ చేయండి",
        GROUPS_OVERALL_BALANCE: "మొత్తం నిల్వ",
        GROUPS_YOU_OWE: "మీరు బాకీ ఉన్నారు",
        GROUPS_YOU_ARE_OWED: "మీకు రావాలి",
        GROUPS_NO_GROUPS: "ఇంకా సమూహాలు లేవు.",
        GROUPS_CREATE_FIRST: "బిల్లులను పంచుకోవడానికి మీ మొదటి సమూహాన్ని సృష్టించండి!",
        GROUPS_MEMBER: "సభ్యుడు",
        GROUPS_MEMBERS: "సభ్యులు",
        GROUPS_PAID_BY: "చెల్లించినవారు",
        GROUPS_NO_EXPENSES: "ఈ సమూహంలో ఇంకా ఖర్చులు నమోదు కాలేదు.",
        GROUPS_SETTLED_UP: "సెటిల్ అయింది",
        GAMIFICATION_LOADING: "బ్యాడ్జ్‌లు లోడ్ అవుతున్నాయి...",
        GAMIFICATION_NO_BADGES: "ఇంకా బ్యాడ్జ్‌లు లేవు",
        GAMIFICATION_START_EARNING: "విజయాలు సాధించడానికి యాప్‌ని ఉపయోగించడం ప్రారంభించండి!",
        GAMIFICATION_LOCKED: "లాక్ చేయబడింది",
        GAMIFICATION_EARNED: "సంపాదించారు",
        GAMIFICATION_YOUR_ACHIEVEMENTS: "మీ విజయాలు",
        GAMIFICATION_LEVEL_UP: "మీ ఆర్థిక ఫిట్‌నెస్‌ను పెంచుకోండి!",
        GAMIFICATION_EARNED_BADGES: "సంపాదించిన బ్యాడ్జ్‌లు",
        GAMIFICATION_NEXT_CHALLENGES: "తదుపరి సవాళ్లు",
        GAMIFICATION_NO_EARNED_YET: "మీరు ఇంకా బ్యాడ్జ్‌లేవీ సంపాదించలేదు. కొనసాగించండి!",
    },
    ta: {
        APP_TITLE: "கம్యார்த்த 🚀", LEDGER_TITLE_PRIVATE: "எனது தனிப்பட்ட கணக்கு", LEDGER_TITLE_SHARED: "பகிரப்பட்ட சமூக கணக்கு", TOGGLE_MODE: "கணக்கு பயன்முறையை மாற்று:", MODE_SHARED: "பகிரப்பட்டது", MODE_PRIVATE: "தனிப்பட்ட", TOTAL_INCOME: "மொத்த வருமானம்", TOTAL_EXPENSE: "மொத்த வெச்சம்", NET_BALANCE: "நிகர இருப்பு", SMART_ENTRY_TITLE: "ஸ்மார்ட் உள்ளீடு (AI ஆற்றல் பெற்றது)", DESCRIPTION_LABEL: "விளக்கம் (எஸ்எம்எஸ்/குறிப்பை இங்கே ஒட்டு)", DESCRIPTION_PLACEHOLDER: "எ.கா., மின்சார கட்டணத்திற்காக ₹550 செலுத்தப்பட்டது", AI_ANALYZE_BUTTON: "AI பகுப்பாய்வு", THINKING_BUTTON: "யோசிக்கிறது...", CATEGORY_LABEL: "வகை", AMOUNT_LABEL: "தொகை (₹)", AMOUNT_PLACEHOLDER: "எ.கா., 550", RECORD_DEBIT: "பற்றுப் பதிவு செய்", RECORD_CREDIT: "கடன் பதிவு செய்", SAVING_BUTTON: "சேமிக்கிறது...", HISTORY_TITLE: "பரிவர்த்தனை வரலாறு", NO_ENTRIES: "கணக்கில் இன்னும் உள்ளீடுகள் இல்லை. கண்காணிப்பை தொடங்குங்கள்!", EXPENSE: "செலவு", INCOME: "வருமானம்", GOALS_TITLE: "சேமிப்பு இலக்குகள்", OBLIGATIONS_TITLE: "உரிய தேதி விழிப்பூட்டல்கள்", BUSINESS_RELATED: "வணிகம் தொடர்பானது?", GST_AMOUNT: "GST தொகை (₹)", DUE_DATE: "உரிய தேதி", ADD_OBLIGATION: "செலுத்த வேண்டிய தொகையை சேர்", DUE_IN_7_DAYS: "7 நாட்களில் செலுத்த வேண்டும்!", NO_OBLIGATIONS: "தற்போது செலுத்த வேண்டிய தொகைகள் இல்லை.", ADD_NEW_GOAL: "புதிய இலக்கை சேர்", GOAL_NAME: "இலக்கின் பெயர்", GOAL_TARGET: "இலக்கு தொகை (₹)", GOAL_DATE: "இலக்கு தேதி", REQUIRED_DAILY: "தேவையான தினசரி சேமிப்பு", ADD_GOAL_BUTTON: "இலக்கை சேர்", LANGUAGE: "மொழி", EXPORT_TAX: "வணிக கணக்கைப் பதிவிறக்கு (CSV)", VOICE_ENTRY: "குரல் உள்ளீடு", MARK_PAID: "செலுத்தப்பட்டது எனக் குறி", SAVE_GOAL_BUTTON: "இலக்கை சேமி", GOAL_COMPLETED: "இலக்கை அடைந்தது!", GOAL_PROGRESS_ALERT: "இலக்கு முன்னேற்றம்: %s இலக்கை நோக்கி %s சேமிக்கப்பட்டது。", DUE_TODAY_ALERT: "இன்று உரியது: %s கட்டணம் இன்று உரியது!", LOGIN_TITLE: "கம్యார்த்திக்கு வரவேற்கிறோம்", CREATE_TITLE: "உங்கள் கணக்கை உருவாக்கவும்", LOGIN_BUTTON: "உள்நுழை", CREATE_BUTTON: "பதிவு செய்க", ALREADY_ACCOUNT: "ஏற்கனவே ஒரு கணக்கு உள்ளதா? உள்நுழைக", NEED_ACCOUNT: "உங்களுக்கு கணக்கு இல்லையா? பதிவு செய்க", EMAIL_PLACEHOLDER: "மின்னஞ்சல் முகவரி", PASSWORD_PLACEHOLDER: "கடவுச்சொல்", LOGOUT: "வெளியேறு", FORGOT_PASSWORD_LINK: "கடவுச்சொல் மறந்துவிட்டதா?", PASSWORD_RESET_SUCCESS: "ஒரு கணக்கு இருந்தால், %s க்கு கடவுச்சொல் மீட்டமைப்பு இணைப்பு அனுப்பப்பட்டுள்ளது。", CHAT_TITLE: "கம్యார்த்தி ஆலோசகர்", CHAT_PLACEHOLDER: "ஒரு நிதி கேள்வியைக் கேளுங்கள்...", SEND: "அனுப்பு", WELCOME_MESSAGE: "வணக்கம்! நான் கம్యார்த்தி ஆலோசகர். பட்ஜெட், சேமிப்பு இலக்குகள் அல்லது பொதுவான நிதி பற்றி எதையும் கேளுங்கள்!", GO_TO_PROFILE: "எனது சுயவிவரம்", GO_TO_DASHBOARD: "டாஷ்போர்டு", PROFILE_TITLE: "பயனர் சுயவிவரம்", USER_EMAIL: "இமெயில்", USER_ID_FULL: "பயனர் ID (UID)", ACCOUNT_TYPE: "கணக்கு வகை", ACCOUNT_PERMANENT: "நிரந்தர (மின்னஞ்சல்/கடவுச்சொல்)", ACCOUNT_ANONYMOUS: "அநாமதேய (உள்ளூர்)", CHANGE_PASSWORD: "கடவுச்சொல்லை மாற்று", NEW_PASSWORD_PLACEHOLDER: "புதிய கடவுச்சொல்லை உள்ளிடவும் (குறைந்தது 6 எழுத்துக்கள்)", AUTH_LOGOUT_PROMPT: "பாதுகாப்புத் தேவை: கடவுச்சொல்லை மாற்றுவதற்கு முன் உங்கள் அடையாளத்தைச் சரிபார்க்க லாக் அவுட் செய்து மீண்டும் லாக் இன் செய்யவும்。", FIRESTORE_BAD_REQUEST: "எழுதுவது தோல்வியடைந்தது: உங்கள் Firebase பாதுகாப்பு விதிகளைச் சரிபார்க்கவும் (நிலை 400).",
        SUMMARY_SHARED_SUBTITLE: "நிதிகளை ஒன்றாக நிர்வகித்தல்",
        SUMMARY_PRIVATE_SUBTITLE: "உங்கள் நிதி மேலோட்டம் இங்கே உள்ளது",
        FAMILY_HEADER_TITLE: "குடும்ப கணக்கு",
        FAMILY_HEADER_SUBTITLE: "தொடங்க ஒரு குழுவைத் தேர்ந்தெடுக்கவும் அல்லது புதிய ஒன்றை உருவாக்கவும்.",
        CREATE_FAMILY_GROUP: "குடும்பக் குழுவை உருவாக்கு",
        DASHBOARD_SUFFIX: "டாஷ்போர்டு",
        SHARED_FAMILY_LEDGER: "பகிரப்பட்ட குடும்ப கணக்கு",
        MEMBERS_COUNT: "உறுப்பினர்கள்",
        INVITE_BUTTON: "அழைப்பு",
        INVITE_MODAL_TITLE: "உறுப்பினர்களை அழைக்கவும்",
        INVITE_MODAL_SUBTITLE: "குழுவில் உறுப்பினர்களைச் சேர்க்க இந்த இணைப்பைப் பகிரவும்.",
        COPY_LINK: "இணைப்பை நகலெடு",
        COPIED: "நகலெடுக்கப்பட்டது!",
        FAMILY_BTN_SWITCH_PRIVATE: "தனிப்பட்ட பயன்முறைக்கு மாறு",
        FAMILY_BTN_FAMILY_GROUPS: "குடும்பம் & குழுக்கள்",
        FAMILY_BTN_PRIVATE: "தனிப்பட்ட",
        FAMILY_BTN_FAMILY: "குடும்பம்",
        NOTIFICATIONS_TITLE: "அறிவிப்புகள்",
        MARK_ALL_READ: "அனைத்தையும் படித்ததாகக் குறி",
        LOADING: "ஏற்றுகிறது...",
        NET_WORTH_BTN: "நிகர மதிப்பு & சொத்துக்கள்",
        CALENDAR_BTN: "நிதி காலண்டர்",
        MANAGE_GROUPS: "குழுக்களை நிர்வகி",
        DELETE_ACCOUNT_TITLE: "கணக்கை நீக்கு",
        DELETE_ACCOUNT_WARNING: "உங்கள் கணக்கை நீக்கிய பிறகு, அதை திரும்பப் பெற முடியாது. உறுதியாக இருக்கவும்.",
        DELETE_ACCOUNT_BUTTON: "கணக்கை நிரந்தரமாக நீக்கு",
        DELETE_CONFIRM_TEXT: "உங்கள் கணக்கை நிச்சயமாக நீக்க விரும்புகிறீர்களா? இந்த செயலை மாற்ற முடியாது மற்றும் உங்கள் எல்லா தரவும் நீக்கப்படும்.",
        DELETE_CONFIRM_EMAIL: "உறுதிப்படுத்த, உங்கள் மின்னஞ்சல் முகவரியை தட்டச்சு செய்யவும்:",
        ACCOUNT_DELETED: "உங்கள் கணக்கு நீக்கப்பட்டது. நீங்கள் செல்வதில் எங்களுக்கு வருத்தம்.",
        CURRENCY_PREFERENCE_TITLE: "நாணய விருப்பம்",
        DISPLAY_CURRENCY_LABEL: "நாணயத்தைக் காட்டு",
        EMAIL_ALERTS_TITLE: "மின்னஞ்சல் விழிப்பூட்டல்கள்",
        ENABLE_EMAIL_NOTIFICATIONS: "மின்னஞ்சல் அறிவிப்புகளை இயக்கு",
        EMAIL_NOTIFICATIONS_DESC: "உரிய தேதிகள், இலக்கு நிறைவு மற்றும் பரிவர்த்தனைகளுக்கான விழிப்பூட்டல்களைப் பெறவும்",
        EMAIL_ALERTS_STATUS: "மின்னஞ்சல் விழிப்பூட்டல்கள்",
        ENABLED: "இயக்கப்பட்டது",
        DISABLED: "முடக்கப்பட்டது",
        PASSWORD_VALIDATION_ERROR: "கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்.",
        CURRENCY_UPDATED: "நாணயம் %s க்கு புதுப்பிக்கப்பட்டது",
        FAILED_UPDATE_CURRENCY: "நாணய விருப்பத்தைப் புதுப்பிக்க முடியவில்லை.",
        PROFILE_TAB_DETAILS: "விவரங்கள்",
        PROFILE_TAB_GROUPS: "குழுக்கள்",
        PROFILE_TAB_SUBSCRIPTIONS: "சந்தாக்கள்",
        PROFILE_TAB_BADGES: "பேட்ஜ்கள்",
        PROFILE_TAB_TIMETRAVEL: "டைம் டிராவல்",
        PROFILE_TAB_CHALLENGES: "சவால்கள்",
        GROUPS_TITLE: "குழுக்கள்",
        GROUPS_CREATE_GROUP: "புதிய குழு",
        GROUPS_ADD_EXPENSE: "செலவைச் சேர்",
        GROUPS_SETTLE_UP: "கணக்கை முடி",
        GROUPS_OVERALL_BALANCE: "மொத்த இருப்பு",
        GROUPS_YOU_OWE: "நீங்கள் தர வேண்டும்",
        GROUPS_YOU_ARE_OWED: "உங்களுக்கு வர வேண்டும்",
        GROUPS_NO_GROUPS: "இன்னும் குழுக்கள் இல்லை.",
        GROUPS_CREATE_FIRST: "பில்களைப் பிரிக்க உங்கள் முதல் குழுவை உருவாக்கவும்!",
        GROUPS_MEMBER: "உறுப்பினர்",
        GROUPS_MEMBERS: "உறுப்பினர்கள்",
        GROUPS_PAID_BY: "செலுத்தியவர்",
        GROUPS_NO_EXPENSES: "இந்தக் குழுவில் இன்னும் செலவுகள் இல்லை.",
        GROUPS_SETTLED_UP: "கணக்கு முடிந்தது",
        GAMIFICATION_LOADING: "பேட்ஜ்கள் ஏற்றப்படுகின்றன...",
        GAMIFICATION_NO_BADGES: "பேட்ஜ்கள் இல்லை",
        GAMIFICATION_START_EARNING: "சாதனைகளைப் பெற பயன்பாட்டைப் பயன்படுத்தத் தொடங்குங்கள்!",
        GAMIFICATION_LOCKED: "பூட்டப்பட்டது",
        GAMIFICATION_EARNED: "பெற்றது",
        GAMIFICATION_YOUR_ACHIEVEMENTS: "உங்கள் சாதனைகள்",
        GAMIFICATION_LEVEL_UP: "உங்கள் நிதி தகுதியை உயர்த்தவும்!",
        GAMIFICATION_EARNED_BADGES: "பெற்ற பேட்ஜ்கள்",
        GAMIFICATION_NEXT_CHALLENGES: "அடுத்த சவால்கள்",
        GAMIFICATION_NO_EARNED_YET: "நீங்கள் இன்னும் பேட்ஜ்கள் எதையும் பெறவில்லை. தொடருங்கள்!",
    },
    kn: {
        APP_TITLE: "ಗಮ್ಯಾರ್ಥ 🚀", LEDGER_TITLE_PRIVATE: "ನನ್ನ ಖಾಸಗಿ ಲೆಡ್ಜರ್", LEDGER_TITLE_SHARED: "ಹಂಚಿದ ಸಮುದಾಯ ಲೆಡ್ಜರ್", TOGGLE_MODE: "ಲೆಡ್ಜರ್ ಮೋಡ್ ಟಾಗಲ್ ಮಾಡಿ:", MODE_SHARED: "ಹಂಚಲಾಗಿದೆ", MODE_PRIVATE: "ಖಾಸಗಿ", TOTAL_INCOME: "ಒಟ್ಟು ಆದಾಯ", TOTAL_EXPENSE: "ಒಟ್ಟು ಖರ್ಚು", NET_BALANCE: "ನಿವ್ವಳ ಸಮತೋಲನ", SMART_ENTRY_TITLE: "ಸ್ಮಾರ್ಟ್ ನಮೂದು (AI ಚಾಲಿತ)", DESCRIPTION_LABEL: "ವಿವರಣೆ (SMS/ಟಿಪ್ಪಣಿ ಅಂಟಿಸಿ)", DESCRIPTION_PLACEHOLDER: "ಉದಾಹರಣೆಗೆ, ವಿದ್ಯುತ್ ಬಿಲ್‌ಗೆ ₹550 ಪಾವತಿಸಲಾಗಿದೆ", AI_ANALYZE_BUTTON: "AI ವಿಶ್ಲೇಷಿಸಿ", THINKING_BUTTON: "ಯೋಚಿಸುತ್ತಿದೆ...", CATEGORY_LABEL: "ವರ್ಗ", AMOUNT_LABEL: "ಮೊತ್ತ (₹)", AMOUNT_PLACEHOLDER: "ಉದಾಹರಣೆಗೆ, 550", RECORD_DEBIT: "ಡೆಬಿಟ್ ದಾಖಲಿಸಿ", RECORD_CREDIT: "ಕ್ರೆಡಿಟ್ ದಾಖಲಿಸಿ", SAVING_BUTTON: "ಉಳಿಸಲಾಗುತ್ತಿದೆ...", HISTORY_TITLE: "ವ್ಯವಹಾರ ಇತಿಹಾಸ", NO_ENTRIES: "ಲೆಡ್ಜರ್‌ನಲ್ಲಿ ಇನ್ನೂ ನಮೂದುಗಳಿಲ್ಲ. ಟ್ರ್ಯಾಕಿಂಗ್ ಪ್ರಾರಂಭಿಸಿ!", EXPENSE: "ಖರ್ಚು", INCOME: "ಆದಾಯ", GOALS_TITLE: "ಉಳಿತಾಯ ಗುರಿಗಳು", OBLIGATIONS_TITLE: "ಗಡುವು ದಿನಾಂಕ ಎಚ್ಚರಿಕೆಗಳು", BUSINESS_RELATED: "ವ್ಯಾಪಾರ ಸಂಬಂಧಿತವೇ?", GST_AMOUNT: "GST ಮೊತ್ತ (₹)", DUE_DATE: "ಗಡುವು ದಿನಾಂಕ", ADD_OBLIGATION: "ಬಾಕಿ ಪಾವತಿ ಸೇರಿಸಿ", DUE_IN_7_DAYS: "7 ದಿನಗಳಲ್ಲಿ ಬಾಕಿ!", NO_OBLIGATIONS: "ಪ್ರಸ್ತುತ ಬಾಕಿ ಪಾವತಿಗಳಿಲ್ಲ.", ADD_NEW_GOAL: "ಹೊಸ ಗುರಿಯನ್ನು ಸೇರಿಸಿ", GOAL_NAME: "ಗುರಿಯ ಹೆಸರು", GOAL_TARGET: "ಗುರಿ ಮೊತ್ತ (₹)", GOAL_DATE: "ಗುರಿ ದಿನಾಂಕ", REQUIRED_DAILY: "ಅಗತ್ಯ ದೈನಂದಿನ ಉಳಿತಾಯ", ADD_GOAL_BUTTON: "ಗುರಿ ಸೇರಿಸಿ", LANGUAGE: "ಭಾಷೆ", EXPORT_TAX: "ವ್ಯಾಪಾರ ಲೆಡ್ಜರ್ ರಫ್ತು (CSV)", VOICE_ENTRY: "ಧ್ವನಿ ನಮೂದು", MARK_PAID: "ಪಾವತಿಸಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ", SAVE_GOAL_BUTTON: "ಗುರಿ ಉಳಿಸಿ", GOAL_COMPLETED: "ಗುರಿ ತಲುಪಿದೆ!", GOAL_PROGRESS_ALERT: "ಗುರಿ ಪ್ರಗತಿ: %s ಗುರಿಗಾಗಿ %s ಉಳಿಸಲಾಗಿದೆ。", DUE_TODAY_ALERT: "ಇಂದು ಬಾಕಿ: %s ಪಾವತಿ ಇಂದು ಬಾಕಿ ಇದೆ!", LOGIN_TITLE: "ಗಮ್ಯಾರ್ಥಗೆ ಸುಸ್ವಾಗತ", CREATE_TITLE: "ನಿಮ್ಮ ಖಾತೆಯನ್ನು ರಚಿಸಿ", LOGIN_BUTTON: "ಲಾಗ್ ಇನ್", CREATE_BUTTON: "ಸೈನ್ ಅಪ್ ಮಾಡಿ", ALREADY_ACCOUNT: "ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ? ಲಾಗ್ ಇನ್ ಮಾಡಿ", NEED_ACCOUNT: "ಖಾತೆ ಇಲ್ಲವೇ? ಸೈನ್ ಅಪ್ ಮಾಡಿ", EMAIL_PLACEHOLDER: "ಇಮೇಲ್ ವಿಳಾಸ", PASSWORD_PLACEHOLDER: "ಪಾಸ್ವರ್ಡ್", LOGOUT: "ಲಾಗ್ ಔಟ್", FORGOT_PASSWORD_LINK: "ಪಾಸ್ವರ್ಡ್ ಮರೆತುಹೋಗಿದೆಯೇ?", PASSWORD_RESET_SUCCESS: "ಒಂದು ಖಾತೆ ಇದ್ದರೆ, %s ಗೆ ಪಾಸ್ವರ್ಡ್ ಮರುಹೊಂದಿಸುವ ಲಿಂಕ್ ಕಳುಹಿಸಲಾಗಿದೆ。", CHAT_TITLE: "ಗಮ್ಯಾರ್ಥ ಸಲಹೆಗಾರ", CHAT_PLACEHOLDER: "ಹಣಕಾಸಿನ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ...", SEND: "ಕಳುಹಿಸು", WELCOME_MESSAGE: "ನಮಸ್ಕಾರ! ನಾನು ಗಮ್ಯಾರ್ಥ ಸಲಹೆಗಾರ. ಬಜೆಟ್, ಉಳಿತಾಯ ಗುರಿಗಳು ಅಥವಾ ಸಾಮಾನ್ಯ ಹಣಕಾಸು ಕುರಿತು ಏನೇ ಬೇಕಾದರೂ ಕೇಳಿ!", GO_TO_PROFILE: "ನನ್ನ ಪ್ರೊಫೈಲ್", GO_TO_D್ಯಾಶ್‌ಬೋರ್ಡ್: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", PROFILE_TITLE: "ಬಳಕೆದಾರ ಪ್ರೊಫೈಲ್", USER_EMAIL: "ಇಮೇಲ್", USER_ID_FULL: "ಬಳಕೆದಾರ ID (UID)", ACCOUNT_TYPE: "ಖಾತೆ ಪ್ರಕಾರ", ACCOUNT_PERMANENT: "ಶಾಶ್ವತ (ಇಮೇಲ್/ಪಾಸ್‌ವರ್ಡ್)", ACCOUNT_ANONYMOUS: "ಗುಮನಾಮ (ಸ್ಥಳೀಯ)", CHANGE_PASSWORD: "ಪಾಸ್ವರ್ಡ್ ಬದಲಾಯಿಸಿ", NEW_PASSWORD_PLACEHOLDER: "ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ (ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳು)", AUTH_LOGOUT_PROMPT: "ಭದ್ರತಾ ಅಗತ್ಯ: ದಯವಿಟ್ಟು ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸುವ ಮೊದಲು ನಿಮ್ಮ ಗುರುತನ್ನು ಪರಿಶೀಲಿಸಲು ಲಾಗ್ ಔಟ್ ಮಾಡಿ ಮತ್ತು ಮರು-ಲಾಗ್ ಇನ್ ಮಾಡಿ.", FIRESTORE_BAD_REQUEST: "ಬರವಣಿಗೆ ವಿಫಲವಾಗಿದೆ: ನಿಮ್ಮ Firebase ಭದ್ರತಾ ನಿಯಮಗಳನ್ನು ಪರಿಶೀಲಿಸಿ (ಸ್ಥಿತಿ 400).",
        SUMMARY_SHARED_SUBTITLE: "ಹಣಕಾಸು ನಿರ್ವಹಣೆ ಒಟ್ಟಿಗೆ",
        SUMMARY_PRIVATE_SUBTITLE: "ಇಲ್ಲಿ ನಿಮ್ಮ ಹಣಕಾಸು ಅವಲೋಕನವಿದೆ",
        FAMILY_HEADER_TITLE: "ಕುಟುಂಬ ಲೆಡ್ಜರ್",
        FAMILY_HEADER_SUBTITLE: "ಪ್ರಾರಂಭಿಸಲು ಗುಂಪನ್ನು ಆರಿಸಿ ಅಥವಾ ಹೊಸದನ್ನು ರಚಿಸಿ.",
        CREATE_FAMILY_GROUP: "ಕುಟುಂಬ ಗುಂಪನ್ನು ರಚಿಸಿ",
        DASHBOARD_SUFFIX: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        SHARED_FAMILY_LEDGER: "ಹಂಚಿದ ಕುಟುಂಬ ಲೆಡ್ಜರ್",
        MEMBERS_COUNT: "ಸದಸ್ಯರು",
        INVITE_BUTTON: "ಆಹ್ವಾನಿಸಿ",
        INVITE_MODAL_TITLE: "ಸದಸ್ಯರನ್ನು ಆಹ್ವಾನಿಸಿ",
        INVITE_MODAL_SUBTITLE: "ಗುಂಪಿಗೆ ಸದಸ್ಯರನ್ನು ಸೇರಿಸಲು ಈ ಲಿಂಕ್ ಅನ್ನು ಹಂಚಿಕೊಳ್ಳಿ.",
        COPY_LINK: "ಲಿಂಕ್ ನಕಲಿಸಿ",
        COPIED: "ನಕಲಿಸಲಾಗಿದೆ!",
        FAMILY_BTN_SWITCH_PRIVATE: "ಖಾಸಗಿ ಮೋಡ್‌ಗೆ ಬದಲಿಸಿ",
        FAMILY_BTN_FAMILY_GROUPS: "ಕುಟುಂಬ ಮತ್ತು ಗುಂಪುಗಳು",
        FAMILY_BTN_PRIVATE: "ಖಾಸಗಿ",
        FAMILY_BTN_FAMILY: "ಕುಟುಂಬ",
        NOTIFICATIONS_TITLE: "ಸೂಚನೆಗಳು",
        MARK_ALL_READ: "ಎಲ್ಲವನ್ನೂ ಓದಿದಂತೆ ಗುರುತಿಸಿ",
        LOADING: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
        NET_WORTH_BTN: "ನಿವ್ವಳ ಮೌಲ್ಯ ಮತ್ತು ಆಸ್ತಿಗಳು",
        CALENDAR_BTN: "ಹಣಕಾಸು ಕ್ಯಾಲೆಂಡರ್",
        MANAGE_GROUPS: "ಗುಂಪುಗಳನ್ನು ನಿರ್ವಹಿಸಿ",
        DELETE_ACCOUNT_TITLE: "ಖಾತೆಯನ್ನು ಅಳಿಸಿ",
        DELETE_ACCOUNT_WARNING: "ಒಮ್ಮೆ ನೀವು ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಅಳಿಸಿದರೆ, ಅದನ್ನು ಹಿಂಪಡೆಯಲಾಗುವುದಿಲ್ಲ. ದಯವಿಟ್ಟು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.",
        DELETE_ACCOUNT_BUTTON: "ಖಾತೆಯನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಿ",
        DELETE_CONFIRM_TEXT: "ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ? ಈ ಕ್ರಿಯೆಯನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗುವುದಿಲ್ಲ ಮತ್ತು ನಿಮ್ಮ ಎಲ್ಲಾ ಡೇಟಾವನ್ನು ಅಳಿಸಲಾಗುತ್ತದೆ.",
        DELETE_CONFIRM_EMAIL: "ದೃಢೀಕರಿಸಲು, ದಯವಿಟ್ಟು ನಿಮ್ಮ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ಟೈಪ್ ಮಾಡಿ:",
        ACCOUNT_DELETED: "ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಅಳಿಸಲಾಗಿದೆ. ನೀವು ಹೋಗುತ್ತಿರುವುದಕ್ಕೆ ನಮಗೆ ವಿಷಾದವಿದೆ.",
        CURRENCY_PREFERENCE_TITLE: "ಕರೆನ್ಸಿ ಆದ್ಯತೆ",
        DISPLAY_CURRENCY_LABEL: "ಕರೆನ್ಸಿ ಪ್ರದರ್ಶಿಸಿ",
        EMAIL_ALERTS_TITLE: "ಇಮೇಲ್ ಎಚ್ಚರಿಕೆಗಳು",
        ENABLE_EMAIL_NOTIFICATIONS: "ಇಮೇಲ್ ಸೂಚನೆಗಳನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ",
        EMAIL_NOTIFICATIONS_DESC: "ಗಡುವು ದಿನಾಂಕಗಳು, ಗುರಿ ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ಮತ್ತು ವ್ಯವಹಾರಗಳಿಗಾಗಿ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಸ್ವೀಕರಿಸಿ",
        EMAIL_ALERTS_STATUS: "ಇಮೇಲ್ ಎಚ್ಚರಿಕೆಗಳು",
        ENABLED: "ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ",
        DISABLED: "ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ",
        PASSWORD_VALIDATION_ERROR: "ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳಿರಬೇಕು.",
        CURRENCY_UPDATED: "ಕರೆನ್ಸಿಯನ್ನು %s ಗೆ ನವೀಕರಿಸಲಾಗಿದೆ",
        FAILED_UPDATE_CURRENCY: "ಕರೆನ್ಸಿ ಆದ್ಯತೆಯನ್ನು ನವೀಕರಿಸಲು ವಿಫಲವಾಗಿದೆ.",
        PROFILE_TAB_DETAILS: "ವಿವರಗಳು",
        PROFILE_TAB_GROUPS: "ಗುಂಪುಗಳು",
        PROFILE_TAB_SUBSCRIPTIONS: "ಚಂದಾದಾರಿಕೆಗಳು",
        PROFILE_TAB_BADGES: "ಬ್ಯಾಡ್ಜ್‌ಗಳು",
        PROFILE_TAB_TIMETRAVEL: "ಟೈಮ್ ಟ್ರಾವೆಲ್",
        PROFILE_TAB_CHALLENGES: "ಸವಾಲುಗಳು",
        GROUPS_TITLE: "ಗುಂಪುಗಳು",
        GROUPS_CREATE_GROUP: "ಹೊಸ ಗುಂಪು",
        GROUPS_ADD_EXPENSE: "ಖರ್ಚು ಸೇರಿಸಿ",
        GROUPS_SETTLE_UP: "ಇತ್ಯರ್ಥ ಮಾಡಿ",
        GROUPS_OVERALL_BALANCE: "ಒಟ್ಟು ಬಾಕಿ",
        GROUPS_YOU_OWE: "ನೀವು ನೀಡಬೇಕಿದೆ",
        GROUPS_YOU_ARE_OWED: "ನಿಮಗೆ ಬರಬೇಕಿದೆ",
        GROUPS_NO_GROUPS: "ಇನ್ನೂ ಗುಂಪುಗಳಿಲ್ಲ.",
        GROUPS_CREATE_FIRST: "ಬಿಲ್‌ಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಲು ನಿಮ್ಮ ಮೊದಲ ಗುಂಪನ್ನು ರಚಿಸಿ!",
        GROUPS_MEMBER: "ಸದಸ್ಯ",
        GROUPS_MEMBERS: "ಸದಸ್ಯರು",
        GROUPS_PAID_BY: "ಪಾವತಿಸಿದವರು",
        GROUPS_NO_EXPENSES: "ಈ ಗುಂಪಿನಲ್ಲಿ ಇನ್ನೂ ಯಾವುದೇ ಖರ್ಚು ದಾಖಲಾಗಿಲ್ಲ.",
        GROUPS_SETTLED_UP: "ಇತ್ಯರ್ಥವಾಗಿದೆ",
        GAMIFICATION_LOADING: "ಬ್ಯಾಡ್ಜ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
        GAMIFICATION_NO_BADGES: "ಇನ್ನೂ ಯಾವುದೇ ಬ್ಯಾಡ್ಜ್‌ಗಳಿಲ್ಲ",
        GAMIFICATION_START_EARNING: "ಸಾಧನೆಗಳನ್ನು ಗಳಿಸಲು ಅಪ್ಲಿಕೇಶನ್ ಬಳಸಲು ಪ್ರಾರಂಭಿಸಿ!",
        GAMIFICATION_LOCKED: "ಲಾಕ್ ಆಗಿದೆ",
        GAMIFICATION_EARNED: "ಗಳಿಸಿರುವುದು",
        GAMIFICATION_YOUR_ACHIEVEMENTS: "ನಿಮ್ಮ ಸಾಧನೆಗಳು",
        GAMIFICATION_LEVEL_UP: "ನಿಮ್ಮ ಆರ್ಥಿಕ ಫಿಟ್ನೆಸ್ ಅನ್ನು ಹೆಚ್ಚಿಸಿ!",
        GAMIFICATION_EARNED_BADGES: "ಗಳಿಸಿದ ಬ್ಯಾಡ್ಜ್‌ಗಳು",
        GAMIFICATION_NEXT_CHALLENGES: "ಮುಂದಿನ ಸವಾಲುಗಳು",
        GAMIFICATION_NO_EARNED_YET: "ನೀವು ಇನ್ನೂ ಯಾವುದೇ ಬ್ಯಾಡ್ಜ್‌ಗಳನ್ನು ಗಳಿಸಿಲ್ಲ. ಮುಂದುವರಿಸಿ!",
    },
    fa: {
        APP_TITLE: "گمیارتا 🚀", LEDGER_TITLE_PRIVATE: "دفترچه خصوصی من", LEDGER_TITLE_SHARED: "دفترچه اشتراکی جامعه", TOGGLE_MODE: "تغییر حالت:", MODE_SHARED: "جامعه", MODE_PRIVATE: "خصوصی", TOTAL_INCOME: "کل درآمد", TOTAL_EXPENSE: "کل هزینه", NET_BALANCE: "تراز خالص", SMART_ENTRY_TITLE: "ورود هوشمند (با قدرت هوش مصنوعی)", DESCRIPTION_LABEL: "توضیحات (پیامک/یادداشت را اینجا بچسبانید)", DESCRIPTION_PLACEHOLDER: "مثلاً ۵۵۰ تومان برای قبض برق پرداخت شد", AI_ANALYZE_BUTTON: "تحلیل هوش مصنوعی", THINKING_BUTTON: "در حال فکر کردن...", CATEGORY_LABEL: "دسته بندی", AMOUNT_LABEL: "مبلغ", AMOUNT_PLACEHOLDER: "مثلاً ۵۵۰", RECORD_DEBIT: "ثبت هزینه", RECORD_CREDIT: "ثبت درآمد", SAVING_BUTTON: "در حال ذخیره...", HISTORY_TITLE: "تاریخچه تراکنش‌ها", NO_ENTRIES: "هنوز ورودی در دفترچه نیست. ردیابی را شروع کنید!", EXPENSE: "هزینه", INCOME: "درآمد", GOALS_TITLE: "اهداف پس‌انداز", OBLIGATIONS_TITLE: "هشدارهای تاریخ سررسید", BUSINESS_RELATED: "مربوط به کسب و کار؟", GST_AMOUNT: "مبلغ مالیات (تومان)", DUE_DATE: "تاریخ سررسید", ADD_OBLIGATION: "افزودن پرداخت معوقه", DUE_IN_7_DAYS: "سررسید در ۷ روز!", NO_OBLIGATIONS: "هیچ پرداخت معوقه‌ای وجود ندارد.", ADD_NEW_GOAL: "افزودن هدف جدید", GOAL_NAME: "نام هدف", GOAL_TARGET: "مبلغ هدف", GOAL_DATE: "تاریخ هدف", REQUIRED_DAILY: "پس‌انداز روزانه مورد نیاز", ADD_GOAL_BUTTON: "افزودن هدف", LANGUAGE: "زبان", EXPORT_TAX: "خروجی دفترچه کسب و کار (CSV)", VOICE_ENTRY: "ورود صوتی", MARK_PAID: "علامت‌گذاری به عنوان پرداخت شده", SAVE_GOAL_BUTTON: "ذخیره هدف", GOAL_COMPLETED: "هدف محقق شد!", GOAL_PROGRESS_ALERT: "پیشرفت هدف: %s از %s ذخیره شد.", DUE_TODAY_ALERT: "سررسید امروز: پرداخت %s امروز است!", LOGIN_TITLE: "به گمیارتا خوش آمدید", CREATE_TITLE: "حساب کاربری خود را بسازید", LOGIN_BUTTON: "ورود", CREATE_BUTTON: "ثبت نام", ALREADY_ACCOUNT: "قبلاً حساب داشتید؟ وارد شوید", NEED_ACCOUNT: "حساب ندارید؟ ثبت نام کنید", EMAIL_PLACEHOLDER: "آدرس ایمیل", PASSWORD_PLACEHOLDER: "رمز عبور", LOGOUT: "خروج", FORGOT_PASSWORD_LINK: "رمز عبور را فراموش کردید؟", PASSWORD_RESET_SUCCESS: "اگر حسابی وجود داشته باشد، لینک بازیابی رمز به %s ارسال شده است.", CHAT_TITLE: "مشاور گمیارتا", CHAT_PLACEHOLDER: "یک سوال مالی بپرسید...", SEND: "ارسال", WELCOME_MESSAGE: "سلام! من مشاور گمیارتا هستم. هر سوالی درباره بودجه‌بندی، اهداف پس‌انداز یا مسائل مالی کلی دارید بپرسید!", GO_TO_PROFILE: "پروفایل من", GO_TO_DASHBOARD: "داشبورد", PROFILE_TITLE: "پروفایل کاربر", USER_EMAIL: "ایمیل", USER_ID_FULL: "شناسه کاربر (UID)", ACCOUNT_TYPE: "نوع حساب", ACCOUNT_PERMANENT: "دائمی (ایمیل/رمز)", ACCOUNT_ANONYMOUS: "ناشناس (محلی)", CHANGE_PASSWORD: "تغییر رمز عبور", NEW_PASSWORD_PLACEHOLDER: "رمز عبور جدید (حداقل ۶ کاراکتر)", AUTH_LOGOUT_PROMPT: "الزام امنیتی: لطفاً خارج شوید و دوباره وارد شوید تا رمز عبور را تغییر دهید.", budgets_title: "بودجه‌ها", budget: "بودجه", spent: "خرج شده", remaining: "باقیمانده", add_new_budget: "افزودن بودجه جدید", budget_category: "دسته بندی", budget_amount: "مبلغ بودجه", add_budget_button: "افزودن بودجه", FIRESTORE_BAD_REQUEST: "خطا در نوشتن: قوانین امنیتی را بررسی کنید.",
        SUMMARY_SHARED_SUBTITLE: "مدیریت مالی با هم",
        SUMMARY_PRIVATE_SUBTITLE: "اینجا نمای کلی مالی شماست",
        FAMILY_HEADER_TITLE: "دفترچه خانوادگی",
        FAMILY_HEADER_SUBTITLE: "برای شروع یک گروه را انتخاب کنید یا گروه جدیدی بسازید.",
        CREATE_FAMILY_GROUP: "ایجاد گروه خانوادگی",
        DASHBOARD_SUFFIX: "داشبورد",
        SHARED_FAMILY_LEDGER: "دفترچه خانوادگی مشترک",
        MEMBERS_COUNT: "اعضا",
        INVITE_BUTTON: "دعوت",
        INVITE_MODAL_TITLE: "دعوت اعضا",
        INVITE_MODAL_SUBTITLE: "این لینک را برای افزودن اعضا به گروه به اشتراک بگذارید.",
        COPY_LINK: "کپی لینک",
        COPIED: "کپی شد!",
        FAMILY_BTN_SWITCH_PRIVATE: "تغییر به حالت خصوصی",
        FAMILY_BTN_FAMILY_GROUPS: "خانواده و گروه‌ها",
        FAMILY_BTN_PRIVATE: "خصوصی",
        FAMILY_BTN_FAMILY: "خانواده",
        NOTIFICATIONS_TITLE: "اعلان‌ها",
        MARK_ALL_READ: "علامت‌گذاری همه به عنوان خوانده شده",
        LOADING: "در حال بارگذاری...",
        NET_WORTH_BTN: "ارزش خالص و دارایی‌ها",
        CALENDAR_BTN: "تقویم مالی",
        MANAGE_GROUPS: "مدیریت گروه‌ها",
        DELETE_ACCOUNT_TITLE: "حذف حساب کاربری",
        DELETE_ACCOUNT_WARNING: "پس از حذف حساب کاربری، راه بازگشتی نیست. لطفاً مطمئن باشید.",
        DELETE_ACCOUNT_BUTTON: "حذف دائمی حساب کاربری",
        DELETE_CONFIRM_TEXT: "آیا کاملاً مطمئن هستید که می‌خواهید حساب خود را حذف کنید؟ این عمل قابل بازگشت نیست و تمام داده‌های شما حذف خواهد شد.",
        DELETE_CONFIRM_EMAIL: "برای تایید، لطفاً آدرس ایمیل خود را تایپ کنید:",
        ACCOUNT_DELETED: "حساب شما حذف شد. متاسفیم که شما را از دست می‌دهیم.",
        CURRENCY_PREFERENCE_TITLE: "ترجیحات ارز",
        DISPLAY_CURRENCY_LABEL: "نمایش ارز",
        EMAIL_ALERTS_TITLE: "هشدارهای ایمیلی",
        ENABLE_EMAIL_NOTIFICATIONS: "فعال‌سازی اعلان‌های ایمیلی",
        EMAIL_NOTIFICATIONS_DESC: "دریافت هشدار برای تاریخ‌های سررسید، تکمیل اهداف و تراکنش‌ها",
        EMAIL_ALERTS_STATUS: "هشدارهای ایمیلی",
        ENABLED: "فعال",
        DISABLED: "غیرفعال",
        PASSWORD_VALIDATION_ERROR: "رمز عبور باید حداقل ۶ کاراکتر باشد.",
        CURRENCY_UPDATED: "ارز به %s بروزرسانی شد",
        FAILED_UPDATE_CURRENCY: "بروزرسانی ترجیحات ارز ناموفق بود.",
        PROFILE_TAB_DETAILS: "جزئیات",
        PROFILE_TAB_GROUPS: "گروه‌ها",
        PROFILE_TAB_SUBSCRIPTIONS: "اشتراک‌ها",
        PROFILE_TAB_BADGES: "نشان‌ها",
        PROFILE_TAB_TIMETRAVEL: "سفر در زمان",
        PROFILE_TAB_CHALLENGES: "چالش‌ها",
        GROUPS_TITLE: "گروه‌ها",
        GROUPS_CREATE_GROUP: "گروه جدید",
        GROUPS_ADD_EXPENSE: "افزودن هزینه",
        GROUPS_SETTLE_UP: "تسویه حساب",
        GROUPS_OVERALL_BALANCE: "تراز کلی",
        GROUPS_YOU_OWE: "بدهکارید",
        GROUPS_YOU_ARE_OWED: "طلبکارید",
        GROUPS_NO_GROUPS: "هنوز گروهی نیست.",
        GROUPS_CREATE_FIRST: "اولین گروه خود را برای تقسیم صورتحساب بسازید!",
        GROUPS_MEMBER: "عضو",
        GROUPS_MEMBERS: "اعضا",
        GROUPS_PAID_BY: "پرداخت شده توسط",
        GROUPS_NO_EXPENSES: "هنوز هزینه‌ای در این گروه ثبت نشده است.",
        GROUPS_SETTLED_UP: "تسویه شد",
        GAMIFICATION_LOADING: "در حال بارگذاری نشان‌ها...",
        GAMIFICATION_NO_BADGES: "هنوز نشانی وجود ندارد",
        GAMIFICATION_START_EARNING: "برای کسب دستاوردها استفاده از اپلیکیشن را شروع کنید!",
        GAMIFICATION_LOCKED: "قفل شده",
        GAMIFICATION_EARNED: "کسب شده",
        GAMIFICATION_YOUR_ACHIEVEMENTS: "دستاوردهای شما",
        GAMIFICATION_LEVEL_UP: "تناسب اندام مالی خود را ارتقا دهید!",
        GAMIFICATION_EARNED_BADGES: "نشان‌های کسب شده",
        GAMIFICATION_NEXT_CHALLENGES: "چالش‌های بعدی",
        GAMIFICATION_NO_EARNED_YET: "شما هنوز هیچ نشانی کسب نکرده‌اید. ادامه دهید!",
    },
};

const T = (key, ...args) => {
    const lang = appState.currentLanguage;
    let text = translations[lang][key] || translations['en'][key] || key;
    args.forEach((arg) => { text = text.replace(`%s`, arg); });
    return text;
};

// --- UTILITY FUNCTIONS ---
const formatCurrency = (amount, currencyCode) => {
    const currency = currencyCode || appState.activeCurrency || 'INR';
    const locale = (appState.currentLanguage === 'fa') ? 'fa-IR' : 'en-IN';
    return new Intl.NumberFormat(locale, {
        style: 'currency', currency: currency, minimumFractionDigits: 0
    }).format(amount);
};

const formatDate = (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const locale_map = {
        'en': 'en-IN',
        'hi': 'hi-IN',
        'te': 'te-IN',
        'ta': 'ta-IN',
        'kn': 'kn-IN',
        'fa': 'fa-IR'
    };
    const locale = locale_map[appState.currentLanguage] || 'en-IN';
    // Use Intl.DateTimeFormat for better control if needed, but toLocaleDateString is fine
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
};

const today = new Date();
const isDueSoon = (date) => {
    if (!date) return false;
    const due = new Date(date);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
};
const isDueToday = (date) => {
    if (!date) return false;
    const due = new Date(date);
    return due.toDateString() === today.toDateString();
};

const secureFetch = async (url, options = {}) => {
    const headers = options.headers || {};
    if (appState.token) {
        headers['Authorization'] = `Bearer ${appState.token}`;
    }
    const updatedOptions = { ...options, headers };
    return fetch(url, updatedOptions);
};

// --- DYNAMIC MODULE LOADER WRAPPERS ---
// Helper to ensure groups module is loaded before calling its functions
const openCreateGroupModalWrapper = (type) => {
    // If function exists globally (attached by groups.js), call it
    if (window.showCreateGroupModal) {
        window.showCreateGroupModal(type);
    } else {
        // Dynamic import if not yet loaded
        import('./js/groups.js').then(module => {
            // Initialize if needed (though showCreateGroupModal is stand-alone usually)
            module.initGroups({
                apiBaseUrl: API_BASE_URL,
                appState: appState,
                setAlert: setAlert
            });
            // Re-check global or use module export
            if (window.showCreateGroupModal) window.showCreateGroupModal(type);
        }).catch(err => console.error("Failed to load groups module:", err));
    }
};
window.openCreateGroupModalWrapper = openCreateGroupModalWrapper;

const getSpeechLocale = (lang) => {
    switch (lang) {
        case 'hi': return 'hi-IN';
        case 'te': return 'te-IN';
        case 'ta': return 'ta-IN';
        case 'kn': return 'kn-IN';
        case 'fa': return 'fa-IR';
        case 'en':
        default: return 'en-IN';
    }
};

// --- ALERT FUNCTIONS ---
const setAlert = (message, type) => {
    appState.alert = { message, type };
    renderAlertBanner();
    // Automatically dismiss success and temporary alerts after 4 seconds
    if (type === 'success' || type === 'progress') {
        setTimeout(() => {
            if (appState.alert.message === message) { // Only dismiss if it hasn't been replaced
                appState.alert = { message: '', type: '' };
                renderAlertBanner();
            }
        }, 4000);
    }
};

const renderAlertBanner = () => {
    const { message, type } = appState.alert;
    let bgColor = 'bg-yellow-100';
    let borderColor = 'border-yellow-500';
    let textColor = 'text-yellow-800';

    if (type === 'success') {
        bgColor = 'bg-green-100';
        borderColor = 'border-green-500';
        textColor = 'text-green-800';
    } else if (type === 'error') {
        bgColor = 'bg-red-100';
        borderColor = 'border-red-500';
        textColor = 'text-red-800';
    }

    if (!message) {
        D.alertContainer.innerHTML = '';
        return;
    }

    D.alertContainer.innerHTML = `
                <div class="fixed top-0 left-0 right-0 z-50 p-4 shadow-xl ${bgColor} border-b-4 ${borderColor} transition-all duration-300">
                    <div class="flex items-center justify-between">
                        <p class="font-medium ${textColor} text-sm">${message}</p>
                        <button id="dismiss-alert-btn" class="ml-4 ${textColor} opacity-70 hover:opacity-100 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                        </button>
                    </div>
                </div>
            `;
    document.getElementById('dismiss-alert-btn').onclick = () => setAlert('', '');
};

// --- DATA COMPUTATION ---
const computeSummary = () => {
    let income = 0;
    let expense = 0;
    const catMap = {};

    appState.transactions.forEach(t => {
        const amount = parseFloat(t.amount) || 0;
        if (t.type === 'income') {
            income += amount;
        } else if (t.type === 'expense') {
            expense += amount;
            const cat = t.category || 'Uncategorized';
            catMap[cat] = (catMap[cat] || 0) + amount;
        }
    });

    return {
        totalIncome: income, totalExpense: expense, netBalance: income - expense, expensesByCategory: catMap
    };
};

// --- RENDER FUNCTIONS (DOM Manipulation) ---

const renderHeaderDetails = () => {
    const ledgerTitleText = 'Dashboard';
    let viewButtonText, newView;

    // Simplified navigation: toggle between Dashboard, Profile, and Admin (if applicable)
    if (appState.currentMainView === 'dashboard') {
        viewButtonText = T('GO_TO_PROFILE');
        newView = 'profile';
    } else if (appState.currentMainView === 'profile') {
        viewButtonText = T('GO_TO_DASHBOARD');
        newView = 'dashboard';
    } else if (appState.currentMainView === 'admin' && isAdmin()) {
        viewButtonText = T('GO_TO_DASHBOARD');
        newView = 'dashboard';
    } else if (appState.currentMainView === 'networth') {
        viewButtonText = T('GO_TO_DASHBOARD');
        newView = 'dashboard';
    } else if (appState.currentMainView === 'groups') {
        viewButtonText = T('GO_TO_DASHBOARD');
        newView = 'dashboard';
    } else if (appState.currentMainView === 'calendar') {
        appState.currentMainView = 'calendar'; // Keep it calendar so back logic works if needed, or redirect
        viewButtonText = T('GO_TO_DASHBOARD');
        newView = 'dashboard';
    } else {
        viewButtonText = T('GO_TO_DASHBOARD');
        newView = 'dashboard';
    }

    // Show/Hide Admin Button based on role
    if (isAdmin()) {
        D.adminBtn = document.getElementById('admin-btn');
        if (D.adminBtn) {
            D.adminBtn.classList.remove('hidden');
            D.adminBtn.onclick = () => {
                appState.currentMainView = 'admin';
                localStorage.setItem('currentMainView', 'admin');
                updateUI();
            };
        }
    }

    const familyBtnText = appState.isShared ? T('FAMILY_BTN_SWITCH_PRIVATE') : T('FAMILY_BTN_FAMILY_GROUPS');
    const familyBtnClass = appState.isShared ? 'bg-gray-500 hover:bg-gray-600' : 'bg-emerald-500 hover:bg-emerald-600';
    const familyBtnLabel = appState.isShared ? T('FAMILY_BTN_PRIVATE') : T('FAMILY_BTN_FAMILY');

    // Group Selector (Only if shared)
    let groupSelectorHtml = '';
    if (appState.isShared && appState.groups && appState.groups.length > 0) {
        const options = appState.groups.map(g => `<option value="${g.id}" ${g.id == appState.currentGroupId ? 'selected' : ''}>${g.group_name}</option>`).join('');
        groupSelectorHtml = `
            <select id="group-selector" class="ml-1 text-xs bg-white text-gray-800 border border-gray-300 rounded-full px-2 py-1 focus:outline-none">
                ${options}
            </select>
            <button id="manage-groups-btn" class="ml-1 text-xs bg-blue-500 text-white px-2 py-1 rounded-full" title="${T('MANAGE_GROUPS')}">⚙️</button>
        `;
    }

    D.ledgerTitle.innerHTML = `
                <button id="view-toggle-btn" class="ml-2 text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-full font-medium transition duration-150">
                    ${viewButtonText}
                </button>
                <button id="groups-btn" class="ml-1 text-xs ${familyBtnClass} text-white px-3 py-1 rounded-full font-medium transition duration-150" title="${familyBtnText}">
                    <i class="fas fa-users mr-1"></i> ${familyBtnLabel}
                </button>
                <div id="notification-container" class="relative inline-block text-left ml-1 hidden">
                    <button id="notification-btn" class="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium transition duration-150 relative border border-indigo-200" title="${T('NOTIFICATIONS_TITLE')}">
                        <i class="fas fa-bell"></i>
                        <span id="notification-badge" class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center hidden">0</span>
                    </button>
                    <!-- Dropdown -->
                    <div id="notifications-dropdown" class="hidden absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl overflow-hidden z-50 border border-gray-100 ring-1 ring-black ring-opacity-5">
                        <div class="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                            <span class="text-xs font-semibold text-gray-700">${T('NOTIFICATIONS_TITLE')}</span>
                            <button id="mark-all-read-btn" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">${T('MARK_ALL_READ')}</button>
                        </div>
                        <div id="notifications-list" class="max-h-80 overflow-y-auto divide-y divide-gray-50">
                            <div class="p-4 text-center text-gray-500 text-xs">${T('LOADING')}</div>
                        </div>
                    </div>
                </div>

                ${groupSelectorHtml}
                <button id="wealth-btn" class="ml-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-full font-medium transition duration-150" title="${T('NET_WORTH_BTN')}">
                    💰
                </button>
                <button id="calendar-btn" class="ml-1 text-xs bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded-full font-medium transition duration-150" title="${T('CALENDAR_BTN')}">
                    📅
                </button>
            `;

    // Initialize Notifications (if script is loaded)
    if (window.initNotifications) {
        window.initNotifications();
    }

    document.getElementById('view-toggle-btn').onclick = () => {
        appState.currentMainView = newView;
        localStorage.setItem('currentMainView', newView);
        updateUI();
    };

    document.getElementById('groups-btn').onclick = async () => {
        if (appState.isShared) {
            // Switch to Private
            appState.isShared = false;
            // Persist Private Mode
            fetch(`${API_BASE_URL}/user/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appState.token}` },
                body: JSON.stringify({ key: 'current_mode', value: 'private' })
            });

            appState.currentGroupId = null;
            appState.currentMainView = 'dashboard';
            localStorage.setItem('currentMainView', 'dashboard');
            // Clear data to prevent personal data from showing in shared mode (or vice versa)
            appState.transactions = [];
            appState.goals = [];
            appState.obligations = [];
            appState.budgets = [];

            await initializeListeners();
            updateUI();
        } else {
            // Switch to Shared
            // Ensure groups are loaded
            if (!appState.groups || appState.groups.length === 0) {
                try {
                    const response = await fetch(`${API_BASE_URL}/groups`, {
                        headers: { 'Authorization': `Bearer ${appState.token}` }
                    });
                    const data = await response.json();
                    appState.groups = data.groups || [];
                } catch (e) { console.error("Error fetching groups:", e); }
            }

            // Ensure appState.groups is populated correctly
            // If it's empty, we fetch.
            // If fetching returns empty, we prompt creation.
            // If fetch returns groups, we MUST select one if none is selected, OR if the currently selected one is not in the list (stale).

            if (!appState.groups || appState.groups.length === 0) {
                // Try fetching again to be sure
                try {
                    const response = await fetch(`${API_BASE_URL}/groups`, { headers: { 'Authorization': `Bearer ${appState.token}` } });
                    if (response.ok) {
                        const data = await response.json();
                        appState.groups = data.groups || [];
                    }
                } catch (e) { console.error("Error fetching groups on switch", e); }
            }

            if (appState.groups.length === 0) {
                // No groups exist. Stay in 'dashboard' but show Empty State via renderFamilyHeader or special state?
                // Actually, if we set currentMainView = 'groups', it shows the list/creappState.currentMainView = 'groups';ation UI.
                // The user wants "Multiplayer" -> "Family Dashboard".
                // If they have no groups, they can't have a Family Dashboard really.
                // Let's force them to create a Family Group.
                if (confirm("You need to create a Family Group first. Create one now?")) {
                    openCreateGroupModalWrapper('family');
                } else {
                    // Cancelled, stay on private
                    return;
                }
            } else {
                // We have groups.
                // FILTER for FAMILY groups only
                const familyGroups = appState.groups.filter(g => g.group_type === 'family');

                if (familyGroups.length === 0) {
                    // Has general groups but NO family groups
                    if (confirm(T('CREATE_FAMILY_GROUP') + "?")) { // Reusing generic prompt or create better key
                        openCreateGroupModalWrapper('family');
                    }
                    return;
                }

                // We have family groups
                appState.isShared = true;
                appState.currentMainView = 'dashboard';
                localStorage.setItem('currentMainView', 'dashboard');
                // Clear private data
                appState.transactions = []; appState.goals = []; appState.obligations = []; appState.budgets = [];

                // Validate selection (must be a family group)
                const groupExists = appState.currentGroupId && familyGroups.find(g => g.id == appState.currentGroupId);

                if (!groupExists) {
                    appState.currentGroupId = familyGroups[0].id; // Default to first FAMILY group
                }

                // Persist Shared Mode and Current Group
                fetch(`${API_BASE_URL}/user/settings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appState.token}` },
                    body: JSON.stringify({ key: 'current_mode', value: 'shared' })
                });
                fetch(`${API_BASE_URL}/user/settings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appState.token}` },
                    body: JSON.stringify({ key: 'current_group', value: appState.currentGroupId })
                });

                await initializeListeners();
                updateUI();
            }
        }
    };

    if (document.getElementById('group-selector')) {
        document.getElementById('group-selector').onchange = async (e) => {
            appState.currentGroupId = e.target.value;

            // Persist Group Selection
            fetch(`${API_BASE_URL}/user/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appState.token}` },
                body: JSON.stringify({ key: 'current_group', value: appState.currentGroupId })
            });

            // Clear data before loading new group
            appState.transactions = [];
            appState.goals = [];
            appState.obligations = [];
            appState.budgets = [];

            await initializeListeners();
            updateUI();
        };
    }

    if (document.getElementById('manage-groups-btn')) {
        document.getElementById('manage-groups-btn').onclick = () => {
            appState.currentMainView = 'groups';
            localStorage.setItem('currentMainView', 'groups');
            updateUI();
        };
    }

    document.getElementById('wealth-btn').onclick = () => {
        appState.currentMainView = 'networth';
        localStorage.setItem('currentMainView', 'networth');
        updateUI();
    };

    document.getElementById('calendar-btn').onclick = () => {
        appState.currentMainView = 'calendar';
        localStorage.setItem('currentMainView', 'calendar');
        updateUI();
    };
}

const renderDashboard = () => {
    const summary = computeSummary();
    const dueAlertCount = appState.obligations.filter(o => !o.isPaid && isDueSoon(o.dueDate)).length;

    const familyHeaderHtml = appState.isShared ? renderFamilyHeader() : '';

    D.logoutBtn.textContent = T('LOGOUT');
    D.logoutBtn.classList.remove('hidden');
    D.headerDetails.classList.remove('hidden');

    D.mainContent.innerHTML = `
        <div id="dashboard-container" class="space-y-6 pb-20 select-none">
            ${familyHeaderHtml}

            <!-- Summary Text -->
            <div id="summary-section" class="px-2">
                <h1 class="text-2xl font-bold text-gray-800">
                    ${T(appState.isShared ? 'LEDGER_TITLE_SHARED' : 'LEDGER_TITLE_PRIVATE')}
                </h1>
                <p class="text-gray-500 text-sm">
                    ${appState.isShared
            ? T('SUMMARY_SHARED_SUBTITLE')
            : T('SUMMARY_PRIVATE_SUBTITLE')}
                </p>
            </div>

            <!-- Summary Cards -->
            <div id="summary-cards" class="grid grid-cols-3 gap-3 px-1">
                ${renderSummaryCards(summary)}
            </div>

            <!-- Main Actions Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <!-- Transaction Entry -->
                 <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transform transition-all duration-300 hover:shadow-md">
                     ${renderTransactionForm()}
                 </div>

                 <!-- Category Chart -->
                 <div id="chart-container" class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transform transition-all duration-300 hover:shadow-md">
                     <!-- Chart Rendered by JS -->
                 </div>
            </div>

            <!-- Trackers Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Obligations -->
                <div id="obligations-tracker-container" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <!-- JS Injected -->
                </div>
                 <!-- Goals -->
                <div id="goals-tracker-container" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <!-- JS Injected -->
                </div>
                 <!-- Budgets -->
                <div id="budgets-tracker-container" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <!-- JS Injected -->
                </div>
            </div>


            <!-- Transaction History -->
            <div id="history-container" class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all duration-300 hover:shadow-md">
                <!-- List Rendered by JS -->
            </div>
        </div>
    `;

    renderCategoryChart(summary.expensesByCategory);
    renderTransactionHistory();
    renderGoalTracker();
    renderObligationsTracker();
    renderBudgetsTracker();

    // Attach form listeners
    document.getElementById('transaction-form').onsubmit = handleAddTransaction;
    document.getElementById('voice-entry-btn').onclick = startVoiceRecognition; // Changed from startVoiceEntry
    document.getElementById('ai-analyze-btn').onclick = analyzeTransaction;

    // Type Toggles
    document.getElementById('type-expense-btn').onclick = () => {
        appState.type = 'expense';
        updateUI(); // Changed from renderDashboard()
    };
    document.getElementById('type-income-btn').onclick = () => {
        appState.type = 'income';
        updateUI(); // Changed from renderDashboard()
    };

    // Description Input Auto-Resize/Animate
    const descInput = document.getElementById('description-input');
    descInput.addEventListener('input', (e) => {
        appState.description = e.target.value;
        const aiBtn = document.getElementById('ai-analyze-btn');

        // Dynamically toggle disabled state
        aiBtn.disabled = appState.isAnalyzing || !appState.description.trim();

        if (appState.description.length > 5 && !appState.amount) {
            aiBtn.classList.add('animate-pulse');
        } else {
            aiBtn.classList.remove('animate-pulse');
        }
    });

    // Checkbox listener
    const bCheck = document.getElementById('is-business-checkbox');
    if (bCheck) {
        bCheck.onchange = (e) => {
            appState.isBusiness = e.target.checked;
            updateUI(); // Changed from renderDashboard()
        };
    }
    const gstInput = document.getElementById('gst-amount-input');
    if (gstInput) {
        gstInput.oninput = (e) => appState.gstAmount = e.target.value;
    }

    // Amount listener
    document.getElementById('amount-input').oninput = (e) => appState.amount = e.target.value;
};

// window.addMoneyToGoal = async (goalId) => {
//     const input = document.getElementById(`add-money-goal-${goalId}`);
//     const amountToAdd = parseFloat(input.value);

//     if (!amountToAdd || amountToAdd <= 0) {
//         setAlert('Please enter a valid amount to add.', 'error');
//         return;
//     }

//     const goal = appState.goals.find(g => g.id === goalId);
//     if (!goal) return;

//     const newSavedAmount = (goal.saved_amount || 0) + amountToAdd;

//     try {
//         const response = await fetch(`${API_BASE_URL}/goals/${goalId}/progress`, {
//             method: 'PUT',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${appState.token}`
//             },
//             body: JSON.stringify({ saved_amount: newSavedAmount })
//         });

//         if (!response.ok) throw new Error('Failed to update goal progress.');

//         // Update state and UI on success
//         goal.saved_amount = newSavedAmount;
//         input.value = ''; // Clear input
//         setAlert(`Successfully added ${formatCurrency(amountToAdd)} to your goal!`, 'success');
//         renderGoalTracker(); // Re-render just the goals section for efficiency
//     } catch (error) {
//         setAlert(error.message, 'error');
//     }
// };

window.addMoneyToGoal = async (goalId) => {
    const input = document.getElementById(`add-money-goal-${goalId}`);
    const amountToAdd = parseFloat(input.value);

    if (!amountToAdd || amountToAdd <= 0) {
        setAlert('Please enter a valid amount.', 'error');
        return;
    }

    const goal = appState.goals.find(g => g.id == goalId);
    if (!goal) return;

    // Ensure both values are numbers to prevent string concatenation
    const currentSaved = parseFloat(goal.savedAmount) || 0;
    const newSavedAmount = currentSaved + amountToAdd;

    try {
        const response = await secureFetch(`${API_BASE_URL}/goals/${goalId}/progress`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({ saved_amount: newSavedAmount })
        });

        if (!response.ok) throw new Error('Failed to update goal progress.');

        // Update local cache with camelCase property
        goal.savedAmount = newSavedAmount;

        input.value = '';
        setAlert(`Added ₹${amountToAdd} to goal ✅`, 'success');

        // Reload goals to ensure fresh data and trigger completion check
        await initializeListeners();

        // Trigger updateUI to check for goal completion and send email if needed
        updateUI();

    } catch (error) {
        setAlert(error.message, 'error');
    }
};

window.editBudget = async (id) => {
    const budget = appState.budgets.find(b => b.id === id);
    if (!budget) return;

    const newAmount = prompt(`Enter new budget amount for "${budget.category}":`, budget.amount);
    if (!newAmount || isNaN(parseFloat(newAmount)) || parseFloat(newAmount) <= 0) {
        if (newAmount !== null) setAlert('Please enter a valid positive number.', 'error');
        return;
    }

    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    try {
        await secureFetch(`${API_BASE_URL}/budgets`, {
            method: 'POST', // The backend uses POST for create/update (upsert)
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appState.token}` },
            body: JSON.stringify({ category: budget.category, amount: parseFloat(newAmount), monthYear })
        });
        setAlert('Budget updated successfully!', 'success');
        await initializeListeners();
        updateUI();
    } catch (error) {
        console.error('Error updating budget:', error);
        setAlert('Failed to update budget.', 'error');
    }
};

window.deleteBudget = async (id) => {
    if (!confirm("Are you sure you want to delete this budget?")) return;

    try {
        await secureFetch(`${API_BASE_URL}/budgets/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        setAlert('Budget deleted successfully!', 'success');
        await initializeListeners();
        updateUI();
    } catch (error) {
        console.error('Error deleting budget:', error);
        setAlert('Failed to delete budget.', 'error');
    }
};

const handleChangePassword = async (e) => {
    e.preventDefault(); // Prevent default form submission
    // This functionality requires a backend endpoint to change password for a logged-in user.
    // The current backend (server.js) only has a password reset endpoint.
    // For now, we will alert the user that this feature is not implemented.
    setAlert("Password change for logged-in users is not yet implemented. Please use the 'Forgot Password' feature if you need to reset it.", 'error');
    document.getElementById('new-password-input').value = ''; // Clear the input
    // Re-enable the button if it was disabled
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.disabled = false;
        changePasswordBtn.textContent = T('CHANGE_PASSWORD');
    }
};


const fetchUserProfile = async () => {
    const response = await secureFetch(`${API_BASE_URL}/user/profile`, {
        headers: { 'Authorization': `Bearer ${appState.token}` }
    });
    const data = await response.json();
    appState.emailAlertsEnabled = data.user.email_alerts_enabled;
    appState.isAdmin = data.user.is_admin; // Store admin status

    // Load Family Mode settings
    appState.currentGroupId = data.user.current_group;
    if (data.user.current_mode === 'shared') {
        appState.isShared = true;
    } else {
        appState.isShared = false;
    }
    // Note: We don't auto-set activeCurrency here as it's often preferred to keep session state, but could be added.
};

const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;
    appState.activeCurrency = newCurrency;

    try {
        await secureFetch(`${API_BASE_URL}/user/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({
                full_name: appState.userName,
                email_alerts_enabled: appState.emailAlertsEnabled,
                currency: newCurrency
            })
        });
        setAlert(T('CURRENCY_UPDATED').replace('%s', newCurrency), 'success');
        updateUI(); // Re-render the entire UI with the new currency
    } catch (error) {
        setAlert(T('FAILED_UPDATE_CURRENCY'), 'error');
    }
};

const loadProfileTabContent = async (tabName) => {
    const container = document.getElementById('profile-content');
    if (!container) return;

    // Update Tab Styles
    document.querySelectorAll('.profile-tab').forEach(btn => {
        btn.classList.remove('bg-white', 'text-gray-900', 'shadow-sm');
        btn.classList.add('bg-gray-100', 'text-gray-600', 'hover:bg-white');
    });
    const activeBtn = document.getElementById(`profile-${tabName}-tab`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-gray-100', 'text-gray-600', 'hover:bg-white');
        activeBtn.classList.add('bg-white', 'text-gray-900', 'shadow-sm');
    }

    container.innerHTML = '<div class="flex justify-center p-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>';

    switch (tabName) {
        case 'details':
            renderUserProfileDetails(container);
            break;
        case 'groups':
            import('./js/groups.js').then(module => {
                module.initGroups({ apiBaseUrl: API_BASE_URL, appState, setAlert, T });
                module.renderGroupsView(container);
            }).catch(e => {
                console.error(e);
                container.innerHTML = '<div class="text-red-500 text-center">Failed to load groups.</div>';
            });
            break;
        case 'badges':
            import('./js/gamification.js').then(module => {
                module.renderBadgesView(container, T);
            }).catch(e => {
                console.error(e);
                container.innerHTML = '<div class="text-red-500 text-center">Failed to load badges.</div>';
            });
            break;
        case 'challenges':
            import('./js/challenges.js').then(module => {
                module.initChallenges({ apiBaseUrl: API_BASE_URL, appState, setAlert });
                module.renderChallengesView(container);
            }).catch(e => {
                console.error(e);
                container.innerHTML = '<div class="text-red-500 text-center">Failed to load challenges.</div>';
            });
            break;
        case 'recurring':
            import('./js/recurring.js').then(module => {
                module.renderRecurringView(container, appState, API_BASE_URL);
            }).catch(e => {
                console.error(e);
                container.innerHTML = '<div class="text-red-500 text-center">Failed to load subscriptions.</div>';
            });
            break;
        case 'timetravel':
            import('./js/timetravel.js').then(module => {
                module.renderTimeTravelView(container, appState);
            }).catch(e => {
                console.error(e);
                container.innerHTML = '<div class="text-red-500 text-center">Failed to load time travel.</div>';
            });
            break;
        default:
            renderUserProfileDetails(container);
    }
};

// --- PAGE NAVIGATION ---
const renderPage = (pageName) => {
    import('./js/pages.js').then(module => {
        // Clear main content
        D.mainContent.innerHTML = '';

        // Render the page
        module.renderStaticPage(pageName, D.mainContent, T);

        // Update active state in footer/nav if needed
    }).catch(e => {
        console.error("Failed to load page: " + pageName, e);
    });
};
window.renderPage = renderPage;

const renderFooter = () => {
    const footer = document.getElementById('app-footer');
    if (!footer) return;

    footer.innerHTML = `
        <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            <!-- Tagline -->
            <p class="text-indigo-900 font-bold text-lg mb-4" style="font-family: 'Playfair Display', serif;">${T('FOOTER_TAGLINE')}</p>

            <!-- Navigation Links -->
            <div class="flex flex-wrap justify-center gap-6 mb-4 text-xs font-medium text-gray-500">
                <button onclick="window.renderPage('about')" class="hover:text-indigo-600 transition">${T('FOOTER_ABOUT')}</button>
                <button onclick="window.renderPage('contact')" class="hover:text-indigo-600 transition">${T('FOOTER_SUPPORT')}</button>
                <button onclick="window.renderPage('privacy')" class="hover:text-indigo-600 transition">${T('FOOTER_PRIVACY')}</button>
                <button onclick="window.renderPage('terms')" class="hover:text-indigo-600 transition">${T('FOOTER_TERMS')}</button>
            </div>

            <!-- Copyright -->
            <p class="text-xs text-gray-400">${T('FOOTER_COPYRIGHT')}</p>
        </div>
    `;
    footer.classList.remove('hidden');
};

const renderUserProfile = (initialTab = 'details') => { // This is now the main container for profile tabs
    D.mainContent.innerHTML = `
                <div id="profile-main-wrapper" class="p-4 space-y-6 transition-all duration-300">
                    <div id="profile-header-container" class="flex justify-between items-center border-b pb-2 mb-4">
                        <h2 class="text-3xl font-bold text-indigo-700">${T('PROFILE_TITLE')}</h2>
                    </div>

                    <!-- Profile Navigation Tabs -->
                    <div class="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto whitespace-nowrap scrollbar-hide w-full shadow-inner">
                        <button id="profile-details-tab" class="px-4 py-2 text-sm font-medium rounded-md transition profile-tab active bg-white text-gray-900 shadow-sm shrink-0">
                            👤 ${T('PROFILE_TAB_DETAILS')}
                        </button>
                        <button id="profile-groups-tab" class="px-4 py-2 text-sm font-medium rounded-md transition profile-tab bg-gray-100 text-gray-600 hover:bg-white shrink-0">
                            👥 ${T('PROFILE_TAB_GROUPS')}
                        </button>
                        <button id="profile-recurring-tab" class="px-4 py-2 text-sm font-medium rounded-md transition profile-tab bg-gray-100 text-gray-600 hover:bg-white shrink-0">
                            🔄 ${T('PROFILE_TAB_SUBSCRIPTIONS')}
                        </button>
                        <button id="profile-badges-tab" class="px-4 py-2 text-sm font-medium rounded-md transition profile-tab bg-gray-100 text-gray-600 hover:bg-white shrink-0">
                            🏆 ${T('PROFILE_TAB_BADGES')}
                        </button>
                        <button id="profile-timetravel-tab" class="px-4 py-2 text-sm font-medium rounded-md transition profile-tab bg-gray-100 text-gray-600 hover:bg-white shrink-0">
                            🔮 ${T('PROFILE_TAB_TIMETRAVEL')}
                        </button>
                        <button id="profile-challenges-tab" class="px-4 py-2 text-sm font-medium rounded-md transition profile-tab bg-gray-100 text-gray-600 hover:bg-white shrink-0">
                            🏁 ${T('PROFILE_TAB_CHALLENGES')}
                        </button>
                    </div>

                    <!-- Profile Content Container -->
                    <div id="profile-content" class="min-h-[600px]">
                        <!-- Content will be loaded here -->
                    </div>
                </div>
            `;

    document.getElementById('profile-details-tab').onclick = () => loadProfileTabContent('details');
    document.getElementById('profile-groups-tab').onclick = () => loadProfileTabContent('groups');
    document.getElementById('profile-badges-tab').onclick = () => loadProfileTabContent('badges');
    document.getElementById('profile-recurring-tab').onclick = () => loadProfileTabContent('recurring');
    document.getElementById('profile-timetravel-tab').onclick = () => loadProfileTabContent('timetravel');
    document.getElementById('profile-challenges-tab').onclick = () => loadProfileTabContent('challenges');

    loadProfileTabContent(initialTab); // Load default content
};

const renderUserProfileDetails = (container) => {
    const userEmail = appState.userEmail || T('ACCOUNT_ANONYMOUS');
    // With custom backend, a user is either logged in (permanent) or not.
    const accountType = appState.userEmail ? T('ACCOUNT_PERMANENT') : T('ACCOUNT_ANONYMOUS');
    const isPermanentUser = !!appState.userEmail;

    container.innerHTML = `
                <div class="space-y-6">
                    <!-- Account Type & Details Card (Professional Look) -->
                    <div class="bg-white p-6 rounded-xl shadow-2xl border border-gray-200">
                        <div class="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 class="text-xl font-bold text-gray-800">${T('ACCOUNT_TYPE')}</h3>
                            <span class="text-sm font-semibold px-3 py-1 rounded-full ${isPermanentUser ? 'bg-teal-100 text-teal-700' : 'bg-yellow-100 text-yellow-700'}">
                                ${accountType}
                            </span>
                        </div>

                        <div class="space-y-4">
                            <!-- Email -->
                            <div class="flex justify-between border-b border-dashed pb-2">
                                <span class="font-medium text-gray-600">${T('USER_EMAIL')}</span>
                                <span class="text-indigo-600 font-semibold truncate max-w-[50%]">${userEmail}</span>
                            </div>

                            <!-- User ID -->
                            <div class="flex justify-between items-center">
                                <span class="font-medium text-gray-600">${T('USER_ID_FULL')}</span>
                                <span class="text-gray-500 text-sm break-all max-w-[60%] font-mono">${appState.userId || 'N/A'}</span>
                            </div>
                        </div>
                    </div>


                    <!-- Currency Settings -->
                    <div class="bg-white p-6 rounded-xl shadow-2xl border border-gray-200">
                        <h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                            ${T('CURRENCY_PREFERENCE_TITLE')}
                        </h3>
                        <div class="flex items-center justify-between">
                            <label for="currency-selector" class="font-medium text-gray-600">${T('DISPLAY_CURRENCY_LABEL')}</label>
                            <select id="currency-selector" class="p-2 border border-gray-300 rounded-md">
                                <option value="INR" ${appState.activeCurrency === 'INR' ? 'selected' : ''}>INR (₹)</option>
                                <option value="IRR" ${appState.activeCurrency === 'IRR' ? 'selected' : ''}>IRR (﷼)</option>
                                <option value="USD" ${appState.activeCurrency === 'USD' ? 'selected' : ''}>USD ($)</option>
                                <option value="AED" ${appState.activeCurrency === 'AED' ? 'selected' : ''}>AED (د.إ)</option>
                                <option value="EUR" ${appState.activeCurrency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                                <option value="GBP" ${appState.activeCurrency === 'GBP' ? 'selected' : ''}>GBP (£)</option>
                            </select>
                        </div>
                    </div>

                    <!-- Email Alerts Settings -->
                    ${isPermanentUser ? `
                        <div class="bg-white p-6 rounded-xl shadow-2xl border border-gray-200">
                            <h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                                ${T('EMAIL_ALERTS_TITLE')}
                            </h3>
                            <div class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h4 class="font-medium text-gray-800">${T('ENABLE_EMAIL_NOTIFICATIONS')}</h4>
                                        <p class="text-sm text-gray-600">${T('EMAIL_NOTIFICATIONS_DESC')}</p>
                                    </div>
                                    <label class="flex items-center cursor-pointer">
                                        <input type="checkbox" id="email-alerts-toggle" ${appState.emailAlertsEnabled ? 'checked' : ''}
                                                class="sr-only peer">
                                        <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Change Password Card (Only for Permanent Users) -->
                    ${isPermanentUser ? `
                        <div class="bg-white p-6 rounded-xl shadow-2xl border border-gray-200">
                            <h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                                ${T('CHANGE_PASSWORD')}
                            </h3>
                            <form id="change-password-form" class="space-y-4">
                                <div>
                                    <label for="new-password-input" class="sr-only">New Password</label>
                                    <input type="password" id="new-password-input" required placeholder="${T('NEW_PASSWORD_PLACEHOLDER')}"
                                            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-gray-900" />
                                </div>
                                <button type="submit" id="change-password-btn" class="w-full py-3 px-4 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition duration-150">
                                    ${T('CHANGE_PASSWORD')}
                                </button>
                            </form>
                        </div>
                    ` : ''}

                    <!-- Danger Zone -->
                    <div class="bg-white p-6 rounded-xl shadow-2xl border border-red-200">
                        <h3 class="text-xl font-bold text-red-800 mb-4 border-b border-red-100 pb-2">
                            ${T('DELETE_ACCOUNT_TITLE')}
                        </h3>
                        <div class="space-y-4">
                            <p class="text-sm text-gray-600">
                                ${T('DELETE_ACCOUNT_WARNING')}
                            </p>
                            <button id="delete-account-btn" class="w-full py-3 px-4 rounded-lg text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition duration-150">
                                ${T('DELETE_ACCOUNT_BUTTON')}
                            </button>
                        </div>
                    </div>
                </div>
            `;

    // Attach event listeners
    if (isPermanentUser) {
        document.getElementById('change-password-form').onsubmit = handleChangePassword;

        document.getElementById('email-alerts-toggle').onchange = (e) => {
            appState.emailAlertsEnabled = e.target.checked;
            setAlert(`${T('EMAIL_ALERTS_STATUS')} ${e.target.checked ? T('ENABLED') : T('DISABLED')}`, 'success');
        };
        document.getElementById('currency-selector').onchange = handleCurrencyChange;
    }

    // Attach listener for delete account (available to all users)
    const deleteBtn = document.getElementById('delete-account-btn');
    if (deleteBtn) {
        deleteBtn.onclick = handleDeleteAccount;
    }
};

const handleDeleteAccount = async () => {
    if (!confirm(T('DELETE_CONFIRM_TEXT'))) {
        return;
    }

    // Double confirmation
    const email = prompt(T('DELETE_CONFIRM_EMAIL'));
    if (!email) return;

    // Simple client-side check to prevent typos (optional)
    // In a real app, you might match this against appState.userEmail

    try {
        const response = await secureFetch(`${API_BASE_URL}/user/profile`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({ email_confirmation: email }) // Send email for backend verification if needed
        });

        if (response.ok) {
            alert(T('ACCOUNT_DELETED'));
            handleLogout();
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete account');
        }
    } catch (error) {
        setAlert(error.message, 'error');
    }
};


const renderAuthUI = () => {
    D.logoutBtn.classList.add('hidden');
    D.headerDetails.classList.add('hidden');

    const isLogin = appState.authView === 'login';
    const title = isLogin ? T('LOGIN_TITLE') : T('CREATE_TITLE');
    const buttonText = isLogin ? T('LOGIN_BUTTON') : T('CREATE_BUTTON');
    const linkText = isLogin ? T('NEED_ACCOUNT') : T('ALREADY_ACCOUNT');

    D.mainContent.innerHTML = `
                <div class="flex items-center justify-center min-h-[80vh] px-4">
                    <div class="w-full max-w-sm p-8 mt-12 auth-card rounded-xl" style="animation: flipIn 0.7s ease-out;">
                        <h2 class="text-3xl font-extrabold text-indigo-700 text-center mb-6">${title}</h2>

                        <form id="auth-form" class="space-y-6">
                            <div>
                                <label for="email" class="sr-only">Email</label>
                                <input type="email" id="auth-email" required placeholder="${T('EMAIL_PLACEHOLDER')}"
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" />
                            </div>

                            <div>
                                <label for="password" class="sr-only">Password</label>
                                <input type="password" id="auth-password" required placeholder="${T('PASSWORD_PLACEHOLDER')}"
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" />
                            </div>

                            <button type="submit" id="auth-submit-btn" class="auth-button w-full py-3 px-4 rounded-lg text-lg font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition duration-150">
                                ${buttonText}
                            </button>
                        </form>

                        ${isLogin ? `
                            <div class="mt-4 text-center">
                                <button id="forgot-password-btn" class="text-sm font-medium text-red-500 hover:text-red-700 transition duration-150">
                                    ${T('FORGOT_PASSWORD_LINK')}
                                </button>
                            </div>
                        ` : ''}

                        <div class="mt-6 text-center">
                            <button id="auth-toggle-view" class="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition duration-150">
                                ${linkText}
                            </button>
                        </div>
                    </div>
                </div>
            `;

    // Attach Auth Event Listeners
    document.getElementById('auth-toggle-view').onclick = () => {
        appState.authView = isLogin ? 'create' : 'login';
        renderAuthUI();
    };
    document.getElementById('auth-form').onsubmit = (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;

        // --- FIX: Client-side password validation to prevent auth/weak-password error ---
        if (!isLogin && password.length < 6) {
            setAlert(T('PASSWORD_VALIDATION_ERROR'), 'error');
            return;
        }

        if (isLogin) {
            handleLogin(email, password);
        } else {
            handleCreateAccount(email, password);
        }
    };

    if (isLogin) {
        document.getElementById('forgot-password-btn').onclick = handleForgotPassword;
    }

    // Hide FAB when on auth screen
    D.fabContainer.innerHTML = '';
    D.chatWindowContainer.innerHTML = '';
};

const renderSummaryCards = (summary) => {
    const { totalIncome, totalExpense, netBalance } = summary;
    const balanceColor = netBalance > 0 ? 'text-green-600' : (netBalance < 0 ? 'text-red-600' : 'text-gray-800');
    const balanceSign = netBalance >= 0 ? '₹' : '-₹';
    const balanceValue = formatCurrency(Math.abs(netBalance)).replace('₹', '').trim();

    return `
                <div class="p-3 bg-green-100 rounded-lg text-center shadow-sm card-flip-animation" style="animation-delay: 0s;">
                    <p class="text-xs text-green-700 font-medium">${T('TOTAL_INCOME')}</p>
                    <p class="text-sm sm:text-lg font-bold text-green-600">${formatCurrency(totalIncome)}</p>
                </div>
                <div class="p-3 bg-red-100 rounded-lg text-center shadow-sm card-flip-animation" style="animation-delay: 0.1s;">
                    <p class="text-xs text-red-700 font-medium">${T('TOTAL_EXPENSE')}</p>
                    <p class="text-sm sm:text-lg font-bold text-red-600">${formatCurrency(totalExpense)}</p>
                </div>
                <div class="p-3 rounded-lg text-center shadow-md ${netBalance >= 0 ? 'bg-indigo-100' : 'bg-yellow-100'} card-flip-animation" style="animation-delay: 0.2s;">
                    <p class="text-xs text-gray-700 font-medium">${T('NET_BALANCE')}</p>
                    <p class="text-sm sm:text-lg font-extrabold ${balanceColor}">
                        ${formatCurrency(netBalance)}
                    </p>
                </div>
            `;
};

// --- FAMILY / GROUP DASHBOARD HEADER ---
const renderFamilyHeader = () => {
    if (!appState.isShared) return '';

    // If no group is selected or groups list is empty (after switch), show Create prompt
    // This handles the "Group Not Found" by preventing the header from rendering broken state
    if (!appState.currentGroupId || !appState.groups.find(g => g.id == appState.currentGroupId)) {
        return `
            <div id="family-header-container" class="mb-6 p-4 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl shadow-lg text-white flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold"><i class="fas fa-users"></i> ${T('FAMILY_HEADER_TITLE')}</h2>
                    <p class="text-teal-100 text-sm mt-1">${T('FAMILY_HEADER_SUBTITLE')}</p>
                </div>
                <button onclick="openCreateGroupModalWrapper('family')" class="bg-white text-teal-600 px-4 py-2 rounded-lg font-bold shadow hover:bg-teal-50 transition">
                    ${T('CREATE_FAMILY_GROUP')}
                </button>
            </div>
        `;
    }

    const currentGroup = appState.groups.find(g => g.id == appState.currentGroupId);
    const groupName = currentGroup ? currentGroup.group_name : 'Family Group';
    const members = appState.currentGroupMembers || [];
    const memberCount = members.length > 0 ? members.length : (currentGroup.member_count || 1);

    // Avatar list
    const avatars = members.map(m => `
        <div class="w-8 h-8 rounded-full bg-teal-200 border-2 border-white flex items-center justify-center text-xs font-bold text-teal-800 -ml-2 first:ml-0" title="${m.user_name}">
            ${m.user_name ? m.user_name.charAt(0).toUpperCase() : '?'}
        </div>
    `).join('');

    // List available family groups for the dropdown
    const familyGroups = appState.groups.filter(g => g.group_type === 'family');

    return `
        <div id="family-header-container" class="mb-6 p-4 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl shadow-lg text-white">
            <div class="flex justify-between items-start">
                <div>
                    <h2 class="text-2xl font-bold flex items-center gap-2">
                        <i class="fas fa-home"></i> ${groupName} ${T('DASHBOARD_SUFFIX')}
                    </h2>
                    <p class="text-teal-100 text-sm mt-1">${T('SHARED_FAMILY_LEDGER')}</p>

                    <div class="flex items-center mt-3 ml-2">
                        ${avatars}
                        <div class="ml-3 text-xs text-teal-100">${memberCount} ${T('MEMBERS_COUNT')}</div>
                    </div>
                </div>
                <div class="flex gap-2">
                     <div class="relative inline-block text-left">
                        <select id="header-group-selector" onchange="appState.currentGroupId = this.value; fetch('${API_BASE_URL}/user/settings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + appState.token }, body: JSON.stringify({ key: 'current_group', value: this.value }) }); appState.transactions=[]; appState.goals=[]; initializeListeners().then(updateUI);" class="bg-teal-700 text-white text-sm rounded-lg px-2 py-1 outline-none border border-teal-600 hover:bg-teal-800 transition">
                            ${familyGroups.map(g => `<option value="${g.id}" ${g.id == appState.currentGroupId ? 'selected' : ''}>${g.group_name}</option>`).join('')}
                        </select>
                    </div>
                    <button onclick="triggerInviteFlow(${appState.currentGroupId})" class="bg-white text-teal-600 px-3 py-2 rounded-lg text-sm font-bold shadow hover:bg-teal-50 transition flex items-center gap-1">
                        <i class="fas fa-user-plus"></i> ${T('INVITE_BUTTON')}
                    </button>
                </div>
            </div>
        </div>
    `;
};

// --- INVITE FLOW LOGIC ---
const triggerInviteFlow = async (groupId) => {
    try {
        const response = await secureFetch(`${API_BASE_URL}/groups/${groupId}/invite`, {
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to generate link');
        }

        const data = await response.json();
        const link = `${window.location.origin}/?join=${data.invite_token}`;

        showInviteModal(link);

    } catch (error) {
        console.error('Error inviting member:', error);
        setAlert(error.message, 'error');
    }
};
window.triggerInviteFlow = triggerInviteFlow; // Make globally accessible

const showInviteModal = (link) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-fade-in relative">
            <button class="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onclick="this.closest('.fixed').remove()">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div class="text-center mb-4">
                <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                </div>
                <h3 class="text-lg font-bold text-gray-800">${T('INVITE_MODAL_TITLE')}</h3>
                <p class="text-sm text-gray-500">${T('INVITE_MODAL_SUBTITLE')}</p>
            </div>

            <div class="bg-gray-50 p-3 rounded-lg break-all text-xs text-gray-600 font-mono border border-gray-200 mb-4 select-all">
                ${link}
            </div>

            <button onclick="navigator.clipboard.writeText('${link}').then(() => { this.innerText = '${T('COPIED')}'; setTimeout(() => this.innerText = '${T('COPY_LINK')}', 2000); })"
                    class="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition">
                ${T('COPY_LINK')}
            </button>
        </div>
    `;
    document.body.appendChild(modal);
};
window.showInviteModal = showInviteModal; // Make globally accessible

const renderTransactionForm = () => {
    const isExpense = appState.type === 'expense';
    return `
                <form id="transaction-form" class="p-4">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                        ${T('SMART_ENTRY_TITLE')}
                    </h2>

                    <!-- Type Selector Tabs -->
                    <div class="flex mb-4">
                        <button type="button" id="type-expense-btn"
                            class="flex-1 py-2 text-center font-medium rounded-l-lg transition ${isExpense ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
                            ${T('EXPENSE')}
                        </button>
                        <button type="button" id="type-income-btn"
                            class="flex-1 py-2 text-center font-medium rounded-r-lg transition ${!isExpense ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
                            ${T('INCOME')}
                        </button>
                    </div>

                    <!-- Description/AI/Voice Input -->
                    <div class="space-y-3">
                        <div>
                            <label for="description-input" class="block text-sm font-medium text-gray-700">${T('DESCRIPTION_LABEL')}</label>
                            <div class="flex space-x-1 sm:space-x-2">
                                <button type="button" id="voice-entry-btn" class="mt-1 flex-shrink-0 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition duration-150 text-sm">
                                    <i class="fas fa-microphone h-5 w-5 flex items-center justify-center"></i>
                                </button>
                                <input
                                    id="description-input" type="text" value="${appState.description}"
                                    placeholder="${T('DESCRIPTION_PLACEHOLDER')}" required
                                    class="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <button
                                    type="button" id="ai-analyze-btn" ${appState.isAnalyzing || !appState.description.trim() ? 'disabled' : ''}
                                    class="mt-1 flex-shrink-0 px-4 py-2 bg-indigo-500 text-white font-semibold rounded-md hover:bg-indigo-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-150 text-sm"
                                >
                                    ${appState.isAnalyzing ? T('THINKING_BUTTON') : T('AI_ANALYZE_BUTTON')}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Category & Amount & GST -->
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                        <div>
                            <label for="category-display" class="block text-sm font-medium text-gray-700">${T('CATEGORY_LABEL')}</label>
                            <div id="category-display" class="mt-1 block w-full p-3 bg-indigo-50 border border-indigo-300 rounded-md text-sm font-semibold text-indigo-800 truncate">
                                ${appState.category}
                            </div>
                        </div>
                        <div>
                            <label for="amount-input" class="block text-sm font-medium text-gray-700">${T('AMOUNT_LABEL')}</label>
                            <input id="amount-input" type="number" value="${appState.amount}"
                                placeholder="${T('AMOUNT_PLACEHOLDER')}" required min="1"
                                class="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                            />
                        </div>

                        <!-- Business & GST Fields -->
                        ${isExpense ? `
                            <div class="flex flex-col justify-end">
                                <label class="flex items-center text-sm font-medium text-gray-700 mb-1">
                                    <input type="checkbox" id="is-business-checkbox" ${appState.isBusiness ? 'checked' : ''}
                                        class="h-4 w-4 text-indigo-600 border-gray-300 rounded mr-2" />
                                    ${T('BUSINESS_RELATED')}
                                </label>
                                <input type="number" id="gst-amount-input" value="${appState.gstAmount}"
                                    placeholder="${T('GST_AMOUNT')}" ${!appState.isBusiness ? 'disabled' : ''}
                                    class="mt-1 block w-full p-3 border rounded-md text-sm ${!appState.isBusiness ? 'bg-gray-100' : 'border-gray-300 focus:ring-indigo-500'}"
                                />
                            </div>
                        ` : '<div></div>'}
                    </div>

                    <button type="submit" ${appState.isSaving ? 'disabled' : ''}
                        class="mt-6 w-full py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition duration-150"
                    >
                        ${appState.isSaving ? T('SAVING_BUTTON') : T(isExpense ? 'RECORD_DEBIT' : 'RECORD_CREDIT')}
                    </button>
                </form>
            `;
};

const renderGoalTracker = () => {
    const container = document.getElementById('goals-tracker-container');
    const [showForm, setShowForm] = [container.dataset.showForm === 'true', (value) => {
        container.dataset.showForm = value;
        renderGoalTracker();
    }];

    const visibleGoals = appState.goals.slice(0, appState.visibleGoalsCount);
    const hasMoreGoals = appState.goals.length > appState.visibleGoalsCount;
    const showLessGoals = appState.visibleGoalsCount > 3;


    const goalCards = visibleGoals.map(goal => {
        const remaining = goal.targetAmount - (goal.savedAmount || 0);
        const progress = Math.min(100, ((goal.savedAmount || 0) / goal.targetAmount) * 100);
        const diffDays = Math.max(1, (new Date(goal.targetDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const requiredDaily = (remaining / diffDays);
        const isCompleted = remaining <= 0;

        return `
                    <div class="p-4 rounded-xl shadow-md transition ${isCompleted ? 'bg-teal-100 border-2 border-teal-500' : 'bg-blue-50 border border-blue-200'}">
                        <div class="flex justify-between items-center mb-2">
                            <h3 class="font-bold text-lg text-gray-800">${goal.name}</h3>
                            <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${isCompleted ? 'bg-teal-500 text-white' : 'bg-blue-200 text-blue-800'}">
                                ${isCompleted ? T('GOAL_COMPLETED') : formatDate(new Date(goal.targetDate))}
                            </span>
                        </div>

                        <p class="text-sm text-gray-600 mb-2">
                            Target: <span class="font-bold">${formatCurrency(goal.targetAmount)}</span>
                        </p>

                        <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                            <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${progress}%;"></div>
                        </div>
                        <div class="flex justify-between text-xs text-gray-600 mb-3">
                            <span>${formatCurrency(goal.savedAmount || 0)} Saved</span>
                            <span>${formatCurrency(remaining > 0 ? remaining : 0)} Remaining</span>
                        </div>

                        ${!isCompleted ? `
                            <div class="text-center bg-white p-2 rounded-lg border border-dashed border-blue-300">
                                <p class="text-xs font-medium text-blue-700">
                                    ${T('REQUIRED_DAILY')}: <span class="font-extrabold text-base">${formatCurrency(requiredDaily)}</span>
                                </p>
                            </div>
                            <div class="mt-3 text-center">
                                <input id="add-money-goal-${goal.id}" type="number" placeholder="e.g. 200"
                                       class="w-24 border p-1 rounded text-sm mr-2" />
                                <button onclick="addMoneyToGoal('${goal.id}')"
                                        class="bg-green-600 text-white px-3 py-1 rounded text-sm">Add</button>
                            </div>
                        ` : ''}

                        <div class="flex justify-end space-x-3 mt-3 pt-2 border-t border-gray-200">
                           <button class="text-xs text-blue-600 hover:underline" onclick="window.editGoal(${goal.id}, '${goal.name.replace(/'/g, "\\'")}', ${goal.targetAmount}, '${goal.targetDate.toISOString().split('T')[0]}')">Edit</button>
                           <button class="text-xs text-red-600 hover:underline" onclick="window.deleteGoal(${goal.id})">Delete</button>
                        </div>
                    </div>
                `;
    }).join('');

    container.innerHTML = `
                <div class="p-4">
                    <div class="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 class="text-xl font-semibold text-gray-800">${T('GOALS_TITLE')} (${appState.goals.length})</h2>
                        <button id="add-goal-toggle" class="text-sm bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition">
                            ${showForm ? 'Close' : T('ADD_NEW_GOAL')}
                        </button>
                    </div>

                    <!-- Goal Form -->
                    ${showForm ? `
                        <form id="goal-form" class="p-4 mb-4 bg-white rounded-xl shadow-inner space-y-3">
                            <input name="goalName" placeholder="${T('GOAL_NAME')}" required class="w-full p-2 border rounded" />
                            <input name="targetAmount" type="number" placeholder="${T('GOAL_TARGET')}" required min="1" class="w-full p-2 border rounded" />
                            <label class="text-sm text-gray-600 block mt-2">${T('GOAL_DATE')}</label>
                            <input name="targetDate" type="date" required class="w-full p-2 border rounded" />
                            <button type="submit" class="w-full py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700">
                                ${T('SAVE_GOAL_BUTTON')}
                            </button>
                        </form>
                    ` : ''}

                    ${appState.goals.length === 0 ? `
                        <p class="text-gray-500 text-center py-4">Set a savings goal to start planning!</p>
                    ` : `
                        <div class="space-y-4">
                            ${goalCards}
                        </div>

                        <!-- Show More/Less Buttons -->
                        <div class="mt-4 flex justify-center space-x-4">
                            ${hasMoreGoals ? `
                                <button id="show-more-goals" class="text-sm font-medium text-blue-600 hover:underline">Show More</button>
                            ` : ''}
                            ${showLessGoals ? `
                                <button id="show-less-goals" class="text-sm font-medium text-gray-600 hover:underline">Show Less</button>
                            ` : ''}
                        </div>

                    `}
                </div>
            `;

    // Attach event listeners for Goal Tracker
    document.getElementById('add-goal-toggle').onclick = () => setShowForm(!showForm);
    if (showForm) document.getElementById('goal-form').onsubmit = handleAddGoal;

    if (hasMoreGoals) {
        document.getElementById('show-more-goals').onclick = () => {
            appState.visibleGoalsCount += 3;
            renderGoalTracker();
        };
    }
    if (showLessGoals) {
        document.getElementById('show-less-goals').onclick = () => {
            appState.visibleGoalsCount = 3;
            renderGoalTracker();
        };
    }
};

const renderObligationsTracker = () => {
    const container = document.getElementById('obligations-tracker-container');
    const [showForm, setShowForm] = [container.dataset.showForm === 'true', (value) => {
        container.dataset.showForm = value;
        renderObligationsTracker();
    }];

    const visibleObligations = appState.obligations.slice(0, appState.visibleObligationsCount);
    const hasMoreObligations = appState.obligations.length > appState.visibleObligationsCount;
    const showLessObligations = appState.visibleObligationsCount > 3;


    const obligationCards = visibleObligations.map(obligation => {
        const isAlert = isDueSoon(obligation.dueDate) && !obligation.isPaid;
        const daysLeft = Math.ceil((new Date(obligation.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        return `
                    <div class="p-3 rounded-xl flex justify-between items-center shadow-sm transition ${isAlert ? 'bg-yellow-100 border-l-4 border-yellow-500' : (obligation.isPaid ? 'bg-green-50 border-l-4 border-green-300' : 'bg-white border-l-4 border-gray-300')}">
                        <div>
                            <h3 class="font-semibold text-gray-800">${obligation.description}</h3>
                            <p class="text-sm text-gray-500">
                                ${T('DUE_DATE')}: <span class="font-medium text-red-600">${formatDate(new Date(obligation.dueDate))}</span>
                                ${!obligation.isPaid && daysLeft >= 0 ? `<span class="ml-2 text-xs font-bold text-yellow-700">(${daysLeft} days left)</span>` : ''}
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="font-extrabold text-lg text-red-600 mb-1">${formatCurrency(obligation.amount)}</p>
                            ${obligation.isPaid ? `
                                <div class="flex space-x-2 justify-end">
                                    <button disabled class="text-xs bg-gray-400 text-white px-3 py-1 rounded-full cursor-not-allowed">
                                        Paid
                                    </button>
                                    <button onclick="window.deleteObligation('${obligation.id}')" class="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
                                </div>
                            ` : `
                                <div class="flex space-x-2 justify-end">
                                    <button data-id="${obligation.id}" class="mark-paid-btn text-xs bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-600 transition">
                                        ${T('MARK_PAID')}
                                    </button>
                                    <button onclick="window.deleteObligation('${obligation.id}')" class="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
                                </div>
                            `}
                        </div>
                    </div>
                `;
    }).join('');

    container.innerHTML = `
                <div class="p-4">
                    <div class="flex justify-between items-center mb-4 border-b pb-2">
                        <div class="flex items-center space-x-2">
                            <h2 class="text-xl font-semibold text-gray-800">${T('OBLIGATIONS_TITLE')} (${appState.obligations.length})</h2>
                            ${appState.obligations.length > 0 ? `<button onclick="window.clearAllObligations()" class="text-xs text-red-500 hover:text-red-700">Clear All</button>` : ''}
                        </div>
                        <button id="add-obligation-toggle" class="text-sm bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition">
                            ${showForm ? 'Close' : T('ADD_OBLIGATION')}
                        </button>
                    </div>

                    <!-- Obligation Form -->
                    ${showForm ? `
                        <form id="obligation-form" class="p-4 mb-4 bg-white rounded-xl shadow-inner space-y-3">
                            <input name="obligationDescription" placeholder="What is due? (e.g., Credit Card Bill)" required class="w-full p-2 border rounded" />
                            <input name="obligationAmount" type="number" placeholder="${T('AMOUNT_LABEL')}" required min="1" class="w-full p-2 border rounded" />
                            <label class="text-sm text-gray-600 block mt-2">${T('DUE_DATE')}</label>
                            <input name="obligationDueDate" type="date" required class="w-full p-2 border rounded" />
                            <button type="submit" class="w-full py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700">
                                ${T('ADD_OBLIGATION')}
                            </button>
                        </form>
                    ` : ''}

                    ${appState.obligations.length === 0 ? `
                        <p class="text-gray-500 text-center py-4">${T('NO_OBLIGATIONS')}</p>
                    ` : `
                        <div class="space-y-3">
                            ${obligationCards}
                        </div>

                        <!-- Show More/Less Buttons -->
                        <div class="mt-4 flex justify-center space-x-4">
                            ${hasMoreObligations ? `
                                <button id="show-more-obligations" class="text-sm font-medium text-blue-600 hover:underline">Show More</button>
                            ` : ''}
                            ${showLessObligations ? `
                                <button id="show-less-obligations" class="text-sm font-medium text-gray-600 hover:underline">Show Less</button>
                            ` : ''}
                        </div>

                    `}
                </div>
            `;

    // Attach event listeners for Obligations Tracker
    document.getElementById('add-obligation-toggle').onclick = () => setShowForm(!showForm);
    if (showForm) document.getElementById('obligation-form').onsubmit = handleAddObligation;

    if (hasMoreObligations) {
        document.getElementById('show-more-obligations').onclick = () => {
            appState.visibleObligationsCount += 3;
            renderObligationsTracker();
        };
    }
    if (showLessObligations) {
        document.getElementById('show-less-obligations').onclick = () => {
            appState.visibleObligationsCount = 3;
            renderObligationsTracker();
        };
    }

    document.querySelectorAll('.mark-paid-btn').forEach(button => {
        button.onclick = () => {
            const obligationId = button.dataset.id;
            const obligation = appState.obligations.find(o => o.id == obligationId);
            if (obligation) markObligationPaid(obligation);
        };
    });
};

const renderBudgetsTracker = () => {
    const container = document.getElementById('budgets-tracker-container');
    if (!container) return;

    const [showForm, setShowForm] = [container.dataset.showForm === 'true', (value) => {
        container.dataset.showForm = value;
        renderBudgetsTracker();
    }];

    const visibleBudgets = (appState.budgets || []).slice(0, appState.visibleBudgetsCount);
    const hasMoreBudgets = (appState.budgets || []).length > appState.visibleBudgetsCount;
    const showLessBudgets = appState.visibleBudgetsCount > 3;

    const budgetCards = visibleBudgets.map(budget => {
        const spent = budget.spent_amount || 0;
        const remaining = budget.amount - spent;
        const progress = Math.min(100, (spent / budget.amount) * 100);
        const isExceeded = remaining < 0;

        return `
                    <div class="p-4 rounded-xl shadow-md transition ${isExceeded ? 'bg-red-100 border-2 border-red-500' : 'bg-purple-50 border border-purple-200'}">
                        <div class="flex justify-between items-center mb-2">
                            <h3 class="font-bold text-lg text-gray-800">${budget.category}</h3>
                            <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${isExceeded ? 'bg-red-500 text-white' : 'bg-purple-200 text-purple-800'}">
                                ${isExceeded ? 'Exceeded' : 'On Track'}
                            </span>
                        </div>

                        <p class="text-sm text-gray-600 mb-2">
                            Budget: <span class="font-bold">${formatCurrency(budget.amount, budget.currency)}</span>
                        </p>

                        <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                            <div class="${isExceeded ? 'bg-red-600' : 'bg-purple-600'} h-2.5 rounded-full" style="width: ${progress}%;"></div>
                        </div>
                        <div class="flex justify-between text-xs text-gray-600 mb-3">
                            <span>${formatCurrency(spent, budget.currency)} Spent</span>
                            <span class="${isExceeded ? 'text-red-600 font-bold' : ''}">${formatCurrency(remaining, budget.currency)} Remaining</span>
                        </div>

                        <div class="flex justify-end space-x-3 mt-3 pt-2 border-t border-purple-200">
                           <button class="text-xs text-blue-600 hover:underline" onclick="editBudget(${budget.id})">Edit</button>
                           <button class="text-xs text-red-600 hover:underline" onclick="deleteBudget(${budget.id})">Delete</button>
                        </div>
                    </div>
                `;
    }).join('');

    container.innerHTML = `
                <div class="p-4">
                    <div class="flex justify-between items-center mb-4 border-b pb-2">
                        <div class="flex items-center space-x-2">
                            <h2 class="text-xl font-semibold text-gray-800">${T('budgets_title')} (${(appState.budgets || []).length})</h2>
                            ${(appState.budgets || []).length > 0 ? `<button onclick="window.clearAllBudgets()" class="text-xs text-red-500 hover:text-red-700">Clear All</button>` : ''}
                        </div>
                        <button id="add-budget-toggle" class="text-sm bg-purple-500 text-white px-3 py-1 rounded-full hover:bg-purple-600 transition">
                            ${showForm ? 'Close' : T('add_new_budget')}
                        </button>
                    </div>

                    ${showForm ? `
                        <form id="budget-form" class="p-4 mb-4 bg-white rounded-xl shadow-inner space-y-3">
                            <input name="budgetCategory" placeholder="${T('budget_category')}" required class="w-full p-2 border rounded" />
                            <input name="budgetAmount" type="number" placeholder="${T('budget_amount')}" required min="1" class="w-full p-2 border rounded" />
                            <button type="submit" class="w-full py-2 bg-purple-600 text-white rounded font-medium hover:bg-purple-700">${T('add_budget_button')}</button>
                        </form>
                    ` : ''}

                    ${(appState.budgets || []).length === 0 ? `<p class="text-gray-500 text-center py-4">Set a budget to track your spending!</p>` : `
                        <div class="space-y-4">${budgetCards}</div>
                        <!-- Show More/Less Buttons -->
                        <div class="mt-4 flex justify-center space-x-4">
                            ${hasMoreBudgets ? `
                                <button id="show-more-budgets" class="text-sm font-medium text-blue-600 hover:underline">Show More</button>
                            ` : ''}
                            ${showLessBudgets ? `
                                <button id="show-less-budgets" class="text-sm font-medium text-gray-600 hover:underline">Show Less</button>
                            ` : ''}
                        </div>
                    `}
                </div>
            `;

    document.getElementById('add-budget-toggle').onclick = () => setShowForm(!showForm);
    if (showForm) document.getElementById('budget-form').onsubmit = handleAddBudget;

    if (hasMoreBudgets) {
        document.getElementById('show-more-budgets').onclick = () => {
            appState.visibleBudgetsCount += 3;
            renderBudgetsTracker();
        };
    }
    if (showLessBudgets) {
        document.getElementById('show-less-budgets').onclick = () => {
            appState.visibleBudgetsCount = 3;
            renderBudgetsTracker();
        };
    }
};

const renderCategoryChart = (expensesByCategory) => {
    const container = document.getElementById('chart-container');
    const categories = Object.keys(expensesByCategory);
    if (categories.length === 0) {
        container.innerHTML = '';
        return;
    }

    // Sort categories by amount and take the top 7
    const sortedCategories = Object.entries(expensesByCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 7);

    if (sortedCategories.length === 0) return;

    const maxAmount = sortedCategories[0][1]; // The highest amount is the first one
    const barHeight = 20;
    const height = sortedCategories.length * (barHeight + 10);

    let chartSVG = sortedCategories.map(([category, amount], index) => {
        const widthPercentage = (amount / maxAmount) * 100;
        const y = index * (barHeight + 10);
        const color = `hsl(${index * 50}, 70%, 50%)`;

        return `
                    <g transform="translate(0, ${y})">
                        <rect
                            x="90" y="0"
                            width="${widthPercentage * 2.5}px"
                            height="${barHeight}"
                            fill="${color}" rx="5"
                        />
                        <text x="0" y="${barHeight / 2 + 5}" font-size="12" fill="#4b5563" font-weight="bold" class="truncate w-10">${category}</text>
                        <text
                            x="${95 + (widthPercentage * 2.5)}" y="${barHeight / 2 + 5}"
                            font-size="12" fill="#1f2937" font-weight="semibold"
                        >
                            ${formatCurrency(amount)}
                        </text>
                    </g>
                `;
    }).join('');

    container.innerHTML = `
                <div class="w-full">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Spending Distribution (AI Categories)</h3>
                    <svg width="100%" height="${height}" viewBox="0 0 350 ${height}" class="overflow-visible">
                        ${chartSVG}
                    </svg>
                </div>
            `;
};

const renderTransactionHistory = () => {
    const container = document.getElementById('history-container');

    if (appState.transactions.length === 0) {
        if (appState.isShared) {
            container.innerHTML = `
                <div class="flex justify-between items-center mb-4 border-b pb-2">
                     <h2 class="text-xl font-semibold text-gray-800">${T('HISTORY_TITLE')}</h2>
                     <button onclick="clearAllTransactions()" class="text-xs text-red-600 hover:text-red-800 font-medium">Clear All</button>
                </div>
                <div class="text-center py-10 px-4 bg-teal-50 rounded-xl border border-teal-100">
                    <div class="text-4xl mb-4">👨‍👩‍👧‍👦</div>
                    <h3 class="text-lg font-bold text-teal-800 mb-2">Welcome to your Family Ledger!</h3>
                    <p class="text-sm text-teal-600 mb-4">Start tracking shared expenses with your group.</p>
                    <button onclick="window.triggerInviteFlow(${appState.currentGroupId})" class="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 transition shadow">
                        Invite Family Members
                    </button>
                    <p class="text-xs text-gray-500 mt-4">Expenses added here are visible to all group members.</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                    <div class="flex justify-between items-center mb-4 border-b pb-2">
                         <h2 class="text-xl font-semibold text-gray-800 ">${T('HISTORY_TITLE')} (0)</h2>
                         <button onclick="clearAllTransactions()" class="text-xs text-red-600 hover:text-red-800 font-medium mr-2">Clear All</button>
                         <button id="export-tax-btn" class="text-xs bg-indigo-500 text-white px-3 py-1 rounded-full hover:bg-indigo-600 transition disabled:opacity-50" disabled>
                            ${T('EXPORT_TAX')}
                         </button>
                    </div>
                    <p class="text-gray-500 text-center py-8">${T('NO_ENTRIES')}</p>
                `;
        }
        return;
    }


    const visibleTransactions = appState.transactions.slice(0, appState.visibleTransactionsCount);
    const hasMoreTransactions = appState.transactions.length > appState.visibleTransactionsCount;
    const showLessTransactions = appState.visibleTransactionsCount > 5;

    // Header with Clear All button
    let headerHtml = `
                    <div class="flex justify-between items-center mb-4 border-b pb-2">
                         <h2 class="text-xl font-semibold text-gray-800 ">${T('HISTORY_TITLE')} (${appState.transactions.length})</h2>
                         <div class="flex space-x-2">
                             <button onclick="window.clearAllTransactions()" class="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition">
                                Clear History
                             </button>
                             <button id="export-tax-btn" class="text-xs bg-indigo-500 text-white px-3 py-1 rounded-full hover:bg-indigo-600 transition disabled:opacity-50" ${appState.transactions.length === 0 ? 'disabled' : ''}>
                                ${T('EXPORT_TAX')}
                             </button>
                         </div>
                    </div>`;

    const historyList = visibleTransactions.map(t => {
        // Shared Mode Styling
        if (appState.isShared) {
            const colorClass = 'bg-teal-50 border-l-4 border-teal-400';
            const amountColor = 'text-teal-700';
            const icon = `
                <div class="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-xs">
                    GRP
                </div>
             `;
            return `
                <div class="flex items-center justify-between p-3 rounded-lg shadow-sm border border-gray-100 mb-3 transition hover:shadow-md ${colorClass}">
                    <div class="flex items-center space-x-3">
                        ${icon}
                        <div>
                            <p class="font-semibold text-gray-800 text-sm md:text-base">${t.description}</p>
                            <p class="text-xs text-gray-500">
                                ${t.category} • ${formatDate(new Date(t.transaction_date || t.timestamp))}
                            </p>
                        </div>
                    </div>
                    <span class="font-bold ${amountColor} text-base md:text-lg">
                        ${formatCurrency(t.amount)}
                    </span>
                    <button onclick="window.deleteTransaction('${t.id}')" class="ml-3 text-gray-400 hover:text-red-500 transition p-1" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            `;
        }

        // Private Mode Styling
        const isIncome = t.type === 'income';
        const colorClass = isIncome ? 'bg-green-50 border-l-4 border-green-400' : 'bg-red-50 border-l-4 border-red-400';
        const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
        const icon = isIncome
            ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>`;


        return `
                    <div class="p-3 rounded-xl flex items-center justify-between shadow-sm transition ${colorClass}">
                        <div class="flex items-center space-x-3 flex-1">
                            ${icon}
                            <div>
                                <p class="font-semibold text-gray-800 line-clamp-1">${t.description}</p>
                                <p class="text-xs text-gray-500 mt-0.5">
                                    <span class="font-bold text-indigo-700 mr-2 cursor-pointer hover:underline hover:text-indigo-900" 
                                          onclick="event.stopPropagation(); window.correctCategory('${t.id}', '${t.category || 'Uncategorized'}', '${t.description.replace(/'/g, "\\'")}')" 
                                          title="Click to correct category">
                                        [${t.category || 'Uncategorized'}]
                                    </span>
                                    ${formatDate(t.timestamp)}
                                </p>
                                ${t.isBusiness && !isIncome ? `<p class="text-xs text-yellow-700 font-medium">Business: GST ₹${(t.gstAmount || 0).toFixed(0)}</p>` : ''}
                            </div>
                        </div>
                        <div class="flex items-center">
                             <span class="font-bold ${amountColor} text-base md:text-lg mr-3">
                                ${isIncome ? '+' : '-'}${formatCurrency(t.amount)}
                            </span>
                            <button onclick="window.deleteTransaction('${t.id}')" class="text-gray-400 hover:text-red-500 transition p-1" title="Delete">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
    }).join('');

    container.innerHTML = headerHtml + `
                <div class="space-y-3 pb-20">
                    ${historyList}

                    <!-- Show More/Less Buttons -->
                    <div class="mt-4 flex justify-center space-x-4">
                        ${hasMoreTransactions ? `
                            <button id="show-more-transactions" class="text-sm font-medium text-blue-600 hover:underline">Show More</button>
                        ` : ''}
                        ${showLessTransactions ? `
                            <button id="show-less-transactions" class="text-sm font-medium text-gray-600 hover:underline">Show Less</button>
                        ` : ''}
                    </div>
                </div>
            `;
    document.getElementById('export-tax-btn').onclick = exportTaxLedger;

    if (hasMoreTransactions) {
        document.getElementById('show-more-transactions').onclick = () => {
            appState.visibleTransactionsCount += 5;
            renderTransactionHistory();
        };
    }
    if (showLessTransactions) {
        document.getElementById('show-less-transactions').onclick = () => {
            appState.visibleTransactionsCount = 5;
            renderTransactionHistory();
        };
    }
};

// --- CHATBOT UI & LOGIC ---

const toggleChat = () => {
    appState.isChatOpen = !appState.isChatOpen;
    updateUI();
};

const renderChatFAB = () => {
    // If the chat window is open, do not render the FAB.
    if (appState.isChatOpen) {
        D.fabContainer.innerHTML = '';
        return;
    }

    const chatIcon = `
                <div class="logo-container" style="width: 56px; height: 56px;">
                    <div class="fluid-shape">
                        <span class="g-letter" style="font-size: 2rem;">G</span>
                    </div>
                </div>`;

    // Get user name, default to 'there' if not available
    const userName = appState.userName ? appState.userName.split(' ')[0] : 'there';
    const helpMessageWords = `Hi ${userName}, how can I help you?`.split(' ');

    D.fabContainer.innerHTML = `
                <div id="chat-fab-wrapper" class="fixed bottom-6 end-6 z-40 flex items-center group">
                    <!-- Desktop Tooltip (Animated) -->
                    <div class="fab-tooltip hidden md:block">
                        <div class="fab-tooltip-text-container">
                            ${helpMessageWords.map((word, index) =>
        `<span class="fab-tooltip-word" style="animation-delay: ${index * 0.5}s">${word}</span>`
    ).join(' ')}
                        </div>
                    </div>

                    <!-- Mobile Tooltip (Animated) -->
                    <div class="fab-tooltip block md:hidden" style="right: 70px; max-width: 100px;">
                        <div class="fab-tooltip-text-container">
                            <span class="fab-tooltip-word" style="animation-delay: 0s">Ask</span>
                            <span class="fab-tooltip-word" style="animation-delay: 0.5s">AI</span>
                        </div>
                    </div>
                    <button id="chat-fab" class="rounded-full shadow-lg hover:bg-pink-700 transition duration-150 transform hover:scale-105">
                        ${chatIcon}
                    </button>
                </div>
            `;
    document.getElementById('chat-fab').onclick = toggleChat;
};

const renderChatWindow = () => {
    if (!appState.isChatOpen) {
        D.chatWindowContainer.innerHTML = '';
        return;
    }

    // Predefined auto-suggestions when chat opens
    const autoSuggestions = [
        'Summarize this month expenses',
        'Suggest monthly budgets',
        'Where am I overspending?',
        'Compare this month vs last month',
        'How much did I spend on groceries?',
    ];

    const suggestionsHTML = `
                <div id="chat-suggestions" class="p-3 border-b border-gray-200 bg-gray-100">
                    <p class="text-xs text-gray-600 font-medium mb-2">Try one of these:</p>
                    <div class="flex flex-wrap gap-2">
                        ${autoSuggestions.map(s => `<button class="suggestion-chip">${s}</button>`).join('')}
                    </div>
                </div>
            `;

    // Ensure the welcome message uses the correct language after render
    const initialHistory = appState.chatHistory.map(m => {
        if (m.role === 'model' && m.text === 'WELCOME_MESSAGE') {
            return { role: 'model', text: T('WELCOME_MESSAGE') };
        }
        return m;
    });

    let chatBubbles = initialHistory.map(message => {
        const isUser = message.role === 'user';
        const alignment = isUser ? 'items-end' : 'items-start';
        const bubbleClass = isUser ? 'user-bubble' : 'ai-bubble';
        const margin = isUser ? 'ms-auto' : 'me-auto';

        return `
                    <div class="flex ${alignment} mb-4">
                        <div class="max-w-xs sm:max-w-md p-3 shadow-md ${bubbleClass} ${margin}">
                            <p class="text-sm whitespace-pre-wrap">${message.text}</p>
                        </div>
                    </div>
                `;
    }).join('');

    // Add budget suggestion prompt if triggered
    if (appState.showBudgetSuggestionPrompt) {
        const suggestionBubble = `
                    <div class="flex items-start mb-4">
                        <div class="max-w-xs sm:max-w-md p-3 ai-bubble me-auto">
                            <p class="text-sm">I see you have a few transactions but no budgets. Would you like me to suggest some based on your spending?</p>
                            <button id="suggest-budgets-btn" class="mt-2 bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition">
                                Yes, suggest budgets
                            </button>
                        </div>
                    </div>
                `;
        chatBubbles += suggestionBubble;
        // Reset the prompt after showing
        appState.showBudgetSuggestionPrompt = false;
    }

    // Add thinking bubble if AI is processing
    if (appState.isChatThinking) {
        const thinkingText = T('THINKING_BUTTON');
        const thinkingBubble = `
                    <div class="flex items-start mb-4">
                        <div class="max-w-xs sm:max-w-md p-3 ai-bubble me-auto opacity-70">
                            <p class="text-sm animate-pulse">${thinkingText}</p>
                        </div>
                    </div>
                `;
        chatBubbles += thinkingBubble;
    }


    D.chatWindowContainer.innerHTML = `
                <div class="fixed inset-0 z-50 bg-gray-50 flex flex-col max-w-lg mx-auto shadow-2xl">
                    <!-- Chat Header -->
                    <div class="bg-indigo-700 text-white p-4 flex justify-between items-center shadow-md">
                        <h2 class="text-xl font-bold">${T('CHAT_TITLE')}</h2>
                        <button id="close-chat-btn" class="text-white hover:text-indigo-200 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <!-- Auto Suggestions -->
                    ${suggestionsHTML}

                    <!-- Chat Body (Messages) -->
                    <div id="chat-body" class="flex-1 overflow-y-auto p-4 space-y-4">
                        ${chatBubbles}
                    </div>

                    <!-- Chat Input -->
                    <form id="chat-input-form" class="p-4 bg-white border-t border-gray-200">
                        <div class="flex space-x-2">
                            <input
                                type="text" id="chat-input"
                                placeholder="${T('CHAT_PLACEHOLDER')}"
                                class="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                ${appState.isChatThinking ? 'disabled' : ''}
                            />
                            <!-- Voice Input / Stop Speaking Button -->
                            <button
                                type="button" id="chat-mic-btn"
                                class="${appState.isSpeaking ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} px-3 py-3 rounded-lg transition"
                                title="${appState.isSpeaking ? 'Stop Speaking' : 'Speak'}"
                            >
                                ${appState.isSpeaking ? 'Stop' : '🎤'}
                            </button>
                            <button
                                type="submit" id="chat-send-btn"
                                class="bg-teal-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50 transition"
                                ${appState.isChatThinking ? 'disabled' : ''}
                            >
                                ${T('SEND')}
                            </button>
                        </div>
                    </form>
                </div>
            `;

    // Attach event listeners
    document.getElementById('close-chat-btn').onclick = toggleChat;
    document.getElementById('chat-input-form').onsubmit = handleChatQuery;

    // Reset voice flag if user types manually
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.oninput = () => {
            appState.lastInputWasVoice = false;
        };
    }

    // Voice Assistant / Stop Handler
    document.getElementById('chat-mic-btn').onclick = () => {
        console.log('Mic button clicked');
        // If currently speaking (AI is talking), this button acts as a STOP button
        if (appState.isSpeaking) {
            window.speechSynthesis.cancel();
            appState.isSpeaking = false;
            renderChatWindow(); // Re-render to show mic icon again
            return;
        }

        // Standardize SpeechRecognition API
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setAlert('Voice recognition not supported in this browser.', 'error');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = appState.currentLanguage === 'hi' ? 'hi-IN' : 'en-US'; // Basic lang support
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        const micBtn = document.getElementById('chat-mic-btn');
        micBtn.classList.add('animate-pulse', 'bg-red-200'); // Visual feedback for listening

        try {
            recognition.start();
        } catch (err) {
            console.error('Recognition start error:', err);
            micBtn.classList.remove('animate-pulse', 'bg-red-200');
        }

        recognition.onresult = (event) => {
            const speechResult = event.results[0][0].transcript;
            console.log('Speech result:', speechResult);
            document.getElementById('chat-input').value = speechResult;
            micBtn.classList.remove('animate-pulse', 'bg-red-200');
            // Auto-submit after voice
            appState.lastInputWasVoice = true; // Flag that this was a voice command
            handleChatQuery({ preventDefault: () => { } });
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            micBtn.classList.remove('animate-pulse', 'bg-red-200');
            if (event.error === 'not-allowed') {
                setAlert('Please allow microphone access.', 'error');
            } else {
                setAlert('Could not hear you. Please try again.', 'error');
            }
        };

        recognition.onend = () => {
            micBtn.classList.remove('animate-pulse', 'bg-red-200');
        };
    };

    // Attach listener for the budget suggestion button if it exists
    const suggestBudgetsBtn = document.getElementById('suggest-budgets-btn');
    if (suggestBudgetsBtn) {
        suggestBudgetsBtn.onclick = handleSuggestBudgets;
    }

    // Attach listeners for auto-suggestion chips
    document.querySelectorAll('#chat-suggestions .suggestion-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.textContent.trim();

            // Map friendly text to commands
            const commandMap = {
                'Where am I overspending?': '/overspending',
                'Suggest monthly budgets': '/suggest_budget',
                'Summarize this month expenses': '/month_summary',
                'Compare this month vs last month': '/compare_last_month',
            };

            const input = document.getElementById('chat-input');
            if (input) {
                input.value = commandMap[text] || text; // default normal text
                input.focus();
            }
        });
    });

    setTimeout(() => {
        const chatBody = document.getElementById('chat-body');
        if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
    }, 10);
};

const generateBudgetSuggestions = () => {
    const categorySpending = {};
    appState.transactions.forEach(t => {
        if (t.type === 'expense') {
            const cat = t.category || 'Uncategorized';
            categorySpending[cat] = (categorySpending[cat] || 0) + t.amount;
        }
    });

    const existingBudgets = new Set(appState.budgets.map(b => b.category));
    const suggestions = [];

    Object.entries(categorySpending).forEach(([category, spent]) => {
        if (!existingBudgets.has(category) && spent > 1000) { // Suggest for categories with >1000 spent and no budget
            const suggestedAmount = Math.ceil(spent * 1.2 / 100) * 100; // Round up to nearest 100
            suggestions.push({ category, suggestedAmount, spent });
        }
    });

    return suggestions;
};

const attachBudgetSuggestionListeners = () => {
    document.querySelectorAll('.apply-budget-btn').forEach(btn => {
        btn.onclick = async () => {
            const category = btn.dataset.category;
            const amount = parseFloat(btn.dataset.amount);
            await applyBudget(category, amount, btn);
        };
    });

    const applyAllBtn = document.getElementById('apply-all-budgets-btn');
    if (applyAllBtn) {
        applyAllBtn.onclick = async () => {
            const buttons = document.querySelectorAll('.apply-budget-btn');
            applyAllBtn.disabled = true;
            applyAllBtn.textContent = 'Applying...';
            for (const btn of buttons) {
                if (!btn.disabled) {
                    const category = btn.dataset.category;
                    const amount = parseFloat(btn.dataset.amount);
                    await applyBudget(category, amount, btn);
                }
            }
            applyAllBtn.textContent = 'All Applied!';
        };
    }

    // Dismiss budget suggestion prompt
    const dismissBtn = document.getElementById('dismiss-budget-suggestions');
    if (dismissBtn) {
        dismissBtn.onclick = () => {
            appState.showBudgetSuggestionPrompt = false;
            renderChatWindow();
        };
    }
};

const applyBudget = async (category, amount, buttonElement) => {
    try {
        const now = new Date();
        const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        await secureFetch(`${API_BASE_URL}/budgets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appState.token}` },
            body: JSON.stringify({ category, amount, monthYear })
        });
        if (buttonElement) {
            buttonElement.textContent = 'Applied!';
            buttonElement.disabled = true;
            buttonElement.classList.remove('bg-green-600', 'hover:bg-green-700');
            buttonElement.classList.add('bg-gray-400', 'cursor-not-allowed');
        }
    } catch (error) {
        console.error(`Failed to apply budget for ${category}:`, error);
        if (buttonElement) buttonElement.textContent = 'Failed!';
    }
};

const handleChatQuery = async (e, fixedMessage = null) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const queryText = fixedMessage || (input ? input.value.trim() : '');
    if (!queryText) return;

    // 1. Add user message and clear input
    appState.chatHistory.push({ role: 'user', text: queryText });
    if (input) {
        // If the user manually triggered this (not voice auto-submit), reset voice flag
        // However, handleChatQuery is called by voice too.
        // If input has value, it might be typed.
        // We rely on 'input' event listener to clear the flag usually, but let's be safe:
        if (!appState.lastInputWasVoice) {
            // ensure it stays false for next time
        }
        input.value = '';
    }

    // 2. Set thinking state and re-render
    appState.isChatThinking = true;
    renderChatWindow();

    // Add a timeout to the fetch request for better error handling
    const controller = new AbortController();
    const timeoutMs = 20000; // 20 seconds
    const timeout = setTimeout(() => controller.abort(), timeoutMs);


    // Prepare conversation with proper translation for welcome message
    const conversation = appState.chatHistory.map(msg => {
        let text = msg.text;
        if (msg.role === 'model' && text === 'WELCOME_MESSAGE') {
            text = T('WELCOME_MESSAGE');
        }
        return { role: msg.role, text: text };
    });

    // 3. Call our new backend endpoint
    try {
        const response = await secureFetch(`${API_BASE_URL}/chat/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({
                message: queryText,
                history: conversation,
                language: appState.currentLanguage
            }),
            signal: controller.signal // Attach the abort signal
        });

        clearTimeout(timeout); // Clear the timeout if we get a response

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponseText = data.text || "I'm sorry, I couldn't understand that.";

        // Add model response
        appState.chatHistory.push({ role: 'model', text: aiResponseText });
        appState.isChatThinking = false;
        renderChatWindow();

        // --- TITLE: Voice Assistant Feedback ---
        // --- TITLE: Voice Assistant Feedback ---
        // Speak the response Only if the user used voice input
        if ('speechSynthesis' in window && appState.lastInputWasVoice) {
            // Cancel any previous speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(aiResponseText);
            // Select voice based on language if possible (basic implementation)
            // utterance.lang = 'en-US';

            utterance.onstart = () => {
                appState.isSpeaking = true;
                renderChatWindow(); // Update UI to show Stop button
            };

            utterance.onend = () => {
                appState.isSpeaking = false;
                renderChatWindow(); // Update UI to show Mic button
            };

            utterance.onerror = () => {
                appState.isSpeaking = false;
                renderChatWindow();
            };

            window.speechSynthesis.speak(utterance);
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error("Chatbot request timed out");
            appState.chatHistory.push({ role: 'model', text: "The request took too long to respond. Please try a simpler question or check your network." });
        } else {
            console.error("Chatbot API Failed:", error);
            appState.chatHistory.push({ role: 'model', text: "I'm sorry, I'm having trouble connecting to the network right now. Please try again later." });
        }
    } finally {
        clearTimeout(timeout);
        appState.isChatThinking = false;
        renderChatWindow();
    }
};

const handleSuggestBudgets = () => {
    // This function will mimic handleChatQuery with a fixed message
    handleChatQuery({ preventDefault: () => { } }, '/suggest_budget');
};

// Main function to re-render the entire dynamic UI
const updateUI = () => {
    // Handle RTL Layout for Persian
    document.documentElement.dir = (appState.currentLanguage === 'fa') ? 'rtl' : 'ltr';

    if (appState.isLoading) {
        // Show loading screen, do nothing else
        return;
    }

    if (!appState.userId) { // Check if user is logged in
        renderAuthUI();
        // Ensure chat is closed on auth screen
        appState.isChatOpen = false;
        renderChatWindow();
        return;
    }

    // If logged in, render the main app container elements (header/fab)
    renderHeaderDetails();
    renderChatFAB(); // Always render FAB when logged in

    // New logic to switch main views
    // New logic to switch main views
    if (appState.currentMainView === 'profile') {
        renderUserProfile();
    } else if (appState.currentMainView === 'groups') {
        import('./js/groups.js').then(async groupsModule => {
            groupsModule.initGroups({
                apiBaseUrl: API_BASE_URL,
                appState: appState,
                setAlert: setAlert
            });
            await groupsModule.initializeGroupListeners();
            groupsModule.renderGroupsView(D.mainContent);
        });
    } else if (appState.currentMainView === 'networth') {
        import('./js/networth.js').then(module => {
            module.initNetWorth({ apiBaseUrl: API_BASE_URL, appState, setAlert });
            module.renderNetWorthView(D.mainContent);
        });
    } else if (appState.currentMainView === 'calendar') {
        import('./js/calendar.js').then(module => {
            module.renderCalendarView(D.mainContent, appState, API_BASE_URL);
        });
    } else if (appState.currentMainView === 'admin' && isAdmin()) {
        renderAdminPanel();
    } else {
        // If logged in and not on profile/admin/groups view, render the dashboard
        renderDashboard();

        // Show admin button if user is admin
        const adminBtn = document.getElementById('admin-btn');
        if (adminBtn) {
            adminBtn.style.display = appState.isAdmin ? 'inline-block' : 'none';
        }
    }

    renderChatWindow(); // Ensure chat window updates on language/thinking state change

    // Check for obligations due TODAY
    const dueToday = appState.obligations.find(o => isDueToday(o.dueDate) && !o.isPaid);
    if (dueToday) {
        setAlert(T('DUE_TODAY_ALERT').replace('%s', dueToday.description), 'error');
    } else {
        // Clear error alert if no obligations are due today
        if (appState.alert.type === 'error') setAlert('', '');
    }

    // Check for goals completed
    const completedGoals = appState.goals.filter(g => g.savedAmount >= g.targetAmount);
    if (completedGoals.length > 0) {
        const goalId = completedGoals[0].id;
        const notifiedKey = `goal_notified_${goalId}`;
        const completionStateKey = `goal_completion_${goalId}`;

        // Store the current saved amount to detect actual progress
        const currentSavedAmount = completedGoals[0].savedAmount;
        const storedSavedAmount = localStorage.getItem(completionStateKey);

        // Only notify if:
        // 1. We haven't notified before, AND
        // 2. The saved amount has increased (not decreased from deletion)
        if (!localStorage.getItem(notifiedKey)) {
            // Check if this is genuine progress (not a re-trigger after deletion)
            if (!storedSavedAmount || parseFloat(currentSavedAmount) >= parseFloat(storedSavedAmount)) {
                setAlert(T('GOAL_COMPLETED') + `: ${completedGoals[0].name}!`, 'success');
                // Send email alert for completed goals (only once)
                sendGoalCompletionAlertEmail(completedGoals[0]);
                // Mark as notified in localStorage to prevent duplicate emails
                localStorage.setItem(notifiedKey, 'true');
            }
        }

        // Always update the stored amount for next comparison
        localStorage.setItem(completionStateKey, currentSavedAmount);
    }
    renderAlertBanner();
};

// --- ONBOARDING TOUR LOGIC ---
const tourSteps = [
    {
        element: '#transaction-form',
        title: 'Welcome to Gamyartha!',
        text: 'This is the Smart Entry form. You can add expenses or income here. Use the "AI Analyze" button to automatically fill details from a text message or note!',
        position: 'bottom'
    },
    {
        element: '#summary-cards',
        title: 'Your Financial Summary',
        text: 'Quickly see your total income, expenses, and net balance for the current period at a glance.',
        position: 'bottom'
    },
    {
        element: '#obligations-tracker-container',
        title: 'Due Date Alerts',
        text: 'Never miss a bill payment again! Add your credit card bills, rent, or any recurring payments here to get timely reminders.',
        position: 'top'
    },
    {
        element: '#goals-tracker-container',
        title: 'Savings Goals',
        text: 'Planning for a vacation or a new gadget? Set your savings goals here and track your progress towards achieving them.',
        position: 'top'
    },
    {
        element: '#budgets-tracker-container',
        title: 'Monthly Budgets',
        text: 'Set monthly spending limits for different categories to keep your finances in check. We\'ll warn you if you\'re about to go over!',
        position: 'top'
    },
    {
        element: '#history-container',
        title: 'Transaction History',
        text: 'All your recorded income and expenses will appear here. You can see your full financial history at a glance.',
        position: 'top'
    },
    {
        element: '#chat-fab-wrapper',
        title: 'Your AI Financial Advisor',
        text: 'This is Gamyartha, your personal AI assistant. Click here to ask financial questions, get budget suggestions, or analyze your spending habits.',
        position: 'left'
    }
];

const waitForElement = (selector, callback) => {
    const element = document.querySelector(selector);
    if (element) {
        callback();
    } else {
        let attempts = 0;
        const interval = setInterval(() => {
            const el = document.querySelector(selector);
            attempts++;
            if (el) {
                clearInterval(interval);
                callback();
            } else if (attempts > 20) { // Give up after 2 seconds
                clearInterval(interval);
                console.warn(`Onboarding tour could not find element: ${selector}`);
            }
        }, 100);
    }
};

let currentTourStep = 0;
let tourUserId = null;

const startOnboardingTour = (userId) => {
    currentTourStep = 0;
    tourUserId = userId || appState.userId;
    console.log(`Starting onboarding tour for user: ${tourUserId}`);
    showTourStep(currentTourStep);
};

const showTourStep = (stepIndex) => {
    if (stepIndex >= tourSteps.length) {
        endOnboardingTour();
        return;
    }

    const step = tourSteps[stepIndex];

    // Use the waitForElement utility to prevent race conditions
    waitForElement(step.element, () => {
        const targetElement = document.querySelector(step.element);

        if (!targetElement) {
            // If element still doesn't exist after waiting, skip to next step
            showTourStep(stepIndex + 1);
            return;
        }

        const rect = targetElement.getBoundingClientRect();

        let popoverStyle = '';
        switch (step.position) {
            case 'bottom': popoverStyle = `top: ${rect.bottom + 15}px; left: ${rect.left}px;`; break;
            case 'top': popoverStyle = `bottom: ${window.innerHeight - rect.top + 15}px; left: ${rect.left}px;`; break;
            case 'left': popoverStyle = `top: ${rect.top}px; right: ${window.innerWidth - rect.left + 15}px;`; break;
            case 'right': popoverStyle = `top: ${rect.top}px; left: ${rect.right + 15}px;`; break;
        }

        D.onboardingContainer.innerHTML = `
                    <div class="onboarding-overlay"></div>
                    <div class="onboarding-popover" style="${popoverStyle}">
                        <h3>${step.title}</h3>
                        <p>${step.text}</p>
                        <div class="mt-4 flex justify-between items-center">
                            <button id="skip-tour-btn" class="text-xs text-gray-500 hover:underline">Skip Tour</button>
                            <button id="next-tour-btn" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700">
                                ${stepIndex === tourSteps.length - 1 ? 'Finish' : 'Next'}
                            </button>
                        </div>
                    </div>
                `;

        targetElement.classList.add('onboarding-highlight');

        document.getElementById('next-tour-btn').onclick = () => {
            targetElement.classList.remove('onboarding-highlight');
            showTourStep(stepIndex + 1);
        };
        document.getElementById('skip-tour-btn').onclick = () => {
            targetElement.classList.remove('onboarding-highlight');
            endOnboardingTour();
        };
    });
};

const endOnboardingTour = () => {
    D.onboardingContainer.innerHTML = '';
    const userIdToSave = tourUserId || appState.userId;
    if (userIdToSave) {
        console.log(`Saving onboarding completion for user: ${userIdToSave}`);
        localStorage.setItem(`hasVisited_${userIdToSave}`, 'true');
    } else {
        console.error("Could not save onboarding completion: No User ID");
    }
};


// --- AUTH LOGIC (Error handling updated) ---

const handleLogin = async (email, password) => {
    const submitBtn = document.getElementById('auth-submit-btn');
    // Defensive: if button not present, bail out
    if (!submitBtn) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging In...';

    // Use AbortController to timeout the fetch if server doesn't respond
    const controller = new AbortController();
    const timeoutMs = 10000; // 10 seconds
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
            signal: controller.signal
        });

        // Clear timeout once we have a response
        clearTimeout(timeout);

        // Try to parse JSON safely
        let data;
        try {
            data = await response.json();
        } catch (parseErr) {
            throw new Error('Invalid server response');
        }

        if (!response.ok) {
            if (response.status === 403 && data.verificationRequired) {
                setAlert(data.error, 'warning');
                renderVerificationScreen(email);
                return;
            }
            throw new Error(data.error || 'Login failed');
        }

        // Store token and user data
        appState.token = data.token;
        appState.userId = data.user.id;
        appState.userEmail = data.user.email;
        appState.userName = data.user.full_name;
        appState.isAdmin = data.user.is_admin;

        localStorage.setItem('authToken', data.token);

        setAlert('Login successful! Welcome back.', 'success');

        // Initialize notifications
        if (typeof initNotifications === 'function') {
            initNotifications();
        }

        // Show welcome message in chat
        const welcomeMessage = T('WELCOME_MESSAGE');
        appState.chatHistory = [{ role: 'model', text: welcomeMessage }];
        renderChatWindow();

        await initializeListeners(); // Fetch user data after successful login



        updateUI(); // Re-render the UI to show the dashboard

    } catch (error) {
        // Differentiate abort from other errors
        if (error.name === 'AbortError') {
            console.error('Login request timed out');
            setAlert('Login timed out. Please check your network or backend server and try again.', 'error');
        } else {
            console.error('Login Error:', error.message || error);
            setAlert(error.message || 'Login failed. Please check your credentials.', 'error');
        }
    } finally {
        // Ensure button is always re-enabled and text restored
        clearTimeout(timeout);
        submitBtn.disabled = false;
        submitBtn.textContent = T('LOGIN_BUTTON');
    }
};

const handleCreateAccount = async (email, password) => {
    const submitBtn = document.getElementById('auth-submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
                full_name: email.split('@')[0]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Account creation failed');
        }

        if (data.verificationRequired) {
            setAlert('Verification code sent to your email.', 'success');
            renderVerificationScreen(email);
            return;
        }

        // Store token and user data
        appState.token = data.token;
        appState.userId = data.user.id;
        appState.userEmail = data.user.email;
        appState.userName = data.user.full_name;
        appState.isAdmin = data.user.is_admin;

        localStorage.setItem('authToken', data.token);

        setAlert('Account created successfully!', 'success');

        // Show welcome message in chat
        const welcomeMessage = T('WELCOME_MESSAGE');
        appState.chatHistory = [{ role: 'model', text: welcomeMessage }];
        renderChatWindow();

        await initializeListeners(); // Fetch user data after successful account creation

        // Start onboarding for new users
        setTimeout(() => startOnboardingTour(data.user.id), 500);

        updateUI(); // Re-render the UI to show the dashboard
    } catch (error) {
        console.error("Create Account Error:", error.message);

        if (error.message && error.message.includes('User already exists')) {
            setAlert('User already exists. Redirecting to login...', 'info');
            setTimeout(() => {
                appState.authView = 'login';
                renderAuthUI();
                const emailInput = document.getElementById('auth-email');
                if (emailInput) emailInput.value = email;
            }, 1500);
        } else {
            setAlert(error.message || 'Account creation failed.', 'error');
        }

        submitBtn.disabled = false;
        submitBtn.textContent = T('CREATE_BUTTON');
    }
};

const handleForgotPassword = async () => {
    const emailInput = document.getElementById('auth-email');
    const email = emailInput ? emailInput.value : '';

    if (!email) {
        setAlert("Please enter your email address to reset your password.", 'error');
        return;
    }

    const forgotBtn = document.getElementById('forgot-password-btn');
    forgotBtn.disabled = true;
    forgotBtn.textContent = 'Sending Code...';

    try {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to send reset code');
        }

        console.log('Password reset code sent successfully');

        // Store email and code for verification
        sessionStorage.setItem('resetEmail', email);
        sessionStorage.setItem('resetCode', data.resetCode); // Store the code

        setAlert(`Password reset code sent. In development, your code is: ${data.resetCode}`, 'success');

        // Show code input field
        showPasswordResetCodeInput(email);

    } catch (error) {
        console.error('Forgot password error:', error);
        setAlert(error.message || 'Failed to send reset code. Please try again.', 'error');
    } finally {
        forgotBtn.disabled = false;
        forgotBtn.textContent = T('FORGOT_PASSWORD_LINK');
    }
};

const showPasswordResetCodeInput = (email) => {
    const authForm = document.getElementById('auth-form');
    const existingCodeInput = document.getElementById('reset-code-input');

    if (existingCodeInput) return; // Already showing



    // Add code input field
    const codeInputHTML = `
                <div id="reset-code-section" class="space-y-4 mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 class="text-lg font-semibold text-blue-800">Enter Reset Code</h3>
                    <p class="text-sm text-blue-600">Check your email for the 6-digit code sent to ${email}</p>
                    <div>
                        <label for="reset-code-input" class="sr-only">Reset Code</label>
                        <input type="text" id="reset-code-input" required placeholder="Enter 6-digit code"
                               class="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-mono tracking-widest" maxlength="6" />
                    </div>
                    <div>
                        <label for="new-password-input" class="sr-only">New Password</label>
                        <input type="password" id="new-password-input" required placeholder="Enter new password (min 6 chars)"
                               class="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <button type="button" id="verify-reset-code-btn" class="w-full py-3 px-4 rounded-lg text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition duration-150">
                        Reset Password
                    </button>
                    <button type="button" id="cancel-reset-btn" class="w-full py-2 px-4 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800 transition duration-150">
                        Cancel
                    </button>
                </div>
            `;

    authForm.insertAdjacentHTML('afterend', codeInputHTML);

    // Attach event listeners
    document.getElementById('verify-reset-code-btn').onclick = () => verifyResetCode(email);
    document.getElementById('cancel-reset-btn').onclick = hidePasswordResetCodeInput;
};

const hidePasswordResetCodeInput = () => {
    const resetSection = document.getElementById('reset-code-section');
    if (resetSection) {
        resetSection.remove();
    }
};

const verifyResetCode = async (email) => {
    const codeInput = document.getElementById('reset-code-input');
    const newPasswordInput = document.getElementById('new-password-input');
    const verifyBtn = document.getElementById('verify-reset-code-btn');

    const enteredCode = codeInput.value.trim();
    const newPassword = newPasswordInput.value;

    if (!enteredCode || enteredCode.length !== 6) {
        setAlert('Please enter a valid 6-digit code.', 'error');
        return;
    }

    if (newPassword.length < 6) {
        setAlert('New password must be at least 6 characters long.', 'error');
        return;
    }

    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Resetting...';

    try {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                reset_code: enteredCode,
                new_password: newPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Password reset failed');
        }

        setAlert('Password reset successfully! You are now logged in.', 'success');

        // Clear reset data
        sessionStorage.removeItem('resetEmail');
        sessionStorage.removeItem('resetCode');

        hidePasswordResetCodeInput();

        // Show welcome message
        const welcomeMessage = T('WELCOME_MESSAGE');
        appState.chatHistory = [{ role: 'model', text: welcomeMessage }];
        renderChatWindow();

    } catch (error) {
        console.error('Password reset error:', error);
        setAlert(error.message || 'Failed to reset password. Please try again.', 'error');
    } finally {
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Reset Password';
    }
};

const renderVerificationScreen = (email) => {
    const authContainer = document.getElementById('main-content');
    if (!authContainer) return;

    authContainer.innerHTML = `
        <div class="flex items-center justify-center min-h-[80vh] px-4">
            <div class="w-full max-w-sm p-8 mt-12 bg-white rounded-xl shadow-2xl border border-gray-100 relative overflow-hidden">
             
            <div class="text-center mb-8">
                <div class="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 class="text-3xl font-bold text-gray-900 mb-2">Check your Inbox</h2>
                <p class="text-gray-500 text-sm">We sent a verification code to <br/><span class="font-semibold text-gray-700">${email}</span></p>
            </div>

            <form id="verification-form" class="space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                    <input type="text" id="verify-code" placeholder="123456" class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-center text-2xl tracking-widest" required />
                </div>

                <button type="submit" id="verify-btn" class="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 transform hover:-translate-y-0.5 shadow-lg">
                    Verify Email
                </button>
            </form>
            
            <button id="back-to-login-btn" class="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700">Back to Login</button>
        </div>
    </div>
    `;

    document.getElementById('back-to-login-btn').onclick = () => {
        appState.authView = 'login';
        renderAuthUI();
    };

    document.getElementById('verification-form').onsubmit = async (e) => {
        e.preventDefault();
        const code = document.getElementById('verify-code').value.trim();
        const verifyBtn = document.getElementById('verify-btn');
        verifyBtn.disabled = true;
        verifyBtn.textContent = 'Verifying...';

        try {
            const response = await secureFetch(`${API_BASE_URL}/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Verification failed');

            // Success! Log them in
            setAlert('Email verified! Logging you in...', 'success');

            appState.token = data.token;
            appState.userId = data.user.id;
            appState.userEmail = data.user.email;
            appState.userName = data.user.full_name;
            appState.isAdmin = data.user.is_admin;
            localStorage.setItem('authToken', data.token);

            // Init standard post-login flow
            const welcomeMessage = T('WELCOME_MESSAGE');
            appState.chatHistory = [{ role: 'model', text: welcomeMessage }];
            renderChatWindow();
            await initializeListeners();
            setTimeout(() => startOnboardingTour(data.user.id), 500); // Start tour here!
            updateUI();

        } catch (error) {
            setAlert(error.message, 'error');
            verifyBtn.disabled = false;
            verifyBtn.textContent = 'Verify Email';
        }
    };


};

const handleLogout = async () => {
    try {
        // Clear state related to the current user before signing out
        appState.transactions = [];
        appState.goals = [];
        appState.obligations = [];
        appState.userId = null;
        appState.userEmail = null;
        appState.userName = null;
        appState.isAdmin = false;
        appState.token = null;
        appState.isShared = false;
        appState.isChatOpen = false; // Also close chat
        appState.currentMainView = 'dashboard'; // Reset view

        // Clear stored token and view
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentMainView');

        setAlert('You have been logged out successfully.', 'success');

        // Update UI to show login page
        updateUI();
    } catch (error) {
        // If there was an issue clearing local storage or state, log it.
        console.error("Logout Error:", error.message);
        setAlert('Logout failed. Try again.', 'error');
    }
};


// --- EVENT HANDLERS & API LOGIC (CONTINUED) ---

const toggleSharedMode = async () => {
    appState.isShared = !appState.isShared;

    // Check if shared mode and no group selected
    if (appState.isShared && !appState.currentGroupId) {
        setAlert('No family group selected. Please select a group in Profile.', 'warning');
        // We still switch mode effectively, but data might be empty.
        // Ideally redirect to profile -> groups, but for now just warn.
    }

    // Persist the mode change on the backend
    try {
        await fetch(`${API_BASE_URL}/user/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({ key: 'current_mode', value: appState.isShared ? 'shared' : 'private' })
        });
    } catch (error) {
        console.error('Failed to set user mode:', error);
        setAlert('Could not switch mode. Please try again.', 'error');
    }

    // Reload data to reflect mode change (Shared vs Private)
    await initializeListeners();
    updateUI();
};

window.switchToGroupDashboard = async (groupId) => {
    // 1. Set as Active Group (if needed, redundant but safe)
    appState.currentGroupId = groupId;

    // 2. Set Mode to Shared
    appState.isShared = true;

    // 3. Set View to Dashboard
    appState.currentMainView = 'dashboard';
    localStorage.setItem('currentMainView', 'dashboard');

    // 4. Persist Settings
    try {
        await fetch(`${API_BASE_URL}/user/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appState.token}` },
            body: JSON.stringify({ key: 'current_mode', value: 'shared' })
        });
        // We assume 'current_group' is already set if they are clicking "Open Dashboard" from an active group.
        // If not, we could set it here too, but let's assume UI state is consistent.
    } catch (e) { console.error('Error saving settings', e); }

    // 5. Update UI
    // Ensure we are viewing dashboard (hide profile etc)
    // Ensure we are viewing dashboard (hide profile etc)
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('text-indigo-600'));
    // Ideally we should highlight the dashboard icon but we rely on updateUI to render the active state if we had a bottom nav or sidebar.
    // For now, removing active highlights from other tabs is safe.
    // Actually we use currentMainView state.
    // Need to trigger data reload
    setAppLoading(true);
    await initializeListeners();
    setAppLoading(false);
    updateUI();

    // Scroll to top
    window.scrollTo(0, 0);
};

// Helper to set loading state
const setAppLoading = (loading) => {
    appState.isLoading = loading;
    if (loading) {
        D.mainContent.innerHTML = '<div class="flex justify-center items-center h-64"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>';
    }
};

// --- Custom Language Selector Logic ---
const initLanguageSelector = () => {
    const btn = document.getElementById('language-menu-btn');
    const menu = document.getElementById('language-dropdown-menu');
    const label = document.getElementById('current-lang-label');
    const options = document.querySelectorAll('.lang-option');

    if (!btn || !menu) return;

    // Toggle menu
    btn.onclick = (e) => {
        e.stopPropagation();
        menu.classList.toggle('hidden');
    };

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!btn.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });

    // Handle selection
    options.forEach(opt => {
        opt.onclick = () => {
            const lang = opt.dataset.value;
            appState.currentLanguage = lang;
            localStorage.setItem('currentLanguage', lang);
            if (label) label.textContent = lang.toUpperCase();
            menu.classList.add('hidden');
            updateUI();
        };
    });

    // Set initial label based on current state
    if (label) label.textContent = (appState.currentLanguage || 'en').toUpperCase();
};
initLanguageSelector();

const updateFormType = (newType) => {
    if (appState.type !== newType) {
        appState.type = newType;
        appState.category = 'Uncategorized';
        appState.isBusiness = false;
        appState.gstAmount = '';
        updateUI();
    }
};
document.addEventListener('click', (e) => {
    if (e.target.id === 'type-expense-btn') updateFormType('expense');
    if (e.target.id === 'type-income-btn') updateFormType('income');
    // Correctly target the logout button, including cases where a child element is clicked
    if (e.target.closest('#logout-btn')) {
        handleLogout();
    }
    // Handle admin button click
    if (e.target.closest('#admin-btn')) {
        appState.currentMainView = 'admin';
        localStorage.setItem('currentMainView', 'admin');
        updateUI();
    }
});

const analyzeTransaction = async () => {
    if (appState.isAnalyzing || !appState.description.trim()) return;

    appState.isAnalyzing = true;
    updateUI();

    try {
        const response = await secureFetch(`${API_BASE_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({
                description: appState.description.trim(),
                language: appState.currentLanguage
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `API error: ${response.status}`);
        }

        const result = await response.json();
        const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (jsonText) {
            const parsedJson = JSON.parse(jsonText);
            if (parsedJson.category) appState.category = parsedJson.category;
            if (parsedJson.notes) appState.description = parsedJson.notes;
            if (parsedJson.suggestedAmount && parsedJson.suggestedAmount > 0) {
                appState.amount = parsedJson.suggestedAmount.toString();
            }
        }
    } catch (error) {
        console.error("AI Analysis Failed:", error);
        setAlert(T('Analysis Failed') + ": " + error.message, 'error');
        appState.category = 'Uncategorized';
    } finally {
        appState.isAnalyzing = false;
        updateUI();
    }
};

const startVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        setAlert(T('VOICE_ENTRY') + " not supported in this browser.", 'error');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = getSpeechLocale(appState.currentLanguage);
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();
    appState.description = T('THINKING_BUTTON');
    updateUI();

    recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        appState.description = speechResult;
        updateUI();
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error', event);
        appState.description = '';
        updateUI();
    };
    recognition.onend = () => {
        if (appState.description === T('THINKING_BUTTON')) appState.description = '';
        updateUI();
    };
};

const updateGoalProgress = async (amountSaved) => {
    if (!appState.token || amountSaved <= 0 || appState.goals.length === 0) return;

    const goal = appState.goals.find(g => (g.savedAmount || 0) < g.targetAmount);
    if (!goal) return;

    try {
        const newSavedAmount = (goal.savedAmount || 0) + amountSaved;

        const response = await fetch(`${API_BASE_URL}/goals/${goal.id}/progress`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({
                saved_amount: newSavedAmount  // Backend expects snake_case
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update goal progress');
        }

        // Update local state with camelCase property
        goal.savedAmount = newSavedAmount;

        setAlert(`Goal progress updated: Saved ${formatCurrency(amountSaved)} towards ${goal.name}.`, 'success');
    } catch (e) {
        console.error("Goal update failed: ", e);
        setAlert(e.message || "Failed to update goal progress.", 'error');
    }
};

const handleAddTransaction = async (e) => {
    e.preventDefault();

    const numericAmount = parseFloat(appState.amount);
    const numericGst = appState.isBusiness ? parseFloat(appState.gstAmount || 0) : 0;
    if (!numericAmount || numericAmount <= 0 || !appState.description.trim() || !appState.token) {
        setAlert("Please fill out all fields correctly.", 'error');
        return;
    }

    appState.isSaving = true;
    updateUI(); // Show "Saving..."

    try {
        let url = `${API_BASE_URL}/transactions`;
        let body = {
            amount: numericAmount,
            description: appState.description.trim(),
            category: appState.category,
            type: appState.type,
            is_business: appState.isBusiness,
            gst_amount: numericGst
        };

        if (appState.isShared && appState.currentGroupId) {
            // Use Group Split endpoint
            url = `${API_BASE_URL}/groups/split`;
            body = {
                group_id: appState.currentGroupId,
                amount: numericAmount,
                description: appState.description.trim(),
                category: appState.category,
                type: appState.type,
                split_method: 'equal' // Default equal split
            };
        }

        const response = await secureFetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || errorData.error || 'Failed to add transaction');
        }

        // Success handling
        // Clear form fields on success
        appState.amount = ''; appState.description = ''; appState.type = 'expense'; appState.category = 'Uncategorized';
        appState.isBusiness = false; appState.gstAmount = '';

        setAlert('Transaction recorded successfully!', 'success');

        // Reload data to update budgets and re-render the dashboard
        await initializeListeners();
        // renderDashboard calling updateUI via initializeListeners is not correct flow usually,
        // usually initializeListeners sets state, then we call updateUI.
        // But handleAddTransaction calls updateUI at the end (finally block).
        // Let's ensure strict re-render.
        if (appState.currentMainView === 'dashboard') {
            renderDashboard();
        }

        // Check pending invite after login
        checkPendingInvite();

    } catch (error) {
        console.error("Error adding transaction:", error);
        setAlert(error.message || "Failed to record transaction.", 'error');
    } finally {
        appState.isSaving = false;
        updateUI();
    }
};

const handleAddGoal = async (e) => {
    e.preventDefault();
    const form = e.target;
    const goalName = form.goalName.value.trim();
    const targetAmount = parseFloat(form.targetAmount.value);
    const targetDate = form.targetDate.value;

    if (!goalName || !targetAmount || !targetDate || !appState.token) {
        setAlert("Please fill out all goal fields.", 'error');
        return;
    }

    const container = document.getElementById('goals-tracker-container');
    const editingGoalId = container.dataset.editingGoalId;
    const isEditing = !!editingGoalId;

    try {
        const url = isEditing
            ? `${API_BASE_URL}/goals/${editingGoalId}`
            : `${API_BASE_URL}/goals`;

        const response = await secureFetch(url, {
            method: isEditing ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({
                name: goalName,
                target_amount: targetAmount,
                target_date: targetDate,
                group_id: appState.isShared ? appState.currentGroupId : null
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'add'} goal`);
        }

        const data = await response.json();

        form.reset();
        setAlert(`Goal ${isEditing ? 'updated' : 'created'} successfully!`, 'success');

        // Clear editing state
        delete container.dataset.editingGoalId;

        // Reload goals to get proper sorted order (newest first)
        await initializeListeners();

    } catch (error) {
        console.error("Error with goal:", error);
        setAlert(error.message || "Failed to save goal.", 'error');
    }
    // Re-render to close form/update list
    document.getElementById('goals-tracker-container').dataset.showForm = 'false';
    renderGoalTracker();
};

const handleAddObligation = async (e) => {
    e.preventDefault();
    const form = e.target;
    const obligationAmount = parseFloat(form.obligationAmount.value);
    const obligationDescription = form.obligationDescription.value.trim();
    const obligationDueDate = form.obligationDueDate.value;

    if (!obligationAmount || !obligationDescription || !obligationDueDate || !appState.token) {
        setAlert("Please fill out all obligation fields.", 'error');
        return;
    }

    try {
        const response = await secureFetch(`${API_BASE_URL}/obligations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({
                description: obligationDescription,
                amount: obligationAmount,
                due_date: obligationDueDate,
                group_id: appState.isShared ? appState.currentGroupId : null
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add obligation');
        }

        const data = await response.json();

        // Add to local state immediately
        const newObligation = {
            id: data.obligationId,
            description: obligationDescription,
            amount: obligationAmount,
            dueDate: new Date(obligationDueDate),
            isPaid: false
        };
        appState.obligations.push(newObligation);

        form.reset();
        setAlert('Payment obligation added!', 'success');
    } catch (error) {
        console.error("Error adding obligation:", error);
        setAlert(error.message || "Failed to add obligation.", 'error');
    }
    // Re-render to close form/update list
    document.getElementById('obligations-tracker-container').dataset.showForm = 'false';
    renderObligationsTracker();
};

async function handleAddBudget(e) {
    e.preventDefault();
    const form = e.target;
    const category = form.budgetCategory.value.trim();
    const amount = parseFloat(form.budgetAmount.value);

    if (!category || isNaN(amount) || amount <= 0) return alert("Enter valid budget data");

    try {
        const now = new Date();
        const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const response = await secureFetch(`${API_BASE_URL}/budgets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({ category, amount, monthYear, group_id: appState.isShared ? appState.currentGroupId : null })
        });

        const res = await response.json();

        if (!response.ok) {
            throw new Error(res.error || 'Failed to add budget');
        }

        setAlert('Budget added successfully!', 'success');
        await initializeListeners(); // Reload all data

        // Hide form and re-render the budget tracker
        const container = document.getElementById('budgets-tracker-container');
        if (container) container.dataset.showForm = 'false';
        renderBudgetsTracker();
    } catch (error) {
        console.error("Error adding budget:", error);
        setAlert(error.message || "Failed to add budget", 'error');
    }
}

const markObligationPaid = async (obligation) => {
    if (!appState.token) return;

    try {
        // Mark obligation as paid via API
        const response = await secureFetch(`${API_BASE_URL}/obligations/${obligation.id}/pay`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${appState.token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to mark obligation as paid');
        }

        // Record the payment as a new transaction (expense)
        const transactionResponse = await secureFetch(`${API_BASE_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({
                amount: obligation.amount,
                description: `[Payment] ${obligation.description}`,
                category: 'Bills/Payments',
                type: 'expense',
                is_business: false,
                gst_amount: 0
            })
        });

        if (transactionResponse.ok) {
            const transactionData = await transactionResponse.json();
            // Add transaction to local state
            const newTransaction = {
                id: transactionData.transactionId,
                amount: obligation.amount,
                description: `[Payment] ${obligation.description}`,
                category: 'Bills/Payments',
                type: 'expense',
                isBusiness: false,
                gstAmount: 0,
                timestamp: new Date()
            };
            appState.transactions.unshift(newTransaction);
        }

        // Update local obligation state
        obligation.isPaid = true;

        setAlert(`Payment of ${formatCurrency(obligation.amount)} recorded and obligation cleared.`, 'success');

        // Re-render the entire dashboard to update the alert count and all sections
        renderDashboard();

    } catch (error) {
        console.error("Error marking obligation paid:", error);
        setAlert(error.message || "Failed to mark obligation paid.", 'error');
    }
};

// --- ADMIN PANEL FUNCTIONS ---

const renderAdminPanel_Legacy = () => {
    D.mainContent.innerHTML = `
                <div class="p-4 space-y-6">
                    <div class="flex justify-between items-center border-b pb-2 mb-4">
                        <h2 class="text-3xl font-bold text-red-700">🔧 Admin Panel</h2>
                        <span class="text-sm text-gray-600">System Management</span>
                    </div>

                    <!-- Admin Navigation Tabs -->
                    <div class="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                        <button id="admin-users-tab" class="flex-1 py-2 px-4 text-sm font-medium rounded-md transition admin-tab active bg-white text-gray-900 shadow-sm">
                            👥 Users
                        </button>
                        <button id="admin-transactions-tab" class="flex-1 py-2 px-4 text-sm font-medium rounded-md transition admin-tab bg-gray-100 text-gray-600 hover:bg-white">
                            💰 Transactions
                        </button>
                        <button id="admin-goals-tab" class="flex-1 py-2 px-4 text-sm font-medium rounded-md transition admin-tab bg-gray-100 text-gray-600 hover:bg-white">
                            🎯 Goals
                        </button>
                        <button id="admin-obligations-tab" class="flex-1 py-2 px-4 text-sm font-medium rounded-md transition admin-tab bg-gray-100 text-gray-600 hover:bg-white">
                            📅 Obligations
                        </button>
                        <button id="admin-reports-tab" class="flex-1 py-2 px-4 text-sm font-medium rounded-md transition admin-tab bg-gray-100 text-gray-600 hover:bg-white">
                            📊 Reports
                        </button>
                    </div>

                    <!-- Admin Content Container -->
                    <div id="admin-content" class="bg-white rounded-xl shadow-2xl border border-gray-200 min-h-[600px]">
                        <!-- Content will be loaded here -->
                    </div>
                </div>
            `;

    // Set up tab event listeners
    document.getElementById('admin-users-tab').onclick = () => loadAdminContent('users');
    document.getElementById('admin-transactions-tab').onclick = () => loadAdminContent('transactions');
    document.getElementById('admin-goals-tab').onclick = () => loadAdminContent('goals');
    document.getElementById('admin-obligations-tab').onclick = () => loadAdminContent('obligations');
    document.getElementById('admin-reports-tab').onclick = () => loadAdminContent('reports');

    // Load default content (users)
    loadAdminContent('users');
};

const loadAdminContent_Legacy = async (section) => {
    // Update active tab
    document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active', 'bg-white', 'text-gray-900', 'shadow-sm'));
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.add('bg-gray-100', 'text-gray-600');
    });
    document.getElementById(`admin-${section}-tab`).classList.add('active', 'bg-white', 'text-gray-900', 'shadow-sm');
    document.getElementById(`admin-${section}-tab`).classList.remove('bg-gray-100', 'text-gray-600');

    const content = document.getElementById('admin-content');

    switch (section) {
        case 'users':
            await renderAdminUsers(content);
            break;
        case 'transactions':
            await renderAdminTransactions(content);
            break;
        case 'goals':
            await renderAdminGoals(content);
            break;
        case 'obligations':
            await renderAdminObligations(content);
            break;
        case 'reports':
            await renderAdminReports(content);
            break;
    }
};

const renderAdminUsers = async (container) => {
    container.innerHTML = '<div class="p-6 text-center">Loading users...</div>';

    try {
        // Get all users from Firestore (this requires admin privileges)
        const usersSnapshot = await getDocs(collection(appState.db, 'users'));
        const users = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const userRows = users.map(user => `
                    <tr class="border-b border-gray-200 hover:bg-gray-50">
                        <td class="px-4 py-3 text-sm font-mono text-gray-600">${user.id}</td>
                        <td class="px-4 py-3 text-sm">${user.email || 'N/A'}</td>
                        <td class="px-4 py-3 text-sm">
                            <span class="px-2 py-1 text-xs rounded-full ${user.isAnonymous ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
                                ${user.isAnonymous ? 'Anonymous' : 'Permanent'}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-500">
                            ${user.createdAt ? formatDate(new Date(user.createdAt.toDate())) : 'N/A'}
                        </td>
                        <td class="px-4 py-3 text-sm">
                            <button onclick="editUser('${user.id}')" class="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                            <button onclick="deleteUser('${user.id}')" class="text-red-600 hover:text-red-800">Delete</button>
                        </td>
                    </tr>
                `).join('');

        container.innerHTML = `
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-xl font-bold text-gray-800">User Management</h3>
                            <span class="text-sm text-gray-600">${users.length} total users</span>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="min-w-full bg-white admin-table">
                                <thead>
                                    <tr>
                                        <th class="px-4 py-3 text-left">User ID</th>
                                        <th class="px-4 py-3 text-left">Email</th>
                                        <th class="px-4 py-3 text-left">Type</th>
                                        <th class="px-4 py-3 text-left">Created</th>
                                        <th class="px-4 py-3 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>${userRows}</tbody>
                            </table>
                        </div>
                    </div>
                `;
    } catch (error) {
        console.error('Error loading users:', error);
        container.innerHTML = '<div class="p-6 text-center text-red-600">Error loading users</div>';
    }
};

const renderAdminTransactions = async (container) => {
    container.innerHTML = '<div class="p-6 text-center">Loading transactions...</div>';

    try {
        // Get all transactions from all users (requires admin read access)
        const allTransactions = [];
        const usersSnapshot = await getDocs(collection(appState.db, 'users'));

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const transactionsSnapshot = await getDocs(collection(appState.db, `users/${userId}/transactions`));
            transactionsSnapshot.docs.forEach(doc => {
                allTransactions.push({
                    id: doc.id,
                    userId: userId,
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate() || new Date()
                });
            });
        }

        const transactionRows = allTransactions.slice(0, 100).map(t => `
                    <tr class="border-b border-gray-200 hover:bg-gray-50">
                        <td class="px-4 py-3 text-sm font-mono text-gray-600">${t.userId}</td>
                        <td class="px-4 py-3 text-sm">${t.description}</td>
                        <td class="px-4 py-3 text-sm">${t.category}</td>
                        <td class="px-4 py-3 text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                            ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-500">${formatDate(t.timestamp)}</td>
                        <td class="px-4 py-3 text-sm">
                            <button onclick="editTransaction('${t.id}', '${t.userId}')" class="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                            <button onclick="deleteTransaction('${t.id}', '${t.userId}')" class="text-red-600 hover:text-red-800">Delete</button>
                        </td>
                    </tr>
                `).join('');

        container.innerHTML = `
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-xl font-bold text-gray-800">Transaction Management</h3>
                            <span class="text-sm text-gray-600">${allTransactions.length} total transactions</span>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="min-w-full bg-white admin-table">
                                <thead>
                                    <tr>
                                        <th class="px-4 py-3 text-left">User</th>
                                        <th class="px-4 py-3 text-left">Description</th>
                                        <th class="px-4 py-3 text-left">Category</th>
                                        <th class="px-4 py-3 text-left">Amount</th>
                                        <th class="px-4 py-3 text-left">Date</th>
                                        <th class="px-4 py-3 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>${transactionRows}</tbody>
                            </table>
                        </div>
                    </div>
                `;
    } catch (error) {
        console.error('Error loading transactions:', error);
        container.innerHTML = '<div class="p-6 text-center text-red-600">Error loading transactions</div>';
    }
};

const renderAdminGoals = async (container) => {
    container.innerHTML = '<div class="p-6 text-center">Loading goals...</div>';

    try {
        const allGoals = [];
        const usersSnapshot = await getDocs(collection(appState.db, 'users'));

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const goalsSnapshot = await getDocs(collection(appState.db, `users/${userId}/goals`));
            goalsSnapshot.docs.forEach(doc => {
                allGoals.push({
                    id: doc.id,
                    userId: userId,
                    ...doc.data(),
                    targetDate: doc.data().targetDate?.toDate() || new Date()
                });
            });
        }

        const goalRows = allGoals.map(g => `
                    <tr class="border-b border-gray-200 hover:bg-gray-50">
                        <td class="px-4 py-3 text-sm font-mono text-gray-600">${g.userId}</td>
                        <td class="px-4 py-3 text-sm">${g.name}</td>
                        <td class="px-4 py-3 text-sm">${formatCurrency(g.targetAmount)}</td>
                        <td class="px-4 py-3 text-sm">${formatCurrency(g.savedAmount || 0)}</td>
                        <td class="px-4 py-3 text-sm text-gray-500">${formatDate(g.targetDate)}</td>
                        <td class="px-4 py-3 text-sm">
                            <button onclick="editGoal('${g.id}', '${g.userId}')" class="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                            <button onclick="deleteGoal('${g.id}', '${g.userId}')" class="text-red-600 hover:text-red-800">Delete</button>
                        </td>
                    </tr>
                `).join('');

        container.innerHTML = `
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-xl font-bold text-gray-800">Goals Management</h3>
                            <span class="text-sm text-gray-600">${allGoals.length} total goals</span>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="min-w-full bg-white admin-table">
                                <thead>
                                    <tr>
                                        <th class="px-4 py-3 text-left">User</th>
                                        <th class="px-4 py-3 text-left">Goal Name</th>
                                        <th class="px-4 py-3 text-left">Target</th>
                                        <th class="px-4 py-3 text-left">Saved</th>
                                        <th class="px-4 py-3 text-left">Due Date</th>
                                        <th class="px-4 py-3 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>${goalRows}</tbody>
                            </table>
                        </div>
                    </div>
                `;
    } catch (error) {
        console.error('Error loading goals:', error);
        container.innerHTML = '<div class="p-6 text-center text-red-600">Error loading goals</div>';
    }
};

const renderAdminObligations = async (container) => {
    container.innerHTML = '<div class="p-6 text-center">Loading obligations...</div>';

    try {
        const allObligations = [];
        const usersSnapshot = await getDocs(collection(appState.db, 'users'));

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const obligationsSnapshot = await getDocs(collection(appState.db, `users/${userId}/obligations`));
            obligationsSnapshot.docs.forEach(doc => {
                allObligations.push({
                    id: doc.id,
                    userId: userId,
                    ...doc.data(),
                    dueDate: doc.data().dueDate?.toDate() || new Date()
                });
            });
        }

        const obligationRows = allObligations.map(o => `
                    <tr class="border-b border-gray-200 hover:bg-gray-50">
                        <td class="px-4 py-3 text-sm font-mono text-gray-600">${o.userId}</td>
                        <td class="px-4 py-3 text-sm">${o.description}</td>
                        <td class="px-4 py-3 text-sm">${formatCurrency(o.amount)}</td>
                        <td class="px-4 py-3 text-sm text-gray-500">${formatDate(o.dueDate)}</td>
                        <td class="px-4 py-3 text-sm">
                            <span class="px-2 py-1 text-xs rounded-full ${o.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${o.isPaid ? 'Paid' : 'Pending'}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-sm">
                            <button onclick="editObligation('${o.id}', '${o.userId}')" class="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                            <button onclick="deleteObligation('${o.id}', '${o.userId}')" class="text-red-600 hover:text-red-800">Delete</button>
                        </td>
                    </tr>
                `).join('');

        container.innerHTML = `
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-xl font-bold text-gray-800">Obligations Management</h3>
                            <span class="text-sm text-gray-600">${allObligations.length} total obligations</span>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="min-w-full bg-white admin-table">
                                <thead>
                                    <tr>
                                        <th class="px-4 py-3 text-left">User</th>
                                        <th class="px-4 py-3 text-left">Description</th>
                                        <th class="px-4 py-3 text-left">Amount</th>
                                        <th class="px-4 py-3 text-left">Due Date</th>
                                        <th class="px-4 py-3 text-left">Status</th>
                                        <th class="px-4 py-3 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>${obligationRows}</tbody>
                            </table>
                        </div>
                    </div>
                `;
    } catch (error) {
        console.error('Error loading obligations:', error);
        container.innerHTML = '<div class="p-6 text-center text-red-600">Error loading obligations</div>';
    }
};

const renderAdminReports = async (container) => {
    container.innerHTML = `
                <div class="p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">System Reports</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <h4 class="font-semibold text-blue-800 mb-2">Export All Data</h4>
                            <p class="text-sm text-blue-600 mb-3">Download complete system data as CSV</p>
                            <button onclick="exportAllData()" class="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                                Export CSV
                            </button>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <h4 class="font-semibold text-green-800 mb-2">User Statistics</h4>
                            <p class="text-sm text-green-600 mb-3">View user registration and activity stats</p>
                            <button onclick="showUserStats()" class="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
                                View Stats
                            </button>
                        </div>
                    </div>
                </div>
            `;
};

// Admin CRUD functions
const editUser = (userId) => {
    // TODO: Implement user editing modal
    alert(`Edit user: ${userId}`);
};

const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
        // Delete user data (this is complex and requires careful consideration)
        // For now, just show a message
        setAlert('User deletion not implemented yet', 'error');
    } catch (error) {
        console.error('Error deleting user:', error);
        setAlert('Failed to delete user', 'error');
    }
};

const editTransaction = (transactionId, userId) => {
    // TODO: Implement transaction editing modal
    alert(`Edit transaction: ${transactionId} for user: ${userId}`);
};

const deleteTransaction = async (transactionId) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
        await secureFetch(`${API_BASE_URL}/transactions/${transactionId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        setAlert('Transaction deleted successfully', 'success');

        // Refresh based on view
        if (appState.currentMainView === 'admin' && isAdmin()) {
            loadAdminContent('transactions');
        } else {
            await initializeListeners();
            renderDashboard();
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        setAlert('Failed to delete transaction', 'error');
    }
};

const editGoal = (goalId, userId) => {
    // TODO: Implement goal editing modal
    alert(`Edit goal: ${goalId} for user: ${userId}`);
};

const deleteGoal = async (goalId) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
        await secureFetch(`${API_BASE_URL}/goals/${goalId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        setAlert('Goal deleted successfully', 'success');

        if (appState.currentMainView === 'admin' && isAdmin()) {
            loadAdminContent('goals');
        } else {
            await initializeListeners();
            renderDashboard();
        }
    } catch (error) {
        console.error('Error deleting goal:', error);
        setAlert('Failed to delete goal', 'error');
    }
};

const editObligation = (obligationId, userId) => {
    // TODO: Implement obligation editing modal
    alert(`Edit obligation: ${obligationId} for user: ${obligationId}`);
};

const deleteObligation = async (obligationId) => {
    if (!confirm('Are you sure you want to delete this obligation?')) return;

    try {
        await secureFetch(`${API_BASE_URL}/obligations/${obligationId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        setAlert('Obligation deleted successfully', 'success');

        if (appState.currentMainView === 'admin' && isAdmin()) {
            loadAdminContent('obligations');
        } else {
            await initializeListeners();
            renderDashboard();
        }
    } catch (error) {
        console.error('Error deleting obligation:', error);
        setAlert('Failed to delete obligation', 'error');
    }
};

const exportAllData = async () => {
    // TODO: Implement full data export
    alert('Full data export not implemented yet');
};

const showUserStats = async () => {
    // TODO: Implement user statistics
    alert('User statistics not implemented yet');
};

// Make admin functions globally available
window.editUser = editUser;
window.deleteUser = deleteUser;
window.editTransaction = editTransaction;
window.deleteTransaction = deleteTransaction;
window.editGoal = editGoal;
window.deleteGoal = deleteGoal;
window.editObligation = editObligation;
window.deleteObligation = deleteObligation;
window.exportAllData = exportAllData;
window.showUserStats = showUserStats;

// Send goal completion alert email using backend server
const sendGoalCompletionAlertEmail = async (goal) => {
    if (!appState.emailAlertsEnabled || !appState.userEmail) return;

    try {
        const response = await secureFetch(EMAIL_SERVER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}` // Ensure auth is passed if needed
            },
            body: JSON.stringify({
                type: 'goalCompleted',
                to_email: appState.userEmail,
                user_name: appState.userName || appState.userEmail.split('@')[0],
                goalName: goal.name,
                targetAmount: goal.targetAmount
            })
        });

        if (response.ok) {
            console.log('Goal completion alert email sent successfully');
        } else {
            console.error('Failed to send goal completion email');
        }
    } catch (error) {
        console.error('Failed to send goal completion email alert:', error);
    }
};

const exportTaxLedger = () => {
    const businessData = appState.transactions.filter(t => t.isBusiness);

    if (businessData.length === 0) {
        setAlert("No business-related transactions to export!", 'error');
        return;
    }

    let csv = [
        ["Date", "Description", "Type", "Category", "Amount", "GST_Amount", "Net_Amount", "Business_Related"].join(",")
    ];

    businessData.forEach(t => {
        const row = [
            t.timestamp.toISOString().split('T')[0],
            `"${t.description.replace(/"/g, '""')}"`,
            t.type.toUpperCase(),
            t.category,
            t.amount.toFixed(2),
            (t.gstAmount || 0).toFixed(2),
            (t.amount - (t.gstAmount || 0)).toFixed(2),
            "TRUE"
        ].join(",");
        csv.push(row);
    });

    const csvContent = csv.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); // Renamed from Gamyartha to Gamyartha
    link.setAttribute('href', url);
    link.setAttribute('download', `Gamyartha_Tax_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
};

// --- FIREBASE INITIALIZATION AND LISTENERS ---

let unsubscribers = [];
// Define EMAIL_SERVER_URL using the global config
const EMAIL_SERVER_URL = `${window.ENV.BACKEND_API}/api/send-email`;

// --- ADMIN PANEL RENDERING ---
const renderAdminPanel = async () => {
    D.mainContent.innerHTML = `
        <div class="space-y-6">
            <div class="flex justify-between items-center border-b pb-4">
                <div>
                    <h2 class="text-3xl font-bold text-gray-800">Admin Command Center</h2>
                    <p class="text-sm text-gray-500">System Monitoring & Management</p>
                </div>
                <div class="flex space-x-2">
                     <button onclick="loadAdminDashboard()" class="p-2 text-gray-600 hover:text-indigo-600" title="Refresh"><i class="fas fa-sync-alt"></i></button>
                </div>
            </div>

            <!-- Admin Navigation -->
            <div class="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
                <button id="admin-nav-dashboard" onclick="switchAdminTab('dashboard')" class="flex-1 py-2 px-4 text-sm font-medium rounded-md transition admin-nav-btn active bg-white text-indigo-700 shadow-sm">
                    📊 Dashboard
                </button>
                <button id="admin-nav-users" onclick="switchAdminTab('users')" class="flex-1 py-2 px-4 text-sm font-medium rounded-md transition admin-nav-btn text-gray-600 hover:bg-white">
                    👥 Users
                </button>
                <button id="admin-nav-transactions" onclick="switchAdminTab('transactions')" class="flex-1 py-2 px-4 text-sm font-medium rounded-md transition admin-nav-btn text-gray-600 hover:bg-white">
                    💰 Inspector
                </button>
                <button id="admin-nav-broadcast" onclick="switchAdminTab('broadcast')" class="flex-1 py-2 px-4 text-sm font-medium rounded-md transition admin-nav-btn text-gray-600 hover:bg-white">
                    📢 Broadcast
                </button>
                <button id="admin-nav-badges" onclick="switchAdminTab('badges')" class="flex-1 py-2 px-4 text-sm font-medium rounded-md transition admin-nav-btn text-gray-600 hover:bg-white">
                    🏆 Gamification
                </button>
                <button id="admin-nav-challenges" onclick="switchAdminTab('challenges')" class="flex-1 py-2 px-4 text-sm font-medium rounded-md transition admin-nav-btn text-gray-600 hover:bg-white">
                    🏁 Challenges
                </button>
            </div>

            <!-- Content Area -->
            <div id="admin-content-area" class="min-h-[500px]">
                <!-- Dashboard View (Default) -->
                <div id="admin-view-dashboard" class="admin-view space-y-6">
                     <!-- Quick Stats Row -->
                    <div id="admin-stats-container" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="bg-white p-4 rounded-lg shadow animate-pulse h-24"></div>
                        <div class="bg-white p-4 rounded-lg shadow animate-pulse h-24"></div>
                        <div class="bg-white p-4 rounded-lg shadow animate-pulse h-24"></div>
                        <div class="bg-white p-4 rounded-lg shadow animate-pulse h-24"></div>
                    </div>

                <!-- Weekly Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-400">
                         <h3 class="text-lg font-bold text-gray-800 mb-2">📈 New Users (7 Days)</h3>
                         <p class="text-4xl font-bold text-indigo-700" id="weekly-users-count">...</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow border-l-4 border-green-400">
                         <h3 class="text-lg font-bold text-gray-800 mb-2">💳 Transactions (7 Days)</h3>
                         <p class="text-4xl font-bold text-green-700" id="weekly-transactions-count">...</p>
                    </div>
                </div> <!-- Close Summary Cards Grid -->
            </div> <!-- Close admin-view-dashboard -->

            <!-- Users View -->
            <div id="admin-view-users" class="admin-view hidden space-y-4">
                    <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-gray-800">User Management</h3>
                        <button onclick="loadAdminUsers()" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Refresh</button>
                    </div>
                    <div id="users-table-container" class="overflow-x-auto"></div>
                </div>
            </div>

            <!-- Transactions Inspector View -->
            <div id="admin-view-transactions" class="admin-view hidden space-y-4">
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-gray-800">Global Transaction Feed</h3>
                        <button onclick="loadAdminTransactions()" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Refresh</button>
                    </div>
                    <div id="admin-transactions-container" class="overflow-x-auto p-4">
                            <div class="text-center text-gray-500">Loading transactions...</div>
                    </div>
                </div>
            </div>

            <!-- Broadcast View -->
                <div id="admin-view-broadcast" class="admin-view hidden space-y-4">
                <div class="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
                    <h3 class="text-lg font-bold text-gray-800 mb-2">📢 Send Global Broadcast</h3>
                    <p class="text-sm text-gray-500 mb-6">Send an email notification to all users who have alerts enabled.</p>

                    <form onsubmit="handleAdminBroadcast(event)" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Subject</label>
                            <input type="text" id="broadcast-subject" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Message</label>
                            <textarea id="broadcast-message" rows="4" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"></textarea>
                        </div>
                        <div class="bg-yellow-50 p-3 rounded text-xs text-yellow-800">
                            ⚠️ This will be sent immediately to all subscribed users.
                        </div>
                        <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Send Broadcast
                        </button>
                    </form>
                </div>
            </div>

            <!-- Badges View -->
            <div id="admin-view-badges" class="admin-view hidden space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Create Badge Form -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">Create New Badge</h3>
                        <form onsubmit="handleCreateBadge(event)" class="space-y-3">
                            <input type="text" id="badge-code" placeholder="Code (e.g. SAVER_PLATINUM)" required class="w-full text-sm border-gray-300 rounded p-2 border">
                            <input type="text" id="badge-name" placeholder="Name (e.g. Platinum Saver)" required class="w-full text-sm border-gray-300 rounded p-2 border">
                            <input type="text" id="badge-icon" placeholder="Icon (e.g. 💎)" required class="w-full text-sm border-gray-300 rounded p-2 border">
                            <textarea id="badge-desc" placeholder="Description" required class="w-full text-sm border-gray-300 rounded p-2 border"></textarea>
                            <select id="badge-type" class="w-full text-sm border-gray-300 rounded p-2 border">
                                <option value="total_saved">Total Saved</option>
                                <option value="login_streak">Login Streak</option>
                                <option value="budget_count">Budgets Created</option>
                            </select>
                            <input type="number" id="badge-threshold" placeholder="Threshold Value" required class="w-full text-sm border-gray-300 rounded p-2 border">
                            <button type="submit" class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Create Badge</button>
                        </form>
                    </div>

                    <!-- Existing Badges List -->
                    <div class="md:col-span-2 bg-white rounded-lg shadow overflow-hidden">
                            <div class="p-4 border-b border-gray-200">
                            <h3 class="text-lg font-semibold text-gray-800">Active Badges</h3>
                        </div>
                        <div id="admin-badges-list" class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                            <div class="text-center text-gray-500 w-full col-span-2">Loading badges...</div>
                        </div>
                    </div>
                    </div>
            </div>
            <!-- Challenges View -->
            <div id="admin-view-challenges" class="admin-view hidden space-y-4">
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-gray-800">Challenges Management</h3>
                    </div>
                     <div class="p-6">
                        <h4 class="text-md font-bold mb-4">Create New Challenge</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input type="text" id="new-challenge-name" placeholder="Challenge Name" class="border p-2 rounded">
                            <select id="new-challenge-category" class="border p-2 rounded">
                                <option value="total_spend">Total Spend</option>
                                <option value="dining">Dining</option>
                                <option value="shopping">Shopping</option>
                                <option value="entertainment">Entertainment</option>
                                <option value="transport">Transport</option>
                                <option value="groceries">Groceries</option>
                            </select>
                            <input type="date" id="new-challenge-start" class="border p-2 rounded">
                            <input type="date" id="new-challenge-end" class="border p-2 rounded">
                        </div>
                        <input type="text" id="new-challenge-desc" placeholder="Description" class="border p-2 rounded w-full mb-4">
                        <button onclick="createAdminChallenge()" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Create Challenge</button>
                </div>
                 <!-- Existing Challenges List -->
                 <div class="mt-6 bg-white rounded-lg shadow overflow-hidden">
                    <div class="p-4 border-b border-gray-200">
                        <h4 class="text-md font-bold text-gray-800">Active & Upcoming Challenges</h4>
                    </div>
                    <div id="admin-challenges-list" class="divide-y divide-gray-200">
                        <div class="p-4 text-center text-gray-500">Loading challenges...</div>
                    </div>
                 </div>
            </div>

            </div> <!-- Close admin-content-area -->
        </div> <!-- Close root container -->
    `;

    // Initialize Dashboard
    loadAdminDashboard();
};

window.switchAdminTab = (tabName) => {
    // Update Nav
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.classList.remove('bg-white', 'text-indigo-700', 'shadow-sm');
        btn.classList.add('text-gray-600', 'hover:bg-white');
    });
    const activeBtn = document.getElementById(`admin-nav-${tabName}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-white', 'text-indigo-700', 'shadow-sm');
        activeBtn.classList.remove('text-gray-600', 'hover:bg-white');
    }

    // Update View
    document.querySelectorAll('.admin-view').forEach(view => view.classList.add('hidden'));
    const view = document.getElementById(`admin-view-${tabName}`);
    if (view) {
        view.classList.remove('hidden');
    } else {
        console.error(`Admin view not found: admin-view-${tabName}`);
    }

    // Load Data
    if (tabName === 'dashboard') loadAdminDashboard();
    if (tabName === 'users') loadAdminUsers();
    if (tabName === 'transactions') loadAdminTransactions();
    if (tabName === 'badges') loadAdminBadges();
    if (tabName === 'badges') loadAdminBadges();
    if (tabName === 'challenges') loadAdminChallenges();
};

window.createAdminChallenge = async () => {
    const name = document.getElementById('new-challenge-name').value;
    const category = document.getElementById('new-challenge-category').value;
    const start = document.getElementById('new-challenge-start').value;
    const end = document.getElementById('new-challenge-end').value;
    const desc = document.getElementById('new-challenge-desc').value;

    if (!name || !start || !end || !desc) {
        setAlert('Please fill all fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/challenges/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({
                name,
                description: desc,
                start_date: start,
                end_date: end,
                target_category: category,
                winning_criteria: 'lowest_spend'
            })
        });

        const data = await response.json();
        if (response.ok) {
            setAlert('Challenge created successfully!', 'success');
            // Reset form
            document.getElementById('new-challenge-name').value = '';
            document.getElementById('new-challenge-desc').value = '';
            document.getElementById('new-challenge-start').value = '';
            document.getElementById('new-challenge-end').value = '';
        } else {
            setAlert(data.error || 'Failed to create challenge', 'error');
        }
    } catch (error) {
        console.error('Error creating challenge:', error);
        setAlert('Network error', 'error');
    }
};

const loadAdminChallenges = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/challenges`, {
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        const data = await response.json();

        const listContainer = document.getElementById('admin-challenges-list');
        if (!data.challenges || data.challenges.length === 0) {
            listContainer.innerHTML = '<div class="p-4 text-center text-gray-500">No active or upcoming challenges.</div>';
            return;
        }

        listContainer.innerHTML = data.challenges.map(c => `
            <div class="p-4 flex justify-between items-center hover:bg-gray-50">
                <div>
                    <h5 class="font-bold text-gray-800">${c.name}</h5>
                    <p class="text-sm text-gray-600">${c.description}</p>
                    <div class="text-xs text-gray-400 mt-1 space-x-2">
                        <span>📅 ${formatDate(new Date(c.start_date))} - ${formatDate(new Date(c.end_date))}</span>
                        <span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">${c.status || 'upcoming'}</span>
                        <span class="bg-gray-100 px-2 py-0.5 rounded">Target: ${c.target_category}</span>
                    </div>
                </div>
                <button onclick="deleteAdminChallenge(${c.id}, '${c.name.replace(/'/g, "\\'")}')" 
                        class="ml-4 text-red-600 hover:text-red-800 border border-red-200 px-3 py-1 rounded text-sm hover:bg-red-50 transition">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </div>
        `).join('');

    } catch (error) {
        console.error("Error loading challenges:", error);
        document.getElementById('admin-challenges-list').innerHTML = '<div class="p-4 text-red-500">Failed to load challenges</div>';
    }
};

window.deleteAdminChallenge = async (id, name) => {
    if (!confirm(`Are you sure you want to delete the challenge "${name}"? This cannot be undone.`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/challenges/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });

        if (response.ok) {
            setAlert('Challenge deleted successfully', 'success');
            loadAdminChallenges(); // Refresh list
        } else {
            const data = await response.json();
            setAlert(data.error || 'Failed to delete challenge', 'error');
        }
    } catch (error) {
        setAlert('Network error while deleting', 'error');
    }
};


// --- ADMIN ACTIONS ---

const loadAdminDashboard = async () => {
    try {
        // 1. Load Stats
        loadAdminStats(); // Reuse existing function for basic stats box

        // 2. Load Analytics & Health
        const response = await fetch(`${API_BASE_URL}/admin/analytics`, {
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        const data = await response.json();

        // Calculate Weekly Totals
        const weeklyUsers = data.userGrowth.reduce((acc, curr) => acc + (curr.count || 0), 0);
        const weeklyTransactions = data.transactionTrends.reduce((acc, curr) => acc + (curr.count || 0), 0);

        // Update Summary Cards
        const userCountEl = document.getElementById('weekly-users-count');
        const txCountEl = document.getElementById('weekly-transactions-count');

        if (userCountEl) userCountEl.textContent = weeklyUsers;
        if (txCountEl) txCountEl.textContent = weeklyTransactions;

        // Render Health
        const healthContainer = document.getElementById('system-health-container');
        if (healthContainer) {
            const uptimeHours = (data.systemHealth.uptime / 3600).toFixed(2);
            const memoryMB = (data.systemHealth.memoryUsage.heapUsed / 1024 / 1024).toFixed(0);

            healthContainer.innerHTML = `
                <div class="grid grid-cols-2 gap-4">
                    <div class="p-3 bg-green-50 rounded border border-green-100">
                        <p class="text-xs text-gray-500">Uptime</p>
                        <p class="font-mono font-bold text-green-700">${uptimeHours} hrs</p>
                    </div>
                    <div class="p-3 bg-blue-50 rounded border border-blue-100">
                        <p class="text-xs text-gray-500">Memory Load</p>
                        <p class="font-mono font-bold text-blue-700">${memoryMB} MB</p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded border border-gray-200">
                        <p class="text-xs text-gray-500">Node Version</p>
                        <p class="font-mono font-bold text-gray-700">${data.systemHealth.nodeVersion}</p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded border border-gray-200">
                        <p class="text-xs text-gray-500">Platform</p>
                        <p class="font-mono font-bold text-gray-700">${data.systemHealth.platform}</p>
                    </div>
                </div>
                <div class="mt-4">
                   <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                        <span class="text-sm font-medium text-gray-700">Services Operational</span>
                   </div>
                </div>
            `;
        }

        // Charts removed as per user request
    } catch (error) {
        console.error('Dashboard load failed', error);
    }
};

const loadAdminTransactions = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/transactions?limit=20`, {
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        const data = await response.json();

        const html = `
            <table class="min-w-full divide-y divide-gray-200 text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-3 py-2 text-left font-medium text-gray-500">Date</th>
                        <th class="px-3 py-2 text-left font-medium text-gray-500">User</th>
                        <th class="px-3 py-2 text-left font-medium text-gray-500">Description</th>
                        <th class="px-3 py-2 text-left font-medium text-gray-500">Amount</th>
                        <th class="px-3 py-2 text-left font-medium text-gray-500">Type</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${data.transactions.map(t => `
                        <tr>
                            <td class="px-3 py-2 text-gray-500">${formatDate(new Date(t.transaction_date))}</td>
                            <td class="px-3 py-2 font-medium text-indigo-600">${t.full_name} <br> <span class="text-xs text-gray-400">${t.email}</span></td>
                            <td class="px-3 py-2 text-gray-800">${t.description} <br> <span class="text-xs text-gray-500 bg-gray-100 px-1 rounded">${t.category}</span></td>
                            <td class="px-3 py-2 font-mono font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                                ${t.type === 'income' ? '+' : '-'}${t.amount}
                            </td>
                            <td class="px-3 py-2">
                                <span class="px-2 py-0.5 rounded-full text-xs ${t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                    ${t.type}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        document.getElementById('admin-transactions-container').innerHTML = html;
    } catch (error) {
        document.getElementById('admin-transactions-container').innerHTML = '<div class="text-red-500">Failed to load transactions</div>';
    }
};

window.handleAdminBroadcast = async (e) => {
    e.preventDefault();
    const subject = document.getElementById('broadcast-subject').value;
    const message = document.getElementById('broadcast-message').value;

    if (!confirm(`Send this broadcast to ALL users?`)) return;

    try {
        const btn = e.target.querySelector('button');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Sending...';

        const response = await fetch(`${API_BASE_URL}/admin/broadcast`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({ subject, message })
        });

        const data = await response.json();
        if (response.ok) {
            setAlert(data.message, 'success');
            e.target.reset();
        } else {
            throw new Error(data.error);
        }
        btn.disabled = false;
        btn.textContent = originalText;
    } catch (error) {
        setAlert(error.message, 'error');
    }
};

const loadAdminBadges = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/badges`, {
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        const data = await response.json();

        const html = data.badges.map(b => `
            <div class="flex items-start justify-between space-x-3 p-3 border rounded-lg bg-gray-50 hover:bg-white transition">
                <div class="flex items-start space-x-3 flex-1">
                    <div class="text-3xl">${b.icon}</div>
                    <div class="flex-1">
                        <h4 class="font-bold text-gray-800">${b.name}</h4>
                        <p class="text-xs text-gray-500 mb-1">${b.description}</p>
                        <div class="flex items-center space-x-2">
                             <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-mono">${b.code}</span>
                             <span class="text-xs text-gray-400">Rule: ${b.criteria_type} > ${b.criteria_threshold}</span>
                        </div>
                    </div>
                </div>
                <div class="flex flex-col gap-1">
                    <button onclick="editBadge(${b.id}, '${b.code}', '${b.name}', '${b.icon}', '${b.description.replace(/'/g, "\\'")}', '${b.criteria_type}', ${b.criteria_threshold})"
                            class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="deleteBadge(${b.id}, '${b.name}')"
                            class="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');

        document.getElementById('admin-badges-list').innerHTML = html || '<div class="col-span-2 text-center text-gray-400">No badges found</div>';
    } catch (error) {
        document.getElementById('admin-badges-list').innerHTML = '<div class="text-red-500">Failed to load badges</div>';
    }
};

window.handleCreateBadge = async (e) => {
    e.preventDefault();
    const payload = {
        code: document.getElementById('badge-code').value,
        name: document.getElementById('badge-name').value,
        icon: document.getElementById('badge-icon').value,
        description: document.getElementById('badge-desc').value,
        type: document.getElementById('badge-type').value,
        threshold: document.getElementById('badge-threshold').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/admin/badges`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            setAlert('Badge created successfully', 'success');
            e.target.reset();
            loadAdminBadges();
        } else {
            setAlert('Failed to create badge', 'error');
        }
    } catch (error) {
        setAlert('Error creating badge', 'error');
    }
};

const loadAdminStats = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        const data = await response.json();

        const statsHtml = `
            <div class="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500">
                <p class="text-sm text-gray-500">Total Users</p>
                <p class="text-2xl font-bold text-indigo-700">${data.users}</p>
            </div>
            <div class="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                <p class="text-sm text-gray-500">Total Transactions</p>
                <p class="text-2xl font-bold text-green-700">${data.transactions}</p>
            </div>
            <div class="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                <p class="text-sm text-gray-500">Active Goals</p>
                <p class="text-2xl font-bold text-blue-700">${data.goals}</p>
            </div>
            <div class="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
                <p class="text-sm text-gray-500">Pending Obligations</p>
                <p class="text-2xl font-bold text-yellow-700">${data.obligations}</p>
            </div>
        `;
        document.getElementById('admin-stats-container').innerHTML = statsHtml;
    } catch (error) {
        console.error('Failed to load admin stats', error);
        setAlert('Failed to load admin stats', 'error');
    }
};

const loadAdminUsers = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        const data = await response.json();

        const usersTableHtml = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name/Email</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${data.users.map(user => `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium text-gray-900">${user.full_name || 'No Name'}</div>
                                <div class="text-sm text-gray-500">${user.email}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${formatDate(new Date(user.created_at))}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}">
                                    ${user.is_admin ? 'Admin' : 'User'}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button onclick="toggleUserRole(${user.id}, ${!user.is_admin})" class="text-indigo-600 hover:text-indigo-900">
                                    ${user.is_admin ? 'Demote' : 'Make Admin'}
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        document.getElementById('users-table-container').innerHTML = usersTableHtml;
    } catch (error) {
        console.error('Failed to load users', error);
        document.getElementById('users-table-container').innerHTML = '<div class="p-8 text-center text-red-500">Failed to load users</div>';
    }
};

window.toggleUserRole = async (userId, makeAdmin) => {
    if (!confirm("Are you sure you want to change this user's role?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({ is_admin: makeAdmin })
        });

        if (response.ok) {
            setAlert('User role updated successfully', 'success');
            loadAdminUsers();
        } else {
            throw new Error('Failed to update role');
        }
    } catch (error) {
        setAlert(error.message, 'error');
    }
};

const fetchGroupMembers = async (groupId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/balances`, {
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        if (response.ok) {
            const data = await response.json();
            appState.currentGroupMembers = data.balances || [];
            // Re-render header if it's already visible
            const headerContainer = document.getElementById('family-header-container');
            if (headerContainer) {
                headerContainer.innerHTML = renderFamilyHeader().replace(/^<div/, '<div'); // hacky update, better to re-render dashboard
                renderDashboard();
            }
        }
    } catch (e) {
        console.error("Error fetching group members", e);
    }
};

const initializeListeners = async () => {
    if (!appState.token || !appState.userId) return;

    try {

        // Load transactions (Shared or Private)
        let transactionsUrl = `${API_BASE_URL}/transactions`;
        let goalsUrl = `${API_BASE_URL}/goals`;
        let obligationsUrl = `${API_BASE_URL}/obligations`;
        let budgetsUrl = `${API_BASE_URL}/budgets`;

        if (appState.isShared && appState.currentGroupId) {
            transactionsUrl = `${API_BASE_URL}/groups/${appState.currentGroupId}/transactions`;
            const qs = `?group_id=${appState.currentGroupId}`;
            goalsUrl += qs;
            obligationsUrl += qs;
            budgetsUrl += qs;
            console.log('Loading Shared Ledger from:', transactionsUrl);
            // Fetch group members as well
            fetchGroupMembers(appState.currentGroupId);
        }

        const transactionsResponse = await fetch(transactionsUrl, {
            headers: {
                'Authorization': `Bearer ${appState.token}`
            }
        });

        if (transactionsResponse.ok) {
            const data = await transactionsResponse.json();
            appState.transactions = data.transactions.map(t => ({
                id: t.id,
                amount: parseFloat(t.amount) || 0,
                description: t.description,
                category: t.category,
                type: t.type,
                isBusiness: t.is_business,
                gstAmount: t.gst_amount,
                currency: t.currency,
                timestamp: new Date(t.transaction_date)
            }));
        }

        // Load goals
        const goalsResponse = await fetch(goalsUrl, {
            headers: {
                'Authorization': `Bearer ${appState.token}`
            }
        });

        if (goalsResponse.ok) {
            const data = await goalsResponse.json();
            appState.goals = data.goals.map(g => ({
                id: g.id,
                name: g.name,
                targetAmount: parseFloat(g.target_amount),
                savedAmount: parseFloat(g.saved_amount) || 0,
                targetDate: new Date(g.target_date)
            })).sort((a, b) => b.id - a.id); // Sort by ID descending (newest first)
        }

        // Load obligations
        const obligationsResponse = await fetch(obligationsUrl, {
            headers: {
                'Authorization': `Bearer ${appState.token}`
            }
        });

        if (obligationsResponse.ok) {
            const data = await obligationsResponse.json();
            appState.obligations = data.obligations.map(o => ({
                id: o.id,
                description: o.description,
                amount: o.amount,
                dueDate: new Date(o.due_date),
                isPaid: o.is_paid
            })).sort((a, b) => b.dueDate - a.dueDate); // Sort by newest due date first
        }

        // Load budgets
        const budgetsResponse = await fetch(budgetsUrl, {
            headers: {
                'Authorization': `Bearer ${appState.token}`
            }
        });

        if (budgetsResponse.ok) {
            const data = await budgetsResponse.json();
            appState.budgets = data.budgets.map(b => ({
                id: b.id,
                category: b.category,
                amount: b.amount,
                currency: b.currency,
                spent_amount: b.spent_amount,
                remaining: b.amount - (b.spent_amount || 0)
            }));
        }

        // Check for automatic budget suggestion trigger
        if (appState.budgets.length === 0 && appState.transactions.length > 8) {
            // Only set the prompt if the chat is not already open.
            if (!appState.isChatOpen) {
                appState.showBudgetSuggestionPrompt = true;
            }
        }

        updateUI();
    } catch (error) {
        console.error("Failed to load data:", error);
    }
};

// Check for pending invite link
const checkPendingInvite = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinToken = urlParams.get('join');

    if (joinToken) {
        sessionStorage.setItem('pendingInvite', joinToken);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const pendingToken = sessionStorage.getItem('pendingInvite');
    if (pendingToken && appState.token) {
        try {
            const response = await fetch(`${API_BASE_URL}/groups/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${appState.token}`
                },
                body: JSON.stringify({ token: pendingToken })
            });

            const data = await response.json();
            if (response.ok) {
                setAlert(data.message, 'success');
                sessionStorage.removeItem('pendingInvite');
                // Initiate Groups module and switch view
                await import('./js/groups.js').then(async m => {
                    m.initGroups({ apiBaseUrl: API_BASE_URL, appState, setAlert });
                    // Force reload groups
                    await m.initializeGroupListeners();
                });

                appState.currentMainView = 'groups';
                localStorage.setItem('currentMainView', 'groups');
                updateUI();
            } else if (response.status === 404) {
                setAlert('Invite link is invalid or expired.', 'error');
                sessionStorage.removeItem('pendingInvite');
            } else if (response.status === 200 && data.message.includes('already')) {
                setAlert(data.message, 'info');
                sessionStorage.removeItem('pendingInvite');
                appState.currentMainView = 'groups';
                localStorage.setItem('currentMainView', 'groups');
                updateUI();
            }
        } catch (error) {
            console.error('Error joining group:', error);
        }
    }
};

const initializeAppAndAuth = async () => {
    try {
        // Check if user is already logged in via stored token
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            try {
                // Verify token with backend
                const response = await fetch(`${API_BASE_URL}/user/profile`, {
                    headers: {
                        'Authorization': `Bearer ${storedToken}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.user && data.user.id) {
                        appState.token = storedToken;
                        appState.userId = data.user.id;
                        appState.userEmail = data.user.email;
                        appState.userName = data.user.full_name;
                        appState.emailAlertsEnabled = data.user.email_alerts_enabled;
                        appState.activeCurrency = data.user.currency || 'INR';
                        appState.isAdmin = data.user.is_admin;
                        appState.geminiApiKey = data.geminiApiKey;

                        // Load Family Mode settings on init
                        appState.currentGroupId = data.user.current_group;
                        appState.isShared = (data.user.current_mode === 'shared');
                        // Successfully validated token and loaded user data
                        console.log('Token validated and user session restored');

                        // Initialize notifications
                        if (typeof initNotifications === 'function') {
                            initNotifications();
                        }
                    } else {
                        throw new Error('Invalid user data in response');
                    }
                } else if (response.status === 401 || response.status === 403) {
                    // Token is invalid or expired, clear it
                    console.error('Token is invalid, clearing session');
                    localStorage.removeItem('authToken');
                    appState.token = null;
                    appState.userId = null;
                    appState.userEmail = null;
                    appState.userName = null;
                    appState.isAdmin = false;
                    setAlert('Your session has expired. Please log in again.', 'info');
                } else {
                    // Other server error, don't clear token (might be temporary network issue)
                    console.error('Failed to verify token due to server error, keeping session:', response.status);
                }
            } catch (error) {
                // Network error or other issue, don't clear token
                console.error('Token verification failed due to network error, keeping session:', error);
            }
        }

        appState.isLoading = false;
        initializeListeners();
        updateUI();

        // Check for pending invite after initialization
        checkPendingInvite();
    } catch (e) {
        console.error("App Initialization Error:", e);
        appState.isLoading = false;
        appState.userId = null;
        updateUI();
    }
};

// Badge Management Functions
window.editBadge = (id, code, name, icon, description, type, threshold) => {
    // Populate form with existing values
    document.getElementById('badge-code').value = code;
    document.getElementById('badge-name').value = name;
    document.getElementById('badge-icon').value = icon;
    document.getElementById('badge-desc').value = description;
    document.getElementById('badge-type').value = type;
    document.getElementById('badge-threshold').value = threshold;

    // Change form submit to update instead of create
    const form = document.getElementById('admin-badge-form');
    form.onsubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/admin/badges/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${appState.token}`
                },
                body: JSON.stringify({
                    code: document.getElementById('badge-code').value,
                    name: document.getElementById('badge-name').value,
                    icon: document.getElementById('badge-icon').value,
                    description: document.getElementById('badge-desc').value,
                    type: document.getElementById('badge-type').value,
                    threshold: document.getElementById('badge-threshold').value
                })
            });

            if (response.ok) {
                setAlert('Badge updated successfully!', 'success');
                form.reset();
                // Reset form back to create mode
                form.onsubmit = window.handleCreateBadge;
                loadAdminBadges();
            } else {
                setAlert('Failed to update badge', 'error');
            }
        } catch (error) {
            setAlert('Error updating badge', 'error');
        }
    };

    // Scroll to form
    document.getElementById('admin-badge-form').scrollIntoView({ behavior: 'smooth' });
};

window.deleteBadge = async (id, name) => {
    if (!confirm(`Are you sure you want to delete the badge "${name}"? This will remove it from all users.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/badges/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${appState.token}`
            }
        });

        if (response.ok) {
            setAlert('Badge deleted successfully!', 'success');
            loadAdminBadges();
        } else {
            setAlert('Failed to delete badge', 'error');
        }
    } catch (error) {
        setAlert('Error deleting badge', 'error');
    }
};

// --- RUN APP ---
window.onload = () => {
    initThreeJS();
    // --- Delete/Clear API Wrappers ---

    window.deleteTransaction = async (id) => {
        if (!confirm('Are you sure you want to delete this transaction?')) return;
        try {
            let response;

            // Check if we're in shared mode - if so, this is a group expense
            if (appState.isShared && appState.currentGroupId) {
                // Delete group expense
                response = await fetch(`${API_BASE_URL}/groups/${appState.currentGroupId}/expenses/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${appState.token}` }
                });
            } else {
                // Delete personal transaction
                response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${appState.token}` }
                });
            }

            if (response.ok) {
                setAlert('Transaction deleted.', 'success');
                await initializeListeners();
                updateUI();
            } else {
                const error = await response.json();
                setAlert(error.message || 'Failed to delete transaction.', 'error');
            }
        } catch (e) {
            console.error(e);
            setAlert('Error deleting transaction.', 'error');
        }
    };

    window.clearAllTransactions = async () => {
        const confirmMessage = appState.isShared
            ? 'WARNING: This will delete ALL shared expenses for this group. This cannot be undone. Are you sure?'
            : 'WARNING: This will delete ALL your transactions. This cannot be undone. Are you sure?';

        if (!confirm(confirmMessage)) return;

        try {
            let response;

            if (appState.isShared && appState.currentGroupId) {
                // Shared mode - clear group expenses
                response = await fetch(`${API_BASE_URL}/groups/${appState.currentGroupId}/expenses`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${appState.token}` }
                });
            } else {
                // Private mode - clear personal transactions
                response = await fetch(`${API_BASE_URL}/transactions`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${appState.token}` }
                });
            }

            if (response.ok) {
                setAlert('All transactions cleared.', 'success');
                await initializeListeners();
                updateUI();
            } else { setAlert('Failed to clear transactions.', 'error'); }
        } catch (e) { console.error(e); setAlert('Error clearing transactions.', 'error'); }
    };

    window.deleteObligation = async (id) => {
        if (!confirm('Delete this obligation?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/obligations/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${appState.token}` }
            });
            if (response.ok) {
                setAlert('Obligation deleted.', 'success');
                await initializeListeners();
                updateUI();
            } else { setAlert('Failed to delete obligation.', 'error'); }
        } catch (e) { console.error(e); setAlert('Error deleting obligation.', 'error'); }
    };

    window.clearAllObligations = async () => {
        if (!confirm('Delete ALL obligations?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/obligations`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${appState.token}` }
            });
            if (response.ok) {
                setAlert('All obligations cleared.', 'success');
                await initializeListeners();
                updateUI();
            } else { setAlert('Failed to clear obligations.', 'error'); }
        } catch (e) { console.error(e); setAlert('Error clearing obligations.', 'error'); }
    };

    window.deleteBudget = async (id) => {
        if (!confirm('Delete this budget?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${appState.token}` }
            });
            if (response.ok) {
                setAlert('Budget deleted.', 'success');
                await initializeListeners();
                updateUI();
            } else { setAlert('Failed to delete budget.', 'error'); }
        } catch (e) { console.error(e); setAlert('Error deleting budget.', 'error'); }
    };

    window.clearAllBudgets = async () => {
        if (!confirm('Delete ALL budgets?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/budgets`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${appState.token}` }
            });
            if (response.ok) {
                setAlert('All budgets cleared.', 'success');
                await initializeListeners();
                updateUI();
            } else { setAlert('Failed to clear budgets.', 'error'); }
        } catch (e) { console.error(e); setAlert('Error clearing budgets.', 'error'); }
    };

    // Goal management functions
    window.editGoal = (id, name, targetAmount, targetDate) => {
        // Populate the form with existing values
        const container = document.getElementById('goals-tracker-container');
        container.dataset.showForm = 'true';
        container.dataset.editingGoalId = id;

        renderGoalTracker();

        // Fill in the form
        setTimeout(() => {
            const form = document.getElementById('goal-form');
            if (form) {
                form.goalName.value = name;
                form.targetAmount.value = targetAmount;
                form.targetDate.value = targetDate;
            }
        }, 100);
    };

    window.deleteGoal = async (id) => {
        if (!confirm('Delete this goal? This action cannot be undone.')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${appState.token}` }
            });
            if (response.ok) {
                // Remove from local state immediately
                appState.goals = appState.goals.filter(g => g.id !== id);

                setAlert('Goal deleted successfully.', 'success');

                // Just re-render the goals tracker, don't reload all data
                renderGoalTracker();
            } else { setAlert('Failed to delete goal.', 'error'); }
        } catch (e) { console.error(e); setAlert('Error deleting goal.', 'error'); }
    };

    // Initialize app
    initializeAppAndAuth();
};

window.correctCategory = async (id, oldCategory, description) => {
    const newCategory = prompt(`Current Category: ${oldCategory}\n\nEnter new category for this transaction:`, oldCategory);

    if (!newCategory || newCategory.trim() === '' || newCategory === oldCategory) return;

    const category = newCategory.trim();

    // 1. Update the specific transaction
    try {
        const response = await secureFetch(`${API_BASE_URL}/transactions/${id}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appState.token}` },
            body: JSON.stringify({ category: category })
        });

        if (!response.ok) throw new Error('Failed to update transaction');

        // Update local state
        const txn = appState.transactions.find(t => t.id == id);
        if (txn) txn.category = category;

        setAlert('Category updated!', 'success');
        updateUI();

    } catch (error) {
        console.error('Error updating category:', error);
        setAlert('Failed to update category.', 'error');
        return;
    }

    // 2. Ask to learn
    if (confirm(`Do you want AI to remember this rule?\n\n"${description}" -> "${category}"`)) {
        try {
            await secureFetch(`${API_BASE_URL}/learn-category`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appState.token}` },
                body: JSON.stringify({
                    keyword: description, // Sending full description as keyword for now, or ask user for keyword
                    category: category
                })
            });
            setAlert('AI has learned this rule!', 'success');
        } catch (error) {
            console.error('Error learning rule:', error);
            // Don't alert error here to not annoy user if main action succeeded
        }
    }
};
