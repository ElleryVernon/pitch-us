/**
 * React hook for automatic presentation data saving.
 *
 * Provides debounced auto-save functionality that saves presentation data
 * to the server when changes are detected. Skips saving during streaming,
 * loading, or when data hasn't changed. Integrates with undo/redo history.
 */

'use client'
import { useEffect, useRef, useCallback, useState } from 'react';
import { PresentationGenerationApi } from '../../services/api/presentation-generation';
import { useUndoRedoStore, usePresentationUIStore, usePresentationDataStore, type PresentationData } from '@/stores';

/**
 * Options for configuring auto-save behavior.
 *
 * @property debounceMs - Milliseconds to wait before saving after last change.
 *   Defaults to 1000ms.
 * @property enabled - Whether auto-save is enabled. Defaults to true.
 */
interface UseAutoSaveOptions {
    debounceMs?: number;
    enabled?: boolean;
}

/**
 * Return value from useAutoSave hook.
 *
 * @property isSaving - Whether a save operation is currently in progress.
 * @property lastSavedAt - Timestamp of the last successful save, or null if
 *   no save has occurred yet.
 */
interface UseAutoSaveReturn {
    isSaving: boolean;
    lastSavedAt: Date | null;
}

/**
 * Hook for automatic presentation data saving.
 *
 * Monitors presentation data changes and automatically saves to the server
 * after a debounce period. Skips saving during streaming, loading, or
 * layout loading states. Only saves if data has actually changed since
 * the last save.
 *
 * @param options - Configuration options for auto-save behavior.
 * @returns Object with isSaving flag and lastSavedAt timestamp.
 */
export const useAutoSave = ({
    debounceMs = 1000,
    enabled = true,
}: UseAutoSaveOptions = {}): UseAutoSaveReturn => {
   
    const addToHistory = useUndoRedoStore((state) => state.addToHistory);
    const presentationData = usePresentationDataStore((state) => state.presentationData);
    const { isStreaming, isLoading, isLayoutLoading } = usePresentationUIStore();

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedDataRef = useRef<string>('');
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

    // Debounced save function
    const debouncedSave = useCallback(async (data: PresentationData) => {
        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout
        saveTimeoutRef.current = setTimeout(async () => {
            if (!data || isSaving) return;

            const currentDataString = JSON.stringify(data);

            // Skip if data hasn't changed since last save
            if (currentDataString === lastSavedDataRef.current) {
                return;
            }

            try {
                setIsSaving(true);
                console.log('🔄 Auto-saving presentation data...');

                // Call the API to update presentation content
                await PresentationGenerationApi.updatePresentationContent(data as unknown as { id: string; [key: string]: unknown });

                // Update last saved data reference
                lastSavedDataRef.current = currentDataString;
                
                // Update last saved timestamp
                setLastSavedAt(new Date());

                console.log('✅ Auto-save successful');

            } catch (error) {
                console.error('❌ Auto-save failed:', error);

            } finally {
                setIsSaving(false);
            }
        }, debounceMs);
    }, [debounceMs, isSaving]);

    // Effect to trigger auto-save when presentation data changes
    useEffect(() => {
        if (!enabled || !presentationData || isStreaming || isLoading || isLayoutLoading ) return;
        
        addToHistory(presentationData.slides, "AUTO_SAVE");
        // Trigger debounced save
        debouncedSave(presentationData);
       
        // Cleanup timeout on unmount
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [presentationData, enabled, debouncedSave, isLoading, isStreaming, isLayoutLoading, addToHistory]);
    
    return {
        isSaving,
        lastSavedAt,
    };
};
