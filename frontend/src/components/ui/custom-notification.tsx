// components/ui/custom-notification.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NotificationType = "success" | "error" | "warning" | "info";

interface CustomNotificationProps {
  id?: string;
  title: string;
  message: string;
  type: NotificationType;
  duration?: number;
  onClose?: () => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export const CustomNotification = ({
  title,
  message,
  type,
  duration = 5000,
  onClose,
  position = "top-right",
}: CustomNotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration > 0) {
      const interval = 100;
      const steps = duration / interval;
      const decrement = 100 / steps;

      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            setIsVisible(false);
            setTimeout(() => onClose?.(), 300);
            return 0;
          }
          return prev - decrement;
        });
      }, interval);

      const timeout = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);

      return () => {
        clearInterval(timer);
        clearTimeout(timeout);
      };
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  const iconMap = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const bgColorMap = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
    info: "bg-blue-50 border-blue-200",
  };

  const textColorMap = {
    success: "text-green-800",
    error: "text-red-800",
    warning: "text-yellow-800",
    info: "text-blue-800",
  };

  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  return (
    <div
      className={cn(
        "fixed z-[100] w-96 p-4 rounded-lg border shadow-lg animate-slide-in",
        bgColorMap[type],
        positionClasses[position]
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{iconMap[type]}</div>
        <div className="ml-3 flex-1">
          <h3 className={cn("text-sm font-medium", textColorMap[type])}>
            {title}
          </h3>
          <div className="mt-1 text-sm opacity-90">{message}</div>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Barre de progression */}
      {duration > 0 && (
        <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-100", {
              "bg-green-500": type === "success",
              "bg-red-500": type === "error",
              "bg-yellow-500": type === "warning",
              "bg-blue-500": type === "info",
            })}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
