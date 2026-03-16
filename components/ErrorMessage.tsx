interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <p className="errorMsg">
      ⚠️ {message}
    </p>
  );
}
