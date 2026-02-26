import { create } from "zustand";

export interface MediaItem {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    mimeType: string;
    alt?: string;
    createdAt: string;
}

interface MediaStore {
    selectedMedia: MediaItem | null;
    isPickerOpen: boolean;
    pickerCallback: ((media: MediaItem) => void) | null;
    setSelectedMedia: (media: MediaItem | null) => void;
    openPicker: (callback: (media: MediaItem) => void) => void;
    closePicker: () => void;
}

export const useMediaStore = create<MediaStore>((set) => ({
    selectedMedia: null,
    isPickerOpen: false,
    pickerCallback: null,
    setSelectedMedia: (media) => set({ selectedMedia: media }),
    openPicker: (callback) => set({ isPickerOpen: true, pickerCallback: callback }),
    closePicker: () => set({ isPickerOpen: false, pickerCallback: null }),
}));
