# Chrome Cookie Monster

A Chrome extension that helps you view and manage cookies for the current website, with built-in intelligence to identify session cookies.

## Features

- 👀 View all cookies for the current domain
- 🔍 Smart detection of session cookies with configurable patterns
- 💾 Settings persist across browser sessions
- 📋 Copy individual cookie values with a click
- 🔄 Copy all cookies in a formatted string (name1=value1;name2=value2)

## Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

### Viewing Cookies
- Click the extension icon to view all cookies for the current domain
- Session cookies are highlighted with a blue border and labeled
- Click any cookie value to copy it to clipboard

### Copy All Cookies
- Click "Copy All Cookies" to copy all cookies in `name1=value1;name2=value2` format
- Useful for testing or API requests

### Customizing Session Detection
1. Click the "Settings" button
2. View current patterns used to detect session cookies
3. Add new patterns or remove existing ones
4. Use "Reset to Defaults" to restore original patterns

## Default Session Cookie Patterns
- sessid
- sessionid
- phpsessid
- aspsessionid
- jsessionid
- cfid
- cftoken
- sid
- session
- userid
- auth
- token

## Technical Details

The extension uses multiple factors to identify session cookies:
- Name matching against known patterns
- No expiration date
- Secure and HttpOnly flags
- Root path setting

## Permissions Used
- `cookies`: To read cookie data
- `activeTab`: To get current tab URL
- `storage`: To save settings
- `<all_urls>`: To access cookies across domains

## Contributing

Feel free to submit issues and enhancement requests!

## License

[MIT License](LICENSE)
