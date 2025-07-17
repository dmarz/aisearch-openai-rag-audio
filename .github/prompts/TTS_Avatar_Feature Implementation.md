# Text to Speech Avatar Implementation Guide

## Overview
This guide provides a sequential approach to implement Microsoft Cognitive Services Text to Speech Avatar functionality in a React frontend + Python backend architecture that already uses Azure OpenAI.

## Prerequisites
- Existing React frontend
- Existing Python backend with Azure OpenAI integration
- Azure Cognitive Services Speech resource (in supported regions: Southeast Asia, North Europe, West Europe, Sweden Central, South Central US, East US 2, West US 2)
- Azure OpenAI resource (already configured)

## Step 1: Backend Infrastructure Setup

### 1.1 Install Required Python Dependencies
```bash
pip install azure-cognitiveservices-speech flask-socketio azure-identity pytz torch numpy
```

### 1.2 Configure Environment Variables
Add to your existing environment configuration:
```bash
# Speech Service Configuration
SPEECH_REGION=westus2  # or your supported region
SPEECH_KEY=your_speech_service_key
SPEECH_PRIVATE_ENDPOINT=  # optional, for private endpoints

# Azure OpenAI (reuse existing configuration)
AZURE_OPENAI_ENDPOINT=your_existing_openai_endpoint
AZURE_OPENAI_API_KEY=your_existing_openai_key
AZURE_OPENAI_DEPLOYMENT_NAME=your_existing_deployment_name

## Step 2: Backend API Development

### 2.1 Create Avatar Service Module
Create a new Python module `avatar_service.py` with the following core functionality:
- WebRTC connection management for avatar video streaming
- Speech synthesis with avatar video output
- Integration with existing Azure OpenAI chat responses
- Token management for Speech and ICE services

### 2.2 Implement Core API Endpoints
Add these endpoints to your existing Flask/FastAPI backend:
- `POST /api/avatar/connect` - Establish avatar video connection
- `POST /api/avatar/speak` - Send text to avatar for speech synthesis
- `POST /api/avatar/disconnect` - Close avatar connection
- `GET /api/avatar/speech-token` - Get speech service token
- `GET /api/avatar/ice-token` - Get ICE server token for WebRTC

### 2.3 Integrate with Existing OpenAI Chat
Modify your existing OpenAI chat endpoint to:
- Stream responses as before for text display
- Queue text chunks for avatar speech synthesis
- Handle sentence-level speaking (on punctuation detection)
- Manage avatar speaking state during conversation

## Step 3: Frontend Component Development

### 3.1 Install Required NPM Dependencies
```bash
npm install microsoft-cognitiveservices-speech-sdk
```

### 3.2 Create Avatar Component
Develop a React component `TTSAvatar.jsx` that includes:
- Video element for avatar display
- WebRTC peer connection management
- Integration with existing chat interface
- Avatar configuration controls (character, style, background)

### 3.3 Implement WebRTC Video Streaming
- Establish WebRTC connection using ICE tokens
- Handle incoming video stream from Speech service
- Implement transparent background support (optional)
- Add video cropping capabilities (optional)

### 3.4 Create Avatar Configuration Interface
Build UI controls for:
- Avatar character selection (lisa, etc.)
- Avatar style selection (casual-sitting, etc.)
- Background color/image settings
- Voice selection integration
- Connection status indicators

## Step 4: Integration with Existing Chat System

### 4.1 Modify Chat Response Handler
Update your existing chat component to:
- Display a second button "Use Avatar to Talk to your Data"
- Display text responses as before
- Send text chunks to avatar for speech synthesis
- Handle avatar speaking states
- Provide stop speaking functionality

### 4.2 Implement Speech Queuing
- Queue text chunks for sequential speaking
- Handle sentence-level synthesis triggering
- Manage speaking interruption
- Implement reconnection handling


## Step 5: Authentication and Security

### 5.1 Reuse Existing Azure Credentials
Leverage your existing Azure OpenAI authentication:
- Use same Azure credentials for Speech service
- Implement token refresh mechanisms
- Handle private endpoint scenarios if applicable

### 5.2 Implement Token Management
- Generate and refresh Speech service tokens
- Manage ICE server authentication
- Handle token expiration gracefully

## Step 6: Testing and Optimization

### 6.1 Basic Avatar Testing
- Test avatar connection establishment
- Verify text-to-speech with lip sync
- Validate video streaming quality
- Test different avatar characters/styles

### 6.2 Chat Integration Testing
- Test avatar speaking during chat responses
- Verify response streaming + speaking synchronization
- Test interruption and reconnection scenarios
- Validate queue management

### 6.3 Performance Optimization
- Implement proper error handling
- Add connection retry logic
- Optimize video streaming settings
- Handle network quality degradation

## Step 7: Deployment Considerations

### 7.1 Infrastructure Requirements
- Ensure WebSocket support in hosting platform
- Configure proper CORS settings
- Handle session stickiness for WebRTC

### 7.2 Container Deployment (Optional)
- Dockerize the application
- Deploy to Azure Container Apps
- Configure environment variables properly

### 7.3 Monitoring and Logging
- Add avatar connection monitoring
- Log speech synthesis performance
- Track video streaming quality metrics

## Key Implementation Notes

1. **Reuse Existing Azure OpenAI Integration**: Leverage your current OpenAI configuration, credentials, and chat flow
2. **WebRTC Dependency**: Avatar functionality requires WebRTC for real-time video streaming
3. **Regional Limitations**: TTS Avatar is only available in specific Azure regions
4. **Token Management**: Implement proper token refresh for both Speech and ICE services
5. **Error Handling**: Add robust error handling for network and service interruptions
6. **Performance**: Consider video quality vs. bandwidth trade-offs

## Expected Timeline
- Step 1-2: Backend setup and API development (2-3 days)
- Step 3-4: Frontend component and integration (3-4 days)  
- Step 5-6: Authentication and testing (2-3 days)
- Step 7-8: Advanced features and deployment (2-4 days)

Total estimated effort: 9-14 days for a complete implementation.

## Reference Implementation
The Microsoft Speech SDK repository contains complete Python and JavaScript examples in:
- `/samples/python/web/avatar/` - Complete Python Flask implementation
- `/samples/js/browser/avatar/` - Complete JavaScript browser implementation
- `/samples/js/node/web/avatar/` - Complete Node.js server implementation

These can serve as reference implementations for your specific use case.
