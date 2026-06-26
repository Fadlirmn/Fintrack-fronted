"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Additional wrapper class (optional) */
  wrapperClassName?: string;
}

/**
 * PasswordInput — input password dengan tombol show/hide di sebelah kanan.
 * Menerima semua props HTMLInputElement standar (className, placeholder, value, onChange, dll).
 */
export function PasswordInput({ className = "", wrapperClassName = "", ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className={`relative ${wrapperClassName}`}>
      <input
        {...props}
        type={show ? "text" : "password"}
        className={`pr-10 ${className}`}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        {show ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
