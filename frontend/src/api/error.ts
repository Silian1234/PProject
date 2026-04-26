import axios from "axios";

function collectValidationMessages(payload: unknown, prefix = ""): string[] {
  if (payload == null) {
    return [];
  }

  if (typeof payload === "string") {
    return [prefix ? `${prefix}: ${payload}` : payload];
  }

  if (Array.isArray(payload)) {
    return payload.flatMap((item) => collectValidationMessages(item, prefix));
  }

  if (typeof payload === "object") {
    const entries = Object.entries(payload as Record<string, unknown>);
    return entries.flatMap(([field, value]) => {
      const normalizedField =
        field === "non_field_errors" || field === "detail" || field === "message" ? "" : field;
      const nextPrefix =
        prefix && normalizedField
          ? `${prefix}.${normalizedField}`
          : normalizedField || prefix;
      return collectValidationMessages(value, nextPrefix);
    });
  }

  return [];
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const messages = collectValidationMessages(error.response?.data)
      .map((message) => message.trim())
      .filter(Boolean);
    if (messages.length > 0) {
      return messages.join("\n");
    }
    return error.message;
  }
  return "Unexpected error";
}
