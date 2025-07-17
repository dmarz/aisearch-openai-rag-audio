import { useState, useCallback } from "react";

export interface UseAvatarOptions {
    onConnectionChange?: (connected: boolean) => void;
    onSpeakingChange?: (speaking: boolean) => void;
    onError?: (error: string) => void;
}

export interface AvatarState {
    connected: boolean;
    speaking: boolean;
    error: string | null;
}

export const useAvatar = (options: UseAvatarOptions = {}) => {
    const [state, setState] = useState<AvatarState>({
        connected: false,
        speaking: false,
        error: null
    });

    const queueSpeech = useCallback((text: string) => {
        if (typeof window !== "undefined" && (window as any).avatarQueueSpeech) {
            (window as any).avatarQueueSpeech(text);
        } else {
            console.warn("Avatar not available for speech");
        }
    }, []);

    const handleConnectionChange = useCallback(
        (connected: boolean) => {
            setState((prev: AvatarState) => ({ ...prev, connected, error: connected ? null : prev.error }));
            options.onConnectionChange?.(connected);
        },
        [options]
    );

    const handleSpeakingChange = useCallback(
        (speaking: boolean) => {
            setState((prev: AvatarState) => ({ ...prev, speaking }));
            options.onSpeakingChange?.(speaking);
        },
        [options]
    );

    const handleError = useCallback(
        (error: string) => {
            setState((prev: AvatarState) => ({ ...prev, error }));
            options.onError?.(error);
        },
        [options]
    );

    return {
        state,
        queueSpeech,
        handlers: {
            onConnectionChange: handleConnectionChange,
            onSpeakingChange: handleSpeakingChange,
            onError: handleError
        }
    };
};
