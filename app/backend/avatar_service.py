import os
import json
import logging
import azure.cognitiveservices.speech as speechsdk
from aiohttp import web, WSMsgType
import aiohttp_cors
from azure.identity import DefaultAzureCredential
from azure.core.credentials import AzureKeyCredential
import asyncio
import uuid
from datetime import datetime, timedelta
import jwt

logger = logging.getLogger(__name__)

class AvatarService:
    def __init__(self, credentials=None):
        self.speech_key = os.environ.get("SPEECH_KEY")
        self.speech_region = os.environ.get("SPEECH_REGION", "westus2")
        self.speech_private_endpoint = os.environ.get("SPEECH_PRIVATE_ENDPOINT")
        
        if not self.speech_key:
            # Try to use the same credentials as OpenAI
            self.credentials = credentials
        
        # Store active connections
        self.active_connections = {}
        
    def get_speech_token(self):
        """Generate a speech service token"""
        try:
            if self.speech_key:
                speech_config = speechsdk.SpeechConfig(subscription=self.speech_key, region=self.speech_region)
            else:
                # Use managed identity or credentials
                speech_config = speechsdk.SpeechConfig(region=self.speech_region)
                
            auth_token = speech_config.get_property(speechsdk.PropertyId.SpeechServiceAuthorization_Token)
            return {
                'token': auth_token,
                'region': self.speech_region,
                'expires_in': 3600  # 1 hour
            }
        except Exception as e:
            logger.error(f"Error getting speech token: {e}")
            raise

    def get_ice_token(self):
        """Generate ICE server token for WebRTC"""
        try:
            # Generate a simple token for ICE servers
            # In production, this should be more secure
            token_data = {
                'iss': 'avatar-service',
                'sub': str(uuid.uuid4()),
                'exp': datetime.utcnow() + timedelta(hours=1),
                'iat': datetime.utcnow()
            }
            
            # Use a simple secret for demo purposes
            secret = os.environ.get("ICE_TOKEN_SECRET", "avatar-service-secret")
            token = jwt.encode(token_data, secret, algorithm='HS256')
            
            return {
                'token': token,
                'ice_servers': [
                    {
                        'urls': ['stun:stun.l.google.com:19302'],
                        'username': '',
                        'credential': ''
                    }
                ]
            }
        except Exception as e:
            logger.error(f"Error generating ICE token: {e}")
            raise

    async def handle_avatar_connect(self, request):
        """Handle avatar connection request"""
        try:
            data = await request.json()
            character = data.get('character', 'lisa')
            style = data.get('style', 'casual-sitting')
            background = data.get('background', '#FFFFFF')
            
            connection_id = str(uuid.uuid4())
            
            # Store connection info
            self.active_connections[connection_id] = {
                'character': character,
                'style': style,
                'background': background,
                'created_at': datetime.utcnow(),
                'speaking': False
            }
            
            return web.json_response({
                'connection_id': connection_id,
                'character': character,
                'style': style,
                'background': background,
                'status': 'connected'
            })
            
        except Exception as e:
            logger.error(f"Error in avatar connect: {e}")
            return web.json_response({'error': str(e)}, status=500)

    async def handle_avatar_speak(self, request):
        """Handle avatar speak request"""
        try:
            data = await request.json()
            connection_id = data.get('connection_id')
            text = data.get('text', '')
            voice = data.get('voice', 'en-US-AriaNeural')
            
            if not connection_id or connection_id not in self.active_connections:
                return web.json_response({'error': 'Invalid connection'}, status=400)
            
            if not text.strip():
                return web.json_response({'error': 'No text provided'}, status=400)
            
            # Mark as speaking
            self.active_connections[connection_id]['speaking'] = True
            
            # In a real implementation, this would trigger the avatar to speak
            # For now, we'll simulate the speaking process
            await asyncio.sleep(0.1)  # Simulate processing time
            
            return web.json_response({
                'connection_id': connection_id,
                'text': text,
                'voice': voice,
                'status': 'speaking'
            })
            
        except Exception as e:
            logger.error(f"Error in avatar speak: {e}")
            return web.json_response({'error': str(e)}, status=500)

    async def handle_avatar_disconnect(self, request):
        """Handle avatar disconnect request"""
        try:
            data = await request.json()
            connection_id = data.get('connection_id')
            
            if connection_id and connection_id in self.active_connections:
                del self.active_connections[connection_id]
                return web.json_response({'status': 'disconnected'})
            
            return web.json_response({'error': 'Connection not found'}, status=404)
            
        except Exception as e:
            logger.error(f"Error in avatar disconnect: {e}")
            return web.json_response({'error': str(e)}, status=500)

    async def handle_speech_token(self, request):
        """Handle speech token request"""
        try:
            token_info = self.get_speech_token()
            return web.json_response(token_info)
        except Exception as e:
            logger.error(f"Error getting speech token: {e}")
            return web.json_response({'error': str(e)}, status=500)

    async def handle_ice_token(self, request):
        """Handle ICE token request"""
        try:
            token_info = self.get_ice_token()
            return web.json_response(token_info)
        except Exception as e:
            logger.error(f"Error getting ICE token: {e}")
            return web.json_response({'error': str(e)}, status=500)

    def setup_routes(self, app):
        """Setup avatar routes"""
        app.router.add_post('/api/avatar/connect', self.handle_avatar_connect)
        app.router.add_post('/api/avatar/speak', self.handle_avatar_speak)
        app.router.add_post('/api/avatar/disconnect', self.handle_avatar_disconnect)
        app.router.add_get('/api/avatar/speech-token', self.handle_speech_token)
        app.router.add_get('/api/avatar/ice-token', self.handle_ice_token)
