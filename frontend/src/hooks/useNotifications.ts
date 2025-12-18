// hooks/useNotifications.ts
"use client";

import { useState, useCallback } from "react";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = Date.now().toString();
      const newNotification = { ...notification, id };
      setNotifications((prev) => [...prev, newNotification]);

      // Suppression automatique après la durée
      if (notification.duration && notification.duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, notification.duration);
      }

      return id;
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Méthodes pratiques
  const success = useCallback(
    (title: string, message: string, duration = 5000) => {
      return addNotification({ title, message, type: "success", duration });
    },
    [addNotification]
  );

  const error = useCallback(
    (title: string, message: string, duration = 5000) => {
      return addNotification({ title, message, type: "error", duration });
    },
    [addNotification]
  );

  const warning = useCallback(
    (title: string, message: string, duration = 5000) => {
      return addNotification({ title, message, type: "warning", duration });
    },
    [addNotification]
  );

  const info = useCallback(
    (title: string, message: string, duration = 5000) => {
      return addNotification({ title, message, type: "info", duration });
    },
    [addNotification]
  );

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    success,
    error,
    warning,
    info,
  };
};
