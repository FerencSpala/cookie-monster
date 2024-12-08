const DEFAULT_SESSION_PATTERNS = [
  'sessid', 'sessionid', 'phpsessid', 'aspsessionid', 
  'jsessionid', 'cfid', 'cftoken', 'sid', 'session', 
  'userid', 'auth', 'token'
];

let currentPatterns = DEFAULT_SESSION_PATTERNS; // Global variable to store patterns

document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Initialize settings and get patterns
    currentPatterns = await initializeSettings();
    
    // Get current tab using Promise wrapper
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab.url);
    const domain = url.hostname;
    
    // Display current domain
    document.getElementById('current-domain').textContent = domain;
    
    // Get cookies using Promise wrapper
    const cookies = await chrome.cookies.getAll({ domain: domain });

    const cookieList = document.getElementById('cookie-list');
    
    if (!cookies?.length) {
      cookieList.innerHTML = '<div class="no-cookies">No cookies found for this domain</div>';
      return;
    }
    
    // Clear loading message
    cookieList.innerHTML = '';
    
    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Sort and display cookies
    cookies
      .sort((a, b) => {
        // First compare by session status
        const aIsSession = isLikelySessionCookie(a);
        const bIsSession = isLikelySessionCookie(b);
        
        if (aIsSession !== bIsSession) {
          return aIsSession ? -1 : 1;
        }
        
        return a.name.localeCompare(b.name);
      })
      .forEach(cookie => {
        const cookieElement = createCookieElement(cookie);
        fragment.appendChild(cookieElement);
      });
    
    cookieList.appendChild(fragment);
    
    // Add copy all handler
    const copyAllButton = document.getElementById('copy-all');
    copyAllButton.addEventListener('click', () => {
      const cookieString = cookies
        .map(cookie => `${cookie.name}=${cookie.value}`)
        .join(';');
      
      const textarea = document.createElement('textarea');
      textarea.value = cookieString;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand('copy');
        
        // Visual feedback
        const originalText = copyAllButton.textContent;
        copyAllButton.textContent = 'Copied!';
        copyAllButton.style.backgroundColor = '#4CAF50';
        
        setTimeout(() => {
          copyAllButton.textContent = originalText;
          copyAllButton.style.backgroundColor = '';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      } finally {
        document.body.removeChild(textarea);
      }
    });

  } catch (error) {
    console.error('Error:', error);
    document.getElementById('cookie-list').innerHTML = 
      '<div class="no-cookies">Error loading cookies. Please try again.</div>';
  }
});

async function initializeSettings() {
  const settingsButton = document.getElementById('toggle-settings');
  const settingsPanel = document.getElementById('settings-panel');
  const patternList = document.getElementById('pattern-list');
  const newPatternInput = document.getElementById('new-pattern');
  const addPatternButton = document.getElementById('add-pattern');
  const resetButton = document.getElementById('reset-defaults');

  // Toggle settings panel
  settingsButton.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
  });

  // Render pattern list
  function renderPatterns() {
    patternList.innerHTML = currentPatterns.map(pattern => `
      <div class="pattern-item">
        ${escapeHtml(pattern)}
        <button class="delete-pattern" data-pattern="${escapeHtml(pattern)}">x</button>
      </div>
    `).join('');
    
    // Update storage
    chrome.storage.sync.set({ sessionPatterns: currentPatterns });
  }

  // Add new pattern
  addPatternButton.addEventListener('click', () => {
    const newPattern = newPatternInput.value.trim().toLowerCase();
    if (newPattern && !currentPatterns.includes(newPattern)) {
      currentPatterns.push(newPattern);
      renderPatterns();
      newPatternInput.value = '';
    }
  });

  // Delete pattern
  patternList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-pattern')) {
      const pattern = e.target.dataset.pattern;
      currentPatterns = currentPatterns.filter(p => p !== pattern);
      renderPatterns();
    }
  });

  // Reset to defaults
  resetButton.addEventListener('click', () => {
    currentPatterns = [...DEFAULT_SESSION_PATTERNS];
    renderPatterns();
  });

  // Initial render
  renderPatterns();
  
  return currentPatterns;
}

function isLikelySessionCookie(cookie) {
  const technicalCharacteristics = [
    !cookie.expirationDate,
    (cookie.secure && cookie.httpOnly),
    cookie.path === '/',
  ];

  const cookieName = cookie.name.toLowerCase();
  
  // Use global currentPatterns instead of fetching from storage
  const hasSessionName = currentPatterns.some(pattern => 
    cookieName.includes(pattern)
  );

  const technicalScore = technicalCharacteristics.filter(Boolean).length;

  return hasSessionName || technicalScore >= 2;
}

function createCookieElement(cookie) {
  const cookieElement = document.createElement('div');
  cookieElement.className = 'cookie-item';
  
  if (isLikelySessionCookie(cookie)) {
    cookieElement.classList.add('session-cookie');
  }
  
  const expirationDate = cookie.expirationDate 
    ? new Date(cookie.expirationDate * 1000).toLocaleString()
    : 'Session Cookie';
  
  const cookieValue = cookie.value || '';
  
  cookieElement.innerHTML = `
    <h3>${escapeHtml(cookie.name)}</h3>
    <div class="cookie-detail cookie-value" data-value="${escapeHtml(cookieValue)}">
      <strong>Value:</strong> <span class="clickable-value">${escapeHtml(cookieValue)}</span>
      <span class="copy-feedback">Copied!</span>
    </div>
    <div class="cookie-detail"><strong>Domain:</strong> ${escapeHtml(cookie.domain)}</div>
    <div class="cookie-detail"><strong>Path:</strong> ${escapeHtml(cookie.path)}</div>
    <div class="cookie-detail"><strong>Expires:</strong> ${escapeHtml(expirationDate)}</div>
    <div class="cookie-detail"><strong>Secure:</strong> ${cookie.secure}</div>
    <div class="cookie-detail"><strong>HttpOnly:</strong> ${cookie.httpOnly}</div>
    <div class="cookie-detail"><strong>SameSite:</strong> ${cookie.sameSite || 'None'}</div>
  `;
  
  // Add click handler for the value
  const valueElement = cookieElement.querySelector('.cookie-value');
  valueElement.addEventListener('click', () => {
    const value = valueElement.dataset.value;
    
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      const feedback = valueElement.querySelector('.copy-feedback');
      feedback.classList.add('show');
      setTimeout(() => {
        feedback.classList.remove('show');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    } finally {
      document.body.removeChild(textarea);
    }
  });
  
  return cookieElement;
}

function escapeHtml(unsafe) {
  if (unsafe == null) return '';
  return unsafe
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
} 