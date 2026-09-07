export interface SubmitFeedbackInput {
  message: string;
  email?: string;
}

export interface SubmitFeedbackResult {
  feedbackId: string;
  receivedAt: string;
}
