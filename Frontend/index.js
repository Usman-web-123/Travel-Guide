// --- Constants ---
const VOICES = {
  English: { Male: "Matthew", Female: "Alicia" },
  Hindi: { Male: "Aman", Female: "Namrita" },
  Tamil: { Male: "Murali", Female: "Iniya" },
  Telugu: { Male: "Zion", Female: "Josie" }
};

const LOCALES = {
  English: "en-US",
  Hindi: "hi-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN"
};

// Dynamic API URL setup with production fallback
const LOCAL_API_URL = "http://127.0.0.1:5000";
const PROD_API_URL = "https://travel-guide-0jho.onrender.com";

function getPrimaryApiUrl() {
  const isLocalEnv = window.location.hostname === "localhost" || 
                     window.location.hostname === "127.0.0.1" || 
                     window.location.protocol === "file:" || 
                     window.location.hostname === "";
  return isLocalEnv ? LOCAL_API_URL : PROD_API_URL;
}

let API_BASE_URL = getPrimaryApiUrl();

// --- State ---
const state = {
  place: '',
  image: '',
  length: 'Summary',
  voice: 'Male',
  currentView: 'landing', // 'landing', 'destination', 'auth'
  currentUser: JSON.parse(localStorage.getItem('travel_user') || 'null')
};

// --- Helper for Safe Fetch with Automatic Endpoint Fallback ---
async function safeFetchJson(targetUrlOrEndpoint, options = {}) {
  let path = targetUrlOrEndpoint;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const parsed = new URL(path);
      path = parsed.pathname + parsed.search;
    } catch (e) {
      // keep path as is
    }
  }
  if (!path.startsWith("/")) path = "/" + path;

  const primaryUrl = `${API_BASE_URL}${path}`;
  const fallbackUrl = API_BASE_URL === LOCAL_API_URL 
    ? `${PROD_API_URL}${path}` 
    : `${LOCAL_API_URL}${path}`;

  let res;
  try {
    res = await fetch(primaryUrl, options);
  } catch (primaryErr) {
    // If primary fetch failed (e.g. local server not started), try fallback URL
    try {
      res = await fetch(fallbackUrl, options);
      API_BASE_URL = API_BASE_URL === LOCAL_API_URL ? PROD_API_URL : LOCAL_API_URL;
    } catch (fallbackErr) {
      throw new Error(
        "Unable to connect to the Travel Guide server. " +
        "Please make sure the backend server is running (run 'python Backend/app.py') " +
        "or check your internet connection."
      );
    }
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(text || `Server returned non-JSON status ${res.status}`);
  }
  
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

// --- DOM Elements ---
const globalBackBtn = document.getElementById('globalBackBtn');
const brandLogo = document.getElementById('brandLogo');
const landingHero = document.getElementById('landingHero');
const destinationsSection = document.getElementById('destinationsSection');
const cardsContainer = document.querySelector('.cards');
const experiencePanel = document.getElementById('experience');
const previewTitle = document.getElementById('previewTitle');
const audioSection = document.getElementById('audioSection');
const audioPlayer = document.getElementById('audioPlayer');
const transcriptText = document.getElementById('scriptText');
const generateButton = document.getElementById('generateBtn');
const languageSelect = document.getElementById('selectLanguage');
const closeButton = document.getElementById('closeExperience');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchPreviewCard = document.getElementById('searchPreviewCard');
const searchPreviewImage = document.getElementById('searchPreviewImage');
const searchPreviewTitle = document.getElementById('searchPreviewTitle');
const transcriptToggle = document.getElementById('transcriptToggle');
const transcriptContent = document.getElementById('transcriptContent');
const transcriptArrow = document.getElementById('transcriptArrow');

// Auth DOM Elements
const headerSearchGroup = document.getElementById('headerSearchGroup');
const authNavButtons = document.getElementById('authNavButtons');
const userProfileBadge = document.getElementById('userProfileBadge');
const userNameDisplay = document.getElementById('userNameDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const openLoginBtn = document.getElementById('openLoginBtn');
const openSignupBtn = document.getElementById('openSignupBtn');
const heroLoginBtn = document.getElementById('heroLoginBtn');

// Landing Auth Elements
const landingAuthCard = document.getElementById('landingAuthCard');
const landingWelcomeCard = document.getElementById('landingWelcomeCard');
const welcomeUserName = document.getElementById('welcomeUserName');
const landingTabLogin = document.getElementById('landingTabLogin');
const landingTabSignup = document.getElementById('landingTabSignup');
const landingAuthForm = document.getElementById('landingAuthForm');
const landingNameGroup = document.getElementById('landingNameGroup');
const landingAuthName = document.getElementById('landingAuthName');
const landingAuthEmail = document.getElementById('landingAuthEmail');
const landingAuthPassword = document.getElementById('landingAuthPassword');
const landingAuthSubmitBtn = document.getElementById('landingAuthSubmitBtn');
const landingAuthAlert = document.getElementById('landingAuthAlert');
const landingAuthSwitchBtn = document.getElementById('landingAuthSwitchBtn');
const landingAuthSwitchPrompt = document.getElementById('landingAuthSwitchPrompt');
const landingAuthTitle = document.getElementById('landingAuthTitle');
const landingAuthSub = document.getElementById('landingAuthSub');

let landingAuthMode = 'login'; // 'login' or 'signup'

// Modal Auth Elements
const authModal = document.getElementById('authModal');
const authModalTitle = document.getElementById('authModalTitle');
const authModalSub = document.getElementById('authModalSub');
const modalBackBtn = document.getElementById('modalBackBtn');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const tabLogin = document.getElementById('tabLogin');
const tabSignup = document.getElementById('tabSignup');
const authForm = document.getElementById('authForm');
const nameGroup = document.getElementById('nameGroup');
const authName = document.getElementById('authName');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authAlert = document.getElementById('authAlert');

let authMode = 'login'; // 'login' or 'signup'

// --- Navigation, History & Back Button Management ---
function updateNavigationState(view) {
  state.currentView = view;
  if (view === 'destination') {
    globalBackBtn.classList.remove('hidden');
  } else {
    globalBackBtn.classList.add('hidden');
  }
}

// Unified Back Navigation Handler (for browser back button & on-screen back buttons)
function handleBackNavigation() {
  if (!authModal.classList.contains('hidden')) {
    if (window.history.state && window.history.state.view === 'auth') {
      window.history.back();
    } else {
      closeAuthModal();
    }
    return;
  }

  if (state.currentView === 'destination') {
    if (window.history.state && window.history.state.view === 'destination') {
      window.history.back();
    } else {
      deselectDestination(false);
    }
    return;
  }

  // Already on landing view - scroll smoothly to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Browser History Popstate Listener (Handles Browser ← and → Buttons) ---
window.addEventListener('popstate', (e) => {
  const currentState = e.state;

  // 1. If auth modal is open and popped state is not auth, close modal
  if (!authModal.classList.contains('hidden') && (!currentState || currentState.view !== 'auth')) {
    closeAuthModal();
    if (!currentState || currentState.view !== 'destination') {
      return;
    }
  }

  // 2. Navigated forward/back to a Destination
  if (currentState && currentState.view === 'destination') {
    const cards = Array.from(document.querySelectorAll('.place-card:not(.search-preview-card)'));
    const matchedCard = cards.find(c => (c.dataset.place || '').toLowerCase() === (currentState.place || '').toLowerCase());
    selectDestination(currentState.place, currentState.image, matchedCard, false);
    return;
  }

  // 3. Navigated forward/back to Auth modal
  if (currentState && currentState.view === 'auth') {
    openAuthModal(currentState.authMode || 'login', false);
    return;
  }

  // 4. Navigated back to Landing page (destinations grid)
  if (state.currentView === 'destination') {
    deselectDestination(false);
  }
});

// Initialize initial browser history entry so clicking browser ← stays inside the app
if (!history.state) {
  history.replaceState({ view: 'landing' }, '', window.location.pathname + (window.location.hash || ''));
}

// Global top-left Back button handler
globalBackBtn.addEventListener('click', handleBackNavigation);

// Brand Logo handler (returns to landing view)
if (brandLogo) {
  brandLogo.addEventListener('click', () => {
    if (state.currentView === 'destination') {
      handleBackNavigation();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

// --- Functions ---
function updateAuthUI() {
  if (state.currentUser) {
    // Authenticated user state
    authNavButtons.classList.add('hidden');
    userProfileBadge.classList.remove('hidden');
    userNameDisplay.textContent = `👤 ${state.currentUser.name || 'User'}`;

    if (headerSearchGroup) headerSearchGroup.classList.remove('hidden');
    if (destinationsSection) destinationsSection.classList.remove('hidden');

    if (landingAuthCard) landingAuthCard.classList.add('hidden');
    if (landingWelcomeCard) {
      landingWelcomeCard.classList.remove('hidden');
      if (welcomeUserName) welcomeUserName.textContent = state.currentUser.name || 'Traveler';
    }
  } else {
    // Guest (unauthenticated) state: ONLY landing page with login/signup is visible; destinations are hidden
    authNavButtons.classList.remove('hidden');
    userProfileBadge.classList.add('hidden');

    if (headerSearchGroup) headerSearchGroup.classList.add('hidden');
    if (destinationsSection) destinationsSection.classList.add('hidden');
    if (experiencePanel) experiencePanel.classList.add('hidden');

    if (landingAuthCard) landingAuthCard.classList.remove('hidden');
    if (landingWelcomeCard) landingWelcomeCard.classList.add('hidden');
  }
}

function selectDestination(place, image, clickedCard = null, pushHistory = true) {
  state.place = place;
  state.image = image;

  // Update UI content
  previewTitle.textContent = place;
  cardsContainer.classList.add('faded');

  // Reset previous states
  document.querySelectorAll('.place-card').forEach(card => card.classList.remove('active'));
  searchPreviewCard.classList.add('hidden');

  // Handle Card Visibility
  if (clickedCard) {
    clickedCard.classList.add('active');
  } else {
    // If it's a search result, show the preview card
    searchPreviewImage.src = image;
    searchPreviewTitle.textContent = place;
    searchPreviewCard.classList.remove('hidden');
    searchPreviewCard.classList.add('active');
  }

  // Reset Audio Panel
  audioSection.classList.add('hidden');
  audioPlayer.src = '';
  transcriptText.textContent = '';
  generateButton.textContent = 'Generate Audio Guide';
  generateButton.disabled = false;

  // Show Panel with animation
  experiencePanel.classList.remove('hidden');
  setTimeout(() => {
    experiencePanel.classList.add('visible');
  }, 10);

  updateNavigationState('destination');

  // Push destination state to browser history so the browser Back button returns to the landmarks grid
  if (pushHistory) {
    const slug = place.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    history.pushState({ view: 'destination', place, image }, '', `#${slug}`);
  }
}

function deselectDestination(updateHistory = false) {
  experiencePanel.classList.remove('visible');

  // Wait for animation to finish before hiding
  setTimeout(() => {
    experiencePanel.classList.add('hidden');
    cardsContainer.classList.remove('faded');
    searchPreviewCard.classList.add('hidden');
    document.querySelectorAll('.place-card').forEach(card => card.classList.remove('active'));
    if (typeof applyFilters === 'function') applyFilters();
    updateNavigationState('landing');
  }, 300);

  if (updateHistory) {
    history.pushState({ view: 'landing' }, '', window.location.pathname);
  }
}

// --- Auth Modal Control ---
function openAuthModal(mode = 'login', pushHistory = true) {
  authMode = mode;
  authModal.classList.remove('hidden');
  authAlert.classList.add('hidden');
  
  if (mode === 'login') {
    tabLogin.classList.add('border-[#ff8a1f]', 'text-[#ff8a1f]');
    tabLogin.classList.remove('border-transparent', 'text-gray-400');
    tabSignup.classList.remove('border-[#ff8a1f]', 'text-[#ff8a1f]');
    tabSignup.classList.add('border-transparent', 'text-gray-400');
    nameGroup.classList.add('hidden');
    authModalTitle.textContent = 'Welcome Back';
    authModalSub.textContent = 'Sign in to save custom guides & preferences';
    authSubmitBtn.textContent = 'Log In';
  } else {
    tabSignup.classList.add('border-[#ff8a1f]', 'text-[#ff8a1f]');
    tabSignup.classList.remove('border-transparent', 'text-gray-400');
    tabLogin.classList.remove('border-[#ff8a1f]', 'text-[#ff8a1f]');
    tabLogin.classList.add('border-transparent', 'text-gray-400');
    nameGroup.classList.remove('hidden');
    authModalTitle.textContent = 'Create an Account';
    authModalSub.textContent = 'Join Travel Guide to explore AI audio guides';
    authSubmitBtn.textContent = 'Sign Up';
  }

  if (pushHistory) {
    history.pushState({ view: 'auth', authMode: mode }, '', '#auth');
  }
}

function closeAuthModal() {
  authModal.classList.add('hidden');
}

// Shared Authentication Executor (handles both Landing page form & Modal form)
async function executeAuth(mode, name, email, password, alertElem, submitBtn) {
  if (alertElem) alertElem.classList.add('hidden');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
  }

  const endpoint = mode === 'signup' ? '/api/signup' : '/api/login';
  const payload = {
    email: (email || '').trim(),
    password: password || '',
    ...(mode === 'signup' && { name: (name || '').trim() })
  };

  try {
    const data = await safeFetchJson(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    state.currentUser = data.user;
    localStorage.setItem('travel_user', JSON.stringify(data.user));
    updateAuthUI();
    closeAuthModal();

    // Smoothly reveal and scroll down to the destinations section
    setTimeout(() => {
      if (destinationsSection) {
        destinationsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 250);

    return data;
  } catch (err) {
    if (alertElem) {
      alertElem.textContent = err.message;
      alertElem.className = 'text-xs text-center py-2 px-3 rounded-lg bg-red-50 text-red-600 border border-red-200 block';
    } else {
      alert(err.message);
    }
    throw err;
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = mode === 'signup' ? 'Sign Up' : 'Log In';
    }
  }
}

// Landing Auth Tab Switching
function setLandingAuthMode(mode = 'login') {
  landingAuthMode = mode;
  if (landingAuthAlert) landingAuthAlert.classList.add('hidden');

  if (mode === 'login') {
    if (landingTabLogin) {
      landingTabLogin.classList.add('border-[#ff8a1f]', 'text-[#ff8a1f]');
      landingTabLogin.classList.remove('border-transparent', 'text-gray-400');
    }
    if (landingTabSignup) {
      landingTabSignup.classList.remove('border-[#ff8a1f]', 'text-[#ff8a1f]');
      landingTabSignup.classList.add('border-transparent', 'text-gray-400');
    }
    if (landingNameGroup) landingNameGroup.classList.add('hidden');
    if (landingAuthTitle) landingAuthTitle.textContent = 'Sign In to Explore';
    if (landingAuthSub) landingAuthSub.textContent = 'Unlock all 28 destinations & personalized AI guides';
    if (landingAuthSubmitBtn) landingAuthSubmitBtn.textContent = 'Log In to Unlock Destinations';
    if (landingAuthSwitchPrompt) {
      landingAuthSwitchPrompt.innerHTML = 'Don\'t have an account? <button id="landingAuthSwitchBtn" type="button" class="text-[#ff8a1f] font-bold hover:underline">Sign Up</button>';
      const newSwitch = document.getElementById('landingAuthSwitchBtn');
      if (newSwitch) newSwitch.addEventListener('click', () => setLandingAuthMode('signup'));
    }
  } else {
    if (landingTabSignup) {
      landingTabSignup.classList.add('border-[#ff8a1f]', 'text-[#ff8a1f]');
      landingTabSignup.classList.remove('border-transparent', 'text-gray-400');
    }
    if (landingTabLogin) {
      landingTabLogin.classList.remove('border-[#ff8a1f]', 'text-[#ff8a1f]');
      landingTabLogin.classList.add('border-transparent', 'text-gray-400');
    }
    if (landingNameGroup) landingNameGroup.classList.remove('hidden');
    if (landingAuthTitle) landingAuthTitle.textContent = 'Create an Account';
    if (landingAuthSub) landingAuthSub.textContent = 'Get free instant access to all 28 worldwide audio guides';
    if (landingAuthSubmitBtn) landingAuthSubmitBtn.textContent = 'Sign Up & Start Exploring';
    if (landingAuthSwitchPrompt) {
      landingAuthSwitchPrompt.innerHTML = 'Already have an account? <button id="landingAuthSwitchBtn" type="button" class="text-[#ff8a1f] font-bold hover:underline">Log In</button>';
      const newSwitch = document.getElementById('landingAuthSwitchBtn');
      if (newSwitch) newSwitch.addEventListener('click', () => setLandingAuthMode('login'));
    }
  }
}

if (landingTabLogin) landingTabLogin.addEventListener('click', () => setLandingAuthMode('login'));
if (landingTabSignup) landingTabSignup.addEventListener('click', () => setLandingAuthMode('signup'));
if (landingAuthSwitchBtn) {
  landingAuthSwitchBtn.addEventListener('click', () => {
    setLandingAuthMode(landingAuthMode === 'login' ? 'signup' : 'login');
  });
}

// Landing Auth Form Submit
if (landingAuthForm) {
  landingAuthForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await executeAuth(
        landingAuthMode,
        landingAuthName ? landingAuthName.value : '',
        landingAuthEmail ? landingAuthEmail.value : '',
        landingAuthPassword ? landingAuthPassword.value : '',
        landingAuthAlert,
        landingAuthSubmitBtn
      );
    } catch (err) {}
  });
}

// Modal Form Submit
if (authForm) {
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await executeAuth(
        authMode,
        authName ? authName.value : '',
        authEmail ? authEmail.value : '',
        authPassword ? authPassword.value : '',
        authAlert,
        authSubmitBtn
      );
    } catch (err) {}
  });
}

// Modal Back & Close Events
modalBackBtn.addEventListener('click', handleBackNavigation);
modalCloseBtn.addEventListener('click', handleBackNavigation);
tabLogin.addEventListener('click', () => openAuthModal('login'));
tabSignup.addEventListener('click', () => openAuthModal('signup'));

// Header & Hero Navigation Buttons
if (openLoginBtn) {
  openLoginBtn.addEventListener('click', () => {
    if (!state.currentUser && landingAuthCard) {
      setLandingAuthMode('login');
      landingAuthCard.scrollIntoView({ behavior: 'smooth' });
    } else {
      openAuthModal('login');
    }
  });
}

if (openSignupBtn) {
  openSignupBtn.addEventListener('click', () => {
    if (!state.currentUser && landingAuthCard) {
      setLandingAuthMode('signup');
      landingAuthCard.scrollIntoView({ behavior: 'smooth' });
    } else {
      openAuthModal('signup');
    }
  });
}

if (heroLoginBtn) {
  heroLoginBtn.addEventListener('click', () => {
    if (!state.currentUser && landingAuthCard) {
      setLandingAuthMode('signup');
      landingAuthCard.scrollIntoView({ behavior: 'smooth' });
    } else {
      openAuthModal('signup');
    }
  });
}

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('travel_user');
  state.currentUser = null;
  updateAuthUI();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// --- Continent & Category Filter Logic ---
const filterTabs = document.querySelectorAll('.filter-tab');

function applyFilters() {
  const activeFilter = state.activeFilter || 'all';
  const query = (searchInput.value || '').trim().toLowerCase();
  const cards = document.querySelectorAll('.place-card:not(.search-preview-card)');

  cards.forEach(card => {
    const categories = (card.dataset.category || '').toLowerCase();
    const place = (card.dataset.place || '').toLowerCase();
    const location = (card.dataset.location || '').toLowerCase();

    const matchesFilter = activeFilter === 'all' || categories.includes(activeFilter);
    const matchesSearch = !query || place.includes(query) || location.includes(query);

    if (matchesFilter && matchesSearch) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const filter = tab.dataset.filter;
    state.activeFilter = filter;

    filterTabs.forEach(t => {
      t.classList.remove('active', 'bg-[#ff8a1f]', 'text-white', 'shadow-md', 'shadow-orange-200');
      t.classList.add('bg-white', 'text-gray-600', 'border', 'border-gray-200');
    });

    tab.classList.add('active', 'bg-[#ff8a1f]', 'text-white', 'shadow-md', 'shadow-orange-200');
    tab.classList.remove('bg-white', 'text-gray-600', 'border', 'border-gray-200');

    applyFilters();
  });
});

// --- Search Handler ---
function performSearch() {
  const query = searchInput.value.trim();
  if (!query) return;
  const lowerQuery = query.toLowerCase();

  const cards = Array.from(document.querySelectorAll('.place-card:not(.search-preview-card)'));
  let foundCard = cards.find(card => {
    const place = (card.dataset.place || '').toLowerCase();
    const location = (card.dataset.location || '').toLowerCase();
    return place.includes(lowerQuery) || location.includes(lowerQuery);
  });

  if (foundCard) {
    foundCard.style.display = '';
    selectDestination(foundCard.dataset.place, foundCard.dataset.image, foundCard);
    destinationsSection.scrollIntoView({ behavior: 'smooth' });
  } else {
    // Dynamic preview for any searched world landmark
    const fallbackImage = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80";
    selectDestination(query, fallbackImage);
    destinationsSection.scrollIntoView({ behavior: 'smooth' });
  }
}

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') performSearch();
});
searchInput.addEventListener('input', () => {
  if (state.currentView === 'landing') {
    applyFilters();
  }
});

// --- Event Listeners ---
closeButton.addEventListener('click', handleBackNavigation);

// Click delegation for all landmark cards
cardsContainer.addEventListener('click', (e) => {
  const card = e.target.closest('.place-card:not(.search-preview-card)');
  if (card && state.currentView !== 'destination') {
    selectDestination(card.dataset.place, card.dataset.image, card);
  }
});

document.querySelectorAll('.place-card:not(.search-preview-card)').forEach(card => {
  card.addEventListener('click', () => {
    if (state.currentView !== 'destination') {
      selectDestination(card.dataset.place, card.dataset.image, card);
    }
  });
});

// Option Toggles (History Type)
const lengthButtons = document.querySelectorAll('[data-group="length"] button');
lengthButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    lengthButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.length = btn.dataset.value;
  });
});

// Option Toggles (Voice Gender)
const voiceButtons = document.querySelectorAll('[data-group="voice"] button');
voiceButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    voiceButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.voice = btn.dataset.value;
  });
});

// Generate Audio Guide Button Logic
generateButton.addEventListener('click', async () => {
  generateButton.disabled = true;
  generateButton.textContent = '⏳ Generating Audio...';

  try {
    const selectedLanguage = languageSelect.value;
    const selectedVoice = state.voice;

    const data = await safeFetchJson(`${API_BASE_URL}/generate-audio-guide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        place: state.place,
        answerType: state.length,
        language: selectedLanguage,
        voiceId: VOICES[selectedLanguage][selectedVoice],
        locale: LOCALES[selectedLanguage],
        userEmail: state.currentUser ? state.currentUser.email : null
      })
    });

    // Update UI with Result
    transcriptText.textContent = data.description;
    audioSection.classList.remove('hidden');

    if (data.audioBase64) {
      audioPlayer.src = `data:audio/mp3;base64,${data.audioBase64}`;
      audioPlayer.load();
      audioPlayer.classList.remove('hidden');
      generateButton.textContent = 'Listen to Audio';
    } else {
      audioPlayer.classList.add('hidden');
      generateButton.textContent = 'Audio Not Available';
    }

  } catch (err) {
    console.error(err);
    alert(`Generation Notice: ${err.message}`);
    generateButton.textContent = 'Generate Audio Guide';
    generateButton.disabled = false;
  }
});

// Transcript Toggle
transcriptToggle.addEventListener('click', () => {
  transcriptContent.classList.toggle('hidden');
  transcriptArrow.classList.toggle('rotate-180');
});

// Initialize Auth State on load
updateAuthUI();

// Restore view from URL hash on direct link or refresh
window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash;
  if (hash && hash !== '#auth' && hash !== '#destinationsSection') {
    const cleanHash = hash.replace('#', '').toLowerCase();
    const cards = Array.from(document.querySelectorAll('.place-card:not(.search-preview-card)'));
    const matched = cards.find(c => {
      const slug = (c.dataset.place || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return slug === cleanHash || (c.dataset.place || '').toLowerCase() === cleanHash;
    });
    if (matched) {
      selectDestination(matched.dataset.place, matched.dataset.image, matched, false);
    }
  } else if (hash === '#auth') {
    openAuthModal('login', false);
  }
});
