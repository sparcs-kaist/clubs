import { useTranslations } from "next-intl";
import { ChangeEvent, ReactNode, useCallback } from "react";
import {
  Control,
  FieldPath,
  FieldPathValue,
  FieldValues,
  RegisterOptions,
  useController,
} from "react-hook-form";

interface FormControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
  control?: Control<TFieldValues>;
  rules?: Omit<RegisterOptions<TFieldValues, TName>, "required" | "disabled">;
  renderItem: (args: {
    required?: boolean;
    maxLength?: number;
    minLength?: number;
    onChange: (
      e:
        | ChangeEvent<HTMLInputElement>
        | string
        | number
        | Date
        | FieldPathValue<TFieldValues, TName>
        | null
        | undefined,
    ) => void;
    onBlur: () => void;
    value: FieldPathValue<TFieldValues, TName>;
    hasError: boolean;
    errorMessage?: string;
  }) => ReactNode;
  defaultValue?: FieldPathValue<TFieldValues, TName>;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp;
  requiredMessage?: string;
  maxLengthMessage?: string;
  minLengthMessage?: string;
  patternMessage?: string;
}

function FormController<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  rules,
  renderItem,
  defaultValue,
  ...props
}: FormControllerProps<TFieldValues, TName>) {
  const t = useTranslations("common");
  const requiredMessage = t("forms.required");
  const maxLengthMessage = t("forms.maxLength", {
    count: props.maxLength ?? 0,
  });
  const minLengthMessage = t("forms.minLength", {
    count: props.minLength ?? 0,
  });
  const patternMessage = t("forms.pattern");

  const isValidLength = (length: number | undefined) =>
    length !== undefined && length > 0;

  const {
    field: { onChange, onBlur, value },
    fieldState: { error },
  } = useController({
    name,
    control,
    rules: {
      ...rules,
      required: {
        value: props.required ?? false,
        message: props.requiredMessage ?? requiredMessage,
      },
      maxLength: isValidLength(props.maxLength)
        ? {
            value: props.maxLength as number,
            message: props.maxLengthMessage ?? maxLengthMessage,
          }
        : undefined,
      minLength: isValidLength(props.minLength)
        ? {
            value: props.minLength as number,
            message: props.minLengthMessage ?? minLengthMessage,
          }
        : undefined,
      pattern:
        props.pattern !== undefined
          ? {
              value: props.pattern,
              message: props.patternMessage ?? patternMessage,
            }
          : undefined,
    },
    defaultValue,
  });

  const messages: Record<string, string> = {
    required: props.requiredMessage ?? requiredMessage,
    maxLength: props.maxLengthMessage ?? maxLengthMessage,
    minLength: props.minLengthMessage ?? minLengthMessage,
    pattern: props.patternMessage ?? patternMessage,
  };

  return renderItem({
    ...props,
    onChange: useCallback(e => onChange(e), [onChange]),
    onBlur: useCallback(() => {
      onBlur();
    }, [onBlur]),
    value,
    hasError: !!error?.message,
    errorMessage: error ? (messages[error.type] ?? error.message) : undefined,
  });
}

export default FormController;
