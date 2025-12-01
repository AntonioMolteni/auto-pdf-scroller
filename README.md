# Auto PDF Scroller

Auto PDF Scroller is a lightweight Electron application that automatically scrolls through PDF documents at a configurable speed. Perfect for hands-free reading, presentations, or studying.

### Download

Grab the latest `.dmg` from the [Releases Page](https://github.com/AntonioMolteni/auto-pdf-scroller/releases) for an easy, ready-to-use installation.

## Features

### Core Functionality

- **Automatic PDF Scrolling**: Smooth, time-based autoscroll at adjustable speeds (0.5x - 8x)
- **Multi-File Support**: Load entire folders of PDFs and navigate between them
- **Persistent Settings**: Automatically remembers your last opened folder
- **Manual Scroll Detection**: Automatically pauses autoscroll when you manually interact with the document, then resumes after 3 seconds
- **Smooth Performance**: Fractional pixel accumulation ensures smooth scrolling at all speeds

### Desktop Features

- Two-column layout with file list sidebar
- Native-looking UI with system button styling
- Responsive controls bar

### Mobile Features

- Fully responsive design for phones and tablets
- Portrait and landscape orientation support
- Hamburger menu for file list navigation
- Optimized touch controls
- Adjustable PDF scale for better mobile viewing

### Accessibility & Controls Enhancements

- **Unified Start/Stop Button**: Toggle autoscroll with a single button
- **Keyboard Shortcuts**:
  - `Space` to start or stop auto-scrolling
  - `Arrow Keys` to adjust scrolling speed dynamically
- **Consistent Styling**: Cleaner and more cohesive UI
- **App Icon Added**: New application icon for better visual identity

## Controls

| Control           | Action                                                 |
| ----------------- | ------------------------------------------------------ |
| **Select Folder** | Choose a folder containing PDF files                   |
| **☰ (Hamburger)** | Toggle file list on mobile                             |
| **▶ / ⏹**         | Start or stop automatic scrolling                      |
| **Speed Slider**  | Adjust scroll speed (0.5 - 8.0 px/sec)                 |
| **Manual Scroll** | Any manual interaction pauses autoscroll for 3 seconds |
| **Keyboard**      | `Space` to start/stop, `Arrow Keys` to adjust speed    |

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- macOS, Windows, or Linux

### Installation

```bash
# Clone the repository
git clone https://github.com/AntonioMolteni/auto-pdf-scroller.git
cd auto-pdf-scroller

# Install dependencies
npm install

# Run in development mode
npm start
```

### Building

```bash
# Build distribution packages
npx electron-builder

# Output files will be in the dist/ directory
```

## Technical Details

### Stack

- **Framework**: Electron 39.2.4
- **PDF Engine**: PDF.js 3.11.174
- **Language**: Vanilla JavaScript, HTML5, CSS3

### Architecture

- **Time-based Animation**: requestAnimationFrame loop with delta-time calculations
- **Fractional Pixel Accumulation**: Enables smooth scrolling at very low speeds
- **EMA Delta Smoothing**: Reduces jitter from variable frame rates
- **Flexbox Responsive Layout**: Adapts seamlessly to desktop and mobile screens
- **Manual Scroll Detection**: Event listeners for wheel, touch, pointer, and keyboard interactions

### Performance Optimizations

- Efficient PDF rendering with configurable scale
- Immediate programmatic scrolling (no CSS smooth scroll interference)
- Minimal DOM manipulation
- Event delegation for file list interactions

## Project Structure

```
auto-pdf-scroller/
├── main.js              # Electron main process
├── preload.js           # IPC bridge for security
├── renderer.js          # Application logic and PDF handling
├── index.html           # UI structure
├── style.css            # Responsive styling
├── package.json         # Dependencies and scripts
└── README.md            # This file
```

## Known Limitations

- Requires PDF files to be in a local directory
- PDF.js worker thread must be available
- Mobile autoscroll requires sufficient vertical space after controls and file list

## Future Enhancements

- Keyboard shortcuts for speed adjustment
- Custom speed profiles
- PDF annotation support
- Cloud storage integration
- Bookmarks and page navigation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Author

**Antonio Molteni**
