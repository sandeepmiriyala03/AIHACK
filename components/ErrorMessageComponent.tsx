import React from "react";

interface ErrorMessageComponentProps {
  message?: string | null;
}

export function ErrorMessageComponent({ message }: ErrorMessageComponentProps) {
  return message ? <div className="errorMsg">{message}</div> : null;
}
