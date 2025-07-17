import React, { useRef, useEffect, useState, useCallback } from "react";

interface TTSAvatarProps {
    isVisible: boolean;
    onConnectionChange?: (connected: boolean) => void;
    onSpeakingChange?: (speaking: boolean) => void;
}

interface AvatarConnection {
    connectionId: string | null;
    connected: boolean;
    speaking: boolean;
}

const TTSAvatar: React.FC<TTSAvatarProps> = ({ isVisible, onConnectionChange, onSpeakingChange }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [connection, setConnection] = useState<AvatarConnection>({
        connectionId: null,
        connected: false,
        speaking: false
    });
    const [error, setError] = useState<string | null>(null);
    const speechQueueRef = useRef<string[]>([]);
    const isProcessingRef = useRef(false);

    // Avatar configuration
    const avatarConfig = {
        character: "lisa",
        style: "casual-sitting",
        background: "#FFFFFF",
        voice: "en-US-AriaNeural"
    };

    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8765";

    const connectAvatar = useCallback(async () => {
        try {
            setError(null);

            // Connect to avatar service
            const connectResponse = await fetch(`${apiBase}/api/avatar/connect`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(avatarConfig)
            });

            if (!connectResponse.ok) {
                throw new Error("Failed to connect to avatar service");
            }

            const connectData = await connectResponse.json();

            setConnection(prev => ({
                ...prev,
                connectionId: connectData.connection_id,
                connected: true
            }));

            onConnectionChange?.(true);

            // Simulate successful connection for demo
            console.log("Avatar connected with ID:", connectData.connection_id);
        } catch (err) {
            console.error("Avatar connection error:", err);
            setError(err instanceof Error ? err.message : "Connection failed");
            onConnectionChange?.(false);
        }
    }, [apiBase, onConnectionChange]);

    const disconnectAvatar = useCallback(async () => {
        try {
            if (connection.connectionId) {
                await fetch(`${apiBase}/api/avatar/disconnect`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        connection_id: connection.connectionId
                    })
                });
            }

            setConnection({
                connectionId: null,
                connected: false,
                speaking: false
            });

            onConnectionChange?.(false);
            onSpeakingChange?.(false);
        } catch (err) {
            console.error("Avatar disconnect error:", err);
        }
    }, [connection.connectionId, apiBase, onConnectionChange, onSpeakingChange]);

    const speakText = useCallback(
        async (text: string) => {
            if (!connection.connected || !connection.connectionId) {
                console.warn("Avatar not connected");
                return;
            }

            try {
                const response = await fetch(`${apiBase}/api/avatar/speak`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        connection_id: connection.connectionId,
                        text: text,
                        voice: avatarConfig.voice
                    })
                });

                if (!response.ok) {
                    throw new Error("Failed to send text to avatar");
                }

                setConnection(prev => ({ ...prev, speaking: true }));
                onSpeakingChange?.(true);

                // Simulate speaking duration based on text length
                const duration = Math.max(1000, text.length * 50);
                setTimeout(() => {
                    setConnection(prev => ({ ...prev, speaking: false }));
                    onSpeakingChange?.(false);
                }, duration);
            } catch (err) {
                console.error("Avatar speak error:", err);
                setError(err instanceof Error ? err.message : "Speech failed");
            }
        },
        [connection.connected, connection.connectionId, apiBase, onSpeakingChange]
    );

    // Process speech queue
    const processSpeechQueue = useCallback(async () => {
        if (isProcessingRef.current || speechQueueRef.current.length === 0) {
            return;
        }

        isProcessingRef.current = true;

        while (speechQueueRef.current.length > 0) {
            const text = speechQueueRef.current.shift();
            if (text) {
                await speakText(text);
                // Wait a bit before processing next item
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        isProcessingRef.current = false;
    }, [speakText]);

    // Public method to queue text for speaking
    const queueSpeech = useCallback(
        (text: string) => {
            if (!text.trim()) return;

            // Split text into sentences for better pacing
            const sentences = text.split(/[.!?]+/).filter(s => s.trim());
            sentences.forEach(sentence => {
                if (sentence.trim()) {
                    speechQueueRef.current.push(sentence.trim());
                }
            });

            processSpeechQueue();
        },
        [processSpeechQueue]
    );

    // Expose queueSpeech method to parent
    useEffect(() => {
        (window as any).avatarQueueSpeech = queueSpeech;
        return () => {
            delete (window as any).avatarQueueSpeech;
        };
    }, [queueSpeech]);

    // Connect when component becomes visible
    useEffect(() => {
        if (isVisible && !connection.connected) {
            connectAvatar();
        } else if (!isVisible && connection.connected) {
            disconnectAvatar();
        }
    }, [isVisible, connection.connected, connectAvatar, disconnectAvatar]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnectAvatar();
        };
    }, []);

    if (!isVisible) {
        return null;
    }

    return (
        <div className="avatar-container flex h-full w-full flex-col items-center justify-center rounded-lg border-2 border-purple-200 bg-gradient-to-b from-blue-50 to-purple-50">
            <div className="relative h-full max-h-96 w-full max-w-md">
                {/* Video element for avatar (placeholder for now) */}
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="h-full w-full rounded-lg bg-white object-cover"
                    style={{
                        display: connection.connected ? "block" : "none",
                        transform: "scaleX(-1)" // Mirror the video
                    }}
                    poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDMyMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9IiM5Q0E0QjkiLz4KPHJlY3QgeD0iMTIwIiB5PSIxNDAiIHdpZHRoPSI4MCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiM5Q0E0QjkiLz4KPHR0ZXh0IHg9IjE2MCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3MEE5IiBmb250LXNpemU9IjE0cHgiPkF2YXRhcjwvdGV4dD4KPC9zdmc+Cg=="
                />

                {/* Placeholder when not connected */}
                {!connection.connected && (
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-pink-100">
                        <div className="mb-4 flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-purple-300">
                            <span className="text-3xl text-white">👤</span>
                        </div>
                        <p className="font-medium text-purple-700">Digital Assistant</p>
                        <p className="text-sm text-purple-500">Connecting...</p>
                    </div>
                )}

                {/* Connection status */}
                <div className="absolute right-2 top-2">
                    <div className={`h-3 w-3 rounded-full ${connection.connected ? "animate-pulse bg-green-500" : "bg-red-500"}`} />
                </div>

                {/* Speaking indicator */}
                {connection.speaking && (
                    <div className="absolute bottom-2 left-2 animate-pulse rounded bg-blue-500 px-2 py-1 text-xs text-white">Speaking...</div>
                )}

                {/* Error message */}
                {error && <div className="absolute bottom-2 left-2 right-2 rounded bg-red-500 px-2 py-1 text-xs text-white">{error}</div>}
            </div>

            {/* Avatar info */}
            <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                    Character: {avatarConfig.character} | Style: {avatarConfig.style}
                </p>
                <p className="mt-1 text-xs text-gray-500">Status: {connection.connected ? "Connected" : "Disconnected"}</p>
                {connection.connected && <p className="mt-1 text-xs text-green-600">Ready to speak responses</p>}
            </div>
        </div>
    );
};

export default TTSAvatar;
