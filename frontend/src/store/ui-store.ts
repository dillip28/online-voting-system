import { create } from 'zustand';

type ModalType = 'profile' | 'settings' | 'confirm' | 'info' | null;

interface UIState {
  sidebarOpen: boolean;
  darkMode: boolean;
  activeModal: ModalType;
}

interface UIActions {
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
  setActiveModal: (modal: ModalType) => void;
  closeSidebar: () => void;
}

type UIStore = UIState & UIActions;

const getInitialDarkMode = (): boolean => {
  try {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
};

const applyDarkClass = (dark: boolean) => {
  document.documentElement.classList.toggle('dark', dark);
};

const initialDark = getInitialDarkMode();
applyDarkClass(initialDark);

export const useUiStore = create<UIStore>()((set) => ({
  sidebarOpen: false,
  darkMode: initialDark,
  activeModal: null,

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  toggleDarkMode: () => {
    set((state) => {
      const next = !state.darkMode;
      localStorage.setItem('darkMode', String(next));
      applyDarkClass(next);
      return { darkMode: next };
    });
  },

  setActiveModal: (modal) => {
    set({ activeModal: modal });
  },

  closeSidebar: () => {
    set({ sidebarOpen: false });
  },
}));
