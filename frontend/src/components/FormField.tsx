import type { ComponentPropsWithoutRef } from 'react';

interface FormFieldProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'id'> {
  id: string;
  label: string;
  error?: string;
}

export function FormField({ id, label, error, ...inputProps }: FormFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input
        {...inputProps}
        id={id}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
      />
      {error ? (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
