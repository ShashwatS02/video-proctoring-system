# Video Proctoring System - Focus & Object Detection

<p align="center">
  <img src="https://placehold.co/800x350/1a1a1a/FFFFFF?text=Video+Proctoring+System&font=raleway" alt="Project Banner">
</p>

A comprehensive video proctoring system designed for online interviews with advanced computer vision capabilities for focus detection and unauthorized object identification.

---

## 🚀 Live Demo
👉 [Try the Live App](https://smart-proctoring-system.netlify.app/)

---

## 🎯 Features

### Core Functionality

- **Real-time Video Monitoring**: Live video feed with candidate monitoring
- **Focus Detection**: Tracks if candidate is looking at screen vs. looking away
- **Face Detection**: Monitors presence of face and detects multiple faces
- **Object Detection**: Identifies unauthorized items (phones, books, notes, devices)
- **Event Logging**: Comprehensive logging with timestamps and durations
- **Integrity Scoring**: Automated scoring based on violations and events

### Advanced Features

- **Real-time Alerts**: Live notifications for suspicious activities
- **Professional Reporting**: PDF and CSV report generation
- **Session Management**: Complete interview session workflow
- **Responsive Design**: Optimized for desktop interview setups
- **Modern UI/UX**: Clean, professional interface

## 🛠️ Tech Stack

![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38b2ac?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-ff6f00?style=for-the-badge&logo=tensorflow&logoColor=white)
![MediaPipe](https://img.shields.io/badge/MediaPipe-4285f4?style=for-the-badge&logo=google&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-e03c31?style=for-the-badge&logo=webrtc&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)


## 📋 Installation & Setup

### Prerequisites

- Node.js 16+ and npm
- Modern web browser with camera access
- HTTPS connection (required for camera access)

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd video-proctoring-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open https://localhost:5173 (HTTPS required for camera)
   - Allow camera permissions when prompted

## 🎮 Usage Guide

### Starting an Interview Session

1. **Setup Phase**

   - Enter candidate's full name
   - Click "Start Interview" to begin session

2. **Monitoring Phase**

   - System automatically starts video monitoring
   - Real-time detection of focus and objects
   - Live alerts for violations and suspicious activities
   - Monitor dashboard shows current status and recent events

3. **Completion Phase**
   - Click "End Session" when interview is complete
   - System generates comprehensive proctoring report
   - Download reports in PDF or CSV format

### Detection Capabilities

#### Focus Detection

- **Focus Loss**: Triggers when candidate not looking at screen >5 seconds
- **No Face**: Alerts when no face detected >10 seconds
- **Multiple Faces**: Detects when multiple people are present

#### Object Detection

- **Mobile Phones**: Identifies smartphones in video frame
- **Books/Notes**: Detects paper materials and notebooks
- **Electronic Devices**: Recognizes laptops, tablets, other devices
- **Confidence Scoring**: Only reports detections above 70% confidence

### Reporting Features

#### Integrity Scoring System

- **Base Score**: 100 points
- **Deduction Rules**:
  - Phone detected: -15 points
  - Books/notes detected: -10 points
  - Electronic devices: -10 points
  - Multiple faces: -8 points
  - Focus lost: -5 points
  - No face detected: -5 points

#### Report Contents

- Candidate information and session details
- Duration and timeline of interview
- Event summary with violation counts
- Detailed event log with timestamps
- Final integrity score and assessment

## 🛠️ Development

### Project Structure

```
Focus & Object Detection in Video Interviews/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── MonitoringDashboard.tsx
│   │   ├── ProctoringReport.tsx
│   │   ├── SessionSetup.tsx
│   │   └── VideoFeed.tsx
│   ├── hooks/
│   │   ├── useAudioDetection.ts
│   │   ├── useFaceDetection.ts
│   │   ├── useObjectDetection.ts
│   │   └── useVideoStream.ts
│   ├── types/
│   │   └── proctoring.ts
│   ├── utils/
│   │   └── reportGenerator.ts
│   ├── App.tsx
│   ├── supabaseConfig.ts
│   └── ...
├── .env
├── index.html
└── package.json

```

### Key Technologies

#### Computer Vision

- **TensorFlow.js**: Machine learning inference in browser
- **COCO-SSD**: Pre-trained object detection model
- **MediaPipe**: Face detection and landmark tracking
- **WebRTC**: Real-time video streaming

#### Detection Logic

- **Focus Tracking**: Analyzes face position and eye direction
- **Object Recognition**: Identifies prohibited items with confidence scoring
- **Event Processing**: Intelligent filtering and threshold-based alerts

### Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview

# Deploy to hosting platform
npm run deploy
```

## 📊 Performance Considerations

### Optimization Features

- **Efficient Processing**: Optimized detection loops with requestAnimationFrame
- **Model Loading**: Lazy loading of ML models
- **Memory Management**: Proper cleanup of video streams and detection loops
- **Responsive Design**: Optimized for various screen sizes

### Browser Requirements

- **WebRTC Support**: Modern browsers (Chrome 60+, Firefox 55+, Safari 11+)
- **Hardware Acceleration**: GPU acceleration recommended for smooth performance
- **Camera Access**: Requires HTTPS and user permission grants

## 🔒 Privacy & Security

### Data Handling

- **Local Processing**: All detection happens client-side
- **No Video Storage**: Video streams are processed in real-time only
- **Event Logging**: Only detection events and metadata are stored
- **User Consent**: Explicit camera permission required

### Compliance Features

- **Audit Trail**: Complete event logging with timestamps
- **Transparency**: Clear indication of monitoring status
- **Data Export**: Full report export capabilities

## 🎁 Bonus Features

### Advanced Monitoring

- **Eye Closure Detection**: Monitors for drowsiness (future enhancement)
- **Audio Analysis**: Background voice detection (future enhancement)
- **Behavior Analytics**: Advanced behavioral pattern recognition

### Integration Capabilities

- **API Ready**: Structured data format for integration
- **Webhook Support**: Real-time event notifications (configurable)
- **Report Automation**: Scheduled and automated report generation

## 📈 Future Enhancements

- **Machine Learning**: Custom model training for specific use cases
- **Multi-language**: Internationalization support
- **Advanced Analytics**: Behavior pattern analysis
- **Cloud Integration**: Optional cloud storage and processing
- **Mobile Support**: Responsive design for tablet/mobile interviews

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request


## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation and FAQ
- Review the code comments for implementation details

---

**Built with ❤️ for secure and reliable online interview proctoring**
