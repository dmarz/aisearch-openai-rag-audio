import { useState } from "react";
import { Mic, MicOff, User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { GroundingFiles } from "@/components/ui/grounding-files";
import GroundingFileView from "@/components/ui/grounding-file-view";
import StatusMessage from "@/components/ui/status-message";
import TTSAvatar from "@/components/ui/tts-avatar";

import useRealTime from "@/hooks/useRealtime";
import useAudioRecorder from "@/hooks/useAudioRecorder";
import useAudioPlayer from "@/hooks/useAudioPlayer";
import { useAvatar } from "@/hooks/useAvatar";

import { GroundingFile, ToolResult } from "./types";

import logo from "./assets/logo.svg";

function App() {
    const [isRecording, setIsRecording] = useState(false);
    const [isAvatarMode, setIsAvatarMode] = useState(false);
    const [groundingFiles, setGroundingFiles] = useState<GroundingFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<GroundingFile | null>(null);

    // Avatar functionality
    const avatar = useAvatar({
        onConnectionChange: connected => {
            console.log("Avatar connection:", connected);
        },
        onSpeakingChange: speaking => {
            console.log("Avatar speaking:", speaking);
        },
        onError: error => {
            console.error("Avatar error:", error);
        }
    });

    const { startSession, addUserAudio, inputAudioBufferClear } = useRealTime({
        onWebSocketOpen: () => console.log("WebSocket connection opened"),
        onWebSocketClose: () => console.log("WebSocket connection closed"),
        onWebSocketError: event => console.error("WebSocket error:", event),
        onReceivedError: message => console.error("error", message),
        onReceivedResponseAudioDelta: message => {
            if (!isAvatarMode) {
                // Normal audio mode - play audio
                isRecording && playAudio(message.delta);
            }
        },
        onReceivedResponseAudioTranscriptDelta: message => {
            if (isAvatarMode) {
                // Avatar mode - queue text for avatar speech
                if (message.delta && typeof message.delta === "string") {
                    avatar.queueSpeech(message.delta);
                }
            }
        },
        onReceivedInputAudioBufferSpeechStarted: () => {
            stopAudioPlayer();
        },
        onReceivedExtensionMiddleTierToolResponse: message => {
            const result: ToolResult = JSON.parse(message.tool_result);

            const files: GroundingFile[] = result.sources.map(x => {
                return { id: x.chunk_id, name: x.title, content: x.chunk };
            });

            setGroundingFiles((prev: GroundingFile[]) => [...prev, ...files]);
        }
    });

    const { reset: resetAudioPlayer, play: playAudio, stop: stopAudioPlayer } = useAudioPlayer();
    const { start: startAudioRecording, stop: stopAudioRecording } = useAudioRecorder({ onAudioRecorded: addUserAudio });

    const onToggleListening = async () => {
        if (!isRecording) {
            startSession();
            await startAudioRecording();
            resetAudioPlayer();

            setIsRecording(true);
        } else {
            await stopAudioRecording();
            stopAudioPlayer();
            inputAudioBufferClear();

            setIsRecording(false);
        }
    };

    const onToggleAvatarMode = () => {
        setIsAvatarMode(!isAvatarMode);
        // Reset recording state when switching modes
        if (isRecording) {
            onToggleListening();
        }
    };

    const { t } = useTranslation();

    return (
        <div className="flex min-h-screen flex-col bg-gray-100 text-gray-900">
            <div className="p-4 sm:absolute sm:left-4 sm:top-4">
                <img src={logo} alt="Azure logo" className="h-16 w-16" />
            </div>

            <div className="flex flex-grow">
                {/* Main content area */}
                <main className="flex flex-grow flex-col items-center justify-center">
                    <h1 className="mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-4xl font-bold text-transparent md:text-7xl">
                        {t("app.title")}
                    </h1>
                    <div className="mb-4 flex flex-col items-center justify-center">
                        {/* Button container */}
                        <div className="mb-4 flex gap-4">
                            <Button
                                onClick={onToggleListening}
                                className={`h-12 w-60 ${isRecording ? "bg-red-600 hover:bg-red-700" : "bg-purple-500 hover:bg-purple-600"}`}
                                aria-label={isRecording ? t("app.stopRecording") : t("app.startRecording")}
                                disabled={isAvatarMode && isRecording}
                            >
                                {isRecording ? (
                                    <>
                                        <MicOff className="mr-2 h-4 w-4" />
                                        {isAvatarMode ? "Stop Avatar Conversation" : t("app.stopConversation")}
                                    </>
                                ) : (
                                    <>
                                        <Mic className="mr-2 h-6 w-6" />
                                        {isAvatarMode ? "Talk to your Data with Avatar" : "Talk to your Data"}
                                    </>
                                )}
                            </Button>

                            <Button
                                onClick={onToggleAvatarMode}
                                className={`h-12 w-60 ${isAvatarMode ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-500 hover:bg-gray-600"}`}
                                aria-label="Toggle Avatar Mode"
                                disabled={isRecording}
                            >
                                <User className="mr-2 h-4 w-4" />
                                {isAvatarMode ? "Avatar Mode ON" : "Enable Avatar Mode"}
                            </Button>
                        </div>

                        <StatusMessage isRecording={isRecording} />
                    </div>
                    <GroundingFiles files={groundingFiles} onSelected={setSelectedFile} />
                </main>

                {/* Avatar panel on the right */}
                {isAvatarMode && (
                    <div className="w-96 border-l border-gray-200 bg-white p-4">
                        <div className="h-full">
                            <TTSAvatar
                                isVisible={isAvatarMode}
                                onConnectionChange={avatar.handlers.onConnectionChange}
                                onSpeakingChange={avatar.handlers.onSpeakingChange}
                            />
                        </div>
                    </div>
                )}
            </div>

            <footer className="py-4 text-center">
                <p>{t("app.footer")}</p>
            </footer>

            <GroundingFileView groundingFile={selectedFile} onClosed={() => setSelectedFile(null)} />
        </div>
    );
}

export default App;
