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

// Dynamic API URL for local & production deployment
const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? "http://127.0.0.1:5000" 
  : ""; // On Vercel / Render production, empty string will use relative backend or env configured API URL

// --- State ---
const state = {
  place: '',
  image: '',
  length: 'Summary',
  voice: 'Male',
  currentView: 'landing', // 'landing', 'destination', 'auth'
  currentUser: JSON.parse(localStorage.getItem('travel_user') || 'null')
};

// --- DOM Elements ---
const globalBackBtn = document.getElementById('globalBackBtn');
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
const authNavButtons = document.getElementById('authNavButtons');
const userProfileBadge = document.getElementById('userProfileBadge');
const userNameDisplay = document.getElementById('userNameDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const openLoginBtn = document.getElementById('openLoginBtn');
const openSignupBtn = document.getElementById('openSignupBtn');
const heroLoginBtn = document.getElementById('heroLoginBtn');
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

// --- Navigation & Back Button Management ---
function updateNavigationState(view) {
  state.currentView = view;
  if (view === 'destination') {
    globalBackBtn.classList.remove('hidden');
  } else {
    globalBackBtn.classList.add('hidden');
  }
}

// Global top-left Back button handler
globalBackBtn.addEventListener('click', () => {
  deselectDestination();
});

// --- Functions ---
function updateAuthUI() {
  if (state.currentUser) {
    authNavButtons.classList.add('hidden');
    userProfileBadge.classList.remove('hidden');
    userNameDisplay.textContent = `👤 ${state.currentUser.name || 'User'}`;
  } else {
    authNavButtons.classList.remove('hidden');
    userProfileBadge.classList.add('hidden');
  }
}

function selectDestination(place, image, clickedCard = null) {
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
}

function deselectDestination() {
  experiencePanel.classList.remove('visible');

  // Wait for animation to finish before hiding
  setTimeout(() => {
    experiencePanel.classList.add('hidden');
    cardsContainer.classList.remove('faded');
    searchPreviewCard.classList.add('hidden');
    document.querySelectorAll('.place-card').forEach(card => card.classList.remove('active'));
    updateNavigationState('landing');
  }, 300);
}

// --- Auth Modal Control ---
function openAuthModal(mode = 'login') {
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
}

function closeAuthModal() {
  authModal.classList.add('hidden');
}

// Modal Back & Close Events
modalBackBtn.addEventListener('click', closeAuthModal);
modalCloseBtn.addEventListener('click', closeAuthModal);
tabLogin.addEventListener('click', () => openAuthModal('login'));
tabSignup.addEventListener('click', () => openAuthModal('signup'));
openLoginBtn.addEventListener('click', () => openAuthModal('login'));
openSignupBtn.addEventListener('click', () => openAuthModal('signup'));
heroLoginBtn.addEventListener('click', () => openAuthModal('signup'));

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('travel_user');
  state.currentUser = null;
  updateAuthUI();
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authAlert.classList.add('hidden');
  authSubmitBtn.disabled = true;
  authSubmitBtn.textContent = 'Processing...';

  const endpoint = authMode === 'signup' ? '/api/signup' : '/api/login';
  const payload = {
    email: authEmail.value,
    password: authPassword.value,
    ...(authMode === 'signup' && { name: authName.value })
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed');
    }

    state.currentUser = data.user;
    localStorage.setItem('travel_user', JSON.stringify(data.user));
    updateAuthUI();
    closeAuthModal();
    alert(`Success! Welcome ${data.user.name}`);

  } catch (err) {
    authAlert.textContent = err.message;
    authAlert.className = 'text-xs text-center py-2 px-3 rounded-lg bg-red-50 text-red-600 border border-red-200 block';
  } finally {
    authSubmitBtn.disabled = false;
    authSubmitBtn.textContent = authMode === 'signup' ? 'Sign Up' : 'Log In';
  }
});

// --- Search Handler ---
function performSearch() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return;

  const cards = document.querySelectorAll('.place-card:not(.search-preview-card)');
  let foundCard = null;

  cards.forEach(card => {
    const place = card.dataset.place.toLowerCase();
    if (place.includes(query)) {
      foundCard = card;
    }
  });

  if (foundCard) {
    selectDestination(foundCard.dataset.place, foundCard.dataset.image, foundCard);
    destinationsSection.scrollIntoView({ behavior: 'smooth' });
  } else {
    alert(`No landmark found matching "${query}". Showing Taj Mahal preview.`);
    selectDestination("Taj Mahal", "https://s3.ap-south-1.amazonaws.com/new-assets.ccbp.in/frontend/loading-data/niat-course-projects/Taj_Mahal_%28Edited%29.jpeg");
  }
}

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') performSearch();
});

// --- Event Listeners ---
closeButton.addEventListener('click', deselectDestination);

document.querySelectorAll('.place-card:not(.search-preview-card)').forEach(card => {
  card.addEventListener('click', () => {
    selectDestination(card.dataset.place, card.dataset.image, card);
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

    const response = await fetch(`${API_BASE_URL}/generate-audio-guide`, {
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

    if (!response.ok) throw new Error('Generation failed');

    const data = await response.json();

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
    alert('Generation failed. Please check your connection or backend server.');
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
