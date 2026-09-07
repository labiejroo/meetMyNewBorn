import { mutateDb, newId } from "@/mocks/db";
import type { SubmitFeedbackInput, SubmitFeedbackResult } from "@/types";

import { apiError, mockCall, request, usingMocks } from "./http";

/**
 * Uwagi od użytkowników. Docelowo osobna ścieżka niż rezerwacje:
 * API Gateway → lambda → DynamoDB. Dla komponentów to bez znaczenia.
 */
export async function submitFeedback(input: SubmitFeedbackInput): Promise<SubmitFeedbackResult> {
  if (!usingMocks) {
    return request<SubmitFeedbackResult>("/feedback", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  return mockCall(() => {
    const message = input.message.trim();
    if (message.length < 3) {
      throw apiError("bad_request", "Napiszcie choć kilka słów.", {
        message: "Ta wiadomość jest za krótka.",
      });
    }

    return mutateDb((db) => {
      const entry = {
        id: newId("fb"),
        message,
        email: input.email?.trim() ? input.email.trim() : null,
        receivedAt: new Date().toISOString(),
      };
      db.feedback.push(entry);
      return { feedbackId: entry.id, receivedAt: entry.receivedAt };
    });
  }, 700);
}
