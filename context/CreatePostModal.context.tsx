"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ModalType = "image" | "video" | "article" | null;

interface CreatePostModalContextValue {
  modalType: ModalType;
  openModal: (type?: ModalType) => void;
  closeModal: () => void;
}

const CreatePostModalContext = createContext<CreatePostModalContextValue | null>(null);

export const CreatePostModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalType, setModalType] = useState<ModalType>(null);

  const openModal = (type: ModalType = "image") => setModalType(type);
  const closeModal = () => setModalType(null);

  return (
    <CreatePostModalContext.Provider value={{ modalType, openModal, closeModal }}>
      {children}
    </CreatePostModalContext.Provider>
  );
};

export const useCreatePostModal = () => {
  const ctx = useContext(CreatePostModalContext);
  if (!ctx) throw new Error("useCreatePostModal must be used within CreatePostModalProvider");
  return ctx;
};