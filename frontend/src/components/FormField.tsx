import type { ComponentPropsWithoutRef } from 'react';

interface FormFieldProps
  extends Omit<
    ComponentPropsWithoutRef<'input'>,
    'id' | 'aria-describedby' | 'aria-invalid'
  > {
  id: string;
  label: string;
  error?: string;
  descriptionId?: string;
  invalid?: boolean;
}

export function FormField({
  id,
  label,
  error,
  descriptionId,
  invalid,
  ...inputProps
}: FormFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input
        {...inputProps}
        id={id}
        aria-describedby={error ? errorId : descriptionId}
        aria-invalid={invalid ?? Boolean(error)}
      />
      {error ? (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
